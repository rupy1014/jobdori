# YouTube 댓글 자동 응답 SaaS

## 개요

YouTube 크리에이터를 위한 AI 댓글 자동 응답 서비스.
사용자가 회원가입 후 자신의 YouTube 채널을 연동하고, 톤앤매너와 응답 규칙을 설정하여 댓글에 자동 응답.

**서비스명 (가칭):** ReplyBot / 댓글봇 / AutoReply

---

## 핵심 기능

| 기능 | 설명 |
|------|------|
| **회원가입/로그인** | 이메일 또는 Google OAuth |
| **YouTube 채널 연동** | OAuth로 사용자 채널 연결 |
| **톤앤매너 설정** | 채널 페르소나, 말투, 이모지 사용 등 |
| **응답 규칙 설정** | 댓글 유형별 응답 전략 커스터마이징 |
| **자동/수동 응답** | Cron 자동 + 대시보드 수동 제어 |
| **응답 이력 관리** | 모든 댓글/응답 기록 조회 |

---

## 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Cloudflare Workers                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │  Auth       │  │  Dashboard  │  │  API        │  │  Cron      │ │
│  │  (가입/로그인)│  │  (웹 UI)    │  │  (REST)     │  │  (자동응답) │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
          │                │                │                │
          ▼                ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Cloudflare   │  │ YouTube API  │  │ Claude API   │  │ Cloudflare   │
│ D1 (SQLite)  │  │ (OAuth 연동) │  │ (응답 생성)  │  │ KV (캐시)    │
│ - Users      │  │ - 댓글 조회  │  │              │  │ - 세션       │
│ - Channels   │  │ - 댓글 게시  │  │              │  │ - 토큰 캐시  │
│ - Settings   │  │              │  │              │  │              │
│ - Comments   │  │              │  │              │  │              │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
```

---

## 사용자 플로우

### 1. 회원가입 & 로그인

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Landing    │────▶│  회원가입    │────▶│  이메일     │
│  Page       │     │  (Email/PW) │     │  인증       │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  Google     │ (대안)
                    │  OAuth      │
                    └─────────────┘
```

### 2. YouTube 채널 연동

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  대시보드    │────▶│ YouTube     │────▶│  채널 선택  │
│  "채널연동"  │     │ OAuth 동의  │     │  (다중 가능)│
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
                    ┌──────────────────────────┘
                    ▼
             ┌─────────────┐
             │ refresh_token│
             │ 저장 (암호화) │
             └─────────────┘
```

### 3. 설정 & 응답

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  톤앤매너    │────▶│  응답 규칙  │────▶│  자동응답   │
│  설정       │     │  설정       │     │  ON/OFF     │
└─────────────┘     └─────────────┘     └─────────────┘
```

---

## 데이터베이스 스키마 (D1/SQLite)

### Users (사용자)

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,                    -- UUID
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,                     -- bcrypt (Google OAuth면 NULL)
  name TEXT,
  avatar_url TEXT,
  auth_provider TEXT DEFAULT 'email',    -- 'email' | 'google'
  email_verified INTEGER DEFAULT 0,

  -- 플랜 정보
  plan TEXT DEFAULT 'free',              -- 'free' | 'pro' | 'business'
  plan_expires_at TEXT,

  -- API 키 (선택적 - 본인 키 사용 시)
  own_claude_api_key TEXT,               -- 암호화 저장

  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### Channels (연동된 YouTube 채널)

```sql
CREATE TABLE channels (
  id TEXT PRIMARY KEY,                   -- UUID
  user_id TEXT NOT NULL REFERENCES users(id),

  -- YouTube 정보
  youtube_channel_id TEXT NOT NULL,
  youtube_channel_title TEXT,
  youtube_channel_thumbnail TEXT,

  -- OAuth 토큰 (암호화 저장)
  youtube_access_token TEXT,
  youtube_refresh_token TEXT,
  youtube_token_expires_at TEXT,

  -- 상태
  is_active INTEGER DEFAULT 1,
  last_synced_at TEXT,

  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(user_id, youtube_channel_id)
);
```

### Channel Settings (채널별 설정)

```sql
CREATE TABLE channel_settings (
  id TEXT PRIMARY KEY,
  channel_id TEXT NOT NULL REFERENCES channels(id),

  -- 자동응답 ON/OFF
  auto_reply_enabled INTEGER DEFAULT 0,
  auto_reply_schedule TEXT DEFAULT '0 0 * * *',  -- Cron 표현식

  -- 톤앤매너
  persona_name TEXT,                     -- "AI 잡돌이"
  persona_description TEXT,              -- "AI 교육 채널 운영자"
  tone TEXT DEFAULT 'friendly',          -- 'formal' | 'friendly' | 'casual'
  language TEXT DEFAULT 'ko',            -- 'ko' | 'en' | 'ja'
  use_honorifics INTEGER DEFAULT 0,      -- 존댓말 사용
  max_emoji_count INTEGER DEFAULT 2,
  max_response_length INTEGER DEFAULT 200,

  -- 커스텀 지침 (자유 텍스트)
  custom_instructions TEXT,              -- "절대 방어적이지 않게..."

  -- 응답 예시 (JSON)
  example_responses TEXT,                -- JSON array

  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### Reply Rules (응답 규칙)

```sql
CREATE TABLE reply_rules (
  id TEXT PRIMARY KEY,
  channel_id TEXT NOT NULL REFERENCES channels(id),

  -- 규칙 정보
  name TEXT NOT NULL,                    -- "악플 대응"
  comment_type TEXT NOT NULL,            -- 'negative' | 'question' | 'praise' | 'suggestion' | 'spam' | 'other'
  is_enabled INTEGER DEFAULT 1,
  priority INTEGER DEFAULT 0,            -- 높을수록 먼저 적용

  -- 매칭 조건 (JSON)
  match_conditions TEXT,                 -- {"keywords": ["쓸데없", "시간낭비"], "sentiment": "negative"}

  -- 응답 전략
  response_strategy TEXT NOT NULL,       -- 'reply' | 'ignore' | 'flag_for_review'
  response_template TEXT,                -- "피드백 감사합니다! {{improvement_promise}}"
  response_guidelines TEXT,              -- "수긍하고, 개선 의지 표현"

  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### Comments (댓글 이력)

```sql
CREATE TABLE comments (
  id TEXT PRIMARY KEY,
  channel_id TEXT NOT NULL REFERENCES channels(id),

  -- YouTube 댓글 정보
  youtube_comment_id TEXT NOT NULL,
  youtube_video_id TEXT NOT NULL,
  video_title TEXT,
  author_name TEXT,
  author_channel_id TEXT,
  comment_text TEXT NOT NULL,
  published_at TEXT,

  -- 분류 결과
  detected_type TEXT,                    -- 'negative' | 'question' | etc.
  sentiment_score REAL,                  -- -1.0 ~ 1.0
  matched_rule_id TEXT REFERENCES reply_rules(id),

  -- 애티튜드 정보
  recommended_attitude TEXT,             -- AI 추천 애티튜드
  selected_attitude TEXT,                -- 관리자가 선택한 애티튜드

  -- AI 추천 응답 (검토 모드용)
  ai_suggested_reply TEXT,               -- AI가 생성한 추천 응답
  ai_suggested_at TEXT,

  -- 응답 상태
  status TEXT DEFAULT 'pending',         -- 'pending' | 'reviewing' | 'replied' | 'ignored' | 'flagged'

  -- 최종 응답 정보
  reply_text TEXT,                       -- 실제 게시된 응답
  youtube_reply_id TEXT,
  replied_at TEXT,
  reply_method TEXT,                     -- 'auto' | 'manual' | 'reviewed'

  fetched_at TEXT DEFAULT CURRENT_TIMESTAMP,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_comments_channel_status ON comments(channel_id, status);
CREATE INDEX idx_comments_youtube_id ON comments(youtube_comment_id);
```

### Usage Stats (사용량 통계)

```sql
CREATE TABLE usage_stats (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),

  -- 기간
  period_start TEXT NOT NULL,            -- "2024-11"
  period_type TEXT DEFAULT 'monthly',    -- 'daily' | 'monthly'

  -- 사용량
  comments_fetched INTEGER DEFAULT 0,
  replies_sent INTEGER DEFAULT 0,
  ai_tokens_used INTEGER DEFAULT 0,

  created_at TEXT DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(user_id, period_start, period_type)
);
```

---

## 톤앤매너 설정 UI

### 설정 화면

```
┌─────────────────────────────────────────────────────────────────┐
│  ⚙️ 채널 설정: AI 잡돌이                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📝 기본 정보                                                    │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 페르소나 이름: [AI 잡돌이                              ]  │ │
│  │ 채널 설명:     [AI 교육 채널, 수익화 방법 공유          ]  │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  🎭 톤앤매너                                                     │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 말투:     ( ) 격식체  (●) 친근체  ( ) 반말               │ │
│  │ 존댓말:   [✓] 사용                                        │ │
│  │ 이모지:   최대 [2]개                                      │ │
│  │ 답변 길이: 최대 [200]자                                   │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  📋 커스텀 지침                                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ - 절대 방어적이지 않게                                    │ │
│  │ - 악플에도 감사 표현                                      │ │
│  │ - 다음 콘텐츠 예고 가능하면 포함                          │ │
│  │ - "안녕하세요" 같은 형식적 인사 금지                      │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  💬 응답 예시 (AI 학습용)                                        │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 댓글: "좋은 영상이네요!"                                   │ │
│  │ 응답: "감사합니다! 더 좋은 영상으로 보답할게요 ㅎㅎ"       │ │
│  │                                                  [+ 추가]  │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│                                          [저장] [테스트 응답]   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 응답 규칙 설정 UI

### 규칙 목록

```
┌─────────────────────────────────────────────────────────────────┐
│  📋 응답 규칙                                    [+ 규칙 추가]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  │ 활성 │ 우선순위 │ 규칙명     │ 유형   │ 전략   │ 작업     │ │
│  ├──────┼──────────┼────────────┼────────┼────────┼──────────┤ │
│  │ [✓]  │ 1        │ 스팸 차단  │ 스팸   │ 무시   │ [편집]   │ │
│  │ [✓]  │ 2        │ 악플 대응  │ 부정적 │ 응답   │ [편집]   │ │
│  │ [✓]  │ 3        │ 질문 답변  │ 질문   │ 응답   │ [편집]   │ │
│  │ [✓]  │ 4        │ 칭찬 감사  │ 긍정적 │ 응답   │ [편집]   │ │
│  │ [✓]  │ 5        │ 제안 수용  │ 제안   │ 응답   │ [편집]   │ │
│  │ [ ]  │ 6        │ 기타       │ 기타   │ 검토   │ [편집]   │ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 규칙 편집 모달

```
┌─────────────────────────────────────────────────────────────────┐
│  ✏️ 규칙 편집: 악플 대응                                    [X] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  기본 정보                                                       │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 규칙명:    [악플 대응                                  ]  │ │
│  │ 우선순위:  [2   ]                                         │ │
│  │ 활성화:    [✓]                                            │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  매칭 조건                                                       │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 댓글 유형: [부정적 ▼]                                     │ │
│  │                                                           │ │
│  │ 키워드 (OR 조건):                                         │ │
│  │ [쓸데없] [시간낭비] [별로] [구독취소] [+ 추가]            │ │
│  │                                                           │ │
│  │ 감정 점수: [-1.0] ~ [-0.3]                                │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  응답 전략                                                       │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 전략: (●) 응답  ( ) 무시  ( ) 검토 대기                   │ │
│  │                                                           │ │
│  │ 응답 가이드라인:                                          │ │
│  │ ┌─────────────────────────────────────────────────────┐  │ │
│  │ │ 1. 비판을 수긍한다                                  │  │ │
│  │ │ 2. 개선 의지를 표현한다                             │  │ │
│  │ │ 3. 피드백에 감사한다                                │  │ │
│  │ │ 4. 절대 방어적이거나 공격적이지 않게               │  │ │
│  │ └─────────────────────────────────────────────────────┘  │ │
│  │                                                           │ │
│  │ 응답 예시:                                                │ │
│  │ 댓글: "이게 뭔 쓸데없는 영상이야"                         │ │
│  │ 응답: "아 그렇게 느끼셨군요 ㅠㅠ 더 실용적인 내용으로    │ │
│  │       준비해볼게요. 피드백 감사합니다!"                   │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│                                              [취소] [저장]      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 애티튜드 모드 (Attitude Mode)

댓글 응답 시 선택할 수 있는 **응답 태도/톤**을 정의합니다.
관리자가 AI 추천 응답을 검토할 때, 애티튜드를 선택하여 응답 스타일을 조절할 수 있습니다.

### 기본 제공 애티튜드

| 애티튜드 | 코드 | 설명 | 응답 특성 |
|----------|------|------|-----------|
| **공감** | `empathy` | 상대방 감정에 공감 | "그런 마음이 드셨군요", "이해해요" |
| **감사** | `gratitude` | 진심 어린 감사 표현 | "정말 감사합니다!", "덕분에 힘이 나요" |
| **소신발언** | `honest` | 솔직하고 당당한 의견 | "사실 저는 이렇게 생각해요", "솔직히 말씀드리면" |
| **악플대처** | `graceful` | 품위 있는 대응 | "피드백 감사합니다", "더 나아지겠습니다" |
| **유머** | `humor` | 가볍고 재치있게 | "ㅋㅋ", "아 그건 저도 인정", 밈 활용 |
| **전문가** | `expert` | 신뢰감 있는 정보 제공 | "정확히 말씀드리면~", 근거 제시 |
| **친근** | `friendly` | 친구처럼 편하게 | "ㅎㅎ", "그쵸~", 반말 톤 |
| **격려** | `encouragement` | 응원과 격려 | "화이팅!", "할 수 있어요" |

### 애티튜드별 응답 예시

```yaml
# 같은 댓글에 대한 애티튜드별 응답 차이

댓글: "영상 좀 길지 않아요? 집중이 안돼요"

공감 (empathy):
  "아 맞아요, 영상이 좀 길었죠 ㅠㅠ 다음엔 핵심만 담아볼게요!"

소신발언 (honest):
  "사실 이 주제는 축약하기 어려웠어요. 그래도 챕터 나눠뒀으니 필요한 부분만 보셔도 돼요!"

악플대처 (graceful):
  "피드백 감사합니다! 영상 길이 조절 고민해볼게요. 의견 남겨주셔서 감사해요 🙏"

유머 (humor):
  "ㅋㅋ 저도 편집하다 졸았어요... 다음엔 커피 마시고 편집할게요 ☕"
```

### 애티튜드 설정 DB 스키마

```sql
-- 채널별 기본 애티튜드 설정
ALTER TABLE channel_settings ADD COLUMN default_attitude TEXT DEFAULT 'friendly';

-- 댓글 유형별 추천 애티튜드 매핑
CREATE TABLE attitude_mappings (
  id TEXT PRIMARY KEY,
  channel_id TEXT NOT NULL REFERENCES channels(id),

  comment_type TEXT NOT NULL,           -- 'negative' | 'question' | etc.
  recommended_attitude TEXT NOT NULL,   -- 'empathy' | 'graceful' | etc.

  created_at TEXT DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(channel_id, comment_type)
);

-- 커스텀 애티튜드 정의 (Pro 이상)
CREATE TABLE custom_attitudes (
  id TEXT PRIMARY KEY,
  channel_id TEXT NOT NULL REFERENCES channels(id),

  code TEXT NOT NULL,                   -- 'my_style'
  name TEXT NOT NULL,                   -- "나만의 스타일"
  description TEXT,                     -- "~하는 느낌으로"
  example_responses TEXT,               -- JSON array of examples
  prompt_modifier TEXT,                 -- AI 프롬프트에 추가될 지침

  created_at TEXT DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(channel_id, code)
);
```

---

## 댓글 검토 & 수동 응답 플로우

### 응답 모드 선택

```
┌─────────────────────────────────────────────────────────────────┐
│  🔄 응답 모드 설정                                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  (●) 완전 자동     - AI가 바로 응답 게시                        │
│  ( ) 추천 후 검토  - AI 추천 → 관리자 승인 → 게시              │
│  ( ) 수동만        - 관리자가 직접 작성                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 검토 대시보드 UI

```
┌─────────────────────────────────────────────────────────────────┐
│  📋 댓글 검토                               필터: [검토 대기 ▼] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 📹 AI 수익화 방법 3편                                    │   │
│  │                                                         │   │
│  │ 👤 김철수 · 2시간 전                                    │   │
│  │ "이게 뭔 쓸데없는 영상이야 시간낭비 ㅋㅋ"               │   │
│  │                                                         │   │
│  │ 🏷️ 분류: 부정적  │  추천 애티튜드: 악플대처             │   │
│  │                                                         │   │
│  │ 💬 AI 추천 응답:                                        │   │
│  │ ┌─────────────────────────────────────────────────────┐ │   │
│  │ │ "아 그렇게 느끼셨군요 ㅠㅠ 더 실용적인 내용으로     │ │   │
│  │ │  준비해볼게요. 피드백 감사합니다!"                   │ │   │
│  │ └─────────────────────────────────────────────────────┘ │   │
│  │                                                         │   │
│  │ 애티튜드 변경:                                          │   │
│  │ [악플대처✓] [공감] [소신발언] [유머] [+ 재생성]        │   │
│  │                                                         │   │
│  │                      [무시] [수정 후 게시] [바로 게시]  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 📹 AI 수익화 방법 3편                                    │   │
│  │                                                         │   │
│  │ 👤 이영희 · 3시간 전                                    │   │
│  │ "Claude Code 설치 방법이 궁금해요!"                     │   │
│  │                                                         │   │
│  │ 🏷️ 분류: 질문  │  추천 애티튜드: 친근                   │   │
│  │                                                         │   │
│  │ 💬 AI 추천 응답:                                        │   │
│  │ ┌─────────────────────────────────────────────────────┐ │   │
│  │ │ "네! 무료로 시작할 수 있어요~ 다음 영상에서         │ │   │
│  │ │  설치부터 다뤄볼게요 👍"                             │ │   │
│  │ └─────────────────────────────────────────────────────┘ │   │
│  │                                                         │   │
│  │ 애티튜드 변경:                                          │   │
│  │ [친근✓] [전문가] [격려] [+ 재생성]                     │   │
│  │                                                         │   │
│  │                      [무시] [수정 후 게시] [바로 게시]  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  << 1 2 3 ... >>                                               │
└─────────────────────────────────────────────────────────────────┘
```

### 애티튜드 변경 시 재생성

```typescript
// 애티튜드 변경 → AI 응답 재생성
POST /api/channels/:id/comments/:commentId/regenerate
{
  "attitude": "humor"  // 새로운 애티튜드
}

// Response
{
  "original": "피드백 감사합니다! 더 나아지겠습니다.",
  "regenerated": "ㅋㅋ 저도 편집하다 졸았어요... 다음엔 커피 마시고 할게요 ☕",
  "attitude": "humor"
}
```

---

## 댓글 유형 분류

### 기본 제공 유형

| 유형 | 코드 | 설명 | 기본 전략 | 추천 애티튜드 |
|------|------|------|-----------|---------------|
| **스팸** | `spam` | 광고, 홍보, 무의미 | 무시 | - |
| **부정적** | `negative` | 비난, 불만, 악플 | 응답 | 악플대처/공감 |
| **질문** | `question` | 궁금한 점 문의 | 응답 | 친근/전문가 |
| **긍정적** | `positive` | 칭찬, 응원 | 응답 | 감사/친근 |
| **제안** | `suggestion` | 개선 요청, 아이디어 | 응답 | 공감/감사 |
| **단순반응** | `reaction` | ㅋㅋ, 좋아요 등 | 응답 | 유머/친근 |
| **논쟁** | `debate` | 의견 충돌, 반박 | 검토 | 소신발언/공감 |
| **기타** | `other` | 분류 불가 | 검토 | 친근 |

### 분류 로직

```typescript
// AI 분류 + 규칙 기반 하이브리드
async function classifyComment(comment: string, rules: ReplyRule[]): Promise<Classification> {
  // 1. 규칙 기반 매칭 (우선)
  for (const rule of rules.sort((a, b) => a.priority - b.priority)) {
    if (matchesRule(comment, rule)) {
      return {
        type: rule.comment_type,
        rule_id: rule.id,
        recommended_attitude: rule.recommended_attitude
      };
    }
  }

  // 2. AI 분류 (폴백)
  const aiResult = await classifyWithAI(comment);
  return {
    type: aiResult.type,
    confidence: aiResult.confidence,
    recommended_attitude: getDefaultAttitude(aiResult.type)
  };
}
```

---

## 애티튜드 설정 UI

### 채널 기본 설정

```
┌─────────────────────────────────────────────────────────────────┐
│  🎭 애티튜드 설정                                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📌 기본 애티튜드                                               │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 채널 기본: [친근 ▼]                                       │ │
│  │                                                           │ │
│  │ "특별한 상황이 아니면 이 애티튜드로 응답합니다"           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  🔗 댓글 유형별 애티튜드 매핑                                   │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                                                           │ │
│  │  부정적 댓글  →  [악플대처 ▼]                             │ │
│  │  질문        →  [전문가 ▼]                                │ │
│  │  긍정적 댓글  →  [감사 ▼]                                 │ │
│  │  제안        →  [공감 ▼]                                  │ │
│  │  단순반응    →  [유머 ▼]                                  │ │
│  │  논쟁        →  [소신발언 ▼]                              │ │
│  │                                                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ✨ 커스텀 애티튜드 (Pro)                          [+ 추가]    │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                                                           │ │
│  │  "개발자st"  - 기술적이지만 친근한 개발자 느낌 [편집]    │ │
│  │  "힙쟁이"    - MZ 감성, 밈 활용 [편집]                   │ │
│  │                                                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│                                                      [저장]    │
└─────────────────────────────────────────────────────────────────┘
```

### 커스텀 애티튜드 생성 모달

```
┌─────────────────────────────────────────────────────────────────┐
│  ✨ 커스텀 애티튜드 만들기                                  [X] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  이름: [개발자st                                           ]   │
│                                                                 │
│  설명:                                                          │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 기술적인 내용도 쉽게 설명하면서, 개발자 특유의           │ │
│  │ 유머와 밈을 섞어서 응답. "버그 아닌 피처" 같은 드립 활용 │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  응답 예시 (AI 학습용):                                         │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 댓글: "코드가 이상해요"                                   │ │
│  │ 응답: "버그가 아니라 피처입니다 (거짓말) ㅋㅋ             │ │
│  │       어디가 이상한지 알려주시면 핫픽스 올릴게요!"        │ │
│  │                                                  [+ 추가] │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  AI 지침 (고급):                                                │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ - 개발 용어를 적절히 섞되 설명을 붙여라                   │ │
│  │ - "버그/피처", "배포", "핫픽스" 같은 용어 활용            │ │
│  │ - 이모지는 🐛🚀💻 위주로 사용                            │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│                                              [취소] [저장]      │
└─────────────────────────────────────────────────────────────────┘
```

---

## API 엔드포인트

### 인증 API

| Method | Path | 설명 |
|--------|------|------|
| `POST` | `/api/auth/signup` | 회원가입 (이메일) |
| `POST` | `/api/auth/login` | 로그인 |
| `POST` | `/api/auth/logout` | 로그아웃 |
| `GET` | `/api/auth/google` | Google OAuth 시작 |
| `GET` | `/api/auth/google/callback` | Google OAuth 콜백 |
| `POST` | `/api/auth/verify-email` | 이메일 인증 |
| `POST` | `/api/auth/forgot-password` | 비밀번호 찾기 |

### 채널 API

| Method | Path | 설명 |
|--------|------|------|
| `GET` | `/api/channels` | 내 채널 목록 |
| `POST` | `/api/channels/connect` | YouTube 채널 연동 시작 |
| `GET` | `/api/channels/youtube/callback` | YouTube OAuth 콜백 |
| `DELETE` | `/api/channels/:id` | 채널 연동 해제 |
| `GET` | `/api/channels/:id/settings` | 채널 설정 조회 |
| `PUT` | `/api/channels/:id/settings` | 채널 설정 수정 |

### 응답 규칙 API

| Method | Path | 설명 |
|--------|------|------|
| `GET` | `/api/channels/:id/rules` | 규칙 목록 |
| `POST` | `/api/channels/:id/rules` | 규칙 생성 |
| `PUT` | `/api/channels/:id/rules/:ruleId` | 규칙 수정 |
| `DELETE` | `/api/channels/:id/rules/:ruleId` | 규칙 삭제 |
| `POST` | `/api/channels/:id/rules/reorder` | 규칙 순서 변경 |

### 댓글 API

| Method | Path | 설명 |
|--------|------|------|
| `GET` | `/api/channels/:id/comments` | 댓글 목록 (페이지네이션) |
| `POST` | `/api/channels/:id/comments/fetch` | YouTube에서 댓글 가져오기 |
| `POST` | `/api/channels/:id/comments/:commentId/reply` | 개별 응답 (애티튜드 지정 가능) |
| `POST` | `/api/channels/:id/comments/:commentId/regenerate` | 애티튜드 변경 후 재생성 |
| `POST` | `/api/channels/:id/comments/reply-all` | 전체 자동응답 |
| `POST` | `/api/channels/:id/comments/:commentId/ignore` | 무시 처리 |
| `POST` | `/api/channels/:id/comments/:commentId/flag` | 검토 대기 표시 |
| `POST` | `/api/channels/:id/comments/test-reply` | 테스트 응답 생성 |

### 애티튜드 API

| Method | Path | 설명 |
|--------|------|------|
| `GET` | `/api/attitudes` | 기본 애티튜드 목록 |
| `GET` | `/api/channels/:id/attitudes` | 채널 커스텀 애티튜드 목록 |
| `POST` | `/api/channels/:id/attitudes` | 커스텀 애티튜드 생성 |
| `PUT` | `/api/channels/:id/attitudes/:attitudeId` | 커스텀 애티튜드 수정 |
| `DELETE` | `/api/channels/:id/attitudes/:attitudeId` | 커스텀 애티튜드 삭제 |
| `PUT` | `/api/channels/:id/attitude-mappings` | 댓글유형-애티튜드 매핑 수정 |

### 통계 API

| Method | Path | 설명 |
|--------|------|------|
| `GET` | `/api/stats/usage` | 사용량 통계 |
| `GET` | `/api/stats/channels/:id` | 채널별 통계 |

---

## 요금제 설계

### 플랜 구성

| 기능 | Free | Pro ($9/월) | Business ($29/월) |
|------|------|-------------|-------------------|
| 채널 연동 | 1개 | 3개 | 10개 |
| 월 댓글 응답 | 100개 | 1,000개 | 무제한 |
| 자동응답 | ❌ | ✅ | ✅ |
| 응답 규칙 | 3개 | 10개 | 무제한 |
| 커스텀 지침 | 제한적 | ✅ | ✅ |
| 우선 지원 | ❌ | ❌ | ✅ |
| 본인 API 키 사용 | ❌ | ✅ | ✅ |

### 본인 API 키 옵션

Pro 이상 사용자는 본인의 Claude API 키를 등록하여:
- AI 비용 직접 부담 (더 저렴할 수 있음)
- 사용량 제한 없음
- API 키는 암호화되어 저장

---

## 프로젝트 구조

```
001-youtube-comments/
├── DESIGN.md
├── wrangler.toml
├── package.json
├── tsconfig.json
│
├── src/
│   ├── index.ts                    # Worker 진입점
│   │
│   ├── routes/
│   │   ├── index.ts                # 라우터 설정 (Hono)
│   │   ├── auth.ts                 # 인증 라우트
│   │   ├── channels.ts             # 채널 라우트
│   │   ├── rules.ts                # 규칙 라우트
│   │   ├── comments.ts             # 댓글 라우트
│   │   └── stats.ts                # 통계 라우트
│   │
│   ├── handlers/
│   │   ├── scheduled.ts            # Cron 핸들러
│   │   ├── auth.handler.ts         # 인증 로직
│   │   ├── channel.handler.ts      # 채널 로직
│   │   ├── comment.handler.ts      # 댓글 로직
│   │   └── reply.handler.ts        # 응답 생성 로직
│   │
│   ├── services/
│   │   ├── youtube.ts              # YouTube API
│   │   ├── claude.ts               # Claude API
│   │   └── classifier.ts           # 댓글 분류
│   │
│   ├── db/
│   │   ├── schema.sql              # D1 스키마
│   │   ├── migrations/             # 마이그레이션
│   │   └── queries.ts              # SQL 쿼리
│   │
│   ├── lib/
│   │   ├── auth.ts                 # JWT, 세션
│   │   ├── crypto.ts               # 암호화 (토큰 저장)
│   │   ├── validation.ts           # 입력 검증
│   │   └── response.ts             # HTTP 응답
│   │
│   ├── views/                      # HTML 템플릿
│   │   ├── layouts/
│   │   │   └── main.ts
│   │   ├── pages/
│   │   │   ├── landing.ts
│   │   │   ├── login.ts
│   │   │   ├── signup.ts
│   │   │   ├── dashboard.ts
│   │   │   ├── settings.ts
│   │   │   └── rules.ts
│   │   └── components/
│   │       ├── header.ts
│   │       ├── sidebar.ts
│   │       └── table.ts
│   │
│   └── types/
│       ├── index.ts
│       ├── user.ts
│       ├── channel.ts
│       ├── comment.ts
│       └── env.ts
│
├── migrations/
│   └── 0001_initial.sql
│
└── test/
    ├── auth.test.ts
    ├── channel.test.ts
    └── reply.test.ts
```

---

## 환경 변수

```bash
# wrangler secret put 으로 설정

# 서비스 인증
JWT_SECRET=xxx
ENCRYPTION_KEY=xxx              # 토큰 암호화용

# YouTube OAuth (서비스 전체용)
YOUTUBE_CLIENT_ID=xxx
YOUTUBE_CLIENT_SECRET=xxx

# Google OAuth (로그인용)
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx

# Claude API (서비스 제공용)
CLAUDE_API_KEY=xxx

# 이메일 발송 (선택)
RESEND_API_KEY=xxx
```

---

## wrangler.toml

```toml
name = "youtube-reply-bot"
main = "src/index.ts"
compatibility_date = "2024-11-25"

# Cron (모든 활성 채널 자동응답)
[triggers]
crons = ["0 * * * *"]  # 매시간 실행

# D1 데이터베이스
[[d1_databases]]
binding = "DB"
database_name = "reply-bot-db"
database_id = "xxx"

# KV (세션, 캐시)
[[kv_namespaces]]
binding = "KV"
id = "xxx"

[vars]
ENVIRONMENT = "production"
APP_URL = "https://replybot.example.com"
```

---

## 보안 고려사항

### 1. OAuth 토큰 보안
- AES-256-GCM으로 암호화 저장
- refresh_token만 저장 (access_token은 필요시 발급)
- 연동 해제 시 즉시 revoke

### 2. 사용자 데이터
- 비밀번호: bcrypt 해시
- 세션: HttpOnly, Secure, SameSite=Strict
- API 키: 암호화 저장, 복호화는 사용 시점에만

### 3. Rate Limiting
- 로그인 시도: 5회/분
- API 호출: 100회/분/사용자
- 댓글 응답: 플랜별 제한

### 4. YouTube API 쿼터 관리
- 사용자별 쿼터 추적
- 쿼터 초과 시 자동 중단
- 일일 쿼터 리셋 알림

---

## 배포 단계

### 1. 초기 설정

```bash
# Cloudflare 로그인
wrangler login

# D1 데이터베이스 생성
wrangler d1 create reply-bot-db

# KV 네임스페이스 생성
wrangler kv:namespace create "KV"

# 스키마 적용
wrangler d1 execute reply-bot-db --file=./migrations/0001_initial.sql
```

### 2. Secrets 설정

```bash
wrangler secret put JWT_SECRET
wrangler secret put ENCRYPTION_KEY
wrangler secret put YOUTUBE_CLIENT_ID
wrangler secret put YOUTUBE_CLIENT_SECRET
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put CLAUDE_API_KEY
```

### 3. 배포

```bash
wrangler deploy
```

---

## 향후 로드맵

### Phase 1 (MVP)
- [x] 회원가입/로그인
- [x] YouTube 채널 연동
- [x] 기본 톤앤매너 설정
- [x] 수동 댓글 응답

### Phase 2
- [ ] 자동응답 (Cron)
- [ ] 응답 규칙 커스터마이징
- [ ] 요금제 & 결제 연동

### Phase 3
- [ ] 실시간 알림 (Discord/Slack)
- [ ] 분석 대시보드
- [ ] 다국어 지원
- [ ] 팀 협업 기능

---

## 참고 자료

- [Cloudflare D1 Docs](https://developers.cloudflare.com/d1/)
- [YouTube Data API v3](https://developers.google.com/youtube/v3/docs/comments)
- [Hono - Web Framework](https://hono.dev/)
- [Claude API](https://docs.anthropic.com/claude/reference)
