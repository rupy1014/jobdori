# CLAUDE.md - Autonomey (YouTube 댓글 자동 응답 봇)

## 프로젝트 개요

유튜브 콘텐츠 제작용 프로젝트. AI가 YouTube 댓글을 자동으로 분류하고 응답을 생성합니다.

- **서비스 URL**: https://autonomey.com
- **기술 스택**: Cloudflare Pages, Hono, TypeScript

## 배포 방법

**중요**: 소스코드(`src/`)를 수정한 후 반드시 빌드 후 배포해야 합니다.

### 1. 빌드 (필수)
```bash
npx esbuild src/index.ts --bundle --outfile=public/_worker.js --format=esm --target=esnext --minify
```

### 2. 배포
```bash
npm run deploy
```

### 주의사항
- `src/views/landing.ts` 등 TypeScript 소스를 수정해도 `public/_worker.js`는 자동으로 업데이트되지 않음
- 반드시 esbuild로 빌드 후 배포해야 변경사항이 반영됨
- `npm run deploy`는 `public/` 폴더만 배포함

## 프로젝트 구조

```
src/
├── index.ts          # 메인 엔트리포인트
├── views/
│   ├── landing.ts    # 랜딩 페이지 HTML
│   ├── dashboard.ts  # 대시보드
│   ├── login.ts      # 로그인 페이지
│   └── ...
├── routes/           # API 라우트
├── services/         # 비즈니스 로직
└── lib/              # 유틸리티

public/
├── _worker.js        # 빌드된 Worker (배포 대상)
└── ...               # 정적 파일
```

## 비용 정책

- **서비스**: 무료 (유튜브 콘텐츠 제작용)
- **API 비용**: OpenRouter API 사용량에 따라 발생 (댓글 1,000개당 약 $0.5)
