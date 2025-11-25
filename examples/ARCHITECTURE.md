# Autonomey - System Architecture

AI 인플루언서 자동화 시스템의 3계층 아키텍처 설계

---

## 📐 아키텍처 개요

```
┌─────────────────────────────────────────────┐
│   Claude Commands (Orchestrators)          │  ← 워크플로우 조율, SubAgent 호출
│   - 전체 프로세스 관리                        │
│   - SubAgent 결과 취합 및 피드백              │
│   - 에러 처리 및 재시도                       │
└────────────────┬────────────────────────────┘
                 │ 호출
┌────────────────▼────────────────────────────┐
│   SubAgents (Domain Experts)               │  ← 도메인 규칙 내재화
│   - 복잡한 규칙 준수 (자동)                   │
│   - 도메인 로직 구현                         │
│   - Skills 조합하여 작업 수행                 │
└────────────────┬────────────────────────────┘
                 │ 사용
┌────────────────▼────────────────────────────┐
│   Skills (Atomic Functions)                │  ← 재사용 가능한 단위 작업
│   - 파일 I/O, API 호출, 데이터 변환           │
│   - 단순하고 명확한 입출력                    │
│   - 여러 SubAgent에서 공통 사용               │
└─────────────────────────────────────────────┘
```

---

## 🎯 계층별 역할과 책임

### 1️⃣ Claude Commands (상위 레벨)

**역할**: 워크플로우 오케스트레이터

**책임**:
- SubAgent들을 순서대로 호출
- 각 단계의 출력을 다음 단계의 입력으로 전달
- 전체 프로세스 성공/실패 판단
- 사용자에게 진행 상황 피드백
- 에러 발생 시 재시도 또는 롤백

**특징**:
- ✅ 복잡한 규칙을 직접 관리하지 않음
- ✅ SubAgent의 결과를 신뢰
- ✅ 간단한 조건 분기만 처리
- ✅ 워크플로우 레벨의 비즈니스 로직

**예시**:
```markdown
# /character-create

1. CharacterGenerator 호출 → profile 생성
2. VisualOrchestrator 호출 → reference 이미지 생성
3. 결과 검증 및 사용자 피드백
4. 실패 시 롤백 처리
```

---

### 2️⃣ SubAgents (중간 레벨)

**역할**: 도메인 전문가

**책임**:
- 특정 영역의 복잡한 규칙을 완벽히 숙지
- Skills를 조합해서 복잡한 작업 수행
- 규칙 위반 시 자동으로 수정 또는 명확한 에러
- 도메인 레벨의 Validation 수행

**특징**:
- ✅ 도메인 규칙이 프롬프트에 내재화됨
- ✅ Validation을 내부에서 자동 수행
- ✅ 다른 SubAgent와 독립적으로 동작
- ✅ 규칙 변경 시 SubAgent만 수정하면 됨

**예시**:
```markdown
# SubAgent: visual-orchestrator

내부 규칙 (자동 적용):
- Midjourney --cref, --sref 자동 추가
- 캐릭터별 reference URL 자동 로드
- Seed 값 자동 저장 및 재사용
- 생성 실패 시 3회 자동 재시도
- 이미지 메타데이터 자동 기록
```

---

### 3️⃣ Skills (하위 레벨)

**역할**: 재사용 가능한 원자적 기능

**책임**:
- 파일 읽기/쓰기, JSON 파싱
- API 호출 및 응답 처리
- 이미지 변환 및 최적화
- 단순한 계산 및 포맷 변환

**특징**:
- ✅ 비즈니스 로직 없음
- ✅ 여러 SubAgent에서 공통 사용
- ✅ 입출력이 명확하고 예측 가능
- ✅ 테스트 가능한 단위 기능

**예시**:
```markdown
# Skill: crop-resize

Input:
  - image_path: 원본 이미지 경로
  - aspect_ratio: "4:5" | "9:16" | "2:1"

Output:
  - resized_path: 변환된 이미지 경로

Logic:
  - 원본 비율 계산
  - 중앙 기준 크롭
  - 리사이즈 및 저장
```

---

## 🏗️ AI 인플루언서 시스템 설계

### Claude Commands (6개)

워크플로우 단위로 조율하는 최상위 명령어

```
/.claude/commands/

1. character-create.md
   용도: 새 캐릭터 생성 전체 워크플로우
   호출: CharacterGenerator → VisualOrchestrator
   입력: 캐릭터명, 타입
   출력: 캐릭터 ID, 생성된 파일 경로

2. content-pipeline.md
   용도: 콘텐츠 크롤링 → 스토리 생성 → 승인 워크플로우
   호출: ContentMiner → StoryTransformer → QualityValidator
   입력: 캐릭터 ID, 소스 플랫폼
   출력: 생성된 스토리 파일 경로

3. visual-pipeline.md
   용도: 이미지 생성 → 플랫폼별 변환 워크플로우
   호출: VisualOrchestrator → PlatformConverter
   입력: 캐릭터 ID, 스토리 ID
   출력: 생성된 이미지 ID 목록

4. publish-content.md
   용도: 스토리 → 발행 큐 → Buffer 스케줄링
   호출: CaptionGenerator → PublishingCoordinator
   입력: 캐릭터 ID, 스토리 ID, 플랫폼 목록
   출력: Buffer 스케줄 ID, 발행 시간

5. batch-process.md
   용도: 여러 캐릭터/스토리 일괄 처리
   호출: 여러 Commands 병렬 실행
   입력: 배치 설정 파일
   출력: 처리 결과 요약

6. quality-check.md
   용도: 캐릭터 일관성, 콘텐츠 품질 검증
   호출: QualityValidator
   입력: 캐릭터 ID 또는 스토리 ID
   출력: 검증 리포트
```

---

### SubAgents (8개)

도메인별 전문가로 복잡한 규칙을 내재화

```
/.claude/subagents/

1. character-generator.md
   도메인: 캐릭터 생성

   내재화된 규칙:
   - MBTI 일관성 검증 (16가지 성격 유형)
   - 페르소나 템플릿 필수 항목 검증
   - 캐릭터 ID 중복 방지 및 자동 채번
   - 비주얼 프로필 필수 항목 (face_model, style, signature_items)
   - 콘텐츠 전략 기본값 설정

   사용 Skills:
   - read-json (템플릿 로드)
   - validate-schema (MBTI, 프로필)
   - generate-unique-id
   - write-json (profile, visual-profile, content-strategy)
   - write-markdown (voice-guide)

2. content-miner.md
   도메인: 콘텐츠 크롤링

   내재화된 규칙:
   - 소스별 크롤링 규칙 (Naver, Brunch, Medium 등)
   - 중복 콘텐츠 필터링 (URL, 내용 해시)
   - 메타데이터 구조 표준화
   - 카테고리 자동 분류 (daily_life, emotional, educational, entertainment)

   사용 Skills:
   - web-scrape
   - extract-content
   - validate-schema
   - write-json

3. story-transformer.md
   도메인: 스토리 변환

   내재화된 규칙:
   - 캐릭터 voice consistency 유지 (voice-guide.md 준수)
   - 시대 설정 적용 (2035년 미래 설정)
   - 이미지 참조 형식 검증 (IMG_ID 형식)
   - 스토리 구조 템플릿 준수
   - YAML frontmatter 필수 항목

   사용 Skills:
   - read-json (character profile, source content)
   - read-markdown (voice-guide)
   - call-gpt4 (스토리 변환)
   - validate-voice (캐릭터 일관성)
   - write-markdown (스토리 파일)

4. visual-orchestrator.md
   도메인: 비주얼 생성

   내재화된 규칙:
   - Midjourney 파라미터 자동 추가 (--cref, --sref, --ar, --stylize)
   - 캐릭터별 reference URL 자동 로드
   - Seed 값 자동 저장 및 재사용
   - 생성 실패 시 3회 재시도 로직
   - 이미지 메타데이터 자동 기록
   - 카테고리별 저장 규칙 (portraits, lifestyle, workspace 등)

   사용 Skills:
   - read-json (visual-profile, seeds)
   - build-midjourney-prompt
   - call-midjourney
   - wait-for-async
   - extract-metadata
   - write-json (metadata, seeds)

5. platform-converter.md
   도메인: 플랫폼별 이미지 변환

   내재화된 규칙:
   - 플랫폼별 비율 규칙 (Instagram 4:5, Stories 9:16, Twitter 2:1)
   - 이미지 최적화 및 압축 (품질 vs 용량 밸런스)
   - 파일명 규칙 (IMG_{ID}_{RATIO}.jpg)
   - 캐시 확인 후 중복 변환 방지
   - outputs/ 디렉토리 자동 생성

   사용 Skills:
   - read-image
   - crop-resize
   - optimize-image
   - validate-cache
   - write-image

6. publishing-coordinator.md
   도메인: 발행 조율

   내재화된 규칙:
   - 플랫폼별 포맷 규칙 (글자수, 줄바꿈, 링크 형식)
   - Instagram 캡션 2200자 제한
   - 해시태그 30개 제한
   - 최적 시간 계산 (플랫폼별 engagement 시간대)
   - Buffer API 프로필 ID 자동 매핑
   - 발행 로그 자동 기록

   사용 Skills:
   - read-markdown (story)
   - read-json (platform-config)
   - format-caption
   - generate-hashtags
   - calculate-time
   - call-buffer
   - log-event

7. caption-generator.md
   도메인: 캡션 생성

   내재화된 규칙:
   - 플랫폼별 톤앤매너 (Instagram 친근, Twitter 간결, Facebook 정보성)
   - CTA 위치 규칙 (캡션 끝)
   - 링크 처리 (bio 링크 안내)
   - 해시태그 전략 적용 (base tags + content tags + trending tags)
   - 이모지 사용 규칙 (과도하지 않게)

   사용 Skills:
   - read-markdown (story)
   - read-json (content-strategy)
   - call-gpt4 (캡션 생성)
   - generate-hashtags
   - format-caption
   - truncate-text

8. quality-validator.md
   도메인: 품질 검증

   내재화된 규칙:
   - 캐릭터 일관성 체크 (personality, voice, visual)
   - 이미지-스토리 매칭 검증
   - 메타데이터 완성도 체크
   - YAML frontmatter 필수 항목 검증
   - 발행 준비 상태 체크 (이미지, 캡션, 스케줄)

   사용 Skills:
   - read-json (profile, metadata)
   - read-markdown (story, voice-guide)
   - validate-schema
   - validate-voice
   - generate-report
```

---

### Skills (20+ 개)

재사용 가능한 원자적 기능들

```
/.claude/skills/

📂 file-ops/                    # 파일 입출력
├── read-json.md                # JSON 파일 읽기
├── write-json.md               # JSON 파일 쓰기
├── read-markdown.md            # Markdown 파일 읽기
├── write-markdown.md           # Markdown 파일 쓰기
├── read-image.md               # 이미지 파일 읽기
├── write-image.md              # 이미지 파일 쓰기
└── validate-schema.md          # JSON Schema 검증

📂 api-integrations/            # 외부 API 연동
├── call-midjourney.md          # Midjourney Discord Bot API
├── call-nanobanana.md          # Nano Banana API
├── call-buffer.md              # Buffer API (스케줄링)
├── call-gpt4.md                # GPT-4 API (텍스트 생성)
├── web-scrape.md               # 웹 스크래핑
└── wait-for-async.md           # 비동기 작업 대기

📂 image-processing/            # 이미지 처리
├── crop-resize.md              # 이미지 크롭/리사이즈
├── optimize-image.md           # 이미지 최적화 (압축)
├── extract-metadata.md         # 이미지 메타데이터 추출
├── generate-thumbnail.md       # 썸네일 생성
├── build-midjourney-prompt.md  # Midjourney 프롬프트 생성
└── validate-cache.md           # 이미지 캐시 확인

📂 text-processing/             # 텍스트 처리
├── extract-keywords.md         # 키워드 추출
├── generate-hashtags.md        # 해시태그 생성
├── format-caption.md           # 캡션 포맷팅
├── truncate-text.md            # 텍스트 자르기 (글자수 제한)
├── validate-voice.md           # 캐릭터 voice 일관성 검증
└── extract-content.md          # 웹 콘텐츠 추출

📂 utilities/                   # 유틸리티
├── generate-unique-id.md       # 고유 ID 생성
├── calculate-time.md           # 최적 시간 계산
├── log-event.md                # 이벤트 로깅
├── generate-report.md          # 리포트 생성
└── validate-url.md             # URL 검증
```

---

## 🔄 워크플로우 예시

### 예시 1: 캐릭터 생성

```
User: /character-create "Luna Kim" "future-tech-influencer"

Command: character-create
│
├─ Step 1: CharacterGenerator 호출
│  │
│  ├─ Skill: read-json
│  │  └─ Input: characters/templates/base-profiles/future-tech-influencer.json
│  │  └─ Output: 템플릿 데이터
│  │
│  ├─ Skill: validate-schema
│  │  └─ Input: 템플릿 데이터, MBTI="ENFP"
│  │  └─ Output: 검증 통과
│  │
│  ├─ Skill: generate-unique-id
│  │  └─ Output: "LUNA_001"
│  │
│  ├─ Skill: write-json
│  │  └─ Output: characters/active/LUNA_001/profile.json
│  │  └─ Output: characters/active/LUNA_001/visual-profile.json
│  │  └─ Output: characters/active/LUNA_001/content-strategy.json
│  │
│  └─ Skill: write-markdown
│     └─ Output: characters/active/LUNA_001/voice-guide.md
│
├─ Step 2: VisualOrchestrator 호출
│  │
│  ├─ Skill: read-json
│  │  └─ Input: characters/active/LUNA_001/visual-profile.json
│  │
│  ├─ Skill: build-midjourney-prompt
│  │  └─ Output: "korean woman, 22 years old, tech wear, futuristic..."
│  │
│  ├─ Skill: call-midjourney
│  │  └─ Input: 프롬프트 + --ar 1:1 --stylize 750
│  │  └─ Output: Discord 작업 ID
│  │
│  ├─ Skill: wait-for-async
│  │  └─ Input: Discord 작업 ID
│  │  └─ Output: 생성된 이미지 URL
│  │
│  └─ Skill: write-json
│     └─ Output: visuals/references/LUNA_001/seeds.json (seed 저장)
│     └─ Output: 이미지 다운로드 및 저장
│
└─ Step 3: 결과 피드백
   └─ Output: "✅ LUNA_001 캐릭터 생성 완료
              - Profile: characters/active/LUNA_001/
              - Reference: visuals/references/LUNA_001/character-sheet.png"
```

---

### 예시 2: 콘텐츠 파이프라인

```
User: /content-pipeline "LUNA_001" "naver"

Command: content-pipeline
│
├─ Step 1: ContentMiner 호출
│  │
│  ├─ Skill: web-scrape
│  │  └─ Input: "naver", category="lifestyle"
│  │  └─ Output: 크롤링된 HTML
│  │
│  ├─ Skill: extract-content
│  │  └─ Input: HTML
│  │  └─ Output: 정제된 텍스트 + 메타데이터
│  │
│  └─ Skill: write-json
│     └─ Output: content/sources/korean-blogs/naver/2024-11/article-001.json
│
├─ Step 2: StoryTransformer 호출
│  │
│  ├─ Skill: read-json
│  │  └─ Input: characters/active/LUNA_001/profile.json
│  │  └─ Input: content/sources/.../article-001.json
│  │
│  ├─ Skill: read-markdown
│  │  └─ Input: characters/active/LUNA_001/voice-guide.md
│  │
│  ├─ Skill: call-gpt4
│  │  └─ Input: 캐릭터 프로필 + 소스 콘텐츠 + voice guide
│  │  └─ Prompt: "2035년 설정으로 Luna Kim 관점에서 스토리 변환"
│  │  └─ Output: 변환된 스토리
│  │
│  ├─ Skill: validate-voice
│  │  └─ Input: 생성된 스토리, voice-guide.md
│  │  └─ Output: 일관성 점수 85% (통과)
│  │
│  └─ Skill: write-markdown
│     └─ Output: content/stories/LUNA_001/draft/2024-11-07-001.md
│
├─ Step 3: QualityValidator 호출
│  │
│  ├─ Skill: validate-schema
│  │  └─ Input: 스토리 YAML frontmatter
│  │  └─ Output: 필수 항목 검증 통과
│  │
│  └─ Skill: generate-report
│     └─ Output: 품질 리포트 (이미지 참조 확인, 메타데이터 완성도)
│
└─ Step 4: 승인 대기 알림
   └─ Output: "📝 draft/2024-11-07-001.md 생성됨 (승인 대기)
              - 품질 점수: 85/100
              - 다음: /visual-pipeline 또는 수동 승인"
```

---

### 예시 3: 발행 워크플로우

```
User: /publish-content "LUNA_001" "story-001"

Command: publish-content
│
├─ Step 1: PlatformConverter 호출
│  │
│  ├─ Skill: read-image
│  │  └─ Input: visuals/library/LUNA_001/workspace/IMG_LUNA_045.png
│  │
│  ├─ Skill: validate-cache
│  │  └─ Input: IMG_LUNA_045, platforms=["instagram-feed", "instagram-stories"]
│  │  └─ Output: 캐시 없음, 변환 필요
│  │
│  ├─ Skill: crop-resize
│  │  └─ Input: 원본 이미지, aspect_ratio="4:5"
│  │  └─ Output: visuals/outputs/instagram-feed/LUNA_001/IMG_LUNA_045_4x5.jpg
│  │  └─ Input: 원본 이미지, aspect_ratio="9:16"
│  │  └─ Output: visuals/outputs/instagram-stories/LUNA_001/IMG_LUNA_045_9x16.jpg
│  │
│  └─ Skill: optimize-image
│     └─ Input: 변환된 이미지들
│     └─ Output: 최적화 완료 (압축률 30%)
│
├─ Step 2: CaptionGenerator 호출
│  │
│  ├─ Skill: read-markdown
│  │  └─ Input: content/stories/LUNA_001/approved/2024-11-07-001.md
│  │
│  ├─ Skill: read-json
│  │  └─ Input: characters/active/LUNA_001/content-strategy.json
│  │
│  ├─ Skill: call-gpt4
│  │  └─ Input: 스토리 + 콘텐츠 전략
│  │  └─ Prompt: "Instagram 캡션 생성 (2200자 이내, 친근한 톤)"
│  │  └─ Output: 생성된 캡션
│  │
│  ├─ Skill: generate-hashtags
│  │  └─ Input: 스토리 키워드
│  │  └─ Output: 30개 해시태그
│  │
│  └─ Skill: truncate-text
│     └─ Input: 캡션 + 해시태그
│     └─ Output: 2200자 이내로 조정
│
├─ Step 3: PublishingCoordinator 호출
│  │
│  ├─ Skill: calculate-time
│  │  └─ Input: platform="instagram", character="LUNA_001"
│  │  └─ Output: 최적 시간 = "2024-11-08T09:00:00Z"
│  │
│  ├─ Skill: call-buffer
│  │  └─ Input: {
│  │       profile_id: "instagram_123",
│  │       text: 생성된 캡션,
│  │       media: IMG_LUNA_045_4x5.jpg,
│  │       scheduled_at: "2024-11-08T09:00:00Z"
│  │     }
│  │  └─ Output: Buffer update ID = "buf_xyz789"
│  │
│  └─ Skill: log-event
│     └─ Input: 발행 정보
│     └─ Output: publishing/logs/2024-11/LUNA_001.jsonl (추가)
│
└─ Step 4: 결과 확인
   └─ Output: "🚀 Buffer 스케줄 완료
              - Platform: Instagram
              - 발행 시간: 2024-11-08 09:00 KST
              - Buffer ID: buf_xyz789
              - 이미지: 4:5 (1080x1350)
              - 해시태그: 30개"
```

---

## 🎯 규칙 준수 전략

### 문제점
복잡한 규칙이 많으면 Claude가 실수로 놓치는 경우가 발생

### 해결책: SubAgent에 규칙 내재화

#### ❌ 나쁜 예 (Command가 모든 규칙 관리)

```markdown
# Command: /visual-create

Instructions:
1. 이미지 생성 시 반드시:
   - Midjourney에 --cref URL 추가
   - --sref URL 추가
   - --ar 4:5 (Instagram용)
   - --stylize 750
   - character-sheet.png 경로 확인
   - seeds.json 업데이트
   - 메타데이터에 prompt 저장
   - 카테고리별 폴더 분류
   - 파일명은 IMG_{CHARACTER_ID}_{NUMBER} 형식
   - ... (20가지 규칙)

2. 이미지 생성
3. 저장
```

**문제점**:
- Command가 너무 복잡해짐
- 규칙을 놓치기 쉬움
- 규칙 변경 시 모든 Command 수정 필요
- 재사용성 떨어짐

---

#### ✅ 좋은 예 (SubAgent가 규칙 관리)

```markdown
# Command: /visual-create

Instructions:
1. VisualOrchestrator SubAgent 호출
   - Input: character_id, story_id
   - Output: 생성된 이미지 ID 목록

2. 결과 검증
   - 이미지 생성 성공 여부
   - 메타데이터 존재 여부

3. 사용자 피드백
   - "✅ 이미지 생성 완료: IMG_LUNA_045, IMG_LUNA_046"
```

```markdown
# SubAgent: visual-orchestrator

Domain: Visual Generation for AI Influencers

Internalized Rules (자동 적용):

1. Midjourney 파라미터
   - 항상 --cref {character-sheet URL} 추가
   - 항상 --sref {style-guide URL} 추가
   - 기본 --ar 1:1 (플랫폼별 변환은 PlatformConverter가 담당)
   - 기본 --stylize 750
   - 기본 --v 6.1

2. Reference 관리
   - visuals/references/{CHARACTER_ID}/character-sheet.png 자동 로드
   - seeds.json에서 유사 장면의 seed 자동 검색
   - 생성 성공 시 seed 자동 저장

3. 저장 규칙
   - 파일명: IMG_{CHARACTER_ID}_{AUTO_INCREMENT}.png
   - 저장 경로: visuals/library/{CHARACTER_ID}/{CATEGORY}/
   - 메타데이터: metadata.json 자동 업데이트

4. 에러 처리
   - 생성 실패 시 3회 자동 재시도
   - Discord rate limit 시 대기 후 재시도
   - 최종 실패 시 명확한 에러 메시지

Skills Used:
- read-json (visual-profile, seeds)
- build-midjourney-prompt
- call-midjourney
- wait-for-async
- extract-metadata
- write-json
```

**장점**:
- Command는 단순하고 명확
- 규칙은 SubAgent가 자동으로 보장
- 규칙 변경 시 SubAgent만 수정
- 다른 Command에서도 재사용 가능
- 테스트 및 디버깅 용이

---

## 📊 계층별 복잡도 분배

| 계층 | 복잡도 | 규칙 수 | 책임 |
|-----|-------|--------|------|
| **Commands** | 낮음 | ~5개 | 워크플로우 조율 |
| **SubAgents** | 높음 | ~20개 | 도메인 규칙 준수 |
| **Skills** | 낮음 | ~0개 | 기술적 구현 |

### Commands의 복잡도를 낮게 유지하는 원칙

1. **조건 분기 최소화**: 단순한 성공/실패 판단만
2. **규칙은 SubAgent에 위임**: Command는 규칙을 몰라도 됨
3. **에러는 SubAgent가 처리**: Command는 최종 결과만 받음
4. **상태 관리 최소화**: 필요한 정보만 SubAgent 간 전달

### SubAgent가 규칙을 관리하는 이유

1. **도메인 전문성**: 각 SubAgent는 특정 영역의 전문가
2. **규칙 집중화**: 관련 규칙이 한 곳에 모임
3. **변경 격리**: 규칙 변경 시 해당 SubAgent만 수정
4. **재사용성**: 여러 Command에서 동일한 SubAgent 재사용

---

## 🔧 확장성 고려사항

### 새로운 플랫폼 추가 (예: LinkedIn)

**변경 필요 항목**:
1. `PlatformConverter` SubAgent: LinkedIn 비율 추가 (2:3)
2. `CaptionGenerator` SubAgent: LinkedIn 톤앤매너 추가
3. `PublishingCoordinator` SubAgent: LinkedIn Buffer 프로필 매핑
4. `platform-config/linkedin.json` 생성

**변경 불필요 항목**:
- Commands: 그대로 사용 가능
- Skills: 그대로 재사용
- 다른 SubAgents: 영향 없음

### 새로운 이미지 생성 도구 추가 (예: DALL-E)

**변경 필요 항목**:
1. `VisualOrchestrator` SubAgent: DALL-E 생성 로직 추가
2. `call-dalle.md` Skill 추가

**변경 불필요 항목**:
- Commands: 그대로 사용 가능
- PlatformConverter: 이미지 변환 로직 동일
- 다른 SubAgents: 영향 없음

---

## 💡 핵심 설계 원칙

### 1. 단일 책임 원칙 (Single Responsibility)
각 계층과 컴포넌트는 하나의 명확한 책임만 가짐

### 2. 규칙 내재화 (Rule Internalization)
복잡한 도메인 규칙은 SubAgent에 내재화하여 자동으로 준수

### 3. 재사용성 (Reusability)
Skills는 여러 SubAgent에서, SubAgent는 여러 Command에서 재사용

### 4. 에러 격리 (Error Isolation)
SubAgent의 실패가 전체 시스템에 영향을 최소화

### 5. 확장성 (Scalability)
새로운 기능 추가 시 최소한의 변경으로 확장 가능

### 6. 테스트 가능성 (Testability)
각 계층을 독립적으로 테스트 가능

### 7. 명확한 인터페이스 (Clear Interface)
계층 간 입출력이 명확하고 문서화됨

---

## 📁 파일 구조

```
.claude/
│
├── commands/                   # 6개 워크플로우 오케스트레이터
│   ├── character-create.md
│   ├── content-pipeline.md
│   ├── visual-pipeline.md
│   ├── publish-content.md
│   ├── batch-process.md
│   └── quality-check.md
│
├── subagents/                  # 8개 도메인 전문가
│   ├── character-generator.md
│   ├── content-miner.md
│   ├── story-transformer.md
│   ├── visual-orchestrator.md
│   ├── platform-converter.md
│   ├── publishing-coordinator.md
│   ├── caption-generator.md
│   └── quality-validator.md
│
└── skills/                     # 20+ 재사용 가능한 원자 기능
    ├── file-ops/
    │   ├── read-json.md
    │   ├── write-json.md
    │   ├── read-markdown.md
    │   ├── write-markdown.md
    │   ├── read-image.md
    │   ├── write-image.md
    │   └── validate-schema.md
    │
    ├── api-integrations/
    │   ├── call-midjourney.md
    │   ├── call-nanobanana.md
    │   ├── call-buffer.md
    │   ├── call-gpt4.md
    │   ├── web-scrape.md
    │   └── wait-for-async.md
    │
    ├── image-processing/
    │   ├── crop-resize.md
    │   ├── optimize-image.md
    │   ├── extract-metadata.md
    │   ├── generate-thumbnail.md
    │   ├── build-midjourney-prompt.md
    │   └── validate-cache.md
    │
    ├── text-processing/
    │   ├── extract-keywords.md
    │   ├── generate-hashtags.md
    │   ├── format-caption.md
    │   ├── truncate-text.md
    │   ├── validate-voice.md
    │   └── extract-content.md
    │
    └── utilities/
        ├── generate-unique-id.md
        ├── calculate-time.md
        ├── log-event.md
        ├── generate-report.md
        └── validate-url.md
```

---

## 🚀 실행 흐름 요약

```
사용자 입력
    ↓
Claude Command (워크플로우 조율)
    ↓
SubAgent 1 (도메인 규칙 적용)
    ↓ Skills 조합
SubAgent 2 (도메인 규칙 적용)
    ↓ Skills 조합
SubAgent N (도메인 규칙 적용)
    ↓
Command (결과 취합 및 피드백)
    ↓
사용자 피드백
```

**핵심**:
- Commands는 **무엇을** 할지 결정
- SubAgents는 **어떻게** 할지 실행 (규칙 준수)
- Skills는 **기술적으로** 구현

---

## 📈 성공 지표

이 아키텍처가 성공적으로 작동하는지 확인하는 지표:

1. **규칙 준수율**: SubAgent의 출력이 100% 규칙 준수
2. **재사용률**: Skill이 평균 3개 이상의 SubAgent에서 사용
3. **확장 비용**: 새 플랫폼 추가 시 2개 이하 파일 수정
4. **에러 격리**: SubAgent 실패가 다른 SubAgent에 영향 없음
5. **개발 속도**: 새 워크플로우 추가 시 기존 SubAgent/Skill 재사용

---

**Version**: 1.0
**Last Updated**: 2024-11-07
**Maintained By**: Autonomey Team
