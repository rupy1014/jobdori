/**
 * Cron 스케줄러 핸들러
 * 매일 자동으로 댓글 수집 및 응답
 */

import type { Env } from '../types'
import { fetchComments } from './youtube'
import { classifyComment, generateReplyForComment, replyToComment } from './llm'
import { getPendingComments, getUnclassifiedComments, updateComment, getSettings } from '../lib/kv'

/**
 * 스케줄된 작업 실행
 */
export async function handleScheduled(env: Env): Promise<void> {
  console.log('Starting scheduled task...')

  try {
    const settings = await getSettings(env.KV)

    // 1. 새 댓글 가져오기
    console.log('Step 1: Fetching comments...')
    const fetchResult = await fetchComments(env)
    console.log(`Fetched ${fetchResult.newComments} new comments from ${fetchResult.videos} videos`)

    // 2. 미분류 댓글 분류하기
    console.log('Step 2: Classifying comments...')
    const unclassifiedComments = await getUnclassifiedComments(env.KV)
    console.log(`Found ${unclassifiedComments.length} unclassified comments`)

    for (const comment of unclassifiedComments) {
      try {
        const classification = await classifyComment(env, comment.text)
        await updateComment(env.KV, comment.id, {
          type: classification.type,
          attitude: settings.attitudeMap[classification.type],
          status: 'pending'
        })
        console.log(`Classified comment ${comment.id}: ${classification.type}`)
      } catch (error) {
        console.error(`Failed to classify comment ${comment.id}:`, error)
      }
    }

    // 3. 미응답 댓글에 응답하기
    console.log('Step 3: Replying to pending comments...')
    const pendingComments = await getPendingComments(env.KV)
    console.log(`Found ${pendingComments.length} pending comments`)

    if (pendingComments.length === 0) {
      console.log('No pending comments to reply')
      return
    }
    let repliedCount = 0
    let errorCount = 0

    for (const comment of pendingComments) {
      try {
        // AI 응답 생성
        const replyText = await generateReplyForComment(env, comment, settings)
        console.log(`Generated reply for comment ${comment.id}: ${replyText.substring(0, 50)}...`)

        // YouTube에 댓글 게시
        await replyToComment(env, comment.id, replyText)
        console.log(`Posted reply to YouTube for comment ${comment.id}`)

        // 상태 업데이트
        await updateComment(env.KV, comment.id, {
          status: 'replied',
          replyText,
          repliedAt: new Date().toISOString()
        })

        repliedCount++

        // Rate limiting - 댓글 사이에 1초 대기
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error) {
        console.error(`Failed to reply to comment ${comment.id}:`, error)
        errorCount++
      }
    }

    console.log(`Scheduled task completed: ${repliedCount} replies sent, ${errorCount} errors`)
  } catch (error) {
    console.error('Scheduled task failed:', error)
    throw error
  }
}
