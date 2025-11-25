/**
 * YouTube 댓글 자동 응답 봇
 * Cloudflare Workers + Hono
 *
 * 기능:
 * - [📥 댓글 가져오기] 버튼: YouTube에서 댓글 수집 + AI 분류
 * - [🤖 자동 응답하기] 버튼: 미응답 댓글에 AI 응답 생성 & 게시
 * - Cron: 매일 자동 실행
 */

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { basicAuth } from 'hono/basic-auth'
import { HTTPException } from 'hono/http-exception'

import type { Env } from './types'

// Routes
import apiRoutes from './routes/api'

// Views
import { renderDashboard } from './views/dashboard'
import { renderLogin } from './views/login'

// Handlers
import { handleScheduled } from './services/scheduled'

// Create Hono app
const app = new Hono<{ Bindings: Env }>()

// Middleware
app.use('*', logger())
app.use('*', cors({
  origin: '*',
  credentials: true,
}))

// Public routes
app.get('/login', (c) => {
  return c.html(renderLogin())
})

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Protected routes (Basic Auth)
const protectedApp = new Hono<{ Bindings: Env }>()

protectedApp.use('*', async (c, next) => {
  const auth = basicAuth({
    username: 'admin',
    password: c.env.ADMIN_PASSWORD || 'admin123',
  })
  return auth(c, next)
})

// Dashboard
protectedApp.get('/', async (c) => {
  const html = await renderDashboard(c.env)
  return c.html(html)
})

// API routes
protectedApp.route('/api', apiRoutes)

// Mount protected routes
app.route('/', protectedApp)

// 404 handler
app.notFound((c) => {
  return c.json({
    success: false,
    error: 'Not found',
    path: c.req.path
  }, 404)
})

// Error handler
app.onError((err, c) => {
  // HTTPException (including basicAuth failures) - return the built-in response
  if (err instanceof HTTPException) {
    return err.getResponse()
  }

  console.error('Error:', err)
  return c.json({
    success: false,
    error: err.message || 'Internal server error'
  }, 500)
})

// Export for Cloudflare Workers
export default {
  fetch: app.fetch,

  // Cron trigger handler
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(handleScheduled(env))
  }
}
