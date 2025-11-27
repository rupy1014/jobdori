/**
 * Autonomey - YouTube 댓글 자동 응답 봇
 * Cloudflare Workers + Hono
 *
 * 기능:
 * - [📥 댓글 가져오기] 버튼: YouTube에서 댓글 수집 + AI 분류
 * - [🤖 자동 응답하기] 버튼: 미응답 댓글에 AI 응답 생성 & 게시
 * - Cron: 매일 자동 실행
 * - 회원가입/로그인 (JWT 인증)
 */

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { basicAuth } from 'hono/basic-auth'
import { HTTPException } from 'hono/http-exception'

import type { Env, JWTPayload } from './types'

// Routes
import apiRoutes from './routes/api'
import authRoutes from './routes/auth'

// Views
import { renderDashboard } from './views/dashboard'
import { renderLogin } from './views/login'

// Handlers
import { handleScheduled } from './services/scheduled'

// YouTube OAuth
import { getOAuthUrl, exchangeCodeForTokens } from './services/youtube'

// Auth
import { verifyToken } from './lib/auth'
import { getUserById } from './lib/kv'

// Hono 앱에서 사용할 Variables 타입
type Variables = {
  user: JWTPayload
}

// Create Hono app
const app = new Hono<{ Bindings: Env; Variables: Variables }>()

// Middleware
app.use('*', logger())
app.use('*', cors({
  origin: '*',
  credentials: true,
}))

// ============================================
// Public routes (인증 불필요)
// ============================================

// 로그인 페이지
app.get('/login', (c) => {
  return c.html(renderLogin())
})

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 인증 라우트 (회원가입, 로그인, 토큰 갱신)
app.route('/auth', authRoutes)

// OAuth routes (public but needs env)
app.get('/oauth/start', (c) => {
  const baseUrl = new URL(c.req.url).origin
  const redirectUri = `${baseUrl}/oauth/callback`
  const authUrl = getOAuthUrl(c.env, redirectUri)
  return c.redirect(authUrl)
})

app.get('/oauth/callback', async (c) => {
  const code = c.req.query('code')
  const error = c.req.query('error')

  if (error) {
    return c.html(`
      <html>
        <body style="font-family: sans-serif; padding: 40px; text-align: center;">
          <h1>OAuth Error</h1>
          <p>${error}</p>
          <a href="/oauth/start">Try again</a>
        </body>
      </html>
    `)
  }

  if (!code) {
    return c.html(`
      <html>
        <body style="font-family: sans-serif; padding: 40px; text-align: center;">
          <h1>Error</h1>
          <p>No authorization code received</p>
          <a href="/oauth/start">Try again</a>
        </body>
      </html>
    `)
  }

  try {
    const baseUrl = new URL(c.req.url).origin
    const redirectUri = `${baseUrl}/oauth/callback`
    await exchangeCodeForTokens(c.env, code, redirectUri)

    return c.html(`
      <html>
        <body style="font-family: sans-serif; padding: 40px; text-align: center; background: #0f0f0f; color: #fff;">
          <h1>YouTube Authorization Complete</h1>
          <p>Tokens have been saved. You can now post replies.</p>
          <a href="/" style="color: #3b82f6;">Go to Dashboard</a>
        </body>
      </html>
    `)
  } catch (err) {
    return c.html(`
      <html>
        <body style="font-family: sans-serif; padding: 40px; text-align: center;">
          <h1>Token Exchange Failed</h1>
          <p>${err instanceof Error ? err.message : 'Unknown error'}</p>
          <a href="/oauth/start">Try again</a>
        </body>
      </html>
    `)
  }
})

// ============================================
// Protected routes (JWT 또는 Basic Auth)
// ============================================
const protectedApp = new Hono<{ Bindings: Env; Variables: Variables }>()

// 인증 미들웨어: JWT Bearer 토큰 또는 Basic Auth 지원
protectedApp.use('*', async (c, next) => {
  const authHeader = c.req.header('Authorization')

  // 1. JWT Bearer 토큰 확인
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    const payload = await verifyToken(token, c.env.JWT_SECRET)

    if (payload) {
      c.set('user', payload)
      return next()
    }

    // JWT가 있지만 유효하지 않은 경우
    return c.json({ success: false, error: '유효하지 않은 토큰입니다.' }, 401)
  }

  // 2. Basic Auth 확인 (레거시 지원)
  if (authHeader && authHeader.startsWith('Basic ')) {
    const auth = basicAuth({
      username: 'admin',
      password: c.env.ADMIN_PASSWORD || 'admin123',
    })
    return auth(c, next)
  }

  // 3. 쿠키에서 토큰 확인 (웹 대시보드용)
  const tokenCookie = c.req.raw.headers.get('cookie')?.match(/token=([^;]+)/)?.[1]
  if (tokenCookie) {
    const payload = await verifyToken(tokenCookie, c.env.JWT_SECRET)
    if (payload) {
      c.set('user', payload)
      return next()
    }
  }

  // 4. 인증 없음 - Basic Auth 프롬프트 표시 (브라우저 대시보드 접근용)
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
