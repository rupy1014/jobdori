/**
 * 로그인/회원가입 페이지 HTML 렌더링
 */

export function renderLogin(): string {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>로그인 - Autonomey</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0f0f0f;
      color: #fff;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .main-content {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      padding: 20px;
    }

    footer {
      width: 100%;
      padding: 20px;
      text-align: center;
      border-top: 1px solid #222;
    }

    .footer-copy {
      color: #555;
      font-size: 12px;
    }

    .footer-copy a {
      color: #555;
      text-decoration: none;
      transition: color 0.2s;
    }

    .footer-copy a:hover {
      color: #888;
    }

    .footer-copy a span {
      color: #ef4444;
    }

    .auth-container {
      background: #1a1a1a;
      border-radius: 16px;
      padding: 40px;
      width: 100%;
      max-width: 420px;
      border: 1px solid #333;
    }

    h1 {
      text-align: center;
      margin-bottom: 10px;
      font-size: 28px;
    }

    .subtitle {
      text-align: center;
      color: #888;
      margin-bottom: 30px;
      font-size: 14px;
    }

    .tabs {
      display: flex;
      margin-bottom: 30px;
      border-radius: 8px;
      background: #0f0f0f;
      padding: 4px;
    }

    .tab {
      flex: 1;
      padding: 12px;
      text-align: center;
      cursor: pointer;
      border-radius: 6px;
      transition: all 0.2s;
      font-weight: 500;
      color: #888;
    }

    .tab.active {
      background: #3b82f6;
      color: white;
    }

    .tab:hover:not(.active) {
      color: #fff;
    }

    .form-group {
      margin-bottom: 20px;
    }

    label {
      display: block;
      margin-bottom: 8px;
      font-size: 14px;
      color: #888;
    }

    input {
      width: 100%;
      padding: 14px 16px;
      border: 1px solid #333;
      border-radius: 8px;
      background: #0f0f0f;
      color: #fff;
      font-size: 16px;
      transition: border-color 0.2s;
    }

    input:focus {
      outline: none;
      border-color: #3b82f6;
    }

    input::placeholder {
      color: #555;
    }

    button[type="submit"] {
      width: 100%;
      padding: 14px;
      border: none;
      border-radius: 8px;
      background: #3b82f6;
      color: white;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      margin-top: 10px;
    }

    button[type="submit"]:hover {
      background: #2563eb;
      transform: translateY(-1px);
    }

    button[type="submit"]:disabled {
      background: #374151;
      cursor: not-allowed;
      transform: none;
    }

    .error-message {
      background: #7f1d1d;
      color: #fca5a5;
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 20px;
      font-size: 14px;
      display: none;
    }

    .success-message {
      background: #14532d;
      color: #86efac;
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 20px;
      font-size: 14px;
      display: none;
    }

    .divider {
      display: flex;
      align-items: center;
      margin: 25px 0;
    }

    .divider-line {
      flex: 1;
      height: 1px;
      background: #333;
    }

    .divider-text {
      padding: 0 15px;
      color: #666;
      font-size: 13px;
    }

    #signup-form {
      display: none;
    }

    .loading {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid #ffffff40;
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-right: 8px;
      vertical-align: middle;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="main-content">
  <div class="auth-container">
    <h1>Autonomey</h1>
    <p class="subtitle">YouTube 댓글 자동 응답 봇</p>

    <div class="tabs">
      <div class="tab active" onclick="showTab('login')">로그인</div>
      <div class="tab" onclick="showTab('signup')">회원가입</div>
    </div>

    <div id="error-message" class="error-message"></div>
    <div id="success-message" class="success-message"></div>

    <!-- 로그인 폼 -->
    <form id="login-form" onsubmit="handleLogin(event)">
      <div class="form-group">
        <label for="login-email">이메일</label>
        <input type="email" id="login-email" placeholder="your@email.com" required>
      </div>

      <div class="form-group">
        <label for="login-password">비밀번호</label>
        <input type="password" id="login-password" placeholder="비밀번호 입력" required>
      </div>

      <button type="submit" id="login-btn">로그인</button>
    </form>

    <!-- 회원가입 폼 -->
    <form id="signup-form" onsubmit="handleSignup(event)">
      <div class="form-group">
        <label for="signup-name">이름</label>
        <input type="text" id="signup-name" placeholder="홍길동" required>
      </div>

      <div class="form-group">
        <label for="signup-email">이메일</label>
        <input type="email" id="signup-email" placeholder="your@email.com" required>
      </div>

      <div class="form-group">
        <label for="signup-password">비밀번호</label>
        <input type="password" id="signup-password" placeholder="6자 이상" minlength="6" required>
      </div>

      <button type="submit" id="signup-btn">회원가입</button>
    </form>

  </div>
  </div>

  <footer>
    <div class="footer-copy">
      © 2025 Autonomey. All rights reserved.<br>
      <a href="https://www.youtube.com/@AI%EC%9E%A1%EB%8F%8C%EC%9D%B4" target="_blank" rel="noopener">Made with ❤️ by <span>AI잡돌이</span></a>
    </div>
  </footer>

  <script>
    function showTab(tab) {
      const loginForm = document.getElementById('login-form');
      const signupForm = document.getElementById('signup-form');
      const tabs = document.querySelectorAll('.tab');

      hideMessages();

      if (tab === 'login') {
        loginForm.style.display = 'block';
        signupForm.style.display = 'none';
        tabs[0].classList.add('active');
        tabs[1].classList.remove('active');
      } else {
        loginForm.style.display = 'none';
        signupForm.style.display = 'block';
        tabs[0].classList.remove('active');
        tabs[1].classList.add('active');
      }
    }

    function showError(message) {
      const el = document.getElementById('error-message');
      el.textContent = message;
      el.style.display = 'block';
      document.getElementById('success-message').style.display = 'none';
    }

    function showSuccess(message) {
      const el = document.getElementById('success-message');
      el.textContent = message;
      el.style.display = 'block';
      document.getElementById('error-message').style.display = 'none';
    }

    function hideMessages() {
      document.getElementById('error-message').style.display = 'none';
      document.getElementById('success-message').style.display = 'none';
    }

    function setLoading(buttonId, loading) {
      const btn = document.getElementById(buttonId);
      if (loading) {
        btn.disabled = true;
        btn.innerHTML = '<span class="loading"></span>처리 중...';
      } else {
        btn.disabled = false;
        btn.innerHTML = buttonId === 'login-btn' ? '로그인' : '회원가입';
      }
    }

    async function handleLogin(e) {
      e.preventDefault();
      hideMessages();

      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;

      setLoading('login-btn', true);

      try {
        const res = await fetch('/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (data.success && data.token) {
          // 토큰 저장
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));

          // 쿠키에도 저장 (대시보드 접근용)
          document.cookie = 'token=' + data.token + '; path=/; max-age=' + (7 * 24 * 60 * 60);

          showSuccess('로그인 성공! 채널 목록으로 이동합니다...');
          setTimeout(() => {
            window.location.href = '/channels';
          }, 1000);
        } else {
          showError(data.error || '로그인에 실패했습니다.');
        }
      } catch (err) {
        showError('서버 연결에 실패했습니다.');
      } finally {
        setLoading('login-btn', false);
      }
    }

    async function handleSignup(e) {
      e.preventDefault();
      hideMessages();

      const name = document.getElementById('signup-name').value;
      const email = document.getElementById('signup-email').value;
      const password = document.getElementById('signup-password').value;

      setLoading('signup-btn', true);

      try {
        const res = await fetch('/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password })
        });

        const data = await res.json();

        if (data.success && data.token) {
          // 토큰 저장
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));

          // 쿠키에도 저장
          document.cookie = 'token=' + data.token + '; path=/; max-age=' + (7 * 24 * 60 * 60);

          showSuccess('회원가입 성공! 채널 목록으로 이동합니다...');
          setTimeout(() => {
            window.location.href = '/channels';
          }, 1000);
        } else {
          showError(data.error || '회원가입에 실패했습니다.');
        }
      } catch (err) {
        showError('서버 연결에 실패했습니다.');
      } finally {
        setLoading('signup-btn', false);
      }
    }

    // 토큰 삭제 함수
    function clearTokens() {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      document.cookie = 'token=; path=/; max-age=0';
    }

    // 페이지 로드 시 기존 토큰 확인
    window.onload = function() {
      // URL에서 ?logout 파라미터 확인 (무한 루프 방지)
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('logout')) {
        // 로그아웃 요청 - 토큰 삭제하고 URL 정리
        clearTokens();
        window.history.replaceState({}, '', '/login');
        return;
      }

      const token = localStorage.getItem('token');
      if (token) {
        // 토큰이 있으면 유효한지 확인
        fetch('/auth/me', {
          headers: { 'Authorization': 'Bearer ' + token }
        }).then(res => res.json()).then(data => {
          if (data.success && data.user) {
            // 유효한 토큰 - 채널 목록으로 리다이렉트
            window.location.href = '/channels';
          } else {
            // 유효하지 않은 토큰 - 삭제
            clearTokens();
          }
        }).catch(() => {
          // 네트워크 오류 시에도 토큰 삭제
          clearTokens();
        });
      }
    };
  </script>
</body>
</html>`
}
