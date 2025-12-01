/**
 * 인증 라우트 정의
 * - 회원가입
 * - 로그인
 * - 토큰 갱신
 * - 사용자 정보 조회
 */

import { Hono } from 'hono'
import type { Env, AuthResponse, SignupRequest, LoginRequest, User } from '../types'
import { hashPassword, verifyPassword, createToken, verifyToken, generateId } from '../lib/auth'
import { saveUser, getUserByEmail, getUserById, emailExists, updateUser } from '../lib/kv'

const auth = new Hono<{ Bindings: Env }>()

/**
 * 회원가입
 * POST /auth/signup
 */
auth.post('/signup', async (c) => {
  try {
    const body = await c.req.json<SignupRequest>()

    // 입력값 검증
    if (!body.email || !body.password || !body.name) {
      return c.json<AuthResponse>({
        success: false,
        error: '이메일, 비밀번호, 이름을 모두 입력해주세요.'
      }, 400)
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return c.json<AuthResponse>({
        success: false,
        error: '유효한 이메일 주소를 입력해주세요.'
      }, 400)
    }

    // 비밀번호 길이 검증
    if (body.password.length < 6) {
      return c.json<AuthResponse>({
        success: false,
        error: '비밀번호는 6자 이상이어야 합니다.'
      }, 400)
    }

    // 이메일 중복 확인
    if (await emailExists(c.env.KV, body.email)) {
      return c.json<AuthResponse>({
        success: false,
        error: '이미 사용 중인 이메일입니다.'
      }, 409)
    }

    // 비밀번호 해싱
    const passwordHash = await hashPassword(body.password)

    // 사용자 생성
    const now = new Date().toISOString()
    const user: User = {
      id: generateId(),
      email: body.email.toLowerCase(),
      passwordHash,
      name: body.name,
      role: 'user', // 기본 역할
      createdAt: now,
      updatedAt: now
    }

    // KV에 저장
    await saveUser(c.env.KV, user)

    // JWT 토큰 생성
    const token = await createToken(
      { userId: user.id, email: user.email, role: user.role },
      c.env.JWT_SECRET
    )

    // 서버 사이드에서 쿠키 설정 (더 안정적)
    const maxAge = 7 * 24 * 60 * 60 // 7일
    c.header('Set-Cookie', `token=${token}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`)

    return c.json<AuthResponse>({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    }, 201)
  } catch (error) {
    console.error('Signup error:', error)
    return c.json<AuthResponse>({
      success: false,
      error: '회원가입 중 오류가 발생했습니다.'
    }, 500)
  }
})

/**
 * 로그인
 * POST /auth/login
 */
auth.post('/login', async (c) => {
  try {
    const body = await c.req.json<LoginRequest>()

    // 입력값 검증
    if (!body.email || !body.password) {
      return c.json<AuthResponse>({
        success: false,
        error: '이메일과 비밀번호를 입력해주세요.'
      }, 400)
    }

    // 사용자 조회
    const user = await getUserByEmail(c.env.KV, body.email)
    if (!user) {
      return c.json<AuthResponse>({
        success: false,
        error: '이메일 또는 비밀번호가 일치하지 않습니다.'
      }, 401)
    }

    // 비밀번호 검증
    const isValid = await verifyPassword(body.password, user.passwordHash)
    if (!isValid) {
      return c.json<AuthResponse>({
        success: false,
        error: '이메일 또는 비밀번호가 일치하지 않습니다.'
      }, 401)
    }

    // 마지막 로그인 시간 업데이트
    await updateUser(c.env.KV, user.id, {
      lastLoginAt: new Date().toISOString()
    })

    // JWT 토큰 생성
    const token = await createToken(
      { userId: user.id, email: user.email, role: user.role },
      c.env.JWT_SECRET
    )

    // 서버 사이드에서 쿠키 설정 (더 안정적)
    const maxAge = 7 * 24 * 60 * 60 // 7일
    c.header('Set-Cookie', `token=${token}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`)

    return c.json<AuthResponse>({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    return c.json<AuthResponse>({
      success: false,
      error: '로그인 중 오류가 발생했습니다.'
    }, 500)
  }
})

/**
 * 현재 사용자 정보 조회
 * GET /auth/me
 * Authorization: Bearer <token> 필요
 */
auth.get('/me', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json<AuthResponse>({
        success: false,
        error: '인증이 필요합니다.'
      }, 401)
    }

    const token = authHeader.substring(7)
    const payload = await verifyToken(token, c.env.JWT_SECRET)

    if (!payload) {
      return c.json<AuthResponse>({
        success: false,
        error: '유효하지 않거나 만료된 토큰입니다.'
      }, 401)
    }

    const user = await getUserById(c.env.KV, payload.userId)
    if (!user) {
      return c.json<AuthResponse>({
        success: false,
        error: '사용자를 찾을 수 없습니다.'
      }, 404)
    }

    return c.json<AuthResponse>({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    })
  } catch (error) {
    console.error('Get me error:', error)
    return c.json<AuthResponse>({
      success: false,
      error: '사용자 정보 조회 중 오류가 발생했습니다.'
    }, 500)
  }
})

/**
 * 토큰 갱신
 * POST /auth/refresh
 * Authorization: Bearer <token> 필요
 */
auth.post('/refresh', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json<AuthResponse>({
        success: false,
        error: '인증이 필요합니다.'
      }, 401)
    }

    const token = authHeader.substring(7)
    const payload = await verifyToken(token, c.env.JWT_SECRET)

    if (!payload) {
      return c.json<AuthResponse>({
        success: false,
        error: '유효하지 않거나 만료된 토큰입니다.'
      }, 401)
    }

    const user = await getUserById(c.env.KV, payload.userId)
    if (!user) {
      return c.json<AuthResponse>({
        success: false,
        error: '사용자를 찾을 수 없습니다.'
      }, 404)
    }

    // 새 토큰 생성
    const newToken = await createToken(
      { userId: user.id, email: user.email, role: user.role },
      c.env.JWT_SECRET
    )

    return c.json<AuthResponse>({
      success: true,
      token: newToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    })
  } catch (error) {
    console.error('Refresh token error:', error)
    return c.json<AuthResponse>({
      success: false,
      error: '토큰 갱신 중 오류가 발생했습니다.'
    }, 500)
  }
})

export default auth
