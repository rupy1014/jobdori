/**
 * KV Storage 헬퍼 함수
 */

import type { StoredComment, Settings, DEFAULT_SETTINGS } from '../types'
import { DEFAULT_SETTINGS as defaultSettings } from '../types'

const COMMENTS_PREFIX = 'comment:'
const COMMENTS_INDEX_KEY = 'comments:index'
const SETTINGS_KEY = 'settings'
const CONFIG_KEY = 'config'

/**
 * 댓글 저장
 */
export async function saveComment(kv: KVNamespace, comment: StoredComment): Promise<void> {
  // 댓글 저장
  await kv.put(`${COMMENTS_PREFIX}${comment.id}`, JSON.stringify(comment))

  // 인덱스 업데이트
  const index = await getCommentsIndex(kv)
  if (!index.includes(comment.id)) {
    index.unshift(comment.id) // 최신순으로 앞에 추가
    await kv.put(COMMENTS_INDEX_KEY, JSON.stringify(index))
  }
}

/**
 * 댓글 조회
 */
export async function getComment(kv: KVNamespace, commentId: string): Promise<StoredComment | null> {
  const data = await kv.get(`${COMMENTS_PREFIX}${commentId}`)
  return data ? JSON.parse(data) : null
}

/**
 * 댓글 업데이트
 */
export async function updateComment(
  kv: KVNamespace,
  commentId: string,
  updates: Partial<StoredComment>
): Promise<void> {
  const comment = await getComment(kv, commentId)
  if (comment) {
    await kv.put(`${COMMENTS_PREFIX}${commentId}`, JSON.stringify({ ...comment, ...updates }))
  }
}

/**
 * 댓글 인덱스 조회
 */
export async function getCommentsIndex(kv: KVNamespace): Promise<string[]> {
  const data = await kv.get(COMMENTS_INDEX_KEY)
  return data ? JSON.parse(data) : []
}

/**
 * 댓글 목록 조회 (페이지네이션)
 */
export async function getComments(
  kv: KVNamespace,
  options: {
    page?: number
    limit?: number
    status?: 'all' | 'unclassified' | 'pending' | 'generated' | 'replied'
  } = {}
): Promise<{
  comments: StoredComment[]
  total: number
  page: number
  totalPages: number
}> {
  const { page = 1, limit = 20, status = 'all' } = options

  const index = await getCommentsIndex(kv)

  // 모든 댓글 조회
  const allComments: StoredComment[] = []
  for (const id of index) {
    const comment = await getComment(kv, id)
    if (comment) {
      if (status === 'all' || comment.status === status) {
        allComments.push(comment)
      }
    }
  }

  // 페이지네이션
  const total = allComments.length
  const totalPages = Math.ceil(total / limit)
  const start = (page - 1) * limit
  const comments = allComments.slice(start, start + limit)

  return { comments, total, page, totalPages }
}

/**
 * 미응답 댓글 조회
 */
export async function getPendingComments(kv: KVNamespace): Promise<StoredComment[]> {
  const result = await getComments(kv, { status: 'pending', limit: 1000 })
  return result.comments
}

/**
 * 미분류 댓글 조회
 */
export async function getUnclassifiedComments(kv: KVNamespace): Promise<StoredComment[]> {
  const result = await getComments(kv, { status: 'unclassified', limit: 1000 })
  return result.comments
}

/**
 * 승인 대기 댓글 조회 (응답 생성됨)
 */
export async function getGeneratedComments(kv: KVNamespace): Promise<StoredComment[]> {
  const result = await getComments(kv, { status: 'generated', limit: 1000 })
  return result.comments
}

/**
 * 댓글 존재 여부 확인
 */
export async function commentExists(kv: KVNamespace, commentId: string): Promise<boolean> {
  const comment = await getComment(kv, commentId)
  return comment !== null
}

/**
 * 설정 조회
 */
export async function getSettings(kv: KVNamespace): Promise<Settings> {
  const data = await kv.get(SETTINGS_KEY)
  return data ? JSON.parse(data) : defaultSettings
}

/**
 * 설정 저장
 */
export async function saveSettings(kv: KVNamespace, settings: Settings): Promise<void> {
  await kv.put(SETTINGS_KEY, JSON.stringify(settings))
}

/**
 * 마지막 fetch 시간 조회
 */
export async function getLastFetchedAt(kv: KVNamespace): Promise<string | null> {
  const data = await kv.get(CONFIG_KEY)
  if (data) {
    const config = JSON.parse(data)
    return config.lastFetchedAt || null
  }
  return null
}

/**
 * 마지막 fetch 시간 저장
 */
export async function setLastFetchedAt(kv: KVNamespace, timestamp: string): Promise<void> {
  const data = await kv.get(CONFIG_KEY)
  const config = data ? JSON.parse(data) : {}
  config.lastFetchedAt = timestamp
  await kv.put(CONFIG_KEY, JSON.stringify(config))
}

/**
 * 통계 조회
 */
export async function getStats(kv: KVNamespace): Promise<{
  total: number
  unclassified: number
  pending: number
  generated: number
  replied: number
}> {
  const index = await getCommentsIndex(kv)

  let unclassified = 0
  let pending = 0
  let generated = 0
  let replied = 0

  for (const id of index) {
    const comment = await getComment(kv, id)
    if (comment) {
      if (comment.status === 'unclassified') unclassified++
      else if (comment.status === 'pending') pending++
      else if (comment.status === 'generated') generated++
      else if (comment.status === 'replied') replied++
    }
  }

  return {
    total: index.length,
    unclassified,
    pending,
    generated,
    replied
  }
}
