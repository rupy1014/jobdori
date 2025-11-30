# Autonomey - YouTube 댓글 자동 응답 봇

## 프로젝트 개요
- **목적**: YouTube 댓글을 자동으로 수집, 분류, 응답하는 멀티 유저/멀티 채널 SaaS
- **기술 스택**: Cloudflare Workers, Hono, TypeScript, KV (Cloudflare의 NoSQL)
- **인프라**: Cloudflare Pages + Workers + KV

## 주요 기능
1. 회원가입/로그인 (JWT 기반)
2. YouTube OAuth 연동 (멀티 채널 지원)
3. 댓글 수집 + AI 분류 (OpenRouter API)
4. AI 응답 생성 및 YouTube 게시
5. 스케줄 기반 자동화 (Cron 트리거)
6. 유저별 API Key 설정 (OpenRouter)

## 주요 엔드포인트
### 인증 (Public)
- GET /login - 로그인/회원가입 페이지
- POST /auth/signup, /auth/login - 인증
- GET /oauth/callback - YouTube OAuth 콜백

### 보호된 라우트
- GET /channels - 채널 목록
- GET /channels/:channelId - 채널 대시보드
- GET /settings - 설정 페이지
- POST /api/fetch - 댓글 수집
- POST /api/classify - 댓글 분류
- POST /api/generate - 응답 생성
- POST /api/comments/:id/approve - 응답 승인 & 게시

## 사용자 타입
- `User`: 회원가입한 사용자 (id, email, name, openrouterApiKey)
- `Channel`: YouTube 채널 (userId, youtube credentials, settings, schedule)

## 댓글 상태 플로우
unclassified → pending → generated → replied
