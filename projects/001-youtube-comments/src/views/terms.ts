/**
 * 서비스 이용약관 페이지
 */

export function renderTerms(): string {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>서비스 이용약관 | Autonomey</title>
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
      background: #1a2e1a;
      border-left: 3px solid #22c55e;
      padding: 15px 20px;
      margin: 20px 0;
      border-radius: 0 8px 8px 0;
    }
    .warning {
      background: #2e2a1a;
      border-left: 3px solid #eab308;
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
    <h1>📋 서비스 이용약관</h1>
    <p class="subtitle">Autonomey (유튜브 댓글 자동 응답 서비스)</p>

    <div class="highlight">
      <strong>🎉 베타 서비스 안내:</strong> Autonomey는 현재 베타 테스트 기간으로,
      모든 기능을 <strong>무료</strong>로 이용하실 수 있습니다.
      정식 서비스 출시 시 요금 정책이 변경될 수 있으며, 사전에 안내드립니다.
    </div>

    <h2>제1조 (목적)</h2>
    <p>본 약관은 AI 잡돌이(이하 "운영자")가 제공하는 Autonomey 서비스(이하 "서비스")의
    이용 조건 및 절차, 운영자와 회원 간의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.</p>

    <h2>제2조 (서비스 내용)</h2>
    <p>Autonomey는 다음의 서비스를 제공합니다:</p>
    <ul>
      <li>YouTube 채널 댓글 자동 수집</li>
      <li>AI 기반 댓글 자동 분류 (긍정/질문/부정/스팸)</li>
      <li>AI 맞춤 응답 생성</li>
      <li>댓글 자동/수동 게시</li>
      <li>다중 채널 관리</li>
    </ul>

    <h2>제3조 (회원가입)</h2>
    <ul>
      <li>서비스 이용을 위해서는 회원가입이 필요합니다.</li>
      <li>회원가입 시 정확한 정보를 입력해야 합니다.</li>
      <li>타인의 정보를 도용하거나 허위 정보를 입력할 경우 서비스 이용이 제한될 수 있습니다.</li>
    </ul>

    <h2>제4조 (YouTube 연동)</h2>
    <ul>
      <li>서비스 이용을 위해 YouTube 계정 연동(OAuth)이 필요합니다.</li>
      <li>연동 시 YouTube Data API를 통해 댓글 조회 및 게시 권한을 요청합니다.</li>
      <li>사용자는 언제든지 Google 계정 설정에서 연동을 해제할 수 있습니다.</li>
      <li>YouTube 서비스 약관을 준수해야 합니다.</li>
    </ul>

    <h2>제5조 (API Key 사용)</h2>
    <ul>
      <li>AI 응답 생성을 위해 사용자 본인의 OpenRouter API Key가 필요합니다.</li>
      <li>API Key는 사용자가 직접 발급받아 입력합니다.</li>
      <li>API 사용에 따른 비용은 사용자 부담입니다.</li>
      <li>API Key는 암호화하여 저장되며, 서비스 제공 목적 외에는 사용하지 않습니다.</li>
    </ul>

    <h2>제6조 (이용자의 의무)</h2>
    <p>이용자는 다음 행위를 해서는 안 됩니다:</p>
    <ul>
      <li>스팸성 댓글 대량 게시</li>
      <li>타인을 비방하거나 명예를 훼손하는 댓글 게시</li>
      <li>불법적인 내용의 댓글 게시</li>
      <li>YouTube 커뮤니티 가이드라인 위반</li>
      <li>서비스 시스템에 대한 불법적인 접근 또는 공격</li>
      <li>타인의 계정 도용</li>
    </ul>

    <div class="warning">
      <strong>⚠️ 주의:</strong> AI가 생성한 응답이라 하더라도, 최종 게시에 대한 책임은
      해당 YouTube 채널 소유자(사용자)에게 있습니다. 게시 전 내용을 확인하시기 바랍니다.
    </div>

    <h2>제7조 (서비스 제한 및 중단)</h2>
    <ul>
      <li>운영자는 다음 경우 서비스 이용을 제한하거나 중단할 수 있습니다:
        <ul>
          <li>본 약관을 위반한 경우</li>
          <li>시스템 점검이 필요한 경우</li>
          <li>천재지변, 국가비상사태 등 불가항력적인 경우</li>
        </ul>
      </li>
      <li>베타 서비스 특성상 예고 없이 기능이 변경되거나 서비스가 중단될 수 있습니다.</li>
    </ul>

    <h2>제8조 (면책조항)</h2>
    <ul>
      <li>운영자는 천재지변, 전쟁 등 불가항력적 사유로 인한 서비스 중단에 대해 책임지지 않습니다.</li>
      <li>AI가 생성한 응답의 내용에 대한 최종 책임은 사용자에게 있습니다.</li>
      <li>YouTube API 정책 변경으로 인한 서비스 제한에 대해 책임지지 않습니다.</li>
      <li>사용자의 API Key 관리 소홀로 인한 문제는 사용자 책임입니다.</li>
    </ul>

    <h2>제9조 (저작권)</h2>
    <ul>
      <li>서비스 내 콘텐츠 및 디자인에 대한 저작권은 운영자에게 있습니다.</li>
      <li>사용자가 작성한 댓글의 저작권은 사용자에게 있습니다.</li>
    </ul>

    <h2>제10조 (약관 변경)</h2>
    <ul>
      <li>본 약관은 관련 법령 변경이나 서비스 정책 변경에 따라 수정될 수 있습니다.</li>
      <li>약관 변경 시 서비스 내 공지를 통해 7일 전 안내합니다.</li>
      <li>변경된 약관에 동의하지 않는 경우 회원 탈퇴가 가능합니다.</li>
    </ul>

    <h2>제11조 (분쟁 해결)</h2>
    <p>본 약관과 관련하여 분쟁이 발생한 경우, 대한민국 법률을 준거법으로 하며,
    관할 법원은 운영자의 소재지를 관할하는 법원으로 합니다.</p>

    <h2>제12조 (문의)</h2>
    <p>서비스 이용 관련 문의는 아래로 연락해주세요:</p>
    <ul>
      <li><strong>서비스 운영자:</strong> AI 잡돌이</li>
      <li><strong>이메일:</strong> oojooteam@gmail.com</li>
      <li><strong>YouTube:</strong> <a href="https://www.youtube.com/@AI%EC%9E%A1%EB%8F%8C%EC%9D%B4" style="color: #3b82f6;">@AI잡돌이</a></li>
    </ul>

    <p class="update-date">시행일: 2024년 12월 1일</p>

    <a href="/" class="back-link">← 홈으로 돌아가기</a>
  </div>
</body>
</html>`
}
