 사용 방법:
  1. Google Cloud Console에서 redirect URI 추가: http://localhost:8788/oauth/callback
  2. 대시보드에서 "🔑 재인증" 클릭
  3. Google 계정으로 로그인 & 권한 승인
  4. 토큰이 KV에 자동 저장됨
  5. 이후 토큰이 자동으로 갱신됨


---
엑세스 차단됨: youtube auto comments은(는) Google 인증 절차를 완료하지 않았습니다

AI잡돌이
youtube auto comments에서 Google의 인증 절차를 완료하지 않았습니다. 앱은 현재 테스트 중이며 개발자가 승인한 테스터만 앱에 액세스할 수 있습니다. 액세스할 자격이 있다고 생각되면 개발자에게 문의하세요.
youtube auto comments의 개발자인 경우 오류 세부정보를 참고하세요.


   Google OAuth 앱이 "테스트 모드"라서 발생하는 문제입니다. 테스트 사용자로 본인 이메일을 추가해야 합니다.

  Google Cloud Console에서 설정:

  1. https://console.cloud.google.com/apis/credentials/consent 접속
  2. "OAuth 동의 화면" 탭에서:
    - "테스트 사용자" 섹션 찾기
    - "+ ADD USERS" 클릭
    - 본인 Google 이메일 추가 (YouTube 채널 소유자 이메일)
    - 저장
  3. 다시 /oauth/start로 접속하면 로그인 가능

  참고:
  - 테스트 모드에서는 최대 100명까지 테스트 사용자 추가 가능
  - 앱을 "프로덕션"으로 게시하면 누구나 사용 가능 (Google 심사 필요)
  - 개인 프로젝트는 테스트 모드로 충분합니다