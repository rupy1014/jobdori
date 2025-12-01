# SEO 작업 체크리스트

## 완료된 작업

### 1. 메타 태그 (landing.ts)
- [x] `title`: "유튜브 댓글 자동 응답 AI | Autonomey - 댓글 관리 자동화 시스템"
- [x] `description`: 상세 서비스 설명
- [x] `keywords`: 12개 핵심 키워드
- [x] `robots`, `googlebot`: index, follow
- [x] `canonical` URL

### 2. Open Graph (Facebook/카카오톡)
- [x] og:type, og:url, og:title, og:description
- [x] og:image, og:locale, og:site_name

### 3. Twitter Card
- [x] twitter:card (summary_large_image)
- [x] twitter:url, twitter:title, twitter:description, twitter:image

### 4. Schema.org 구조화 데이터 (JSON-LD)
- [x] SoftwareApplication (앱 정보, 가격, 기능, 평점)
- [x] Organization (회사/서비스 정보)
- [x] FAQPage (FAQ 리치 스니펫)

---

## 남은 작업

### 1. 이미지 파일 추가
- [ ] `og-image.png` (1200x630px 권장) - SNS 공유 시 표시
- [ ] `logo.png` - 브랜드 로고

### 2. 네이버 서치어드바이저
1. https://searchadvisor.naver.com 접속
2. 사이트 등록
3. HTML 태그 인증 코드 받기
4. `landing.ts`에서 `naver-site-verification` 값 입력:
   ```html
   <meta name="naver-site-verification" content="여기에_코드_입력">
   ```

### 3. Google Search Console
1. https://search.google.com/search-console 접속
2. 속성 추가 (URL 접두어 방식)
3. HTML 태그 또는 DNS 인증
4. 사이트맵 제출

### 4. robots.txt 추가
```txt
User-agent: *
Allow: /

Sitemap: https://autonomey.com/sitemap.xml
```

### 5. sitemap.xml 추가
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://autonomey.com/</loc>
    <lastmod>2025-12-01</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://autonomey.com/login</loc>
    <lastmod>2025-12-01</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>
```

### 6. 환경변수 설정 (wrangler.toml 또는 Cloudflare Dashboard)
```
BASE_URL = "https://autonomey.com"
```

---

## 키워드 목록 (현재 적용됨)

| 키워드 | 검색 의도 |
|--------|----------|
| 유튜브 댓글 자동 응답 | 메인 타겟 |
| YouTube 댓글 봇 | 영문 검색 |
| 댓글 자동화 | 일반적 니즈 |
| AI 댓글 관리 | AI 관심층 |
| 유튜브 자동 응답 시스템 | 상세 검색 |
| 댓글 봇 | 간단 검색 |
| 유튜버 도구 | 크리에이터 타겟 |
| 채널 관리 | 채널 운영자 |
| 댓글 자동 분류 | 기능 검색 |
| AI 응답 생성 | 기능 검색 |
| 유튜브 마케팅 자동화 | 마케팅 관심층 |
| 크리에이터 도구 | 크리에이터 타겟 |

---

## 참고: 리치 스니펫 테스트
- Google: https://search.google.com/test/rich-results
- Schema.org: https://validator.schema.org
