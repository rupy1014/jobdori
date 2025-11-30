# Autonomey - YouTube 댓글 자동 응답 봇

YouTube 댓글을 자동으로 수집하고, AI로 분류 후 적절한 응답을 생성하여 게시하는 SaaS 서비스입니다.

## 주요 기능

- **🔐 회원 시스템**: 이메일 회원가입/로그인 (JWT 인증)
- **📺 멀티 채널**: 여러 YouTube 채널 연동 가능
- **🏷️ AI 분류**: 댓글을 긍정/부정/질문/제안/반응/기타로 자동 분류
- **✍️ AI 응답 생성**: 분류별 맞춤 응답 자동 생성
- **✅ 검토 후 게시**: 생성된 응답을 확인/수정 후 승인
- **⏰ 자동화**: Cron을 통한 주기적 댓글 수집 및 응답

## 시작하기

### 1. 환경 설정

```bash
# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .dev.vars
# .dev.vars 파일을 열어서 필수 값 입력
```

### 2. 필수 환경변수

| 변수 | 설명 | 발급처 |
|------|------|--------|
| `JWT_SECRET` | 인증용 시크릿 키 | 직접 생성 (랜덤 문자열) |
| `YOUTUBE_CLIENT_ID` | YouTube OAuth 클라이언트 ID | [Google Cloud Console](https://console.cloud.google.com/) |
| `YOUTUBE_CLIENT_SECRET` | YouTube OAuth 클라이언트 시크릿 | Google Cloud Console |

### 3. 로컬 개발

```bash
npm run dev
```

**접속:** http://localhost:8788/

### 4. 첫 사용 가이드

1. **회원가입**: `/login` 페이지에서 회원가입
2. **API Key 설정**: 설정 페이지에서 OpenRouter API Key 입력
3. **채널 연동**: "채널 추가하기"로 YouTube OAuth 연동
4. **댓글 수집**: 대시보드에서 "댓글 가져오기" 클릭

## 사용 흐름

```
📥 댓글 가져오기 → 🏷️ 자동 분류 → ✍️ 응답 생성 → ✅ 검토/승인 → 📤 YouTube 게시
```

| 단계 | 버튼 | 설명 |
|------|------|------|
| 1 | 📥 댓글 가져오기 | YouTube에서 새 댓글 수집 |
| 2 | 🏷️ 자동 분류 | AI가 댓글 유형 분류 |
| 3 | ✍️ 응답 생성 | 분류별 맞춤 응답 생성 |
| 4 | ✅ 전체 승인 | 생성된 응답을 YouTube에 게시 |

## 댓글 분류 & 응답 스타일

| 분류 | 설명 | 응답 스타일 |
|------|------|-------------|
| 긍정 | 칭찬, 응원 | 진심 어린 감사 |
| 부정 | 비난, 악플 | 품위있게 대응 |
| 질문 | 궁금한 점 | 친절한 정보 제공 |
| 제안 | 콘텐츠 요청 | 공감 + 검토 약속 |
| 반응 | 단순 반응 (ㅋㅋ) | 가볍게 호응 |
| 기타 | 분류 불가 | 친근하게 응대 |

## 배포

### Cloudflare Workers

```bash
# KV 네임스페이스 생성
wrangler kv:namespace create KV
wrangler kv:namespace create KV --preview

# wrangler.toml에 KV ID 입력 후 배포
npm run deploy
```

### Secrets 설정

```bash
wrangler secret put JWT_SECRET
wrangler secret put YOUTUBE_CLIENT_ID
wrangler secret put YOUTUBE_CLIENT_SECRET
wrangler secret put CLAUDE_API_KEY  # 선택
```

## 프로젝트 구조

```
src/
├── index.ts              # Hono 앱 메인 + 라우팅
├── types.ts              # TypeScript 타입 정의
├── lib/
│   ├── auth.ts           # JWT 인증
│   └── kv.ts             # KV 저장소 헬퍼
├── routes/
│   ├── api.ts            # 댓글/설정 API
│   ├── auth.ts           # 회원가입/로그인 API
│   └── user.ts           # 사용자 설정 API
├── services/
│   ├── youtube.ts        # YouTube Data API
│   ├── llm.ts            # AI (Claude/OpenRouter)
│   └── scheduler.ts      # Cron 스케줄러
└── views/
    ├── login.ts          # 로그인/회원가입 페이지
    ├── channels.ts       # 채널 목록 페이지
    ├── dashboard.ts      # 댓글 관리 대시보드
    └── settings.ts       # 설정 페이지
```

## API 엔드포인트

### 인증

| Method | Path | 설명 |
|--------|------|------|
| POST | `/auth/signup` | 회원가입 |
| POST | `/auth/login` | 로그인 |
| GET | `/auth/me` | 현재 사용자 정보 |

### 댓글 관리

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/comments` | 댓글 목록 |
| POST | `/api/fetch` | YouTube에서 댓글 가져오기 |
| POST | `/api/classify` | AI 분류 실행 |
| POST | `/api/generate` | AI 응답 생성 |
| POST | `/api/approve-all` | 전체 승인 (YouTube 게시) |

### 설정

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/settings` | 채널 설정 조회 |
| PUT | `/api/settings` | 채널 설정 저장 |
| PUT | `/api/user/openrouter-key` | OpenRouter API Key 설정 |

## 기술 스택

- **Runtime**: Cloudflare Workers
- **Framework**: Hono
- **Storage**: Cloudflare KV
- **AI**: Claude API / OpenRouter
- **Auth**: JWT
