/**
 * YouTube API 서비스
 * - 댓글 가져오기
 * - 댓글 게시
 */

import type { Env, StoredComment, YouTubeCommentThread, YouTubeVideo } from '../types'
import { saveComment, commentExists, setLastFetchedAt } from '../lib/kv'

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'

/**
 * KV에서 저장된 토큰 가져오기
 */
async function getStoredTokens(kv: KVNamespace): Promise<{
  accessToken?: string
  refreshToken?: string
  expiresAt?: number
} | null> {
  const data = await kv.get('youtube_tokens', 'json')
  return data as any
}

/**
 * KV에 토큰 저장하기
 */
async function saveTokens(kv: KVNamespace, tokens: {
  accessToken: string
  refreshToken: string
  expiresAt: number
}): Promise<void> {
  await kv.put('youtube_tokens', JSON.stringify(tokens))
}

/**
 * OAuth Access Token 갱신
 */
async function refreshAccessToken(env: Env): Promise<string> {
  // KV에서 저장된 토큰 확인
  const storedTokens = await getStoredTokens(env.KV)

  // 저장된 access token이 아직 유효하면 그대로 사용
  if (storedTokens?.accessToken && storedTokens?.expiresAt) {
    if (Date.now() < storedTokens.expiresAt - 60000) { // 1분 여유
      return storedTokens.accessToken
    }
  }

  // refresh token 결정 (KV 우선, 없으면 env)
  const refreshToken = storedTokens?.refreshToken || env.YOUTUBE_REFRESH_TOKEN

  if (!refreshToken) {
    throw new Error('No refresh token available. Please re-authorize the app.')
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: env.YOUTUBE_CLIENT_ID,
      client_secret: env.YOUTUBE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Token refresh failed:', errorText)
    throw new Error(`Failed to refresh token: ${response.statusText}. Please re-authorize at /oauth/start`)
  }

  const data = await response.json() as {
    access_token: string
    expires_in: number
    refresh_token?: string  // 새 refresh token이 발급될 수도 있음
  }

  // 토큰 저장 (새 refresh token이 있으면 업데이트)
  await saveTokens(env.KV, {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken,
    expiresAt: Date.now() + (data.expires_in * 1000)
  })

  return data.access_token
}

/**
 * Authorization code로 토큰 교환 (OAuth 콜백에서 사용)
 */
export async function exchangeCodeForTokens(env: Env, code: string, redirectUri: string): Promise<void> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: env.YOUTUBE_CLIENT_ID,
      client_secret: env.YOUTUBE_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to exchange code: ${errorText}`)
  }

  const data = await response.json() as {
    access_token: string
    refresh_token: string
    expires_in: number
  }

  // KV에 토큰 저장
  await saveTokens(env.KV, {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + (data.expires_in * 1000)
  })
}

/**
 * OAuth 인증 URL 생성
 */
export function getOAuthUrl(env: Env, redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: env.YOUTUBE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/youtube.force-ssl',
    access_type: 'offline',
    prompt: 'consent',  // 항상 refresh token 발급
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}

/**
 * 채널의 모든 영상 ID 가져오기
 */
async function getChannelVideoIds(env: Env): Promise<string[]> {
  const videoIds: string[] = []
  let pageToken = ''

  // 채널의 업로드 playlist ID 가져오기
  const channelResponse = await fetch(
    `${YOUTUBE_API_BASE}/channels?part=contentDetails&id=${env.YOUTUBE_CHANNEL_ID}&key=${env.YOUTUBE_API_KEY}`
  )

  if (!channelResponse.ok) {
    throw new Error(`Failed to get channel: ${channelResponse.statusText}`)
  }

  const channelData = await channelResponse.json() as {
    items: Array<{
      contentDetails: {
        relatedPlaylists: {
          uploads: string
        }
      }
    }>
  }

  const uploadsPlaylistId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads
  if (!uploadsPlaylistId) {
    throw new Error('Could not find uploads playlist')
  }

  // 최근 50개 영상 가져오기 (페이지네이션 1회만)
  const playlistResponse = await fetch(
    `${YOUTUBE_API_BASE}/playlistItems?part=contentDetails&playlistId=${uploadsPlaylistId}&maxResults=50&key=${env.YOUTUBE_API_KEY}`
  )

  if (!playlistResponse.ok) {
    throw new Error(`Failed to get playlist items: ${playlistResponse.statusText}`)
  }

  const playlistData = await playlistResponse.json() as {
    items: Array<{
      contentDetails: {
        videoId: string
      }
    }>
  }

  for (const item of playlistData.items || []) {
    videoIds.push(item.contentDetails.videoId)
  }

  return videoIds
}

/**
 * 영상 정보 가져오기
 */
async function getVideoInfo(env: Env, videoId: string): Promise<{ title: string }> {
  const response = await fetch(
    `${YOUTUBE_API_BASE}/videos?part=snippet&id=${videoId}&key=${env.YOUTUBE_API_KEY}`
  )

  if (!response.ok) {
    throw new Error(`Failed to get video info: ${response.statusText}`)
  }

  const data = await response.json() as {
    items: Array<YouTubeVideo>
  }

  return {
    title: data.items?.[0]?.snippet?.title || 'Unknown'
  }
}

/**
 * 영상의 댓글 가져오기 (답글 정보 포함)
 */
async function getVideoComments(env: Env, videoId: string): Promise<YouTubeCommentThread[]> {
  // part=snippet,replies로 답글 정보도 함께 가져오기
  const response = await fetch(
    `${YOUTUBE_API_BASE}/commentThreads?part=snippet,replies&videoId=${videoId}&maxResults=100&order=time&key=${env.YOUTUBE_API_KEY}`
  )

  if (!response.ok) {
    // 댓글이 비활성화된 영상은 스킵
    if (response.status === 403) {
      console.log(`Comments disabled for video ${videoId}`)
      return []
    }
    throw new Error(`Failed to get comments: ${response.statusText}`)
  }

  const data = await response.json() as {
    items: YouTubeCommentThread[]
  }

  return data.items || []
}

/**
 * 댓글의 모든 답글 가져오기 (replies가 5개 이상일 때 사용)
 */
async function getCommentReplies(env: Env, commentId: string): Promise<Array<{
  id: string
  snippet: {
    textDisplay: string
    authorChannelId: { value: string }
  }
}>> {
  const response = await fetch(
    `${YOUTUBE_API_BASE}/comments?part=snippet&parentId=${commentId}&maxResults=100&key=${env.YOUTUBE_API_KEY}`
  )

  if (!response.ok) {
    console.log(`Failed to get replies for ${commentId}`)
    return []
  }

  const data = await response.json() as {
    items: Array<{
      id: string
      snippet: {
        textDisplay: string
        authorChannelId: { value: string }
      }
    }>
  }

  return data.items || []
}

/**
 * 내 채널이 이미 답글을 달았는지 확인
 */
async function checkMyReply(
  env: Env,
  thread: YouTubeCommentThread,
  myChannelId: string
): Promise<{ hasReply: boolean; replyText?: string }> {
  // 먼저 replies에서 확인 (최대 5개)
  if (thread.replies?.comments) {
    const myReply = thread.replies.comments.find(
      reply => reply.snippet.authorChannelId.value === myChannelId
    )
    if (myReply) {
      return { hasReply: true, replyText: myReply.snippet.textDisplay }
    }
  }

  // totalReplyCount가 replies.comments 길이보다 크면 추가 API 호출
  const totalReplies = (thread.snippet as any).totalReplyCount || 0
  const loadedReplies = thread.replies?.comments?.length || 0

  if (totalReplies > loadedReplies) {
    // 모든 답글 가져오기
    const allReplies = await getCommentReplies(env, thread.snippet.topLevelComment.id)
    const myReply = allReplies.find(
      reply => reply.snippet.authorChannelId.value === myChannelId
    )
    if (myReply) {
      return { hasReply: true, replyText: myReply.snippet.textDisplay }
    }
  }

  return { hasReply: false }
}

/**
 * YouTube에서 댓글 가져오기 (분류 없이 저장만)
 */
export async function fetchComments(env: Env): Promise<{
  newComments: number
  totalProcessed: number
  videos: number
}> {
  let newComments = 0
  let totalProcessed = 0

  // 채널의 영상 목록 가져오기
  const videoIds = await getChannelVideoIds(env)
  console.log(`Found ${videoIds.length} videos`)

  for (const videoId of videoIds) {
    const videoInfo = await getVideoInfo(env, videoId)
    const comments = await getVideoComments(env, videoId)

    for (const thread of comments) {
      const commentData = thread.snippet.topLevelComment.snippet
      const commentId = thread.snippet.topLevelComment.id

      // 내 채널의 댓글은 스킵
      if (commentData.authorChannelId.value === env.YOUTUBE_CHANNEL_ID) {
        continue
      }

      // 이미 저장된 댓글인지 확인
      const exists = await commentExists(env.KV, commentId)
      if (exists) {
        continue
      }

      totalProcessed++

      // 내 채널이 이미 답글을 달았는지 확인
      const { hasReply, replyText } = await checkMyReply(env, thread, env.YOUTUBE_CHANNEL_ID)

      // 저장할 댓글 데이터 생성
      const storedComment: StoredComment = {
        id: commentId,
        videoId,
        videoTitle: videoInfo.title,
        authorName: commentData.authorDisplayName,
        authorChannelId: commentData.authorChannelId.value,
        text: commentData.textDisplay,
        publishedAt: commentData.publishedAt,
        // 이미 답글이 있으면 replied, 없으면 unclassified
        status: hasReply ? 'replied' : 'unclassified',
        replyText: replyText,
        repliedAt: hasReply ? new Date().toISOString() : undefined,
        fetchedAt: new Date().toISOString()
      }

      await saveComment(env.KV, storedComment)
      newComments++
    }
  }

  // 마지막 fetch 시간 저장
  await setLastFetchedAt(env.KV, new Date().toISOString())

  return {
    newComments,
    totalProcessed,
    videos: videoIds.length
  }
}

/**
 * YouTube에 답글 게시하기
 */
export async function postReply(env: Env, parentId: string, text: string): Promise<void> {
  // Access token 갱신
  const accessToken = await refreshAccessToken(env)

  const response = await fetch(`${YOUTUBE_API_BASE}/comments?part=snippet`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      snippet: {
        parentId,
        textOriginal: text
      }
    })
  })

  if (!response.ok) {
    const errorData = await response.text()
    throw new Error(`Failed to post reply: ${response.statusText} - ${errorData}`)
  }
}
