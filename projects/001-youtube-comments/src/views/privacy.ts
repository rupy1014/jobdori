/**
 * 개인정보 처리방침 페이지
 */

export function renderPrivacy(): string {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>개인정보 처리방침 | Autonomey</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0a0a0a;
      color: #e5e5e5;
      line-height: 1.8;
      padding: 40px 20px;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
    }
    h1 {
      font-size: 2rem;
      margin-bottom: 10px;
      color: #fff;
    }
    .subtitle {
      color: #888;
      margin-bottom: 40px;
    }
    h2 {
      font-size: 1.3rem;
      margin-top: 40px;
      margin-bottom: 15px;
      color: #fff;
      border-bottom: 1px solid #333;
      padding-bottom: 10px;
    }
    p, li {
      color: #ccc;
      margin-bottom: 12px;
    }
    ul {
      margin-left: 20px;
      margin-bottom: 20px;
    }
    .highlight {
      background: #1a1a2e;
      border-left: 3px solid #3b82f6;
      padding: 15px 20px;
      margin: 20px 0;
      border-radius: 0 8px 8px 0;
    }
    .back-link {
      display: inline-block;
      margin-top: 40px;
      color: #3b82f6;
      text-decoration: none;
    }
    .back-link:hover {
      text-decoration: underline;
    }
    .update-date {
      color: #666;
      font-size: 0.9rem;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #333;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔒 개인정보 처리방침</h1>
    <p class="subtitle">Autonomey (유튜브 댓글 자동 응답 서비스)</p>

    <div class="highlight">
      <strong>💡 요약:</strong> Autonomey는 서비스 제공에 필요한 최소한의 정보만 수집하며,
      사용자의 YouTube 데이터는 댓글 응답 기능 외에는 사용하지 않습니다.
      현재 베타 기간으로 <strong>완전 무료</strong>로 운영됩니다.
    </div>

    <h2>1. 개인정보 수집 항목</h2>
    <p>Autonomey는 다음과 같은 정보를 수집합니다:</p>
    <ul>
      <li><strong>회원 정보:</strong> 이메일 주소, 이름 (회원가입 시)</li>
      <li><strong>YouTube 연동 정보:</strong> YouTube 채널 ID, 채널명, OAuth 토큰</li>
      <li><strong>서비스 이용 정보:</strong> 댓글 데이터, AI 응답 기록, 설정 값</li>
    </ul>

    <h2>2. 개인정보 수집 목적</h2>
    <p>수집된 정보는 다음 목적으로만 사용됩니다:</p>
    <ul>
      <li>회원 식별 및 서비스 제공</li>
      <li>YouTube 댓글 자동 응답 기능 수행</li>
      <li>서비스 개선 및 통계 분석</li>
      <li>고객 문의 응대</li>
    </ul>

    <h2>3. 개인정보 보유 기간</h2>
    <ul>
      <li>회원 탈퇴 시 즉시 삭제</li>
      <li>YouTube 연동 해제 시 관련 토큰 즉시 삭제</li>
      <li>서비스 이용 기록: 회원 탈퇴 후 30일 이내 삭제</li>
    </ul>

    <h2>4. 개인정보 제3자 제공</h2>
    <p>Autonomey는 사용자의 개인정보를 제3자에게 제공하지 않습니다. 단, 다음의 경우는 예외로 합니다:</p>
    <ul>
      <li>사용자가 사전에 동의한 경우</li>
      <li>법령에 의해 요구되는 경우</li>
    </ul>

    <h2>5. 외부 서비스 연동</h2>
    <p>Autonomey는 다음 외부 서비스와 연동됩니다:</p>
    <ul>
      <li><strong>YouTube Data API:</strong> 댓글 조회 및 게시를 위해 사용</li>
      <li><strong>OpenRouter API:</strong> AI 응답 생성을 위해 사용 (사용자가 직접 API Key 입력)</li>
    </ul>
    <p>각 서비스의 개인정보 처리방침은 해당 서비스에서 확인하시기 바랍니다.</p>

    <h2>6. 사용자 권리</h2>
    <p>사용자는 언제든지 다음 권리를 행사할 수 있습니다:</p>
    <ul>
      <li>개인정보 열람, 정정, 삭제 요청</li>
      <li>YouTube 연동 해제 (Google 계정 설정에서 가능)</li>
      <li>회원 탈퇴</li>
    </ul>

    <h2>7. 개인정보 보호</h2>
    <ul>
      <li>비밀번호는 안전한 해시 알고리즘으로 암호화 저장</li>
      <li>OAuth 토큰은 암호화하여 보관</li>
      <li>HTTPS를 통한 안전한 데이터 전송</li>
    </ul>

    <h2>8. 쿠키 사용</h2>
    <p>Autonomey는 로그인 세션 유지를 위해 쿠키를 사용합니다.
    브라우저 설정에서 쿠키를 비활성화할 수 있으나, 이 경우 서비스 이용이 제한될 수 있습니다.</p>

    <h2>9. 문의처</h2>
    <p>개인정보 관련 문의는 아래로 연락해주세요:</p>
    <ul>
      <li><strong>서비스 제공자:</strong> AI 잡돌이</li>
      <li><strong>이메일:</strong> oojooteam@gmail.com</li>
      <li><strong>YouTube:</strong> <a href="https://www.youtube.com/@AI%EC%9E%A1%EB%8F%8C%EC%9D%B4" style="color: #3b82f6;">@AI잡돌이</a></li>
    </ul>

    <h2>10. 개정 안내</h2>
    <p>본 개인정보 처리방침은 법령 변경이나 서비스 변경에 따라 수정될 수 있습니다.
    변경 시 서비스 내 공지를 통해 안내드립니다.</p>

    <p class="update-date">최종 수정일: 2024년 12월 1일</p>

    <a href="/" class="back-link">← 홈으로 돌아가기</a>
  </div>
</body>
</html>`
}
