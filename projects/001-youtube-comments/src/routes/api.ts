/**
 * API 라우트 정의
 */

import { Hono } from 'hono'
import type { Env, ApiResponse, StoredComment, User, JWTPayload } from '../types'

// Services
import { fetchComments } from '../services/youtube'
import { classifyComment, generateReplyForComment, generateRepliesForComments, replyToComment, type LLMOptions } from '../services/llm'

// KV helpers
import {
  getComments,
  getUnclassifiedComments,
  getPendingComments,
  getGeneratedComments,
  updateComment,
  getStats,
  getSettings,
  saveSettings,
  getLastFetchedAt
} from '../lib/kv'

// Variables 타입 (index.ts에서 설정)
type Variables = {
  jwtPayload: JWTPayload
  user: User
}

const api = new Hono<{ Bindings: Env; Variables: Variables }>()

/**
 * 유저의 API Key로 LLM 옵션 생성
 */
function getLLMOptions(c: { get: (key: 'user') => User | undefined }): LLMOptions {
  const user = c.get('user')
  return {
    apiKey: user?.openrouterApiKey
  }
}

/**
 * 댓글 목록 조회
 * GET /api/comments?page=1&limit=20&status=all
 */
api.get('/comments', async (c) => {
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '20')
  const status = (c.req.query('status') || 'all') as 'all' | 'unclassified' | 'pending' | 'generated' | 'replied'

  const result = await getComments(c.env.KV, { page, limit, status })
  const lastFetchedAt = await getLastFetchedAt(c.env.KV)

  return c.json<ApiResponse>({
    success: true,
    data: {
      ...result,
      lastFetchedAt
    }
  })
})

/**
 * 통계 조회
 * GET /api/stats
 */
api.get('/stats', async (c) => {
  const stats = await getStats(c.env.KV)
  const lastFetchedAt = await getLastFetchedAt(c.env.KV)

  return c.json<ApiResponse>({
    success: true,
    data: {
      ...stats,
      lastFetchedAt
    }
  })
})

/**
 * 댓글 가져오기 (YouTube에서 수집만, 분류 없음)
 * POST /api/fetch
 */
api.post('/fetch', async (c) => {
  try {
    const result = await fetchComments(c.env)

    return c.json<ApiResponse>({
      success: true,
      data: result,
      message: `${result.newComments}개의 새 댓글을 가져왔습니다.`
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
 * 댓글 자동 분류 (미분류 댓글에 AI 분류)
 * POST /api/classify
 */
api.post('/classify', async (c) => {
  try {
    const unclassifiedComments = await getUnclassifiedComments(c.env.KV)

    if (unclassifiedComments.length === 0) {
      return c.json<ApiResponse>({
        success: true,
        data: { classified: 0 },
        message: '분류할 댓글이 없습니다.'
      })
    }

    const settings = await getSettings(c.env.KV)
    let classifiedCount = 0
    const errors: string[] = []

    const llmOptions = getLLMOptions(c)

    for (const comment of unclassifiedComments) {
      try {
        // AI로 댓글 분류 (유저의 API Key 사용)
        const classification = await classifyComment(c.env, comment.text, llmOptions)

        // 분류 결과 업데이트
        await updateComment(c.env.KV, comment.id, {
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
        errors: errors.length > 0 ? errors : undefined
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
 * 응답 생성하기 (pending → generated, 아직 YouTube에 게시 안함)
 * POST /api/generate
 * 배치로 한 번에 여러 댓글 응답 생성
 */
api.post('/generate', async (c) => {
  try {
    const pendingComments = await getPendingComments(c.env.KV)

    if (pendingComments.length === 0) {
      return c.json<ApiResponse>({
        success: true,
        data: { generated: 0 },
        message: '응답을 생성할 댓글이 없습니다.'
      })
    }

    const settings = await getSettings(c.env.KV)
    const llmOptions = getLLMOptions(c)
    let generatedCount = 0
    const errors: string[] = []

    // 배치로 한 번에 응답 생성 (유저의 API Key 사용)
    const repliesMap = await generateRepliesForComments(c.env, pendingComments, settings, llmOptions)

    // 각 댓글 업데이트
    for (const comment of pendingComments) {
      const replyText = repliesMap.get(comment.id)

      if (replyText) {
        try {
          await updateComment(c.env.KV, comment.id, {
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
        errors: errors.length > 0 ? errors : undefined
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
 * 생성된 응답 수정
 * PUT /api/comments/:id/reply
 */
api.put('/comments/:id/reply', async (c) => {
  const commentId = c.req.param('id')

  try {
    const body = await c.req.json<{ replyText: string }>()

    if (!body.replyText || body.replyText.trim() === '') {
      return c.json<ApiResponse>({
        success: false,
        error: '응답 내용을 입력해주세요.'
      }, 400)
    }

    // 응답 텍스트 업데이트
    await updateComment(c.env.KV, commentId, {
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
 * 개별 댓글 승인 (YouTube에 게시)
 * POST /api/comments/:id/approve
 */
api.post('/comments/:id/approve', async (c) => {
  const commentId = c.req.param('id')

  try {
    const comments = await getComments(c.env.KV, { status: 'generated', limit: 1000 })
    const comment = comments.comments.find(c => c.id === commentId)

    if (!comment) {
      return c.json<ApiResponse>({
        success: false,
        error: '승인할 댓글을 찾을 수 없습니다.'
      }, 404)
    }

    if (!comment.replyText) {
      return c.json<ApiResponse>({
        success: false,
        error: '생성된 응답이 없습니다.'
      }, 400)
    }

    // YouTube에 댓글 게시
    await replyToComment(c.env, comment.id, comment.replyText)

    // 상태 업데이트
    await updateComment(c.env.KV, commentId, {
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
 * 전체 승인 (모든 generated 댓글을 YouTube에 게시)
 * POST /api/approve-all
 */
api.post('/approve-all', async (c) => {
  try {
    const generatedComments = await getGeneratedComments(c.env.KV)

    if (generatedComments.length === 0) {
      return c.json<ApiResponse>({
        success: true,
        data: { approved: 0 },
        message: '승인할 댓글이 없습니다.'
      })
    }

    let approvedCount = 0
    const errors: string[] = []

    for (const comment of generatedComments) {
      try {
        if (!comment.replyText) continue

        // YouTube에 댓글 게시
        await replyToComment(c.env, comment.id, comment.replyText)

        // 상태 업데이트
        await updateComment(c.env.KV, comment.id, {
          status: 'replied',
          repliedAt: new Date().toISOString()
        })

        approvedCount++
      } catch (error) {
        console.error(`Approve error for ${comment.id}:`, error)
        errors.push(`${comment.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return c.json<ApiResponse>({
      success: true,
      data: {
        approved: approvedCount,
        total: generatedComments.length,
        errors: errors.length > 0 ? errors : undefined
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

/**
 * 개별 댓글 응답
 * POST /api/comments/:id/reply
 */
api.post('/comments/:id/reply', async (c) => {
  const commentId = c.req.param('id')

  try {
    const body = await c.req.json<{ customReply?: string }>()

    // 댓글 조회
    const comments = await getComments(c.env.KV, { status: 'all', limit: 1000 })
    const comment = comments.comments.find(c => c.id === commentId)

    if (!comment) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Comment not found'
      }, 404)
    }

    const settings = await getSettings(c.env.KV)
    const llmOptions = getLLMOptions(c)

    // 커스텀 응답이 있으면 사용, 없으면 AI 생성 (유저의 API Key 사용)
    const replyText = body.customReply || await generateReplyForComment(c.env, comment, settings, llmOptions)

    // YouTube에 댓글 게시
    await replyToComment(c.env, comment.id, replyText)

    // 상태 업데이트
    await updateComment(c.env.KV, commentId, {
      status: 'replied',
      replyText,
      repliedAt: new Date().toISOString()
    })

    return c.json<ApiResponse>({
      success: true,
      data: { replyText },
      message: '댓글에 응답했습니다.'
    })
  } catch (error) {
    console.error(`Reply error for ${commentId}:`, error)
    return c.json<ApiResponse>({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reply'
    }, 500)
  }
})

/**
 * 설정 조회
 * GET /api/settings
 */
api.get('/settings', async (c) => {
  const settings = await getSettings(c.env.KV)

  return c.json<ApiResponse>({
    success: true,
    data: settings
  })
})

/**
 * 설정 저장
 * PUT /api/settings
 */
api.put('/settings', async (c) => {
  try {
    const body = await c.req.json()
    await saveSettings(c.env.KV, body)

    return c.json<ApiResponse>({
      success: true,
      message: '설정이 저장되었습니다.'
    })
  } catch (error) {
    return c.json<ApiResponse>({
      success: false,
      error: 'Failed to save settings'
    }, 500)
  }
})

export default api
