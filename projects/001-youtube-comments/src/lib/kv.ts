/**
 * KV Storage 헬퍼 함수
 */

import type { StoredComment, Settings, DEFAULT_SETTINGS, User, Channel, ChannelSchedule } from '../types'
import { DEFAULT_SETTINGS as defaultSettings, DEFAULT_SCHEDULE } from '../types'

// KV 키 프리픽스 (레거시 - 하위 호환용)
const COMMENTS_PREFIX = 'comment:'
const COMMENTS_INDEX_KEY = 'comments:index'
const SETTINGS_KEY = 'settings'
const CONFIG_KEY = 'config'

// 사용자 관련 키
const USERS_PREFIX = 'user:'
const USERS_INDEX_KEY = 'users:index'
const USERS_EMAIL_INDEX_PREFIX = 'user:email:'

// 채널 관련 키
const CHANNELS_PREFIX = 'channel:'
const CHANNELS_INDEX_KEY = 'channels:index'
const USER_CHANNELS_PREFIX = 'user:channels:'  // user:channels:{userId} → [channelId, ...]

// 채널별 댓글 키 생성 함수
const getChannelCommentKey = (channelId: string, commentId: string) =>
  `${CHANNELS_PREFIX}${channelId}:comment:${commentId}`
const getChannelCommentsIndexKey = (channelId: string) =>
  `${CHANNELS_PREFIX}${channelId}:comments:index`
const getChannelConfigKey = (channelId: string) =>
  `${CHANNELS_PREFIX}${channelId}:config`

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

// ============================================
// 사용자 관련 KV 함수
// ============================================

/**
 * 사용자 저장
 */
export async function saveUser(kv: KVNamespace, user: User): Promise<void> {
  // 사용자 데이터 저장
  await kv.put(`${USERS_PREFIX}${user.id}`, JSON.stringify(user))

  // 이메일 인덱스 저장 (이메일로 빠른 조회용)
  await kv.put(`${USERS_EMAIL_INDEX_PREFIX}${user.email.toLowerCase()}`, user.id)

  // 사용자 목록 인덱스 업데이트
  const index = await getUsersIndex(kv)
  if (!index.includes(user.id)) {
    index.unshift(user.id)
    await kv.put(USERS_INDEX_KEY, JSON.stringify(index))
  }
}

/**
 * 사용자 ID로 조회
 */
export async function getUserById(kv: KVNamespace, userId: string): Promise<User | null> {
  const data = await kv.get(`${USERS_PREFIX}${userId}`)
  return data ? JSON.parse(data) : null
}

/**
 * 이메일로 사용자 조회
 */
export async function getUserByEmail(kv: KVNamespace, email: string): Promise<User | null> {
  const userId = await kv.get(`${USERS_EMAIL_INDEX_PREFIX}${email.toLowerCase()}`)
  if (!userId) return null
  return getUserById(kv, userId)
}

/**
 * 사용자 업데이트
 */
export async function updateUser(
  kv: KVNamespace,
  userId: string,
  updates: Partial<User>
): Promise<void> {
  const user = await getUserById(kv, userId)
  if (user) {
    const updatedUser = { ...user, ...updates, updatedAt: new Date().toISOString() }
    await kv.put(`${USERS_PREFIX}${userId}`, JSON.stringify(updatedUser))
  }
}

/**
 * 사용자 목록 인덱스 조회
 */
export async function getUsersIndex(kv: KVNamespace): Promise<string[]> {
  const data = await kv.get(USERS_INDEX_KEY)
  return data ? JSON.parse(data) : []
}

/**
 * 이메일 중복 확인
 */
export async function emailExists(kv: KVNamespace, email: string): Promise<boolean> {
  const userId = await kv.get(`${USERS_EMAIL_INDEX_PREFIX}${email.toLowerCase()}`)
  return userId !== null
}

/**
 * 모든 사용자 조회
 */
export async function getAllUsers(kv: KVNamespace): Promise<User[]> {
  const index = await getUsersIndex(kv)
  const users: User[] = []

  for (const id of index) {
    const user = await getUserById(kv, id)
    if (user) {
      users.push(user)
    }
  }

  return users
}

// ============================================
// 채널 관련 KV 함수
// ============================================

/**
 * 채널 저장
 */
export async function saveChannel(kv: KVNamespace, channel: Channel): Promise<void> {
  // 채널 데이터 저장
  await kv.put(`${CHANNELS_PREFIX}${channel.id}`, JSON.stringify(channel))

  // 전체 채널 인덱스 업데이트
  const index = await getChannelsIndex(kv)
  if (!index.includes(channel.id)) {
    index.unshift(channel.id)
    await kv.put(CHANNELS_INDEX_KEY, JSON.stringify(index))
  }

  // 사용자별 채널 인덱스 업데이트
  const userChannels = await getUserChannels(kv, channel.userId)
  if (!userChannels.includes(channel.id)) {
    userChannels.unshift(channel.id)
    await kv.put(`${USER_CHANNELS_PREFIX}${channel.userId}`, JSON.stringify(userChannels))
  }
}

/**
 * 채널 ID로 조회
 */
export async function getChannelById(kv: KVNamespace, channelId: string): Promise<Channel | null> {
  const data = await kv.get(`${CHANNELS_PREFIX}${channelId}`)
  return data ? JSON.parse(data) : null
}

/**
 * 채널 업데이트
 */
export async function updateChannel(
  kv: KVNamespace,
  channelId: string,
  updates: Partial<Channel>
): Promise<void> {
  const channel = await getChannelById(kv, channelId)
  if (channel) {
    const updatedChannel = { ...channel, ...updates, updatedAt: new Date().toISOString() }
    await kv.put(`${CHANNELS_PREFIX}${channelId}`, JSON.stringify(updatedChannel))
  }
}

/**
 * 전체 채널 인덱스 조회
 */
export async function getChannelsIndex(kv: KVNamespace): Promise<string[]> {
  const data = await kv.get(CHANNELS_INDEX_KEY)
  return data ? JSON.parse(data) : []
}

/**
 * 사용자의 채널 목록 조회
 */
export async function getUserChannels(kv: KVNamespace, userId: string): Promise<string[]> {
  const data = await kv.get(`${USER_CHANNELS_PREFIX}${userId}`)
  return data ? JSON.parse(data) : []
}

/**
 * 사용자의 채널 데이터 전체 조회
 */
export async function getUserChannelsData(kv: KVNamespace, userId: string): Promise<Channel[]> {
  const channelIds = await getUserChannels(kv, userId)
  const channels: Channel[] = []

  for (const id of channelIds) {
    const channel = await getChannelById(kv, id)
    if (channel) {
      channels.push(channel)
    }
  }

  return channels
}

/**
 * 모든 활성 채널 조회
 */
export async function getActiveChannels(kv: KVNamespace): Promise<Channel[]> {
  const index = await getChannelsIndex(kv)
  const channels: Channel[] = []

  for (const id of index) {
    const channel = await getChannelById(kv, id)
    if (channel && channel.isActive) {
      channels.push(channel)
    }
  }

  return channels
}

/**
 * YouTube 채널 ID로 내부 채널 조회
 */
export async function getChannelByYouTubeId(kv: KVNamespace, youtubeChannelId: string): Promise<Channel | null> {
  const index = await getChannelsIndex(kv)

  for (const id of index) {
    const channel = await getChannelById(kv, id)
    if (channel && channel.youtube.channelId === youtubeChannelId) {
      return channel
    }
  }

  return null
}

// ============================================
// 채널별 댓글 관련 KV 함수
// ============================================

/**
 * 채널별 댓글 저장
 */
export async function saveChannelComment(kv: KVNamespace, channelId: string, comment: StoredComment): Promise<void> {
  // 댓글 저장
  await kv.put(getChannelCommentKey(channelId, comment.id), JSON.stringify(comment))

  // 인덱스 업데이트
  const index = await getChannelCommentsIndex(kv, channelId)
  if (!index.includes(comment.id)) {
    index.unshift(comment.id)
    await kv.put(getChannelCommentsIndexKey(channelId), JSON.stringify(index))
  }
}

/**
 * 채널별 댓글 조회
 */
export async function getChannelComment(kv: KVNamespace, channelId: string, commentId: string): Promise<StoredComment | null> {
  const data = await kv.get(getChannelCommentKey(channelId, commentId))
  return data ? JSON.parse(data) : null
}

/**
 * 채널별 댓글 업데이트
 */
export async function updateChannelComment(
  kv: KVNamespace,
  channelId: string,
  commentId: string,
  updates: Partial<StoredComment>
): Promise<void> {
  const comment = await getChannelComment(kv, channelId, commentId)
  if (comment) {
    await kv.put(getChannelCommentKey(channelId, commentId), JSON.stringify({ ...comment, ...updates }))
  }
}

/**
 * 채널별 댓글 인덱스 조회
 */
export async function getChannelCommentsIndex(kv: KVNamespace, channelId: string): Promise<string[]> {
  const data = await kv.get(getChannelCommentsIndexKey(channelId))
  return data ? JSON.parse(data) : []
}

/**
 * 채널별 댓글 존재 여부
 */
export async function channelCommentExists(kv: KVNamespace, channelId: string, commentId: string): Promise<boolean> {
  const comment = await getChannelComment(kv, channelId, commentId)
  return comment !== null
}

/**
 * 채널별 댓글 목록 조회 (상태별 필터링)
 */
export async function getChannelComments(
  kv: KVNamespace,
  channelId: string,
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

  const index = await getChannelCommentsIndex(kv, channelId)

  const allComments: StoredComment[] = []
  for (const id of index) {
    const comment = await getChannelComment(kv, channelId, id)
    if (comment) {
      if (status === 'all' || comment.status === status) {
        allComments.push(comment)
      }
    }
  }

  const total = allComments.length
  const totalPages = Math.ceil(total / limit)
  const start = (page - 1) * limit
  const comments = allComments.slice(start, start + limit)

  return { comments, total, page, totalPages }
}

/**
 * 채널별 상태별 댓글 조회
 */
export async function getChannelCommentsByStatus(
  kv: KVNamespace,
  channelId: string,
  status: 'unclassified' | 'pending' | 'generated' | 'replied'
): Promise<StoredComment[]> {
  const result = await getChannelComments(kv, channelId, { status, limit: 1000 })
  return result.comments
}

/**
 * 채널별 통계 조회
 */
export async function getChannelStats(kv: KVNamespace, channelId: string): Promise<{
  total: number
  unclassified: number
  pending: number
  generated: number
  replied: number
}> {
  const index = await getChannelCommentsIndex(kv, channelId)

  let unclassified = 0
  let pending = 0
  let generated = 0
  let replied = 0

  for (const id of index) {
    const comment = await getChannelComment(kv, channelId, id)
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

/**
 * 채널의 마지막 fetch 시간 조회
 */
export async function getChannelLastFetchedAt(kv: KVNamespace, channelId: string): Promise<string | null> {
  const channel = await getChannelById(kv, channelId)
  return channel?.lastFetchedAt || null
}

/**
 * 채널의 마지막 fetch 시간 업데이트
 */
export async function setChannelLastFetchedAt(kv: KVNamespace, channelId: string, timestamp: string): Promise<void> {
  await updateChannel(kv, channelId, { lastFetchedAt: timestamp })
}
