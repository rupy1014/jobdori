/**
 * 멀티 채널 스케줄러
 *
 * Cron 트리거:
 * - 매 15분: 모든 활성 채널에서 수집 + 분류 + 응답 생성
 * - 매 30분: 승인 시간 체크 후 자동 게시
 */

import type { Env, Channel, StoredComment } from '../types'
import {
  getActiveChannels,
  getChannelById,
  updateChannel,
  getChannelCommentsByStatus,
  updateChannelComment,
  saveChannelComment,
  channelCommentExists
} from '../lib/kv'
import { fetchChannelComments, postReplyWithChannel, refreshChannelToken } from './youtube-channel'
import { classifyComment, generateRepliesForComments } from './llm'

/**
 * 현재 시간이 야간 정지 시간대인지 확인
 * pauseStart: "23:00", pauseEnd: "07:00" → 23:00~07:00은 정지
 */
function isPauseTime(pauseStart?: string, pauseEnd?: string, timezone: string = 'Asia/Seoul'): boolean {
  if (!pauseStart || !pauseEnd) return false

  // 현재 시간 (타임존 적용)
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
  const currentTime = formatter.format(now)
  const parts = currentTime.split(':')
  const currentMinutes = parseInt(parts[0] || '0', 10) * 60 + parseInt(parts[1] || '0', 10)

  const startParts = pauseStart.split(':')
  const startMinutes = parseInt(startParts[0] || '0', 10) * 60 + parseInt(startParts[1] || '0', 10)

  const endParts = pauseEnd.split(':')
  const endMinutes = parseInt(endParts[0] || '0', 10) * 60 + parseInt(endParts[1] || '0', 10)

  // 자정을 넘어가는 경우 (예: 23:00 ~ 07:00)
  if (startMinutes > endMinutes) {
    return currentMinutes >= startMinutes || currentMinutes < endMinutes
  }

  // 같은 날 내의 범위 (예: 01:00 ~ 06:00)
  return currentMinutes >= startMinutes && currentMinutes < endMinutes
}

/**
 * 현재 시간이 승인 시간 범위 내인지 확인
 * approveTimes: ["09:00", "14:00", "21:00"]
 * 각 시간 ±15분 범위 내면 true
 */
function isApproveTime(approveTimes: string[], timezone: string): boolean {
  // 현재 시간 (타임존 적용)
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
  const currentTime = formatter.format(now)
  const parts = currentTime.split(':')
  const currentHour = parseInt(parts[0] || '0', 10)
  const currentMinute = parseInt(parts[1] || '0', 10)
  const currentTotalMinutes = currentHour * 60 + currentMinute

  for (const time of approveTimes) {
    const timeParts = time.split(':')
    const hour = parseInt(timeParts[0] || '0', 10)
    const minute = parseInt(timeParts[1] || '0', 10)
    const targetTotalMinutes = hour * 60 + minute

    // ±15분 범위 체크
    const diff = Math.abs(currentTotalMinutes - targetTotalMinutes)
    if (diff <= 15 || diff >= (24 * 60 - 15)) {  // 자정 근처 처리
      return true
    }
  }

  return false
}

/**
 * 채널 토큰 갱신 (필요시)
 * 갱신 실패 시 needsReauth 플래그를 설정하고 null 반환
 */
async function ensureValidToken(env: Env, channel: Channel): Promise<Channel | null> {
  // needsReauth 플래그가 설정된 채널은 스킵
  if (channel.needsReauth) {
    console.log(`[${channel.youtube.channelTitle}] Needs re-auth, skipping`)
    return null
  }

  const expiresAt = new Date(channel.youtube.expiresAt)
  const now = new Date()

  // 만료 5분 전이면 갱신
  if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
    console.log(`[${channel.youtube.channelTitle}] Refreshing token...`)

    try {
      const newTokens = await refreshChannelToken(env, channel.youtube.refreshToken)

      const updatedChannel: Channel = {
        ...channel,
        youtube: {
          ...channel.youtube,
          accessToken: newTokens.accessToken,
          expiresAt: newTokens.expiresAt
        },
        needsReauth: false,
        lastError: undefined
      }

      await updateChannel(env.KV, channel.id, {
        youtube: updatedChannel.youtube,
        needsReauth: false,
        lastError: undefined
      })

      return updatedChannel
    } catch (error) {
      // 토큰 갱신 실패 - needsReauth 플래그 설정
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error(`[${channel.youtube.channelTitle}] Token refresh failed: ${errorMessage}`)

      await updateChannel(env.KV, channel.id, {
        needsReauth: true,
        lastError: `토큰 갱신 실패: ${errorMessage}`,
        isActive: false  // 자동으로 비활성화
      })

      return null
    }
  }

  return channel
}

/**
 * 단일 채널 수집 + 분류 + 응답 생성
 */
async function processChannelFetch(env: Env, channel: Channel): Promise<{
  fetched: number
  classified: number
  generated: number
  skipped?: string
}> {
  const result: { fetched: number; classified: number; generated: number; skipped?: string } =
    { fetched: 0, classified: 0, generated: 0 }

  try {
    // 야간 정지 시간 체크
    if (isPauseTime(channel.schedule.pauseStart, channel.schedule.pauseEnd, channel.schedule.timezone)) {
      console.log(`[${channel.youtube.channelTitle}] In pause time, skipping fetch`)
      result.skipped = 'pause_time'
      return result
    }

    // 1. 토큰 갱신
    const refreshedChannel = await ensureValidToken(env, channel)
    if (!refreshedChannel) {
      result.skipped = 'needs_reauth'
      return result
    }
    channel = refreshedChannel

    // 2. 새 댓글 수집
    console.log(`[${channel.youtube.channelTitle}] Fetching comments...`)
    const comments = await fetchChannelComments(env, channel)

    for (const comment of comments) {
      // 중복 체크
      if (await channelCommentExists(env.KV, channel.id, comment.id)) {
        continue
      }

      // 새 댓글 저장
      const storedComment: StoredComment = {
        ...comment,
        channelId: channel.id,
        status: 'unclassified',
        fetchedAt: new Date().toISOString()
      }
      await saveChannelComment(env.KV, channel.id, storedComment)
      result.fetched++
    }

    console.log(`[${channel.youtube.channelTitle}] Fetched ${result.fetched} new comments`)

    // 3. 미분류 댓글 분류
    const unclassified = await getChannelCommentsByStatus(env.KV, channel.id, 'unclassified')
    for (const comment of unclassified) {
      try {
        const classification = await classifyComment(env, comment.text)
        await updateChannelComment(env.KV, channel.id, comment.id, {
          type: classification.type,
          attitude: channel.settings.attitudeMap[classification.type],
          status: 'pending'
        })
        result.classified++
      } catch (error) {
        console.error(`[${channel.youtube.channelTitle}] Failed to classify ${comment.id}:`, error)
      }
    }

    console.log(`[${channel.youtube.channelTitle}] Classified ${result.classified} comments`)

    // 4. pending 댓글에 대해 응답 생성
    const pending = await getChannelCommentsByStatus(env.KV, channel.id, 'pending')

    // enabled가 false인 유형 필터링
    const enabledPending = pending.filter(c => {
      const type = c.type || 'other'
      const typeInstruction = channel.settings.typeInstructions?.[type]
      return !typeInstruction || typeInstruction.enabled !== false
    })

    if (enabledPending.length > 0) {
      const replies = await generateRepliesForComments(env, enabledPending, channel.settings)

      for (const [commentId, replyText] of replies) {
        await updateChannelComment(env.KV, channel.id, commentId, {
          status: 'generated',
          replyText,
          generatedAt: new Date().toISOString()
        })
        result.generated++
      }
    }

    console.log(`[${channel.youtube.channelTitle}] Generated ${result.generated} replies`)

    // 마지막 수집 시간 업데이트
    await updateChannel(env.KV, channel.id, {
      lastFetchedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error(`[${channel.youtube.channelTitle}] Process failed:`, error)
  }

  return result
}

/**
 * 단일 채널 자동 승인 (게시)
 * approveAfterHours: 응답 생성 후 N시간 경과한 댓글만 승인
 */
async function processChannelApprove(env: Env, channel: Channel): Promise<number> {
  let approvedCount = 0

  try {
    // 야간 정지 시간 체크
    if (isPauseTime(channel.schedule.pauseStart, channel.schedule.pauseEnd, channel.schedule.timezone)) {
      console.log(`[${channel.youtube.channelTitle}] In pause time, skipping approve`)
      return 0
    }

    // 토큰 갱신
    const refreshedChannel = await ensureValidToken(env, channel)
    if (!refreshedChannel) {
      return 0
    }
    channel = refreshedChannel

    // generated 상태인 댓글 조회
    const generated = await getChannelCommentsByStatus(env.KV, channel.id, 'generated')

    if (generated.length === 0) {
      return 0
    }

    // approveAfterHours 설정이 있으면 시간 경과한 댓글만 필터링
    const now = new Date()
    const approveAfterHours = channel.schedule.approveAfterHours
    const eligibleComments = generated.filter(comment => {
      if (!approveAfterHours || !comment.generatedAt) {
        return true  // 설정 없으면 모두 승인 대상
      }
      const generatedAt = new Date(comment.generatedAt)
      const elapsedHours = (now.getTime() - generatedAt.getTime()) / (1000 * 60 * 60)
      return elapsedHours >= approveAfterHours
    })

    if (eligibleComments.length === 0) {
      console.log(`[${channel.youtube.channelTitle}] No comments ready for approval (${generated.length} waiting for ${approveAfterHours}h)`)
      return 0
    }

    console.log(`[${channel.youtube.channelTitle}] Approving ${eligibleComments.length}/${generated.length} replies...`)

    for (const comment of eligibleComments) {
      if (!comment.replyText) continue

      try {
        // YouTube에 댓글 게시
        await postReplyWithChannel(env, channel, comment.id, comment.replyText)

        // 상태 업데이트
        await updateChannelComment(env.KV, channel.id, comment.id, {
          status: 'replied',
          repliedAt: new Date().toISOString()
        })

        approvedCount++

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error) {
        console.error(`[${channel.youtube.channelTitle}] Failed to post reply for ${comment.id}:`, error)
      }
    }

    // 마지막 승인 시간 업데이트
    await updateChannel(env.KV, channel.id, {
      lastApprovedAt: new Date().toISOString()
    })

    console.log(`[${channel.youtube.channelTitle}] Approved ${approvedCount} replies`)

  } catch (error) {
    console.error(`[${channel.youtube.channelTitle}] Approve failed:`, error)
  }

  return approvedCount
}

/**
 * 스케줄 작업: 수집 + 분류 + 응답 생성
 * Cron: 매 15분 또는 매시간 (설정에 따라)
 */
export async function handleFetchSchedule(env: Env): Promise<void> {
  console.log('=== Fetch Schedule Started ===')

  const channels = await getActiveChannels(env.KV)
  console.log(`Found ${channels.length} active channels`)

  for (const channel of channels) {
    // fetchInterval에 따른 실행 여부 결정
    const now = new Date()
    const lastFetched = channel.lastFetchedAt ? new Date(channel.lastFetchedAt) : null

    let shouldFetch = true
    if (lastFetched) {
      const diffMinutes = (now.getTime() - lastFetched.getTime()) / (1000 * 60)

      switch (channel.schedule.fetchInterval) {
        case 'every15min':
          shouldFetch = diffMinutes >= 14
          break
        case 'every30min':
          shouldFetch = diffMinutes >= 29
          break
        case 'hourly':
        default:
          shouldFetch = diffMinutes >= 59
          break
      }
    }

    if (shouldFetch) {
      await processChannelFetch(env, channel)
    } else {
      console.log(`[${channel.youtube.channelTitle}] Skipping (not due yet)`)
    }
  }

  console.log('=== Fetch Schedule Completed ===')
}

/**
 * 스케줄 작업: 자동 승인 (게시)
 * Cron: 매 30분
 */
export async function handleApproveSchedule(env: Env): Promise<void> {
  console.log('=== Approve Schedule Started ===')

  const channels = await getActiveChannels(env.KV)
  console.log(`Found ${channels.length} active channels`)

  for (const channel of channels) {
    // 자동 승인이 활성화되어 있고, 현재가 승인 시간인 경우만
    if (!channel.schedule.autoApprove) {
      console.log(`[${channel.youtube.channelTitle}] Auto-approve disabled, skipping`)
      continue
    }

    if (!isApproveTime(channel.schedule.approveTimes, channel.schedule.timezone)) {
      console.log(`[${channel.youtube.channelTitle}] Not approve time, skipping`)
      continue
    }

    // 마지막 승인 시간 체크 (같은 승인 시간대에 중복 실행 방지)
    if (channel.lastApprovedAt) {
      const lastApproved = new Date(channel.lastApprovedAt)
      const now = new Date()
      const diffMinutes = (now.getTime() - lastApproved.getTime()) / (1000 * 60)

      // 30분 이내에 이미 승인했으면 스킵
      if (diffMinutes < 30) {
        console.log(`[${channel.youtube.channelTitle}] Already approved recently, skipping`)
        continue
      }
    }

    await processChannelApprove(env, channel)
  }

  console.log('=== Approve Schedule Completed ===')
}

/**
 * 통합 스케줄 핸들러 (Cloudflare Cron용)
 */
export async function handleScheduled(env: Env, event: { cron: string }): Promise<void> {
  console.log(`Cron triggered: ${event.cron}`)

  // cron 패턴에 따라 다른 작업 실행
  // */15 * * * * → 수집/분류/응답생성
  // */30 * * * * → 자동 승인
  if (event.cron.includes('*/15') || event.cron.includes('0 * * * *')) {
    await handleFetchSchedule(env)
  }

  if (event.cron.includes('*/30')) {
    await handleApproveSchedule(env)
  }
}
