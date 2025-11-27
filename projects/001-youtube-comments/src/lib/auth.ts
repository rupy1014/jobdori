/**
 * 인증 관련 유틸리티 함수
 * - JWT 토큰 생성/검증
 * - 비밀번호 해싱/검증
 */

import type { Env, JWTPayload, User, UserRole } from '../types'

// ============================================
// 비밀번호 해싱 (Web Crypto API 사용)
// ============================================

/**
 * 비밀번호 해싱 (PBKDF2)
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const salt = crypto.getRandomValues(new Uint8Array(16))

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  )

  const hash = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  )

  // salt + hash를 합쳐서 저장
  const hashArray = new Uint8Array(hash)
  const combined = new Uint8Array(salt.length + hashArray.length)
  combined.set(salt)
  combined.set(hashArray, salt.length)

  return btoa(String.fromCharCode(...combined))
}

/**
 * 비밀번호 검증
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const encoder = new TextEncoder()

  // 저장된 해시에서 salt와 hash 분리
  const combined = Uint8Array.from(atob(storedHash), c => c.charCodeAt(0))
  const salt = combined.slice(0, 16)
  const storedHashBytes = combined.slice(16)

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  )

  const hash = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  )

  const hashArray = new Uint8Array(hash)

  // 상수 시간 비교
  if (hashArray.length !== storedHashBytes.length) return false
  let result = 0
  for (let i = 0; i < hashArray.length; i++) {
    const a = hashArray[i]
    const b = storedHashBytes[i]
    if (a !== undefined && b !== undefined) {
      result |= a ^ b
    }
  }
  return result === 0
}

// ============================================
// JWT 토큰 (Web Crypto API 사용)
// ============================================

/**
 * Base64URL 인코딩
 */
function base64UrlEncode(data: string | Uint8Array): string {
  const str = typeof data === 'string' ? data : String.fromCharCode(...data)
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

/**
 * Base64URL 디코딩
 */
function base64UrlDecode(str: string): string {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  const padding = (4 - (base64.length % 4)) % 4
  const padded = base64 + '='.repeat(padding)
  return atob(padded)
}

/**
 * HMAC-SHA256 서명 생성
 */
async function createSignature(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder()

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data))
  return base64UrlEncode(new Uint8Array(signature))
}

/**
 * HMAC-SHA256 서명 검증
 */
async function verifySignature(data: string, signature: string, secret: string): Promise<boolean> {
  const expectedSignature = await createSignature(data, secret)
  return signature === expectedSignature
}

/**
 * JWT 토큰 생성
 */
export async function createToken(
  payload: { userId: string; email: string; role: UserRole },
  secret: string,
  expiresIn: number = 7 * 24 * 60 * 60 // 7일 (초)
): Promise<string> {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  }

  const now = Math.floor(Date.now() / 1000)

  const tokenPayload: JWTPayload = {
    ...payload,
    iat: now,
    exp: now + expiresIn
  }

  const headerEncoded = base64UrlEncode(JSON.stringify(header))
  const payloadEncoded = base64UrlEncode(JSON.stringify(tokenPayload))

  const dataToSign = `${headerEncoded}.${payloadEncoded}`
  const signature = await createSignature(dataToSign, secret)

  return `${dataToSign}.${signature}`
}

/**
 * JWT 토큰 검증 및 디코딩
 */
export async function verifyToken(token: string, secret: string): Promise<JWTPayload | null> {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const headerEncoded = parts[0]
    const payloadEncoded = parts[1]
    const signature = parts[2]

    if (!headerEncoded || !payloadEncoded || !signature) return null

    const dataToVerify = `${headerEncoded}.${payloadEncoded}`

    // 서명 검증
    const isValid = await verifySignature(dataToVerify, signature, secret)
    if (!isValid) return null

    // 페이로드 디코딩
    const payload: JWTPayload = JSON.parse(base64UrlDecode(payloadEncoded))

    // 만료 검증
    const now = Math.floor(Date.now() / 1000)
    if (payload.exp < now) return null

    return payload
  } catch {
    return null
  }
}

/**
 * UUID 생성
 */
export function generateId(): string {
  return crypto.randomUUID()
}
