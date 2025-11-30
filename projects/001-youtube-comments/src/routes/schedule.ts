/**
 * 스케줄 API 라우트
 * Cron Worker에서 호출하는 엔드포인트
 */

import { Hono } from 'hono'
import type { Env } from '../types'
import { handleFetchSchedule, handleApproveSchedule } from '../services/scheduler'

const app = new Hono<{ Bindings: Env }>()

// 내부 API 인증 미들웨어
// Cron Worker에서만 호출 가능하도록 시크릿 키로 인증
app.use('*', async (c, next) => {
  const authHeader = c.req.header('X-Cron-Secret')
  const cronSecret = c.env.JWT_SECRET  // JWT_SECRET을 cron 인증에도 재사용

  if (!authHeader || authHeader !== cronSecret) {
    return c.json({ success: false, error: 'Unauthorized' }, 401)
  }

  return next()
})

/**
 * POST /api/schedule/fetch
 * 댓글 수집 + 분류 + 응답 생성
 */
app.post('/fetch', async (c) => {
  console.log('Schedule API: fetch called')

  try {
    await handleFetchSchedule(c.env)
    return c.json({ success: true, message: 'Fetch schedule completed' })
  } catch (error) {
    console.error('Fetch schedule error:', error)
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

/**
 * POST /api/schedule/approve
 * 자동 승인 (게시)
 */
app.post('/approve', async (c) => {
  console.log('Schedule API: approve called')

  try {
    await handleApproveSchedule(c.env)
    return c.json({ success: true, message: 'Approve schedule completed' })
  } catch (error) {
    console.error('Approve schedule error:', error)
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

export default app
