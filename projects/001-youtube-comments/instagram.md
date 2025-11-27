# Instagram Messenger API 통합 가이드

> **결정**: Instagram 공식 Messenger API 사용 (Graph API 기반)
>
> 비공식 API(instagrapi)는 계정 밴 리스크로 인해 제외

## 📋 개요

Instagram Messenger API는 Meta의 Graph API 기반으로, 비즈니스/크리에이터 계정의 DM을 프로그래밍 방식으로 관리할 수 있게 해줍니다.

- **출시일**: 2021년 8월 16일부터 전체 비즈니스 계정 사용 가능
- **비용**: 무료
- **안정성**: 공식 API로 계정 밴 위험 없음

## ✅ 가능한 기능

| 기능 | 지원 | 비고 |
|------|------|------|
| DM 받기 (Webhook) | ✅ | 실시간 수신 |
| DM 답장하기 | ✅ | 텍스트, 이미지, 버튼 등 |
| 대화 내역 조회 | ✅ | Conversation API |
| 사용자 프로필 조회 | ✅ | IGSID로 조회 |
| 스토리 멘션 응답 | ✅ | 스토리에서 멘션 시 |
| 게시물 댓글 답장 | ✅ | 댓글을 DM으로 |
| Quick Replies | ✅ | 버튼형 빠른 답장 |
| Ice Breakers | ✅ | FAQ 형태 대화 시작 |

## ❌ 불가능한 기능

| 기능 | 상태 | 이유 |
|------|------|------|
| 먼저 DM 보내기 | ❌ | 고객이 먼저 메시지 보내야 함 |
| 프로모션 메시지 | ❌ | 할인, 쿠폰 등 금지 |
| 24시간 이후 메시지 | ⚠️ | HUMAN_AGENT 태그로 7일까지 가능 |

## 🔧 사전 요구사항

### 1. 계정 설정
- [ ] Instagram **비즈니스** 또는 **크리에이터** 계정
- [ ] Facebook 비즈니스 페이지 연결
- [ ] Facebook Developer 계정

### 2. Facebook App 생성
1. [developers.facebook.com](https://developers.facebook.com) 접속
2. 새 앱 생성 (Business 유형)
3. Instagram 제품 추가

### 3. 필수 권한 (Permissions)

```
instagram_basic              - 프로필 정보 읽기
instagram_manage_messages    - DM 송수신 (Advanced Access 필요)
instagram_manage_comments    - 댓글 관리
pages_manage_metadata        - Webhook 구독
pages_messaging              - 메시지 기능
human_agent                  - 7일 메시징 윈도우
```

### 4. App Review 제출
- `instagram_manage_messages` Advanced Access 필요
- 심사 기간: 수 일 ~ 수 주
- Privacy Policy URL 필수

## 🔌 API 엔드포인트

### 대화 목록 조회
```
GET /{page_id}/conversations?platform=instagram
```

### 메시지 조회
```
GET /{page_id}/conversations?fields=messages{from,to,message,created_time,id}&platform=instagram
```

### 메시지 보내기
```
POST /me/messages
{
  "recipient": { "id": "<IGSID>" },
  "message": { "text": "답장 내용" }
}
```

### 미디어 포함 메시지
```
POST /me/messages
{
  "recipient": { "id": "<IGSID>" },
  "message": {
    "attachment": {
      "type": "image",
      "payload": { "url": "https://example.com/image.jpg" }
    }
  }
}
```

## 🪝 Webhook 설정

### 1. Webhook 구독 설정
- Meta Dashboard → Messenger → Instagram Settings → Webhooks
- Callback URL 설정
- Verify Token 설정

### 2. 구독할 이벤트
```
messages        - 새 메시지 수신
messaging_postbacks - 버튼 클릭
messaging_optins    - 옵트인 이벤트
```

### 3. Webhook 엔드포인트 구현

```typescript
// GET - Verification
app.get('/webhook/instagram', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// POST - Receive Messages
app.post('/webhook/instagram', (req, res) => {
  const body = req.body;

  if (body.object === 'instagram') {
    body.entry.forEach(entry => {
      const messaging = entry.messaging[0];
      const senderId = messaging.sender.id;
      const message = messaging.message?.text;

      // 메시지 처리 로직
      console.log(`From: ${senderId}, Message: ${message}`);
    });
    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});
```

## ⏰ 메시징 윈도우 규칙

| 상황 | 허용 시간 |
|------|----------|
| 일반 응답 | 고객 메시지 후 **24시간** |
| HUMAN_AGENT 태그 | 고객 메시지 후 **7일** |
| 프로모션 메시지 | ❌ 금지 |

### Message Tag 사용
```json
{
  "recipient": { "id": "<IGSID>" },
  "message": { "text": "7일 내 응답입니다" },
  "messaging_type": "MESSAGE_TAG",
  "tag": "HUMAN_AGENT"
}
```

## 📊 Rate Limits

- **시간당 한도**: `200 × 메시지 가능한 사용자 수`
- 예: 1,000명과 대화 가능 → 시간당 200,000 메시지

## 🚀 구현 계획

### Phase 1: 기본 설정
1. Facebook App 생성 및 Instagram 연결
2. 권한 요청 및 App Review 제출
3. Webhook 엔드포인트 구현

### Phase 2: DM 수신
1. Webhook으로 실시간 DM 수신
2. 메시지 저장 및 대시보드 표시
3. YouTube 댓글과 통합 뷰

### Phase 3: AI 응답
1. 받은 DM에 LLM 기반 답장 생성
2. 수동 승인 후 발송
3. 자동 응답 규칙 설정

## 📁 프로젝트 구조 (예정)

```
src/
├── services/
│   ├── youtube.ts       # 기존 YouTube 서비스
│   └── instagram.ts     # 새로 추가할 Instagram 서비스
├── routes/
│   └── api.ts           # /webhook/instagram 추가
└── types.ts             # Instagram 타입 정의 추가
```

## 🔗 참고 자료

- [Meta Developer Docs - Messenger API for Instagram](https://developers.facebook.com/docs/messenger-platform/instagram)
- [Instagram Graph API](https://developers.facebook.com/docs/instagram-api)
- [Webhook Setup Guide](https://developers.facebook.com/docs/messenger-platform/webhooks)
- [Brevo Instagram DM API Guide](https://www.brevo.com/blog/instagram-dm-api/)

## ⚠️ 주의사항

1. **개인 계정 불가**: 반드시 비즈니스/크리에이터 계정 필요
2. **App Review 필수**: Advanced Access 없이는 개발자만 테스트 가능
3. **정책 준수**: 프로모션 메시지 발송 시 계정 제한 가능
4. **먼저 메시지 불가**: 항상 고객이 먼저 대화 시작해야 함

---

*마지막 업데이트: 2024-11-26*
