/**
 * 로그인 페이지 HTML 렌더링
 */

export function renderLogin(): string {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>로그인 - YouTube 댓글 봇</title>
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
      align-items: center;
      justify-content: center;
    }

    .login-container {
      background: #1a1a1a;
      border-radius: 16px;
      padding: 40px;
      width: 100%;
      max-width: 400px;
      border: 1px solid #333;
    }

    h1 {
      text-align: center;
      margin-bottom: 30px;
      font-size: 24px;
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
      padding: 12px 16px;
      border: 1px solid #333;
      border-radius: 8px;
      background: #0f0f0f;
      color: #fff;
      font-size: 16px;
    }

    input:focus {
      outline: none;
      border-color: #3b82f6;
    }

    button {
      width: 100%;
      padding: 14px;
      border: none;
      border-radius: 8px;
      background: #3b82f6;
      color: white;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }

    button:hover {
      background: #2563eb;
    }

    .info {
      margin-top: 20px;
      padding: 15px;
      background: #1f2937;
      border-radius: 8px;
      font-size: 13px;
      color: #9ca3af;
    }

    .info p {
      margin-bottom: 8px;
    }

    .info code {
      background: #374151;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: monospace;
    }
  </style>
</head>
<body>
  <div class="login-container">
    <h1>🤖 YouTube 댓글 봇</h1>

    <form action="/" method="get">
      <div class="form-group">
        <label for="username">사용자명</label>
        <input type="text" id="username" name="username" placeholder="admin" required>
      </div>

      <div class="form-group">
        <label for="password">비밀번호</label>
        <input type="password" id="password" name="password" required>
      </div>

      <button type="submit" onclick="handleLogin(event)">로그인</button>
    </form>

    <div class="info">
      <p>Basic Auth로 보호된 페이지입니다.</p>
      <p>비밀번호는 <code>ADMIN_PASSWORD</code> 환경변수로 설정됩니다.</p>
    </div>
  </div>

  <script>
    function handleLogin(e) {
      e.preventDefault();

      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;

      // Basic Auth 헤더와 함께 대시보드로 이동
      const credentials = btoa(username + ':' + password);

      fetch('/', {
        headers: {
          'Authorization': 'Basic ' + credentials
        }
      }).then(res => {
        if (res.ok) {
          // 성공하면 Basic Auth로 다시 요청
          window.location.href = '/' + '?auth=' + credentials;
        } else {
          alert('로그인 실패: 사용자명 또는 비밀번호를 확인하세요');
        }
      }).catch(() => {
        // 그냥 리다이렉트 시도 (브라우저가 Basic Auth 프롬프트 표시)
        window.location.href = '/';
      });
    }
  </script>
</body>
</html>`
}
