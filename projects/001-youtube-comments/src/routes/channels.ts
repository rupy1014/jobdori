/**
 * 채널 관리 API 라우트
 * - 채널 CRUD
 * - 채널별 댓글 작업 (fetch, classify, generate, approve)
 */

import { Hono } from 'hono'
import type { Env, ApiResponse, Channel, JWTPayload, ChannelSchedule, User } from '../types'
import { DEFAULT_SETTINGS, DEFAULT_SCHEDULE } from '../types'

// Services
import { exchangeCodeForChannel, fetchChannelComments } from '../services/youtube-channel'
import { classifyComment, generateRepliesForComments, replyToComment, type LLMOptions } from '../services/llm'

// KV helpers
import {
  saveChannel,
  getChannelById,
  updateChannel,
  getUserChannelsData,
  getChannelStats,
  getChannelComments,
  getChannelComment,
  updateChannelComment,
  getChannelCommentsByStatus,
  getChannelByYouTubeId,
  saveChannelComment,
  setChannelLastFetchedAt,
  channelCommentExists
} from '../lib/kv'

// Variables 타입 정의
// index.ts의 protectedApp에서 User 타입을 'user'로 설정
type Variables = {
  user: User  // 전체 사용자 정보 (API Key 포함)
  jwtPayload: JWTPayload
}

/**
 * 유저의 API Key로 LLM 옵션 생성
 */
function getLLMOptions(user?: User): LLMOptions {
  return {
    apiKey: user?.openrouterApiKey
  }
}

const channels = new Hono<{ Bindings: Env; Variables: Variables }>()

/**
 * 내 채널 목록 조회
 * GET /api/channels
 */
channels.get('/', async (c) => {
  const user = c.get('user')

  const userChannels = await getUserChannelsData(c.env.KV, user.id)

  // 민감 정보 제거
  const safeChannels = userChannels.map(ch => ({
    id: ch.id,
    youtubeChannelId: ch.youtube.channelId,
    channelTitle: ch.youtube.channelTitle,
    isActive: ch.isActive,
    schedule: ch.schedule,
    createdAt: ch.createdAt,
    lastFetchedAt: ch.lastFetchedAt,
    lastApprovedAt: ch.lastApprovedAt
  }))

  return c.json<ApiResponse>({
    success: true,
    data: safeChannels
  })
})

/**
 * OAuth URL 생성
 * GET /api/channels/oauth-url
 */
channels.get('/oauth-url', async (c) => {
  const baseUrl = new URL(c.req.url).origin
  const redirectUri = `${baseUrl}/api/channels/oauth/callback`

  const params = new URLSearchParams({
    client_id: c.env.YOUTUBE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/youtube.force-ssl',
    access_type: 'offline',
    prompt: 'consent',
  })

  const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`

  return c.json<ApiResponse>({
    success: true,
    data: { url: oauthUrl, redirectUri }
  })
})

/**
 * OAuth 콜백 처리 및 채널 등록
 * GET /api/channels/oauth/callback
 */
channels.get('/oauth/callback', async (c) => {
  const code = c.req.query('code')
  const error = c.req.query('error')

  if (error) {
    return c.redirect(`/dashboard?error=${encodeURIComponent(error)}`)
  }

  if (!code) {
    return c.redirect('/dashboard?error=No authorization code')
  }

  try {
    const user = c.get('user')
    const baseUrl = new URL(c.req.url).origin
    const redirectUri = `${baseUrl}/api/channels/oauth/callback`

    // 토큰 교환 및 채널 정보 획득
    const channelInfo = await exchangeCodeForChannel(c.env, code, redirectUri)

    // 이미 등록된 채널인지 확인
    const existingChannel = await getChannelByYouTubeId(c.env.KV, channelInfo.channelId)
    if (existingChannel) {
      // 이미 등록된 채널이면 토큰만 업데이트
      await updateChannel(c.env.KV, existingChannel.id, {
        youtube: {
          ...existingChannel.youtube,
          accessToken: channelInfo.accessToken,
          refreshToken: channelInfo.refreshToken,
          expiresAt: channelInfo.expiresAt
        }
      })

      return c.redirect(`/dashboard?success=Channel reconnected&channelId=${existingChannel.id}`)
    }

    // 새 채널 생성
    const channelId = crypto.randomUUID()
    const newChannel: Channel = {
      id: channelId,
      userId: user.id,
      youtube: {
        accessToken: channelInfo.accessToken,
        refreshToken: channelInfo.refreshToken,
        expiresAt: channelInfo.expiresAt,
        channelId: channelInfo.channelId,
        channelTitle: channelInfo.channelTitle
      },
      settings: DEFAULT_SETTINGS,
      schedule: DEFAULT_SCHEDULE,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    await saveChannel(c.env.KV, newChannel)

    return c.redirect(`/dashboard?success=Channel registered&channelId=${channelId}`)
  } catch (err) {
    console.error('OAuth callback error:', err)
    return c.redirect(`/dashboard?error=${encodeURIComponent(err instanceof Error ? err.message : 'Unknown error')}`)
  }
})

/**
 * 채널 상세 조회
 * GET /api/channels/:id
 */
channels.get('/:id', async (c) => {
  const channelId = c.req.param('id')
  const user = c.get('user')

  const channel = await getChannelById(c.env.KV, channelId)

  if (!channel) {
    return c.json<ApiResponse>({ success: false, error: 'Channel not found' }, 404)
  }

  // 본인 채널인지 확인
  if (channel.userId !== user.id) {
    return c.json<ApiResponse>({ success: false, error: 'Access denied' }, 403)
  }

  // 민감 정보 제거
  const safeChannel = {
    id: channel.id,
    youtubeChannelId: channel.youtube.channelId,
    channelTitle: channel.youtube.channelTitle,
    settings: channel.settings,
    schedule: channel.schedule,
    isActive: channel.isActive,
    createdAt: channel.createdAt,
    updatedAt: channel.updatedAt,
    lastFetchedAt: channel.lastFetchedAt,
    lastApprovedAt: channel.lastApprovedAt
  }

  return c.json<ApiResponse>({
    success: true,
    data: safeChannel
  })
})

/**
 * 채널 통계 조회
 * GET /api/channels/:id/stats
 */
channels.get('/:id/stats', async (c) => {
  const channelId = c.req.param('id')
  const user = c.get('user')

  const channel = await getChannelById(c.env.KV, channelId)

  if (!channel) {
    return c.json<ApiResponse>({ success: false, error: 'Channel not found' }, 404)
  }

  if (channel.userId !== user.id) {
    return c.json<ApiResponse>({ success: false, error: 'Access denied' }, 403)
  }

  const stats = await getChannelStats(c.env.KV, channelId)

  return c.json<ApiResponse>({
    success: true,
    data: {
      ...stats,
      lastFetchedAt: channel.lastFetchedAt,
      lastApprovedAt: channel.lastApprovedAt
    }
  })
})

/**
 * 채널 댓글 목록 조회
 * GET /api/channels/:id/comments
 */
channels.get('/:id/comments', async (c) => {
  const channelId = c.req.param('id')
  const user = c.get('user')

  const channel = await getChannelById(c.env.KV, channelId)

  if (!channel) {
    return c.json<ApiResponse>({ success: false, error: 'Channel not found' }, 404)
  }

  if (channel.userId !== user.id) {
    return c.json<ApiResponse>({ success: false, error: 'Access denied' }, 403)
  }

  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '20')
  const status = (c.req.query('status') || 'all') as 'all' | 'unclassified' | 'pending' | 'generated' | 'replied'

  const result = await getChannelComments(c.env.KV, channelId, { page, limit, status })

  return c.json<ApiResponse>({
    success: true,
    data: result
  })
})

/**
 * 채널 스케줄 설정 업데이트
 * PUT /api/channels/:id/schedule
 */
channels.put('/:id/schedule', async (c) => {
  const channelId = c.req.param('id')
  const user = c.get('user')

  const channel = await getChannelById(c.env.KV, channelId)

  if (!channel) {
    return c.json<ApiResponse>({ success: false, error: 'Channel not found' }, 404)
  }

  if (channel.userId !== user.id) {
    return c.json<ApiResponse>({ success: false, error: 'Access denied' }, 403)
  }

  try {
    const body = await c.req.json<Partial<ChannelSchedule>>()

    // 유효성 검사
    if (body.approveTimes) {
      // 시간 형식 검증 (HH:MM)
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
      for (const time of body.approveTimes) {
        if (!timeRegex.test(time)) {
          return c.json<ApiResponse>({
            success: false,
            error: `Invalid time format: ${time}. Use HH:MM format.`
          }, 400)
        }
      }
    }

    const updatedSchedule: ChannelSchedule = {
      ...channel.schedule,
      ...body
    }

    await updateChannel(c.env.KV, channelId, { schedule: updatedSchedule })

    return c.json<ApiResponse>({
      success: true,
      message: '스케줄이 업데이트되었습니다.',
      data: updatedSchedule
    })
  } catch (error) {
    return c.json<ApiResponse>({
      success: false,
      error: 'Failed to update schedule'
    }, 500)
  }
})

/**
 * 채널 설정 업데이트
 * PUT /api/channels/:id/settings
 */
channels.put('/:id/settings', async (c) => {
  const channelId = c.req.param('id')
  const user = c.get('user')

  const channel = await getChannelById(c.env.KV, channelId)

  if (!channel) {
    return c.json<ApiResponse>({ success: false, error: 'Channel not found' }, 404)
  }

  if (channel.userId !== user.id) {
    return c.json<ApiResponse>({ success: false, error: 'Access denied' }, 403)
  }

  try {
    const body = await c.req.json()

    const updatedSettings = {
      ...channel.settings,
      ...body
    }

    await updateChannel(c.env.KV, channelId, { settings: updatedSettings })

    return c.json<ApiResponse>({
      success: true,
      message: '설정이 업데이트되었습니다.',
      data: updatedSettings
    })
  } catch (error) {
    return c.json<ApiResponse>({
      success: false,
      error: 'Failed to update settings'
    }, 500)
  }
})

/**
 * 채널 활성화/비활성화
 * PUT /api/channels/:id/toggle
 */
channels.put('/:id/toggle', async (c) => {
  const channelId = c.req.param('id')
  const user = c.get('user')

  const channel = await getChannelById(c.env.KV, channelId)

  if (!channel) {
    return c.json<ApiResponse>({ success: false, error: 'Channel not found' }, 404)
  }

  if (channel.userId !== user.id) {
    return c.json<ApiResponse>({ success: false, error: 'Access denied' }, 403)
  }

  await updateChannel(c.env.KV, channelId, { isActive: !channel.isActive })

  return c.json<ApiResponse>({
    success: true,
    message: channel.isActive ? '채널이 비활성화되었습니다.' : '채널이 활성화되었습니다.',
    data: { isActive: !channel.isActive }
  })
})

// ============================================
// 채널별 댓글 작업 API (fetch, classify, generate, approve)
// ============================================

/**
 * 채널별 댓글 가져오기 (YouTube에서 수집)
 * POST /api/channels/:id/fetch
 */
channels.post('/:id/fetch', async (c) => {
  const channelId = c.req.param('id')
  const user = c.get('user')

  const channel = await getChannelById(c.env.KV, channelId)

  if (!channel) {
    return c.json<ApiResponse>({ success: false, error: 'Channel not found' }, 404)
  }

  if (channel.userId !== user.id) {
    return c.json<ApiResponse>({ success: false, error: 'Access denied' }, 403)
  }

  try {
    // YouTube에서 댓글 수집
    const rawComments = await fetchChannelComments(c.env, channel)

    let newComments = 0
    let existingComments = 0

    // 각 댓글 저장
    const now = new Date().toISOString()
    for (const rawComment of rawComments) {
      const exists = await channelCommentExists(c.env.KV, channelId, rawComment.id)

      if (!exists) {
        await saveChannelComment(c.env.KV, channelId, {
          id: rawComment.id,
          channelId: channelId,
          videoId: rawComment.videoId,
          videoTitle: rawComment.videoTitle,
          authorName: rawComment.authorName,
          authorChannelId: rawComment.authorChannelId,
          text: rawComment.text,
          publishedAt: rawComment.publishedAt,
          fetchedAt: now,
          status: rawComment.status,
          replyText: rawComment.replyText
        })
        newComments++
      } else {
        existingComments++
      }
    }

    // 마지막 fetch 시간 업데이트
    await setChannelLastFetchedAt(c.env.KV, channelId, new Date().toISOString())

    return c.json<ApiResponse>({
      success: true,
      data: {
        newComments,
        existingComments,
        total: rawComments.length,
        channelId
      },
      message: `${newComments}개의 새 댓글을 가져왔습니다.`
    })
  } catch (error) {
    console.error('Fetch error:', error)
    return c.json<ApiResponse>({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch comments'
    }, 500)
  }
})

/**
 * 채널별 댓글 자동 분류 (미분류 댓글에 AI 분류)
 * POST /api/channels/:id/classify
 */
channels.post('/:id/classify', async (c) => {
  const channelId = c.req.param('id')
  const user = c.get('user')

  const channel = await getChannelById(c.env.KV, channelId)

  if (!channel) {
    return c.json<ApiResponse>({ success: false, error: 'Channel not found' }, 404)
  }

  if (channel.userId !== user.id) {
    return c.json<ApiResponse>({ success: false, error: 'Access denied' }, 403)
  }

  try {
    const unclassifiedComments = await getChannelCommentsByStatus(c.env.KV, channelId, 'unclassified')

    if (unclassifiedComments.length === 0) {
      return c.json<ApiResponse>({
        success: true,
        data: { classified: 0, channelId },
        message: '분류할 댓글이 없습니다.'
      })
    }

    // 채널 설정 사용
    const settings = channel.settings
    let classifiedCount = 0
    const errors: string[] = []

    const llmOptions = getLLMOptions(user)

    for (const comment of unclassifiedComments) {
      try {
        // AI로 댓글 분류
        const classification = await classifyComment(c.env, comment.text, llmOptions)

        // 분류 결과 업데이트
        await updateChannelComment(c.env.KV, channelId, comment.id, {
          type: classification.type,
          attitude: settings.attitudeMap[classification.type],
          status: 'pending'
        })

        classifiedCount++
      } catch (error) {
        console.error(`Classify error for ${comment.id}:`, error)
        errors.push(`${comment.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return c.json<ApiResponse>({
      success: true,
      data: {
        classified: classifiedCount,
        total: unclassifiedComments.length,
        errors: errors.length > 0 ? errors : undefined,
        channelId
      },
      message: `${classifiedCount}개의 댓글을 분류했습니다.`
    })
  } catch (error) {
    console.error('Classify error:', error)
    return c.json<ApiResponse>({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to classify comments'
    }, 500)
  }
})

/**
 * 채널별 응답 생성하기 (pending → generated)
 * POST /api/channels/:id/generate
 */
channels.post('/:id/generate', async (c) => {
  const channelId = c.req.param('id')
  const user = c.get('user')

  const channel = await getChannelById(c.env.KV, channelId)

  if (!channel) {
    return c.json<ApiResponse>({ success: false, error: 'Channel not found' }, 404)
  }

  if (channel.userId !== user.id) {
    return c.json<ApiResponse>({ success: false, error: 'Access denied' }, 403)
  }

  try {
    const pendingComments = await getChannelCommentsByStatus(c.env.KV, channelId, 'pending')

    if (pendingComments.length === 0) {
      return c.json<ApiResponse>({
        success: true,
        data: { generated: 0, channelId },
        message: '응답을 생성할 댓글이 없습니다.'
      })
    }

    const settings = channel.settings
    const llmOptions = getLLMOptions(user)
    let generatedCount = 0
    const errors: string[] = []

    // 배치로 응답 생성
    const repliesMap = await generateRepliesForComments(c.env, pendingComments, settings, llmOptions)

    // 각 댓글 업데이트
    for (const comment of pendingComments) {
      const replyText = repliesMap.get(comment.id)

      if (replyText) {
        try {
          await updateChannelComment(c.env.KV, channelId, comment.id, {
            status: 'generated',
            replyText,
            generatedAt: new Date().toISOString()
          })
          generatedCount++
        } catch (error) {
          console.error(`Update error for ${comment.id}:`, error)
          errors.push(`${comment.id}: ${error instanceof Error ? error.message : 'Update failed'}`)
        }
      } else {
        errors.push(`${comment.id}: 응답 생성 실패`)
      }
    }

    return c.json<ApiResponse>({
      success: true,
      data: {
        generated: generatedCount,
        total: pendingComments.length,
        errors: errors.length > 0 ? errors : undefined,
        channelId
      },
      message: `${generatedCount}개의 응답을 생성했습니다. 확인 후 승인해주세요.`
    })
  } catch (error) {
    console.error('Generate error:', error)
    return c.json<ApiResponse>({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate replies'
    }, 500)
  }
})

/**
 * 채널별 생성된 응답 수정
 * PUT /api/channels/:id/comments/:commentId/reply
 */
channels.put('/:id/comments/:commentId/reply', async (c) => {
  const channelId = c.req.param('id')
  const commentId = c.req.param('commentId')
  const user = c.get('user')

  const channel = await getChannelById(c.env.KV, channelId)

  if (!channel) {
    return c.json<ApiResponse>({ success: false, error: 'Channel not found' }, 404)
  }

  if (channel.userId !== user.id) {
    return c.json<ApiResponse>({ success: false, error: 'Access denied' }, 403)
  }

  try {
    const body = await c.req.json<{ replyText: string }>()

    if (!body.replyText || body.replyText.trim() === '') {
      return c.json<ApiResponse>({
        success: false,
        error: '응답 내용을 입력해주세요.'
      }, 400)
    }

    // 댓글 존재 확인
    const comment = await getChannelComment(c.env.KV, channelId, commentId)
    if (!comment) {
      return c.json<ApiResponse>({
        success: false,
        error: '댓글을 찾을 수 없습니다.'
      }, 404)
    }

    // 응답 텍스트 업데이트
    await updateChannelComment(c.env.KV, channelId, commentId, {
      replyText: body.replyText.trim(),
      generatedAt: new Date().toISOString()
    })

    return c.json<ApiResponse>({
      success: true,
      message: '응답이 수정되었습니다.'
    })
  } catch (error) {
    console.error(`Edit reply error for ${commentId}:`, error)
    return c.json<ApiResponse>({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to edit reply'
    }, 500)
  }
})

/**
 * 채널별 생성된 응답 삭제 (pending으로 되돌리기)
 * DELETE /api/channels/:id/comments/:commentId/reply
 */
channels.delete('/:id/comments/:commentId/reply', async (c) => {
  const channelId = c.req.param('id')
  const commentId = c.req.param('commentId')
  const user = c.get('user')

  const channel = await getChannelById(c.env.KV, channelId)

  if (!channel) {
    return c.json<ApiResponse>({ success: false, error: 'Channel not found' }, 404)
  }

  if (channel.userId !== user.id) {
    return c.json<ApiResponse>({ success: false, error: 'Access denied' }, 403)
  }

  try {
    const comment = await getChannelComment(c.env.KV, channelId, commentId)
    if (!comment) {
      return c.json<ApiResponse>({
        success: false,
        error: '댓글을 찾을 수 없습니다.'
      }, 404)
    }

    // 응답 텍스트 삭제하고 pending 상태로 되돌리기
    await updateChannelComment(c.env.KV, channelId, commentId, {
      status: 'pending',
      replyText: undefined,
      generatedAt: undefined
    })

    return c.json<ApiResponse>({
      success: true,
      message: '응답이 삭제되었습니다. 댓글이 "미응답" 상태로 돌아갔습니다.'
    })
  } catch (error) {
    console.error(`Delete reply error for ${commentId}:`, error)
    return c.json<ApiResponse>({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete reply'
    }, 500)
  }
})

/**
 * 채널별 개별 댓글 승인 (YouTube에 게시)
 * POST /api/channels/:id/comments/:commentId/approve
 */
channels.post('/:id/comments/:commentId/approve', async (c) => {
  const channelId = c.req.param('id')
  const commentId = c.req.param('commentId')
  const user = c.get('user')

  const channel = await getChannelById(c.env.KV, channelId)

  if (!channel) {
    return c.json<ApiResponse>({ success: false, error: 'Channel not found' }, 404)
  }

  if (channel.userId !== user.id) {
    return c.json<ApiResponse>({ success: false, error: 'Access denied' }, 403)
  }

  try {
    const comment = await getChannelComment(c.env.KV, channelId, commentId)

    if (!comment) {
      return c.json<ApiResponse>({
        success: false,
        error: '승인할 댓글을 찾을 수 없습니다.'
      }, 404)
    }

    if (comment.status !== 'generated') {
      return c.json<ApiResponse>({
        success: false,
        error: '생성된 응답이 있는 댓글만 승인할 수 있습니다.'
      }, 400)
    }

    if (!comment.replyText) {
      return c.json<ApiResponse>({
        success: false,
        error: '생성된 응답이 없습니다.'
      }, 400)
    }

    // YouTube에 댓글 게시 (채널 토큰 사용)
    await replyToComment(c.env, comment.id, comment.replyText, channel)

    // 상태 업데이트
    await updateChannelComment(c.env.KV, channelId, commentId, {
      status: 'replied',
      repliedAt: new Date().toISOString()
    })

    return c.json<ApiResponse>({
      success: true,
      message: '댓글이 YouTube에 게시되었습니다.'
    })
  } catch (error) {
    console.error(`Approve error for ${commentId}:`, error)
    return c.json<ApiResponse>({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to approve comment'
    }, 500)
  }
})

/**
 * 채널별 전체 승인 (모든 generated 댓글을 YouTube에 게시)
 * POST /api/channels/:id/approve-all
 */
channels.post('/:id/approve-all', async (c) => {
  const channelId = c.req.param('id')
  const user = c.get('user')

  const channel = await getChannelById(c.env.KV, channelId)

  if (!channel) {
    return c.json<ApiResponse>({ success: false, error: 'Channel not found' }, 404)
  }

  if (channel.userId !== user.id) {
    return c.json<ApiResponse>({ success: false, error: 'Access denied' }, 403)
  }

  try {
    const generatedComments = await getChannelCommentsByStatus(c.env.KV, channelId, 'generated')

    if (generatedComments.length === 0) {
      return c.json<ApiResponse>({
        success: true,
        data: { approved: 0, channelId },
        message: '승인할 댓글이 없습니다.'
      })
    }

    let approvedCount = 0
    const errors: string[] = []

    for (const comment of generatedComments) {
      try {
        if (!comment.replyText) continue

        // YouTube에 댓글 게시 (채널 토큰 사용)
        await replyToComment(c.env, comment.id, comment.replyText, channel)

        // 상태 업데이트
        await updateChannelComment(c.env.KV, channelId, comment.id, {
          status: 'replied',
          repliedAt: new Date().toISOString()
        })

        approvedCount++
      } catch (error) {
        console.error(`Approve error for ${comment.id}:`, error)
        errors.push(`${comment.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    // 마지막 승인 시간 업데이트
    await updateChannel(c.env.KV, channelId, { lastApprovedAt: new Date().toISOString() })

    return c.json<ApiResponse>({
      success: true,
      data: {
        approved: approvedCount,
        total: generatedComments.length,
        errors: errors.length > 0 ? errors : undefined,
        channelId
      },
      message: `${approvedCount}개의 댓글이 YouTube에 게시되었습니다.`
    })
  } catch (error) {
    console.error('Approve-all error:', error)
    return c.json<ApiResponse>({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to approve comments'
    }, 500)
  }
})

export default channels
