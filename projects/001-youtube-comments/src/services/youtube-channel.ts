/**
 * 채널별 YouTube API 서비스
 * 멀티 채널 지원을 위한 YouTube API 호출 함수
 */

import type { Env, Channel, StoredComment, YouTubeCommentThread, YouTubeVideo } from '../types'

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'

/**
 * 채널 토큰 갱신
 */
export async function refreshChannelToken(env: Env, refreshToken: string): Promise<{
  accessToken: string
  expiresAt: string
}> {
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
    throw new Error(`Failed to refresh token: ${errorText}`)
  }

  const data = await response.json() as {
    access_token: string
    expires_in: number
  }

  return {
    accessToken: data.access_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000).toISOString()
  }
}

/**
 * OAuth 코드를 토큰으로 교환하고 채널 정보 가져오기
 */
export async function exchangeCodeForChannel(env: Env, code: string, redirectUri: string): Promise<{
  accessToken: string
  refreshToken: string
  expiresAt: string
  channelId: string
  channelTitle: string
}> {
  // 토큰 교환
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
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

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text()
    throw new Error(`Failed to exchange code: ${errorText}`)
  }

  const tokenData = await tokenResponse.json() as {
    access_token: string
    refresh_token: string
    expires_in: number
  }

  // 채널 정보 가져오기
  const channelResponse = await fetch(
    `${YOUTUBE_API_BASE}/channels?part=snippet&mine=true`,
    {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    }
  )

  if (!channelResponse.ok) {
    throw new Error('Failed to get channel info')
  }

  const channelData = await channelResponse.json() as {
    items: Array<{
      id: string
      snippet: {
        title: string
      }
    }>
  }

  const channel = channelData.items?.[0]
  if (!channel) {
    throw new Error('No channel found for this account')
  }

  return {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresAt: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
    channelId: channel.id,
    channelTitle: channel.snippet.title
  }
}

/**
 * 채널의 영상 목록 가져오기
 */
async function getChannelVideoIds(env: Env, channel: Channel): Promise<string[]> {
  const videoIds: string[] = []

  // 채널의 업로드 playlist ID 가져오기
  const channelResponse = await fetch(
    `${YOUTUBE_API_BASE}/channels?part=contentDetails&id=${channel.youtube.channelId}&key=${env.YOUTUBE_API_KEY}`
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

  // 최근 50개 영상 가져오기
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
 * 영상의 댓글 가져오기
 */
async function getVideoComments(env: Env, videoId: string): Promise<YouTubeCommentThread[]> {
  const response = await fetch(
    `${YOUTUBE_API_BASE}/commentThreads?part=snippet,replies&videoId=${videoId}&maxResults=100&order=time&key=${env.YOUTUBE_API_KEY}`
  )

  if (!response.ok) {
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
 * 내 채널이 이미 답글을 달았는지 확인
 */
function checkMyReplyInThread(thread: YouTubeCommentThread, myChannelId: string): {
  hasReply: boolean
  replyText?: string
} {
  if (thread.replies?.comments) {
    const myReply = thread.replies.comments.find(
      reply => reply.snippet.authorChannelId.value === myChannelId
    )
    if (myReply) {
      return { hasReply: true, replyText: myReply.snippet.textDisplay }
    }
  }
  return { hasReply: false }
}

/**
 * 채널의 댓글 수집
 */
export async function fetchChannelComments(env: Env, channel: Channel): Promise<Array<{
  id: string
  videoId: string
  videoTitle: string
  authorName: string
  authorChannelId: string
  text: string
  publishedAt: string
  status: 'unclassified' | 'replied'
  replyText?: string
}>> {
  const comments: Array<{
    id: string
    videoId: string
    videoTitle: string
    authorName: string
    authorChannelId: string
    text: string
    publishedAt: string
    status: 'unclassified' | 'replied'
    replyText?: string
  }> = []

  const videoIds = await getChannelVideoIds(env, channel)

  for (const videoId of videoIds) {
    const videoInfo = await getVideoInfo(env, videoId)
    const threads = await getVideoComments(env, videoId)

    for (const thread of threads) {
      const commentData = thread.snippet.topLevelComment.snippet
      const commentId = thread.snippet.topLevelComment.id

      // 내 채널의 댓글은 스킵
      if (commentData.authorChannelId.value === channel.youtube.channelId) {
        continue
      }

      // 내 채널이 이미 답글을 달았는지 확인
      const { hasReply, replyText } = checkMyReplyInThread(thread, channel.youtube.channelId)

      comments.push({
        id: commentId,
        videoId,
        videoTitle: videoInfo.title,
        authorName: commentData.authorDisplayName,
        authorChannelId: commentData.authorChannelId.value,
        text: commentData.textDisplay,
        publishedAt: commentData.publishedAt,
        status: hasReply ? 'replied' : 'unclassified',
        replyText: hasReply ? replyText : undefined
      })
    }
  }

  return comments
}

/**
 * 채널 인증으로 답글 게시
 */
export async function postReplyWithChannel(
  env: Env,
  channel: Channel,
  parentId: string,
  text: string
): Promise<void> {
  const response = await fetch(`${YOUTUBE_API_BASE}/comments?part=snippet`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${channel.youtube.accessToken}`,
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
