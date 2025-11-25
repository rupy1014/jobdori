# YouTube 댓글 자동 응답 봇

YouTube 댓글을 자동으로 수집하고, AI(Claude)로 분류 후 적절한 응답을 생성하여 게시하는 봇입니다.

## 로컬 개발

```bash
npm install
npm run dev
```

**접속 정보:**
- URL: http://localhost:8788/
- ID: `admin`
- PW: `admin123` (기본값, 배포 시 변경 필요)

## 기능

- **📥 댓글 가져오기**: YouTube에서 댓글 수집 + AI 분류
- **🤖 자동 응답하기**: 미응답 댓글에 AI 응답 생성 & 게시
- **⏰ Cron**: 매일 09:00 KST 자동 실행

## 댓글 분류 & 애티튜드

| 분류 | 설명 | 적용 애티튜드 |
|------|------|--------------|
| positive | 칭찬, 응원 | gratitude (감사) |
| negative | 비난, 악플 | graceful (품위있게) |
| question | 질문 | expert (전문가) |
| suggestion | 제안 | empathy (공감) |
| reaction | 단순반응 (ㅋㅋ) | humor (유머) |
| other | 기타 | friendly (친근) |

## 배포

### 1. KV 네임스페이스 생성

```bash
wrangler kv:namespace create KV
wrangler kv:namespace create KV --preview
```

### 2. wrangler.toml 수정

생성된 KV ID를 `wrangler.toml`에 입력

### 3. Secrets 설정

```bash
wrangler secret put ADMIN_PASSWORD
wrangler secret put YOUTUBE_API_KEY
wrangler secret put YOUTUBE_CHANNEL_ID
wrangler secret put YOUTUBE_ACCESS_TOKEN
wrangler secret put YOUTUBE_REFRESH_TOKEN
wrangler secret put YOUTUBE_CLIENT_ID
wrangler secret put YOUTUBE_CLIENT_SECRET
wrangler secret put CLAUDE_API_KEY
```

### 4. 배포

```bash
npm run deploy
```

## 프로젝트 구조

```
src/
├── index.ts              # Hono 앱 메인
├── types.ts              # 타입 정의
├── lib/
│   └── kv.ts             # KV 헬퍼 함수
├── routes/
│   └── api.ts            # API 라우트
├── services/
│   ├── youtube.ts        # YouTube API
│   ├── claude.ts         # Claude API (분류+응답)
│   └── scheduled.ts      # Cron 핸들러
└── views/
    ├── dashboard.ts      # 대시보드 HTML
    └── login.ts          # 로그인 페이지
```

## API 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| GET | `/health` | 헬스체크 |
| GET | `/` | 대시보드 (인증 필요) |
| GET | `/api/comments` | 댓글 목록 |
| GET | `/api/stats` | 통계 |
| POST | `/api/fetch` | 댓글 가져오기 |
| POST | `/api/reply-all` | 자동 응답 |
| GET | `/api/settings` | 설정 조회 |
| PUT | `/api/settings` | 설정 저장 |
