/**
 * Autonomey - YouTube 댓글 자동 응답 봇
 * Cloudflare Workers + Hono
 *
 * 기능:
 * - 멀티 유저 + 멀티 채널 지원
 * - 사용자별 OpenRouter API Key 설정
 * - [📥 댓글 가져오기] 버튼: YouTube에서 댓글 수집 + AI 분류
 * - [🤖 자동 응답하기] 버튼: 미응답 댓글에 AI 응답 생성 & 게시
 * - Cron: 매일 자동 실행
 * - 회원가입/로그인 (JWT 인증)
 */

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { HTTPException } from 'hono/http-exception'

import type { Env, JWTPayload, User } from './types'

// Routes
import apiRoutes from './routes/api'
import authRoutes from './routes/auth'
import userRoutes from './routes/user'
import channelsRoutes from './routes/channels'
import scheduleRoutes from './routes/schedule'

// Views
import { renderDashboard } from './views/dashboard'
import { renderLogin } from './views/login'
import { renderChannelList } from './views/channels'
import { renderSettings } from './views/settings'
import { renderLanding } from './views/landing'
import { renderPrivacy } from './views/privacy'
import { renderTerms } from './views/terms'

// Handlers (스케줄러는 별도 Cron Worker에서 API 호출)

// YouTube OAuth
import { getOAuthUrl, exchangeCodeForTokens, parseOAuthState } from './services/youtube'

// Auth
import { verifyToken } from './lib/auth'
import { getUserById, getUserChannelsData } from './lib/kv'

// Hono 앱에서 사용할 Variables 타입
type Variables = {
  jwtPayload: JWTPayload
  user: User
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

// 랜딩 페이지 (비로그인 사용자용)
app.get('/', async (c) => {
  // 로그인된 사용자는 채널 목록으로 리다이렉트
  const tokenCookie = c.req.raw.headers.get('cookie')?.match(/token=([^;]+)/)?.[1]
  if (tokenCookie) {
    const payload = await verifyToken(tokenCookie, c.env.JWT_SECRET)
    if (payload) {
      const user = await getUserById(c.env.KV, payload.userId)
      if (user) {
        return c.redirect('/channels')
      }
    }
  }
  const baseUrl = c.env.BASE_URL || 'https://autonomey.com'
  return c.html(renderLanding(baseUrl))
})

// 로그인 페이지
app.get('/login', (c) => {
  return c.html(renderLogin())
})

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 개인정보 처리방침
app.get('/privacy', (c) => {
  return c.html(renderPrivacy())
})

// 서비스 이용약관
app.get('/terms', (c) => {
  return c.html(renderTerms())
})

// 인증 라우트 (회원가입, 로그인, 토큰 갱신)
app.route('/auth', authRoutes)

// 스케줄 API (Cron Worker에서 호출, 자체 인증)
app.route('/api/schedule', scheduleRoutes)

// OAuth callback (public route - state에서 userId 확인)
// 콜백은 Google에서 리다이렉트하므로 public이어야 함
app.get('/oauth/callback', async (c) => {
  const code = c.req.query('code')
  const state = c.req.query('state')
  const error = c.req.query('error')

  if (error) {
    return c.html(`
      <html>
        <body style="font-family: sans-serif; padding: 40px; text-align: center; background: #0f0f0f; color: #fff;">
          <h1>❌ OAuth 오류</h1>
          <p style="color: #f87171;">${error}</p>
          <a href="/channels" style="color: #3b82f6;">채널 목록으로 돌아가기</a>
        </body>
      </html>
    `)
  }

  if (!code) {
    return c.html(`
      <html>
        <body style="font-family: sans-serif; padding: 40px; text-align: center; background: #0f0f0f; color: #fff;">
          <h1>❌ 오류</h1>
          <p style="color: #f87171;">인증 코드를 받지 못했습니다</p>
          <a href="/channels" style="color: #3b82f6;">채널 목록으로 돌아가기</a>
        </body>
      </html>
    `)
  }

  // state에서 userId 파싱
  if (!state) {
    return c.html(`
      <html>
        <body style="font-family: sans-serif; padding: 40px; text-align: center; background: #0f0f0f; color: #fff;">
          <h1>❌ 오류</h1>
          <p style="color: #f87171;">인증 상태(state)가 없습니다. 다시 시도해주세요.</p>
          <a href="/channels" style="color: #3b82f6;">채널 목록으로 돌아가기</a>
        </body>
      </html>
    `)
  }

  const stateData = parseOAuthState(state)
  if (!stateData || !stateData.userId) {
    return c.html(`
      <html>
        <body style="font-family: sans-serif; padding: 40px; text-align: center; background: #0f0f0f; color: #fff;">
          <h1>❌ 오류</h1>
          <p style="color: #f87171;">잘못된 인증 상태입니다. 다시 시도해주세요.</p>
          <a href="/channels" style="color: #3b82f6;">채널 목록으로 돌아가기</a>
        </body>
      </html>
    `)
  }

  try {
    const baseUrl = new URL(c.req.url).origin
    const redirectUri = `${baseUrl}/oauth/callback`
    const channel = await exchangeCodeForTokens(c.env, code, redirectUri, stateData.userId)

    // 성공 메시지와 함께 채널 대시보드로 이동 버튼 제공
    return c.html(`
      <!DOCTYPE html>
      <html lang="ko">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>채널 연동 완료 - Autonomey</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: #0f0f0f;
              color: #fff;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .success-card {
              background: #1a1a1a;
              border: 1px solid #10b981;
              border-radius: 16px;
              padding: 40px;
              text-align: center;
              max-width: 420px;
            }
            .success-icon {
              font-size: 64px;
              margin-bottom: 20px;
            }
            h1 {
              font-size: 24px;
              margin-bottom: 12px;
              color: #10b981;
            }
            .channel-name {
              font-size: 18px;
              color: #fff;
              margin-bottom: 8px;
            }
            .description {
              color: #888;
              font-size: 14px;
              margin-bottom: 24px;
              line-height: 1.5;
            }
            .next-steps {
              background: #052e16;
              border-radius: 8px;
              padding: 16px;
              margin-bottom: 24px;
              text-align: left;
            }
            .next-steps h3 {
              font-size: 14px;
              color: #10b981;
              margin-bottom: 12px;
            }
            .next-steps ul {
              list-style: none;
              font-size: 13px;
              color: #86efac;
            }
            .next-steps li {
              padding: 4px 0;
            }
            .next-steps li::before {
              content: "✓ ";
              color: #10b981;
            }
            .btn-primary {
              display: inline-block;
              background: #10b981;
              color: #fff;
              padding: 14px 28px;
              border-radius: 8px;
              text-decoration: none;
              font-weight: 600;
              font-size: 16px;
              transition: background 0.2s;
            }
            .btn-primary:hover {
              background: #059669;
            }
            .btn-secondary {
              display: inline-block;
              color: #888;
              padding: 10px 20px;
              text-decoration: none;
              font-size: 14px;
              margin-top: 12px;
            }
            .btn-secondary:hover {
              color: #fff;
            }
          </style>
        </head>
        <body>
          <div class="success-card">
            <div class="success-icon">🎉</div>
            <h1>채널 연동 완료!</h1>
            <p class="channel-name">"${channel.youtube.channelTitle}"</p>
            <p class="description">YouTube 채널이 성공적으로 연결되었습니다.<br>이제 댓글 자동 응답 기능을 사용할 수 있습니다.</p>

            <div class="next-steps">
              <h3>다음 단계</h3>
              <ul>
                <li>댓글 가져오기로 최신 댓글 수집</li>
                <li>AI가 댓글을 자동으로 분류</li>
                <li>응답을 생성하고 검토 후 승인</li>
              </ul>
            </div>

            <a href="/channels/${channel.id}" class="btn-primary">대시보드로 이동 →</a>
            <br>
            <a href="/channels" class="btn-secondary">채널 목록 보기</a>
          </div>
        </body>
      </html>
    `)
  } catch (err) {
    return c.html(`
      <html>
        <body style="font-family: sans-serif; padding: 40px; text-align: center; background: #0f0f0f; color: #fff;">
          <h1>❌ 채널 연결 실패</h1>
          <p style="color: #f87171;">${err instanceof Error ? err.message : '알 수 없는 오류'}</p>
          <a href="/oauth/start" style="color: #3b82f6;">다시 시도</a>
          <span style="margin: 0 10px; color: #666;">|</span>
          <a href="/channels" style="color: #888;">채널 목록으로</a>
        </body>
      </html>
    `)
  }
})

// ============================================
// Protected routes (JWT 인증)
// ============================================

// Protected routes - OAuth start
app.get('/oauth/start', async (c) => {
  // 인증 확인
  const tokenCookie = c.req.raw.headers.get('cookie')?.match(/token=([^;]+)/)?.[1]
  if (!tokenCookie) {
    return c.redirect('/login?logout')
  }

  const payload = await verifyToken(tokenCookie, c.env.JWT_SECRET)
  if (!payload) {
    return c.redirect('/login?logout')
  }

  const user = await getUserById(c.env.KV, payload.userId)
  if (!user) {
    return c.redirect('/login?logout')
  }

  const baseUrl = new URL(c.req.url).origin
  const redirectUri = `${baseUrl}/oauth/callback`
  const authUrl = getOAuthUrl(c.env, redirectUri, user.id)
  return c.redirect(authUrl)
})

// Protected routes - 채널 목록
app.get('/channels', async (c) => {
  const tokenCookie = c.req.raw.headers.get('cookie')?.match(/token=([^;]+)/)?.[1]
  if (!tokenCookie) {
    return c.redirect('/login?logout')
  }

  const payload = await verifyToken(tokenCookie, c.env.JWT_SECRET)
  if (!payload) {
    return c.redirect('/login?logout')
  }

  const user = await getUserById(c.env.KV, payload.userId)
  if (!user) {
    return c.redirect('/login?logout')
  }

  const channels = await getUserChannelsData(c.env.KV, user.id)
  return c.html(renderChannelList(user, channels))
})

// Protected routes - 채널 대시보드
app.get('/channels/:channelId', async (c) => {
  const tokenCookie = c.req.raw.headers.get('cookie')?.match(/token=([^;]+)/)?.[1]
  if (!tokenCookie) {
    return c.redirect('/login?logout')
  }

  const payload = await verifyToken(tokenCookie, c.env.JWT_SECRET)
  if (!payload) {
    return c.redirect('/login?logout')
  }

  const user = await getUserById(c.env.KV, payload.userId)
  if (!user) {
    return c.redirect('/login?logout')
  }

  const channelId = c.req.param('channelId')
  const userChannels = await getUserChannelsData(c.env.KV, user.id)
  const currentChannel = userChannels.find(ch => ch.id === channelId)

  if (!currentChannel) {
    return c.redirect('/channels')
  }

  return c.html(await renderDashboard(c.env, { currentChannel, userChannels, user }))
})

// Protected routes - 설정
app.get('/settings', async (c) => {
  const tokenCookie = c.req.raw.headers.get('cookie')?.match(/token=([^;]+)/)?.[1]
  if (!tokenCookie) {
    return c.redirect('/login?logout')
  }

  const payload = await verifyToken(tokenCookie, c.env.JWT_SECRET)
  if (!payload) {
    return c.redirect('/login?logout')
  }

  const user = await getUserById(c.env.KV, payload.userId)
  if (!user) {
    return c.redirect('/login?logout')
  }

  const userChannels = await getUserChannelsData(c.env.KV, user.id)
  return c.html(renderSettings({ user, userChannels }))
})

// Protected API routes
app.use('/api/*', async (c, next) => {
  // /api/schedule는 별도 인증 사용
  if (c.req.path.startsWith('/api/schedule')) {
    return next()
  }

  const authHeader = c.req.header('Authorization')

  // JWT Bearer 토큰 확인
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    const payload = await verifyToken(token, c.env.JWT_SECRET)

    if (payload) {
      const user = await getUserById(c.env.KV, payload.userId)
      if (user) {
        c.set('jwtPayload', payload)
        c.set('user', user)
        return next()
      }
    }
    return c.json({ success: false, error: '유효하지 않은 토큰입니다.' }, 401)
  }

  // 쿠키에서 토큰 확인
  const tokenCookie = c.req.raw.headers.get('cookie')?.match(/token=([^;]+)/)?.[1]
  if (tokenCookie) {
    const payload = await verifyToken(tokenCookie, c.env.JWT_SECRET)
    if (payload) {
      const user = await getUserById(c.env.KV, payload.userId)
      if (user) {
        c.set('jwtPayload', payload)
        c.set('user', user)
        return next()
      }
    }
  }

  return c.json({ success: false, error: '인증이 필요합니다.' }, 401)
})

// API routes
app.route('/api', apiRoutes)
app.route('/api/user', userRoutes)
app.route('/api/channels', channelsRoutes)

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

// Export for Cloudflare Pages
export default {
  fetch: app.fetch
}
