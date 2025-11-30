/**
 * 사용자 관련 API 라우트
 * - API Key 저장/삭제
 * - 비밀번호 변경
 */

import { Hono } from 'hono'
import type { Env, ApiResponse, User, JWTPayload } from '../types'
import { verifyToken, hashPassword, verifyPassword } from '../lib/auth'
import { getUserById, updateUser } from '../lib/kv'

type Variables = {
  user: User
  payload: JWTPayload
}

const user = new Hono<{ Bindings: Env; Variables: Variables }>()

/**
 * JWT 인증 미들웨어
 */
user.use('*', async (c, next) => {
  const authHeader = c.req.header('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json<ApiResponse>({
      success: false,
      error: '인증이 필요합니다.'
    }, 401)
  }

  const token = authHeader.substring(7)
  const payload = await verifyToken(token, c.env.JWT_SECRET)

  if (!payload) {
    return c.json<ApiResponse>({
      success: false,
      error: '유효하지 않거나 만료된 토큰입니다.'
    }, 401)
  }

  const userData = await getUserById(c.env.KV, payload.userId)
  if (!userData) {
    return c.json<ApiResponse>({
      success: false,
      error: '사용자를 찾을 수 없습니다.'
    }, 404)
  }

  c.set('user', userData)
  c.set('payload', payload)
  await next()
})

/**
 * OpenRouter API Key 저장
 * PUT /api/user/apikey
 */
user.put('/apikey', async (c) => {
  try {
    const userData = c.get('user')
    const body = await c.req.json<{ apiKey: string }>()

    if (!body.apiKey) {
      return c.json<ApiResponse>({
        success: false,
        error: 'API Key를 입력해주세요.'
      }, 400)
    }

    // OpenRouter API Key 형식 검증 (기본적인 검증)
    if (!body.apiKey.startsWith('sk-or-')) {
      return c.json<ApiResponse>({
        success: false,
        error: '올바른 OpenRouter API Key 형식이 아닙니다.'
      }, 400)
    }

    // API Key 저장
    await updateUser(c.env.KV, userData.id, {
      openrouterApiKey: body.apiKey,
      updatedAt: new Date().toISOString()
    })

    return c.json<ApiResponse>({
      success: true,
      message: 'API Key가 저장되었습니다.'
    })
  } catch (error) {
    console.error('Save API Key error:', error)
    return c.json<ApiResponse>({
      success: false,
      error: 'API Key 저장 중 오류가 발생했습니다.'
    }, 500)
  }
})

/**
 * OpenRouter API Key 삭제
 * DELETE /api/user/apikey
 */
user.delete('/apikey', async (c) => {
  try {
    const userData = c.get('user')

    // API Key 삭제 (undefined로 설정)
    await updateUser(c.env.KV, userData.id, {
      openrouterApiKey: undefined,
      updatedAt: new Date().toISOString()
    })

    return c.json<ApiResponse>({
      success: true,
      message: 'API Key가 삭제되었습니다.'
    })
  } catch (error) {
    console.error('Delete API Key error:', error)
    return c.json<ApiResponse>({
      success: false,
      error: 'API Key 삭제 중 오류가 발생했습니다.'
    }, 500)
  }
})

/**
 * 비밀번호 변경
 * PUT /api/user/password
 */
user.put('/password', async (c) => {
  try {
    const userData = c.get('user')
    const body = await c.req.json<{ currentPassword: string; newPassword: string }>()

    if (!body.currentPassword || !body.newPassword) {
      return c.json<ApiResponse>({
        success: false,
        error: '현재 비밀번호와 새 비밀번호를 입력해주세요.'
      }, 400)
    }

    // 새 비밀번호 길이 검증
    if (body.newPassword.length < 6) {
      return c.json<ApiResponse>({
        success: false,
        error: '새 비밀번호는 6자 이상이어야 합니다.'
      }, 400)
    }

    // 현재 비밀번호 검증
    const isValid = await verifyPassword(body.currentPassword, userData.passwordHash)
    if (!isValid) {
      return c.json<ApiResponse>({
        success: false,
        error: '현재 비밀번호가 일치하지 않습니다.'
      }, 401)
    }

    // 새 비밀번호 해싱 및 저장
    const newPasswordHash = await hashPassword(body.newPassword)
    await updateUser(c.env.KV, userData.id, {
      passwordHash: newPasswordHash,
      updatedAt: new Date().toISOString()
    })

    return c.json<ApiResponse>({
      success: true,
      message: '비밀번호가 변경되었습니다.'
    })
  } catch (error) {
    console.error('Change password error:', error)
    return c.json<ApiResponse>({
      success: false,
      error: '비밀번호 변경 중 오류가 발생했습니다.'
    }, 500)
  }
})

/**
 * 현재 사용자 정보 조회
 * GET /api/user/me
 */
user.get('/me', async (c) => {
  const userData = c.get('user')

  return c.json<ApiResponse>({
    success: true,
    data: {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      hasApiKey: !!userData.openrouterApiKey,
      createdAt: userData.createdAt
    }
  })
})

export default user
