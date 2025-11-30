/**
 * 랜딩 페이지 HTML 렌더링
 */

export function renderLanding(): string {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Autonomey - YouTube 댓글 자동 응답 AI</title>
  <meta name="description" content="AI가 당신의 채널 톤에 맞춰 YouTube 댓글에 자동으로 응답합니다. 무료로 시작하세요.">
  <meta name="keywords" content="YouTube, 댓글, 자동응답, AI, 유튜브, 댓글관리, 자동화">

  <!-- Open Graph -->
  <meta property="og:title" content="Autonomey - YouTube 댓글 자동 응답 AI">
  <meta property="og:description" content="AI가 당신의 채널 톤에 맞춰 YouTube 댓글에 자동으로 응답합니다.">
  <meta property="og:type" content="website">

  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    :root {
      --primary: #3b82f6;
      --primary-hover: #2563eb;
      --secondary: #10b981;
      --secondary-hover: #059669;
      --accent: #f59e0b;
      --bg-dark: #0f0f0f;
      --bg-card: #1a1a1a;
      --bg-card-hover: #222;
      --border: #333;
      --text: #fff;
      --text-muted: #888;
      --text-dim: #666;
    }

    html {
      scroll-behavior: smooth;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans KR', sans-serif;
      background: var(--bg-dark);
      color: var(--text);
      line-height: 1.6;
    }

    /* Navigation */
    nav {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: rgba(15, 15, 15, 0.9);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid var(--border);
      z-index: 1000;
      padding: 0 20px;
    }

    .nav-container {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: 64px;
    }

    .logo {
      font-size: 20px;
      font-weight: 700;
      color: var(--text);
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .nav-links {
      display: flex;
      gap: 30px;
      align-items: center;
    }

    .nav-links a {
      color: var(--text-muted);
      text-decoration: none;
      font-size: 14px;
      transition: color 0.2s;
    }

    .nav-links a:hover {
      color: var(--text);
    }

    .nav-cta {
      display: flex;
      gap: 12px;
    }

    .btn {
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s;
      cursor: pointer;
      border: none;
    }

    .btn-ghost {
      background: transparent;
      color: var(--text);
      border: 1px solid var(--border);
    }

    .btn-ghost:hover {
      background: var(--bg-card);
      border-color: #555;
    }

    .btn-primary {
      background: var(--primary);
      color: white;
    }

    .btn-primary:hover {
      background: var(--primary-hover);
    }

    .btn-secondary {
      background: var(--secondary);
      color: white;
    }

    .btn-secondary:hover {
      background: var(--secondary-hover);
    }

    .btn-large {
      padding: 16px 32px;
      font-size: 16px;
    }

    /* Sections */
    section {
      padding: 100px 20px;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
    }

    /* Hero Section */
    .hero {
      min-height: 100vh;
      display: flex;
      align-items: center;
      padding-top: 64px;
      background: radial-gradient(ellipse at top, #1a1a3a 0%, var(--bg-dark) 60%);
    }

    .hero-content {
      text-align: center;
      max-width: 800px;
      margin: 0 auto;
    }

    .hero-badge {
      display: inline-block;
      background: rgba(59, 130, 246, 0.15);
      color: var(--primary);
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      margin-bottom: 24px;
      border: 1px solid rgba(59, 130, 246, 0.3);
    }

    .hero h1 {
      font-size: 48px;
      font-weight: 700;
      margin-bottom: 24px;
      line-height: 1.2;
    }

    .hero h1 span {
      background: linear-gradient(135deg, var(--primary), var(--secondary));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .hero p {
      font-size: 20px;
      color: var(--text-muted);
      margin-bottom: 40px;
      line-height: 1.6;
    }

    .hero-cta {
      display: flex;
      gap: 16px;
      justify-content: center;
      margin-bottom: 40px;
    }

    .hero-features {
      display: flex;
      justify-content: center;
      gap: 30px;
      color: var(--text-muted);
      font-size: 14px;
    }

    .hero-features span {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .hero-features .check {
      color: var(--secondary);
    }

    /* Problem Section */
    .problem {
      background: var(--bg-dark);
    }

    .section-title {
      text-align: center;
      margin-bottom: 60px;
    }

    .section-title h2 {
      font-size: 36px;
      margin-bottom: 16px;
    }

    .section-title p {
      color: var(--text-muted);
      font-size: 18px;
    }

    .problem-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 24px;
    }

    .problem-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 32px;
      text-align: center;
      transition: transform 0.2s, border-color 0.2s;
    }

    .problem-card:hover {
      transform: translateY(-4px);
      border-color: #444;
    }

    .problem-card .icon {
      font-size: 48px;
      margin-bottom: 20px;
    }

    .problem-card h3 {
      font-size: 20px;
      margin-bottom: 12px;
    }

    .problem-card p {
      color: var(--text-muted);
      font-size: 15px;
    }

    /* Solution Section */
    .solution {
      background: linear-gradient(180deg, var(--bg-dark) 0%, #0a1628 100%);
    }

    .solution-demo {
      max-width: 700px;
      margin: 0 auto;
    }

    .demo-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 16px;
      overflow: hidden;
    }

    .demo-header {
      background: #222;
      padding: 16px 20px;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .demo-dots {
      display: flex;
      gap: 6px;
    }

    .demo-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }

    .demo-dot.red { background: #ef4444; }
    .demo-dot.yellow { background: #f59e0b; }
    .demo-dot.green { background: #10b981; }

    .demo-title {
      color: var(--text-muted);
      font-size: 13px;
    }

    .demo-content {
      padding: 24px;
    }

    .demo-comment {
      background: #222;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 16px;
    }

    .demo-comment-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
    }

    .demo-avatar {
      width: 32px;
      height: 32px;
      background: var(--primary);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
    }

    .demo-author {
      font-weight: 600;
      font-size: 14px;
    }

    .demo-text {
      color: var(--text);
      font-size: 15px;
      line-height: 1.5;
    }

    .demo-arrow {
      text-align: center;
      padding: 16px;
      color: var(--text-muted);
      font-size: 24px;
    }

    .demo-classification {
      display: inline-block;
      background: rgba(16, 185, 129, 0.15);
      color: var(--secondary);
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      margin-bottom: 12px;
    }

    .demo-reply {
      background: rgba(59, 130, 246, 0.1);
      border: 1px solid rgba(59, 130, 246, 0.3);
      border-radius: 12px;
      padding: 16px;
    }

    .demo-reply-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
    }

    .demo-reply-avatar {
      width: 32px;
      height: 32px;
      background: var(--secondary);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
    }

    .demo-reply-label {
      font-size: 12px;
      color: var(--primary);
      background: rgba(59, 130, 246, 0.2);
      padding: 2px 8px;
      border-radius: 4px;
    }

    /* Steps Section */
    .steps {
      background: var(--bg-dark);
    }

    .steps-list {
      max-width: 600px;
      margin: 0 auto;
    }

    .step {
      display: flex;
      gap: 24px;
      margin-bottom: 40px;
      position: relative;
    }

    .step:not(:last-child)::after {
      content: '';
      position: absolute;
      left: 24px;
      top: 56px;
      width: 2px;
      height: calc(100% - 16px);
      background: var(--border);
    }

    .step-number {
      width: 48px;
      height: 48px;
      background: var(--primary);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      font-weight: 700;
      flex-shrink: 0;
    }

    .step-content h3 {
      font-size: 20px;
      margin-bottom: 8px;
    }

    .step-content p {
      color: var(--text-muted);
      font-size: 15px;
    }

    .step-content .hint {
      display: inline-block;
      background: var(--bg-card);
      color: var(--text-dim);
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 13px;
      margin-top: 8px;
    }

    /* Features Section */
    .features {
      background: linear-gradient(180deg, #0a1628 0%, var(--bg-dark) 100%);
    }

    .feature-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 24px;
    }

    .feature-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 24px;
    }

    .feature-card .badge {
      display: inline-block;
      padding: 6px 14px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 12px;
    }

    .feature-card .badge.positive { background: #052e16; color: #10b981; }
    .feature-card .badge.negative { background: #450a0a; color: #ef4444; }
    .feature-card .badge.question { background: #172554; color: #3b82f6; }
    .feature-card .badge.suggestion { background: #3f3f46; color: #a78bfa; }
    .feature-card .badge.reaction { background: #422006; color: #fbbf24; }
    .feature-card .badge.other { background: #27272a; color: #a1a1aa; }

    .feature-card h4 {
      font-size: 15px;
      margin-bottom: 8px;
    }

    .feature-card p {
      color: var(--text-muted);
      font-size: 14px;
    }

    /* Workflow Section */
    .workflow {
      background: var(--bg-dark);
    }

    .workflow-steps {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 24px;
      flex-wrap: wrap;
    }

    .workflow-step {
      text-align: center;
    }

    .workflow-icon {
      width: 64px;
      height: 64px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      margin: 0 auto 12px;
    }

    .workflow-step p {
      font-size: 14px;
      color: var(--text-muted);
    }

    .workflow-arrow {
      font-size: 24px;
      color: var(--border);
    }

    /* Schedule Section */
    .schedule {
      background: linear-gradient(180deg, var(--bg-dark) 0%, #0a1628 100%);
    }

    .schedule-timeline {
      max-width: 600px;
      margin: 0 auto;
    }

    .schedule-item {
      display: flex;
      gap: 20px;
      margin-bottom: 24px;
      padding: 20px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 12px;
    }

    .schedule-time {
      min-width: 90px;
      padding: 8px 12px;
      background: var(--primary);
      color: white;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      text-align: center;
      height: fit-content;
    }

    .schedule-content h4 {
      font-size: 16px;
      margin-bottom: 6px;
      color: var(--text);
    }

    .schedule-content p {
      font-size: 14px;
      color: var(--text-muted);
      line-height: 1.5;
    }

    .schedule-hint {
      display: inline-block;
      background: rgba(59, 130, 246, 0.15);
      color: var(--primary);
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
      margin-top: 6px;
    }

    .schedule-note {
      text-align: center;
      margin-top: 24px;
      padding: 16px;
      background: var(--bg-card);
      border-radius: 12px;
      max-width: 500px;
      margin-left: auto;
      margin-right: auto;
    }

    .schedule-note p {
      color: var(--text-muted);
      font-size: 14px;
    }

    .schedule-note strong {
      color: var(--secondary);
    }

    /* Pricing Section */
    .pricing {
      background: linear-gradient(180deg, var(--bg-dark) 0%, #0a1628 100%);
    }

    .pricing-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 24px;
      max-width: 700px;
      margin: 0 auto;
    }

    .pricing-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 32px;
      text-align: center;
    }

    .pricing-card.featured {
      border-color: var(--primary);
      position: relative;
    }

    .pricing-card.featured::before {
      content: '추천';
      position: absolute;
      top: -12px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--primary);
      color: white;
      padding: 4px 16px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }

    .pricing-card .plan-icon {
      font-size: 40px;
      margin-bottom: 16px;
    }

    .pricing-card h3 {
      font-size: 24px;
      margin-bottom: 8px;
    }

    .pricing-card .price {
      font-size: 36px;
      font-weight: 700;
      margin-bottom: 8px;
    }

    .pricing-card .price span {
      font-size: 16px;
      color: var(--text-muted);
      font-weight: 400;
    }

    .pricing-card .note {
      font-size: 13px;
      color: var(--text-dim);
      margin-bottom: 24px;
    }

    .pricing-card ul {
      list-style: none;
      text-align: left;
      margin-bottom: 24px;
    }

    .pricing-card li {
      padding: 8px 0;
      font-size: 14px;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .pricing-card li .check {
      color: var(--secondary);
    }

    .pricing-card .btn {
      width: 100%;
    }

    .pricing-hint {
      text-align: center;
      margin-top: 32px;
      padding: 16px;
      background: var(--bg-card);
      border-radius: 12px;
      max-width: 500px;
      margin-left: auto;
      margin-right: auto;
    }

    .pricing-hint p {
      color: var(--text-muted);
      font-size: 14px;
    }

    /* FAQ Section */
    .faq {
      background: var(--bg-dark);
    }

    .faq-list {
      max-width: 700px;
      margin: 0 auto;
    }

    .faq-item {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 12px;
      margin-bottom: 16px;
      overflow: hidden;
    }

    .faq-question {
      padding: 20px 24px;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 600;
      font-size: 16px;
    }

    .faq-question:hover {
      background: var(--bg-card-hover);
    }

    .faq-toggle {
      color: var(--text-muted);
      transition: transform 0.2s;
    }

    .faq-item.open .faq-toggle {
      transform: rotate(180deg);
    }

    .faq-answer {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.3s ease;
    }

    .faq-item.open .faq-answer {
      max-height: 500px;
    }

    .faq-answer-content {
      padding: 0 24px 20px;
      color: var(--text-muted);
      font-size: 15px;
      line-height: 1.7;
    }

    /* CTA Section */
    .cta-section {
      background: linear-gradient(180deg, var(--bg-dark) 0%, #0a1628 50%, var(--bg-dark) 100%);
      text-align: center;
    }

    .cta-section h2 {
      font-size: 36px;
      margin-bottom: 16px;
    }

    .cta-section p {
      color: var(--text-muted);
      font-size: 18px;
      margin-bottom: 32px;
    }

    /* Footer */
    footer {
      background: var(--bg-dark);
      border-top: 1px solid var(--border);
      padding: 40px 20px;
    }

    .footer-content {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 20px;
    }

    .footer-logo {
      font-size: 18px;
      font-weight: 700;
      color: var(--text);
    }

    .footer-links {
      display: flex;
      gap: 24px;
    }

    .footer-links a {
      color: var(--text-muted);
      text-decoration: none;
      font-size: 14px;
    }

    .footer-links a:hover {
      color: var(--text);
    }

    .footer-copy {
      color: var(--text-dim);
      font-size: 13px;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .nav-links {
        display: none;
      }

      .hero h1 {
        font-size: 32px;
      }

      .hero p {
        font-size: 16px;
      }

      .hero-cta {
        flex-direction: column;
        align-items: center;
      }

      .hero-features {
        flex-direction: column;
        gap: 12px;
      }

      .section-title h2 {
        font-size: 28px;
      }

      .workflow-steps {
        flex-direction: column;
      }

      .workflow-arrow {
        transform: rotate(90deg);
      }

      .footer-content {
        flex-direction: column;
        text-align: center;
      }
    }

    /* Animations */
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .animate-fade-in {
      animation: fadeIn 0.6s ease forwards;
    }

    .delay-1 { animation-delay: 0.1s; }
    .delay-2 { animation-delay: 0.2s; }
    .delay-3 { animation-delay: 0.3s; }
  </style>
</head>
<body>
  <!-- Navigation -->
  <nav>
    <div class="nav-container">
      <a href="/" class="logo">
        <span>🎬</span> Autonomey
      </a>
      <div class="nav-links">
        <a href="#features">기능</a>
        <a href="#pricing">요금</a>
        <a href="#faq">FAQ</a>
      </div>
      <div class="nav-cta">
        <a href="/login" class="btn btn-ghost">로그인</a>
        <a href="/login" class="btn btn-primary">무료로 시작</a>
      </div>
    </div>
  </nav>

  <!-- Hero Section -->
  <section class="hero">
    <div class="container">
      <div class="hero-content">
        <div class="hero-badge">🚀 Beta - 무료로 사용해보세요</div>
        <h1>
          댓글 하나하나 답하느라<br>
          <span>영상 만들 시간이 없으신가요?</span>
        </h1>
        <p>
          AI가 당신의 채널 톤에 맞춰<br>
          댓글에 자동으로 응답합니다.
        </p>
        <div class="hero-cta">
          <a href="/login" class="btn btn-primary btn-large">무료로 시작하기</a>
          <a href="#demo" class="btn btn-ghost btn-large">데모 보기</a>
        </div>
        <div class="hero-features">
          <span><span class="check">✓</span> Beta 기간 무료</span>
          <span><span class="check">✓</span> 신용카드 불필요</span>
          <span><span class="check">✓</span> 5분 안에 설정 완료</span>
        </div>
      </div>
    </div>
  </section>

  <!-- Problem Section -->
  <section class="problem">
    <div class="container">
      <div class="section-title">
        <h2>💬 유튜버의 숨겨진 고민</h2>
        <p>구독자가 늘수록 커지는 댓글 관리 부담</p>
      </div>
      <div class="problem-cards">
        <div class="problem-card">
          <div class="icon">😩</div>
          <h3>댓글 폭주</h3>
          <p>구독자가 늘수록<br>감당할 수 없는 댓글 양</p>
        </div>
        <div class="problem-card">
          <div class="icon">⏰</div>
          <h3>시간 부족</h3>
          <p>영상 편집하기도 바쁜데<br>댓글까지 신경 쓸 여유가...</p>
        </div>
        <div class="problem-card">
          <div class="icon">😔</div>
          <h3>팬 이탈</h3>
          <p>답변 없으면 팬이 떠나고<br>채널 성장이 멈춘다</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Solution Section -->
  <section class="solution" id="demo">
    <div class="container">
      <div class="section-title">
        <h2>🤖 AI가 당신처럼 답합니다</h2>
        <p>당신의 말투와 채널 컨셉을 학습해서 진짜 당신처럼 응답합니다</p>
      </div>
      <div class="solution-demo">
        <div class="demo-card">
          <div class="demo-header">
            <div class="demo-dots">
              <span class="demo-dot red"></span>
              <span class="demo-dot yellow"></span>
              <span class="demo-dot green"></span>
            </div>
            <span class="demo-title">YouTube 댓글</span>
          </div>
          <div class="demo-content">
            <div class="demo-comment">
              <div class="demo-comment-header">
                <div class="demo-avatar">👤</div>
                <span class="demo-author">열정적인시청자</span>
              </div>
              <p class="demo-text">이 영상 진짜 도움됐어요! 감사합니다 ㅎㅎ</p>
            </div>

            <div class="demo-arrow">↓ AI 자동 분류</div>
            <div class="demo-classification">✓ 긍정 댓글</div>

            <div class="demo-reply">
              <div class="demo-reply-header">
                <div class="demo-reply-avatar">🤖</div>
                <span class="demo-author">AI 자동 응답</span>
                <span class="demo-reply-label">검토 후 게시</span>
              </div>
              <p class="demo-text">시청해주셔서 감사해요! 😊 도움이 됐다니 정말 뿌듯합니다. 다음 영상도 기대해주세요!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Steps Section -->
  <section class="steps">
    <div class="container">
      <div class="section-title">
        <h2>⚡ 3단계로 끝나는 설정</h2>
        <p>복잡한 설정 없이 바로 시작하세요</p>
      </div>
      <div class="steps-list">
        <div class="step">
          <div class="step-number">1</div>
          <div class="step-content">
            <h3>회원가입 & API Key 설정</h3>
            <p>OpenRouter API Key만 있으면 OK</p>
            <span class="hint">💡 무료 크레딧으로 시작 가능</span>
          </div>
        </div>
        <div class="step">
          <div class="step-number">2</div>
          <div class="step-content">
            <h3>YouTube 채널 연동</h3>
            <p>OAuth로 안전하게 연결, 여러 채널 동시 관리 가능</p>
          </div>
        </div>
        <div class="step">
          <div class="step-number">3</div>
          <div class="step-content">
            <h3>응답 스타일 설정</h3>
            <p>댓글 유형별 톤앤매너 커스텀, 자동/수동 승인 선택</p>
          </div>
        </div>
      </div>
      <div style="text-align: center; margin-top: 40px;">
        <a href="/login" class="btn btn-primary btn-large">지금 시작하기</a>
      </div>
    </div>
  </section>

  <!-- Features Section -->
  <section class="features" id="features">
    <div class="container">
      <div class="section-title">
        <h2>🏷️ AI 자동 분류</h2>
        <p>댓글을 6가지 유형으로 자동 분류하고 맞춤 응답을 생성합니다</p>
      </div>
      <div class="feature-grid">
        <div class="feature-card">
          <span class="badge positive">긍정</span>
          <h4>칭찬, 응원 댓글</h4>
          <p>→ 진심어린 감사 표현</p>
        </div>
        <div class="feature-card">
          <span class="badge negative">부정</span>
          <h4>비난, 악플</h4>
          <p>→ 품위있게 대응</p>
        </div>
        <div class="feature-card">
          <span class="badge question">질문</span>
          <h4>궁금한 점</h4>
          <p>→ 친절한 정보 제공</p>
        </div>
        <div class="feature-card">
          <span class="badge suggestion">제안</span>
          <h4>콘텐츠 요청</h4>
          <p>→ 공감 + 검토 약속</p>
        </div>
        <div class="feature-card">
          <span class="badge reaction">반응</span>
          <h4>단순 반응 (ㅋㅋ, 와)</h4>
          <p>→ 가볍게 호응</p>
        </div>
        <div class="feature-card">
          <span class="badge other">기타</span>
          <h4>기타 댓글</h4>
          <p>→ 친근하게 응대</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Workflow Section -->
  <section class="workflow">
    <div class="container">
      <div class="section-title">
        <h2>🔄 이렇게 작동합니다</h2>
      </div>
      <div class="workflow-steps">
        <div class="workflow-step">
          <div class="workflow-icon">📥</div>
          <p>댓글 가져오기</p>
        </div>
        <span class="workflow-arrow">→</span>
        <div class="workflow-step">
          <div class="workflow-icon">🏷️</div>
          <p>AI 자동 분류</p>
        </div>
        <span class="workflow-arrow">→</span>
        <div class="workflow-step">
          <div class="workflow-icon">✍️</div>
          <p>맞춤 응답 생성</p>
        </div>
        <span class="workflow-arrow">→</span>
        <div class="workflow-step">
          <div class="workflow-icon">✅</div>
          <p>검토 & 승인</p>
        </div>
        <span class="workflow-arrow">→</span>
        <div class="workflow-step">
          <div class="workflow-icon">📤</div>
          <p>YouTube 게시</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Schedule Section -->
  <section class="schedule" id="schedule">
    <div class="container">
      <div class="section-title">
        <h2>⏰ 자동화 스케줄</h2>
        <p>설정만 해두면 자동으로 댓글을 관리합니다</p>
      </div>
      <div class="schedule-timeline">
        <div class="schedule-item">
          <div class="schedule-time">매 시간</div>
          <div class="schedule-content">
            <h4>📥 댓글 수집 + 🏷️ AI 분류 + ✍️ 응답 생성</h4>
            <p>새로운 댓글을 자동으로 가져와서 AI가 유형 분류 후 맞춤 응답을 생성합니다</p>
          </div>
        </div>
        <div class="schedule-item">
          <div class="schedule-time">설정한 시간</div>
          <div class="schedule-content">
            <h4>📤 자동 게시</h4>
            <p>지정한 시간에 생성된 응답을 YouTube에 자동 게시합니다<br>
            <span class="schedule-hint">예: 09:00, 14:00, 21:00 하루 3회</span></p>
          </div>
        </div>
        <div class="schedule-item">
          <div class="schedule-time">야간 정지</div>
          <div class="schedule-content">
            <h4>🌙 휴식 시간 설정</h4>
            <p>밤 시간대(예: 23:00~07:00)에는 자동 게시를 일시 정지할 수 있습니다</p>
          </div>
        </div>
      </div>
      <div class="schedule-note">
        <p>💡 <strong>검토 후 게시 모드</strong>: 자동 게시 없이 직접 확인 후 승인하는 것도 가능해요</p>
      </div>
    </div>
  </section>

  <!-- Pricing Section -->
  <section class="pricing" id="pricing">
    <div class="container">
      <div class="section-title">
        <h2>💰 심플한 요금제</h2>
        <p>Beta 기간 무료, 정식 출시 후 월 1,900원</p>
      </div>
      <div class="pricing-cards">
        <div class="pricing-card featured">
          <div class="plan-icon">🎉</div>
          <h3>Beta (현재)</h3>
          <div class="price">₩0<span>/월</span></div>
          <div class="note">Beta 기간 한정 무료</div>
          <ul>
            <li><span class="check">✓</span> 무제한 채널 연동</li>
            <li><span class="check">✓</span> 무제한 댓글 처리</li>
            <li><span class="check">✓</span> AI 자동 분류</li>
            <li><span class="check">✓</span> AI 응답 생성</li>
            <li><span class="check">✓</span> 검토 후 게시</li>
            <li><span class="check">✓</span> 분류별 응답 커스텀</li>
          </ul>
          <a href="/login" class="btn btn-primary">무료로 시작</a>
        </div>
        <div class="pricing-card">
          <div class="plan-icon">🚀</div>
          <h3>정식 버전</h3>
          <div class="price">₩1,900<span>/월</span></div>
          <div class="note">정식 출시 후 적용 예정</div>
          <ul>
            <li><span class="check">✓</span> Beta 전체 기능</li>
            <li><span class="check">✓</span> 자동 스케줄링</li>
            <li><span class="check">✓</span> 분석 대시보드</li>
            <li><span class="check">✓</span> 우선 기술 지원</li>
            <li><span class="check">✓</span> 신규 기능 우선 제공</li>
            <li><span class="check">✓</span> Beta 유저 할인 혜택</li>
          </ul>
          <button class="btn btn-ghost" disabled>출시 알림받기</button>
        </div>
      </div>
      <div class="pricing-hint">
        <p>💡 AI 비용은 본인의 OpenRouter API Key로 직접 관리 (댓글 1,000개 처리 시 약 $0.5)</p>
      </div>
    </div>
  </section>

  <!-- FAQ Section -->
  <section class="faq" id="faq">
    <div class="container">
      <div class="section-title">
        <h2>❓ 자주 묻는 질문</h2>
      </div>
      <div class="faq-list">
        <div class="faq-item">
          <div class="faq-question">
            API Key는 어떻게 발급받나요?
            <span class="faq-toggle">▼</span>
          </div>
          <div class="faq-answer">
            <div class="faq-answer-content">
              OpenRouter (openrouter.ai)에서 무료 가입 후 API Key를 발급받으시면 됩니다.
              가입 시 무료 크레딧도 제공되어 바로 시작할 수 있습니다!
            </div>
          </div>
        </div>
        <div class="faq-item">
          <div class="faq-question">
            내 채널 정보가 안전한가요?
            <span class="faq-toggle">▼</span>
          </div>
          <div class="faq-answer">
            <div class="faq-answer-content">
              YouTube OAuth 2.0으로 안전하게 연동됩니다. 비밀번호를 저장하지 않으며,
              언제든 Google 계정 설정에서 연동을 해제할 수 있습니다.
            </div>
          </div>
        </div>
        <div class="faq-item">
          <div class="faq-question">
            AI 응답이 마음에 안 들면요?
            <span class="faq-toggle">▼</span>
          </div>
          <div class="faq-answer">
            <div class="faq-answer-content">
              검토 후 게시 기능으로 응답을 확인/수정한 뒤 승인할 수 있습니다.
              마음에 안 드는 응답은 삭제하거나 직접 수정하세요.
            </div>
          </div>
        </div>
        <div class="faq-item">
          <div class="faq-question">
            여러 채널을 운영하는데요?
            <span class="faq-toggle">▼</span>
          </div>
          <div class="faq-answer">
            <div class="faq-answer-content">
              여러 채널을 연동하고 각 채널별로 다른 응답 스타일을 설정할 수 있습니다.
            </div>
          </div>
        </div>
        <div class="faq-item">
          <div class="faq-question">
            나중에 유료로 바뀌나요?
            <span class="faq-toggle">▼</span>
          </div>
          <div class="faq-answer">
            <div class="faq-answer-content">
              네, 정식 출시 후 월 1,900원이 적용될 예정입니다.
              Beta 기간에 가입하신 분들께는 할인 혜택을 드릴 계획이에요!
            </div>
          </div>
        </div>
        <div class="faq-item">
          <div class="faq-question">
            악플에도 자동으로 답하나요?
            <span class="faq-toggle">▼</span>
          </div>
          <div class="faq-answer">
            <div class="faq-answer-content">
              댓글 유형별로 자동응답 ON/OFF를 설정할 수 있어요.
              부정 댓글은 OFF로 두고 직접 대응하셔도 됩니다.
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- CTA Section -->
  <section class="cta-section">
    <div class="container">
      <h2>🚀 지금 바로 시작하세요</h2>
      <p>댓글 관리에 쓰던 시간,<br>이제 더 좋은 영상 만드는 데 쓰세요.</p>
      <a href="/login" class="btn btn-primary btn-large">무료로 시작하기</a>
    </div>
  </section>

  <!-- Footer -->
  <footer>
    <div class="footer-content">
      <div class="footer-logo">🎬 Autonomey</div>
      <div class="footer-links">
        <a href="#">이용약관</a>
        <a href="#">개인정보처리방침</a>
        <a href="#">문의하기</a>
      </div>
      <div class="footer-copy">
        © 2025 Autonomey. All rights reserved.<br>
        <a href="https://www.youtube.com/@AI%EC%9E%A1%EB%8F%8C%EC%9D%B4" target="_blank" rel="noopener" style="color: #555; font-size: 12px; text-decoration: none; transition: color 0.2s;">Made with ❤️ by <span style="color: #ef4444;">AI잡돌이</span></a>
      </div>
    </div>
  </footer>

  <script>
    // FAQ Toggle
    document.querySelectorAll('.faq-question').forEach(question => {
      question.addEventListener('click', () => {
        const item = question.parentElement;
        item.classList.toggle('open');
      });
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  </script>
</body>
</html>`
}
