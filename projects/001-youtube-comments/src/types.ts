/**
 * YouTube 댓글 자동 응답 봇 - 타입 정의
 */

// Cloudflare Workers 환경 바인딩
export type Env = {
  KV: KVNamespace
  ADMIN_PASSWORD: string
  YOUTUBE_API_KEY: string
  YOUTUBE_CHANNEL_ID: string
  YOUTUBE_ACCESS_TOKEN: string
  YOUTUBE_REFRESH_TOKEN: string
  YOUTUBE_CLIENT_ID: string
  YOUTUBE_CLIENT_SECRET: string
  OPENROUTER_API_KEY: string
  ENVIRONMENT: string
}

// 댓글 분류 타입
export type CommentType =
  | 'positive'   // 긍정적 (칭찬, 응원)
  | 'negative'   // 부정적 (비난, 악플)
  | 'question'   // 질문
  | 'suggestion' // 제안
  | 'reaction'   // 단순반응 (ㅋㅋ, 와 등)
  | 'other'      // 기타

// 애티튜드 (응답 태도)
export type Attitude =
  | 'gratitude'  // 감사
  | 'graceful'   // 악플대처 (품위있게)
  | 'expert'     // 전문가 (친절한 정보)
  | 'empathy'    // 공감
  | 'humor'      // 유머
  | 'friendly'   // 친근

// 댓글 상태
// unclassified: 미분류 (가져오기만 함)
// pending: 분류 완료, 응답 대기
// generated: 응답 생성됨, 승인 대기
// replied: 응답 완료 (YouTube에 게시됨)
export type CommentStatus = 'unclassified' | 'pending' | 'generated' | 'replied'

// 저장되는 댓글 데이터
export interface StoredComment {
  id: string                    // YouTube 댓글 ID
  videoId: string
  videoTitle: string
  authorName: string
  authorChannelId: string
  text: string
  publishedAt: string

  // 분류 결과 (분류 전에는 undefined)
  type?: CommentType
  attitude?: Attitude

  // 응답 상태
  status: CommentStatus
  replyText?: string
  generatedAt?: string
  repliedAt?: string

  // 메타
  fetchedAt: string
}

// 설정
export interface Settings {
  persona: string               // "AI 잡돌이"
  tone: string                  // "친근하고 겸손한"
  customInstructions: string    // 커스텀 지침

  // 분류 → 애티튜드 매핑
  attitudeMap: Record<CommentType, Attitude>
}

// 기본 설정
export const DEFAULT_SETTINGS: Settings = {
  persona: 'AI 잡돌이',
  tone: '친근하고 겸손한',
  customInstructions: `- 절대 방어적이지 않게
- 200자 이내로 짧게
- 이모지 1-2개만
- "안녕하세요" 같은 형식적 인사 금지`,
  attitudeMap: {
    positive: 'gratitude',
    negative: 'graceful',
    question: 'expert',
    suggestion: 'empathy',
    reaction: 'humor',
    other: 'friendly'
  }
}

// YouTube API 응답 타입
export interface YouTubeCommentThread {
  id: string
  snippet: {
    topLevelComment: {
      id: string
      snippet: {
        videoId: string
        textDisplay: string
        authorDisplayName: string
        authorChannelId: {
          value: string
        }
        publishedAt: string
      }
    }
  }
  replies?: {
    comments: Array<{
      id: string
      snippet: {
        textDisplay: string
        authorChannelId: {
          value: string
        }
        publishedAt: string
      }
    }>
  }
}

export interface YouTubeVideo {
  id: string
  snippet: {
    title: string
  }
}

// API 응답 타입
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}
