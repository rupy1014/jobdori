# Spec: 001-persona

## Feature Name
페르소나 생성 및 관리

## User Value (고객 가치)
- **다양성 확보**: 100가지 다른 스타일로 브랜드 노출 확대
- **카테고리 최적화**: 브랜드 카테고리별 최적화된 인플루언서 풀 확보
- **검증된 스타일**: 성공한 인플루언서 스타일 기반으로 시행착오 최소화

## Target User (누가 쓸까?)
- **Primary**: 서비스 관리자 (운영팀)
- **Use Case**:
  - 초기 셋업 시 100명의 페르소나 생성
  - 카테고리별 비율 조정 및 관리
  - 미드저니 프롬프트 생성 및 프로필 이미지 관리

## User Journey & Screen Flow

### 1. 페르소나 대시보드
- **UI Elements**:
  - 전체 페르소나 개수 (100명)
  - 카테고리별 분포 차트 (Beauty 25, Fashion 25, Food 20, Fitness 15, Lifestyle 10, Tech 5)
  - "새 페르소나 생성" 버튼
  - 페르소나 목록 테이블 (이름, 카테고리, 상태, 프로필 이미지 여부)
- **CTA**: "새 페르소나 생성", "미드저니 프롬프트 일괄 Export"
- **Next**: 페르소나 생성 모달 또는 개별 페르소나 상세

### 2. 페르소나 생성 모달
- **UI Elements**:
  - 카테고리 선택 드롭다운 (Beauty, Fashion, Food, Fitness, Lifestyle, Tech)
  - 생성 개수 입력 (기본값: 카테고리별 목표 개수)
  - "자동 생성" vs "수동 설정" 토글
- **CTA**: "생성 시작" 버튼
- **Next**: 생성 진행 화면 → 페르소나 목록

### 3. 페르소나 상세/편집 화면
- **UI Elements**:
  - 기본 정보 (이름, 나이, 카테고리, 성격)
  - 미드저니 프롬프트 (자동 생성됨, 수정 가능)
  - 프로필 이미지 업로드 영역
  - 톤앤매너 설정 (활발함/차분함, 친근함/전문적)
- **CTA**: "미드저니 프롬프트 복사", "저장"
- **Next**: 페르소나 목록 복귀

### 4. 미드저니 프롬프트 Export
- **UI Elements**:
  - Export 대상 선택 (전체/카테고리별/개별)
  - 프롬프트 미리보기
- **CTA**: "CSV Export", "클립보드 복사"
- **Next**: Export 완료 → 대시보드

## Business Rules

### 페르소나 생성 규칙
- **카테고리별 기본 비율**:
  - Beauty & Skincare: 25명
  - Fashion & Style: 25명
  - Food & Beverage: 20명
  - Fitness & Wellness: 15명
  - Lifestyle: 10명
  - Tech & Gadgets: 5명
- **총 개수 제한**: 최대 100명 (확장 시 조정 가능)
- **필수 정보**: 이름(한글), 나이, 카테고리, 성격, 미드저니 프롬프트

### 미드저니 프롬프트 생성 규칙
- **자동 생성 항목**:
  - 외모 특징 (나이대, 스타일)
  - 촬영 스타일 (조명, 배경, 각도)
  - 카테고리별 특화 요소 (예: Beauty → "natural makeup", Fashion → "street style")
- **포맷**: "Korean woman in her [age], [category]-focused influencer, [style], professional Instagram photo, natural lighting, --ar 1:1 --v 6"

### 프로필 이미지 관리
- **업로드 형식**: JPG, PNG (1:1 비율 권장)
- **파일 크기**: 최대 5MB
- **저장 위치**: `/assets/personas/[persona-id]/profile.jpg`
- **상태 관리**: 미드저니 생성 대기 / 이미지 업로드 완료

## Edge Cases

### 생성 실패 처리
- 미드저니 프롬프트 생성 실패 시 기본 템플릿 사용
- 중복 이름 방지: 동일 이름 생성 시 자동으로 번호 추가 (예: "지수", "지수2")

### 카테고리 불균형
- 목표 개수 초과 시 경고 메시지 표시
- 관리자 승인 후 추가 생성 가능

### 프로필 이미지 누락
- 이미지 없는 페르소나는 "설정 미완료" 상태로 표시
- 콘텐츠 생성 시 프로필 이미지 필수 체크

## Dependencies
- **None** (초기 셋업 기능)
- **연관 기능**:
  - 002-reference-crawl: 페르소나별 레퍼런스 계정 매칭 시 페르소나 정보 참조
  - 003-content-composer: 콘텐츠 생성 시 페르소나 프로필 이미지 사용

---

## 💡 더 구체화하려면

```
/appkit.spec 001-persona "카테고리별 비율 동적 조정 기능"
/appkit.spec 001-persona "페르소나별 톤앤매너 상세 설정 (MBTI, 말투 샘플)"
/appkit.spec 001-persona "미드저니 프롬프트 버전 관리 (v5 vs v6)"
```
