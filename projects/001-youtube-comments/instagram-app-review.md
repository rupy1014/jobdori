# Instagram App Review 제출 가이드

> **앱 이름**: BizChat Manager (비즈챗 매니저)
>
> **서비스 설명**: Instagram 비즈니스 계정의 댓글과 DM을 한 곳에서 쉽게 관리하는 서비스

---

## 📋 제출 전 체크리스트

### 1단계: 사전 준비 (필수)
- [ ] Facebook Developer 계정 생성
- [ ] Meta Business Suite 계정 설정
- [ ] Instagram 비즈니스/크리에이터 계정 준비
- [ ] Instagram 계정을 Facebook 페이지에 연결
- [ ] 개인정보처리방침(Privacy Policy) 페이지 URL 준비
- [ ] 서비스 약관(Terms of Service) 페이지 URL 준비

### 2단계: Facebook App 생성
- [ ] developers.facebook.com에서 새 앱 생성
- [ ] 앱 유형: "Business" 선택
- [ ] 앱 아이콘 업로드 (1024x1024px)
- [ ] Instagram 제품 추가
- [ ] Webhook 설정 완료

### 3단계: 권한 요청
- [ ] instagram_business_basic - Advanced Access 요청
- [ ] instagram_business_manage_messages - Advanced Access 요청
- [ ] instagram_manage_comments - Advanced Access 요청
- [ ] human_agent - Advanced Access 요청

### 4단계: 스크린캐스트 영상 준비
- [ ] 각 권한별 데모 영상 녹화 (QuickTime 등)
- [ ] Google Drive에 업로드 후 공유 링크 생성
- [ ] 영상에 음성 해설 또는 자막 포함

---

## 🔐 요청할 권한 목록

| 권한 | 용도 | Access Level |
|------|------|--------------|
| `instagram_business_basic` | 비즈니스 계정 정보 조회 (사용자명, ID, 프로필) | Advanced |
| `instagram_business_manage_messages` | DM 수신 및 답장 | Advanced |
| `instagram_manage_comments` | 댓글 조회 및 답글 | Advanced |
| `human_agent` | 24시간 이후 메시지 응답 (7일까지) | Advanced |
| `pages_manage_metadata` | Webhook 구독 | Advanced |
| `pages_read_engagement` | 페이지 참여도 읽기 | Advanced |

---

## 📝 App Review 제출 양식 작성 내용

### 1. App Details (앱 기본 정보)

**App Name (앱 이름)**
```
BizChat Manager
```

**App Icon**
```
1024x1024px PNG 이미지 업로드
```

**App Category**
```
Business and Pages
```

**Privacy Policy URL**
```
https://[your-domain]/privacy-policy
```

**Terms of Service URL**
```
https://[your-domain]/terms-of-service
```

**App Purpose (앱 목적)**
```
BizChat Manager is a business account management tool that helps Instagram business
owners efficiently manage their customer communications. The platform consolidates
comments and direct messages into a single dashboard, enabling faster response times
and better customer engagement.
```

---

### 2. instagram_business_basic 권한

**Use Case Description (사용 사례 설명)**
```
BizChat Manager uses instagram_business_basic to retrieve essential metadata about
connected Instagram Business accounts. This includes:

- Username: Displayed in the dashboard header to identify the connected account
- Account ID: Used internally to associate messages and comments with the correct account
- Profile Picture: Shown in the account selector for easy visual identification

This information is essential for users to verify they have connected the correct
business account and to provide a personalized dashboard experience. The data is
only accessed after explicit user authorization through Instagram Login.

User Flow:
1. User clicks "Connect Instagram Account" button
2. User is redirected to Instagram OAuth login
3. After authorization, user returns to our dashboard
4. Dashboard displays their business account profile (username, profile picture)
5. User can now view and manage their Instagram communications
```

**Screencast Instructions (스크린캐스트 안내)**
```
The screencast demonstrates:
0:00 - User navigates to BizChat Manager login page
0:10 - User clicks "Connect Instagram Business Account"
0:15 - Instagram OAuth authorization screen appears
0:25 - User grants permission and is redirected back
0:35 - Dashboard loads showing connected account metadata
0:45 - Profile picture and username displayed in header
0:55 - Account selector shows the connected business account
```

---

### 3. instagram_business_manage_messages 권한

**Use Case Description (사용 사례 설명)**
```
BizChat Manager uses instagram_business_manage_messages to help business owners
efficiently manage customer inquiries received through Instagram Direct Messages.

Core Functionality:
1. RECEIVE MESSAGES: Real-time webhook notifications when customers send DMs
2. VIEW CONVERSATIONS: Display message history in a unified inbox
3. RESPOND TO CUSTOMERS: Send replies to customer inquiries

Business Value:
- Reduces response time by centralizing all messages in one dashboard
- Prevents missed customer inquiries that could result in lost sales
- Enables team collaboration by allowing multiple staff members to manage inbox

Privacy Compliance:
- Messages are only accessed for accounts that explicitly authorize our app
- We do not initiate conversations - only respond to customer-initiated messages
- Message content is used solely for display and response purposes
- No message data is shared with third parties

User Flow:
1. Customer sends a DM to the business's Instagram account
2. Webhook delivers the message to BizChat Manager
3. Business owner sees new message notification in dashboard
4. Owner reads the message and types a response
5. Response is sent back to the customer via Instagram DM
```

**Screencast Instructions (스크린캐스트 안내)**
```
The screencast demonstrates:
0:00 - Dashboard inbox view showing existing conversations
0:10 - Simulated customer sends a new DM to the business account
0:20 - Real-time notification appears in BizChat Manager dashboard
0:30 - User clicks on the new conversation
0:40 - Message thread displays with customer's inquiry
0:50 - User types a response in the reply field
1:00 - User clicks "Send" button
1:10 - Response appears in the conversation thread
1:20 - Confirmation that message was delivered to customer
```

---

### 4. instagram_manage_comments 권한

**Use Case Description (사용 사례 설명)**
```
BizChat Manager uses instagram_manage_comments to help business owners monitor
and respond to comments on their Instagram posts efficiently.

Core Functionality:
1. FETCH COMMENTS: Retrieve comments from business account's media posts
2. VIEW COMMENT THREADS: Display comments and replies in organized view
3. RESPOND TO COMMENTS: Post replies to customer comments
4. MODERATE COMMENTS: Hide inappropriate comments when necessary

Business Value:
- Increases engagement by enabling timely responses to customer comments
- Improves customer satisfaction through active community management
- Saves time by consolidating comment management across all posts

Privacy Compliance:
- Only accesses comments on the authorized business account's own posts
- Does not access comments on other users' posts
- Comment data is used solely for display and moderation purposes

User Flow:
1. User navigates to "Comments" section in dashboard
2. Dashboard displays recent posts with comment counts
3. User clicks on a post to view all comments
4. User selects a comment to reply
5. User types and submits reply
6. Reply appears under the original comment on Instagram
```

**Screencast Instructions (스크린캐스트 안내)**
```
The screencast demonstrates:
0:00 - User navigates to Comments section
0:10 - List of recent posts with comment counts displayed
0:20 - User clicks on a post with new comments
0:30 - Comment thread expands showing all comments
0:40 - User clicks "Reply" on a customer comment
0:50 - Reply input field appears
1:00 - User types response and clicks "Post Reply"
1:10 - Reply appears in the comment thread
1:20 - Instagram app shows the reply under the original comment
```

---

### 5. human_agent 권한

**Use Case Description (사용 사례 설명)**
```
BizChat Manager requests the human_agent permission to ensure business owners
can provide complete customer support even when responses are delayed beyond
the standard 24-hour messaging window.

Why This Permission is Needed:
- Small business owners may not be available 24/7 to respond immediately
- Complex customer inquiries may require research or escalation
- Weekend/holiday inquiries need responses on the next business day
- Time zone differences between business and customers

Use Cases:
1. DELAYED SUPPORT RESPONSE: Customer asks a product question on Friday night,
   business owner responds Monday morning (within 7-day window)

2. ESCALATED INQUIRIES: Customer reports an issue requiring investigation,
   support team needs 2-3 days to research and respond

3. ORDER-RELATED FOLLOW-UP: Customer inquires about shipping, business needs
   to check with logistics before responding

Policy Compliance:
- human_agent tag is ONLY used for legitimate customer support responses
- We do NOT use this tag for promotional or marketing messages
- All responses using this tag are genuine human support replies
- We educate users about Meta's messaging policies within our platform

User Flow:
1. Customer sends inquiry on Saturday
2. Business owner is unavailable over the weekend
3. On Monday, owner logs into BizChat Manager
4. System shows the message is beyond 24-hour window
5. Owner composes support response
6. Response is sent using human_agent tag (within 7-day window)
7. Customer receives the helpful response
```

**Screencast Instructions (스크린캐스트 안내)**
```
The screencast demonstrates:
0:00 - Dashboard shows a conversation from 3 days ago
0:10 - Message indicator shows "Outside 24-hour window"
0:20 - User clicks on the conversation to view details
0:30 - Customer's original inquiry is displayed
0:40 - System shows "Human Agent response available (5 days remaining)"
0:50 - User types a support response
1:00 - User clicks "Send as Human Agent"
1:10 - Confirmation dialog explains human_agent policy
1:20 - User confirms and message is sent
1:30 - Conversation shows successful delivery
```

---

## 🎬 스크린캐스트 영상 녹화 가이드

### 영상 요구사항
| 항목 | 요구사항 |
|------|----------|
| 형식 | MP4, MOV |
| 해상도 | 1080p 권장 |
| 길이 | 권한당 1-2분 |
| 음성 | 영어 해설 또는 자막 |
| 호스팅 | Google Drive (링크 공유) |

### 영상에 반드시 포함할 내용

**모든 영상 공통:**
1. ✅ Instagram 로그인 플로우 (OAuth 화면)
2. ✅ 사용자가 권한 승인하는 화면
3. ✅ 대시보드에서 해당 기능 사용하는 화면
4. ✅ 실제 Instagram 앱/웹에서 결과 확인

**주의사항:**
- ❌ Instagram 계정 비밀번호 노출 금지
- ❌ 테스트 대시보드 관리자 계정만 공유
- ✅ 마우스 클릭과 동작이 명확히 보이도록
- ✅ 각 단계별 잠시 멈춤 (리뷰어가 확인할 수 있도록)

### 녹화 스크립트 예시 (instagram_business_manage_messages)

```
[0:00] "This screencast demonstrates how BizChat Manager uses the
instagram_business_manage_messages permission."

[0:05] "Here is the BizChat Manager dashboard. The user has already
connected their Instagram Business account."

[0:12] "Let me show the inbox section where Direct Messages are displayed."

[0:18] "Now, I will simulate a customer sending a message to this
business account."

[0:25] "As you can see, the new message appears in real-time in our
dashboard through webhook integration."

[0:35] "The business owner can click on the conversation to see the
full message thread."

[0:42] "Now, I will compose a response to this customer inquiry."

[0:50] "After typing the response, I click the Send button."

[0:55] "The message is successfully sent. Let me verify this in the
Instagram app."

[1:05] "Here in the Instagram app, you can see the response has been
delivered to the customer."

[1:15] "This demonstrates how BizChat Manager helps businesses manage
their Instagram Direct Messages efficiently."
```

---

## 📄 테스트 계정 정보 (Review Notes에 포함)

```
=== TEST CREDENTIALS FOR APP REVIEW ===

Dashboard URL: https://[your-domain]/dashboard

Test Account (Dashboard Login):
- Email: reviewer@bizchat-manager.com
- Password: [생성한 테스트 비밀번호]
- Role: Tester (non-admin access)

Note: This test account has access to view demo data and test the
message/comment management features. Instagram credentials are NOT
required - the test account is pre-connected to a demo Instagram
Business account.

To test the full flow:
1. Log in to the dashboard using credentials above
2. Navigate to "Inbox" to see Direct Messages
3. Navigate to "Comments" to see post comments
4. Try replying to a message or comment

The Instagram Business account used for testing is already connected
and authorized. Reviewers do not need to connect their own Instagram
account.

=== END TEST CREDENTIALS ===
```

---

## ⚠️ 자주 발생하는 거절 사유 및 대응

### 거절 사유 1: "스크린캐스트에서 로그인 플로우가 보이지 않음"
**대응**: 영상 시작 부분에 Instagram OAuth 로그인 화면 반드시 포함

### 거절 사유 2: "Use case가 유효하지 않음"
**대응**:
- "비즈니스 계정 관리" 목적임을 명확히
- 스팸/자동화 봇이 아님을 강조
- 실제 고객 지원 시나리오 설명

### 거절 사유 3: "테스트 방법이 불명확함"
**대응**:
- 테스트 계정 정보 명확히 제공
- 단계별 테스트 가이드 포함
- 사전 연결된 Instagram 계정 준비

### 거절 사유 4: "pages_messaging 권한도 필요"
**대응**: Facebook 페이지 메시지 기능도 함께 신청 고려

---

## 📅 예상 일정

| 단계 | 예상 소요 시간 |
|------|---------------|
| 사전 준비 (계정, 페이지 설정) | 1-2일 |
| Facebook App 생성 및 설정 | 1일 |
| 스크린캐스트 영상 제작 | 2-3일 |
| App Review 제출 | 1일 |
| **Meta 심사 대기** | **1-4주** |
| 거절 시 수정 후 재제출 | 3-7일 |

---

## 🔗 참고 링크

- [Meta App Review 공식 문서](https://developers.facebook.com/docs/app-review)
- [Instagram Messaging API 문서](https://developers.facebook.com/docs/messenger-platform/instagram)
- [Chatwoot Instagram App Review 가이드](https://developers.chatwoot.com/self-hosted/instagram-app-review)
- [App Review 승인 팁 (Medium)](https://medium.com/@chriscouture/how-to-get-your-meta-facebook-app-approved-in-2023-tips-code-snippets-for-navigating-reviews-c1305da5f929)

---

## ✅ 최종 제출 전 확인

- [ ] 모든 Use Case Description 작성 완료
- [ ] 권한별 스크린캐스트 영상 녹화 완료
- [ ] Google Drive 링크 공유 설정 확인 (Anyone with link)
- [ ] 테스트 계정 생성 및 접속 확인
- [ ] Privacy Policy 페이지 라이브 확인
- [ ] 앱 아이콘 업로드 확인
- [ ] 데이터 처리 관련 질문 모두 답변

---

*마지막 업데이트: 2024-11-27*
