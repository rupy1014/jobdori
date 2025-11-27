/**
 * Autonomey - YouTube 댓글 자동 응답 봇 타입 정의
 */

// Cloudflare Workers 환경 바인딩
export type Env = {
  KV: KVNamespace
  JWT_SECRET: string
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

// ============================================
// 사용자 인증 관련 타입
// ============================================

// 사용자 역할
export type UserRole = 'admin' | 'user'

// 사용자 데이터
export interface User {
  id: string
  email: string
  passwordHash: string
  name: string
  role: UserRole
  createdAt: string
  updatedAt: string
  lastLoginAt?: string
}

// 회원가입 요청
export interface SignupRequest {
  email: string
  password: string
  name: string
}

// 로그인 요청
export interface LoginRequest {
  email: string
  password: string
}

// JWT 페이로드
export interface JWTPayload {
  userId: string
  email: string
  role: UserRole
  iat: number
  exp: number
}

// 인증 응답
export interface AuthResponse {
  success: boolean
  token?: string
  user?: {
    id: string
    email: string
    name: string
    role: UserRole
  }
  error?: string
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

// 분류 유형별 응답 지침
export interface TypeInstructions {
  enabled: boolean              // 이 유형에 응답할지 여부
  instruction: string           // 응답 생성 지침
}

// 설정
export interface Settings {
  persona: string               // "AI 잡돌이"
  tone: string                  // "친근하고 겸손한"
  customInstructions: string    // 커스텀 지침 (레거시, 하위 호환)

  // 분류 → 애티튜드 매핑
  attitudeMap: Record<CommentType, Attitude>

  // 공통 응답 지침 (모든 분류에 적용)
  commonInstructions: string

  // 분류 유형별 응답 지침
  typeInstructions: Record<CommentType, TypeInstructions>
}

// 기본 설정
export const DEFAULT_SETTINGS: Settings = {
  persona: 'AI 잡돌이',
  tone: '친근하고 겸손한',
  customInstructions: '',  // 레거시 (하위 호환용)
  attitudeMap: {
    positive: 'gratitude',
    negative: 'graceful',
    question: 'expert',
    suggestion: 'empathy',
    reaction: 'humor',
    other: 'friendly'
  },
  commonInstructions: `- 200자 이내로 짧게
- 이모지 1-2개만
- "안녕하세요" 같은 형식적 인사 금지
- 절대 방어적이지 않게
- 시청자 이름 언급하지 않기`,
  typeInstructions: {
    positive: {
      enabled: true,
      instruction: '진심어린 감사를 표현하세요. 응원이 큰 힘이 된다는 것을 전달하세요.'
    },
    negative: {
      enabled: true,
      instruction: '품위있게 대응하세요. 비판에서 배울 점이 있다면 인정하고, 악플은 짧게 마무리하세요.'
    },
    question: {
      enabled: true,
      instruction: '친절하고 전문적으로 답변하세요. 모르는 건 솔직히 모른다고 하고, 알아보겠다고 하세요.'
    },
    suggestion: {
      enabled: true,
      instruction: '제안에 감사하고 공감하세요. 좋은 아이디어는 반영하겠다고 하세요.'
    },
    reaction: {
      enabled: true,
      instruction: '가볍고 유머러스하게 반응하세요. 짧지만 따뜻하게!'
    },
    other: {
      enabled: false,
      instruction: '친근하게 응대하세요.'
    }
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
