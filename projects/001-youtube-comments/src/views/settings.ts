/**
 * 유저 설정 페이지 HTML 렌더링
 */

import type { User, Channel } from '../types'

interface SettingsProps {
  user: User
  userChannels: Channel[]
}

export function renderSettings(props: SettingsProps): string {
  const { user, userChannels } = props
  const hasApiKey = !!user.openrouterApiKey
  const maskedKey = hasApiKey
    ? user.openrouterApiKey!.slice(0, 8) + '...' + user.openrouterApiKey!.slice(-4)
    : ''

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>설정 - Autonomey</title>
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
      padding: 20px;
    }

    .container {
      max-width: 600px;
      margin: 0 auto;
    }

    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 1px solid #333;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .channel-selector {
      position: relative;
    }

    .channel-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 8px;
      color: #fff;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s;
      min-width: 180px;
    }

    .channel-btn:hover {
      background: #222;
      border-color: #444;
    }

    .channel-btn .icon {
      font-size: 18px;
    }

    .channel-btn .arrow {
      margin-left: auto;
      font-size: 12px;
      color: #888;
    }

    .channel-dropdown {
      position: absolute;
      top: calc(100% + 8px);
      left: 0;
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 8px;
      min-width: 220px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.4);
      z-index: 1000;
      display: none;
      overflow: hidden;
    }

    .channel-dropdown.show {
      display: block;
    }

    .dropdown-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      color: #fff;
      text-decoration: none;
      transition: background 0.15s;
      font-size: 14px;
    }

    .dropdown-item:hover {
      background: #222;
    }

    .dropdown-item.add-new {
      border-top: 1px solid #333;
      color: #3b82f6;
    }

    .dropdown-item.add-new:hover {
      background: #172554;
    }

    .dropdown-item .channel-icon {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #333;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
    }

    .dropdown-item .channel-name {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .nav-link {
      color: #888;
      text-decoration: none;
      font-size: 14px;
      padding: 8px 12px;
      border-radius: 6px;
      transition: all 0.2s;
    }

    .nav-link:hover {
      color: #fff;
      background: #222;
    }

    .nav-link.active {
      color: #3b82f6;
      background: #172554;
    }

    h1 {
      font-size: 24px;
    }

    .btn {
      padding: 10px 16px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }

    .btn-danger {
      background: transparent;
      color: #888;
      border: 1px solid #333;
    }

    .btn-danger:hover {
      background: #7f1d1d;
      color: #fca5a5;
      border-color: #7f1d1d;
    }

    /* 섹션 스타일 */
    .settings-section {
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 20px;
    }

    .settings-section h2 {
      font-size: 18px;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .settings-section .description {
      color: #888;
      font-size: 14px;
      margin-bottom: 20px;
      line-height: 1.5;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group:last-child {
      margin-bottom: 0;
    }

    label {
      display: block;
      font-size: 14px;
      color: #888;
      margin-bottom: 8px;
    }

    input[type="text"],
    input[type="password"],
    input[type="email"] {
      width: 100%;
      padding: 14px 16px;
      border: 1px solid #333;
      border-radius: 8px;
      background: #0f0f0f;
      color: #fff;
      font-size: 14px;
      font-family: monospace;
      transition: border-color 0.2s;
    }

    input:focus {
      outline: none;
      border-color: #3b82f6;
    }

    input::placeholder {
      color: #555;
    }

    .input-group {
      display: flex;
      gap: 10px;
    }

    .input-group input {
      flex: 1;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover {
      background: #2563eb;
    }

    .btn-secondary {
      background: #333;
      color: #fff;
    }

    .btn-secondary:hover {
      background: #444;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    /* 현재 상태 표시 */
    .current-value {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: #222;
      border-radius: 8px;
      margin-bottom: 16px;
    }

    .current-value .value {
      font-family: monospace;
      color: #10b981;
    }

    .current-value .value.none {
      color: #f59e0b;
    }

    .current-value .actions {
      display: flex;
      gap: 8px;
    }

    .btn-sm {
      padding: 6px 12px;
      font-size: 12px;
    }

    .btn-text {
      background: transparent;
      color: #3b82f6;
      padding: 6px 12px;
    }

    .btn-text:hover {
      background: #1e3a5f;
    }

    .btn-text.danger {
      color: #ef4444;
    }

    .btn-text.danger:hover {
      background: #450a0a;
    }

    /* 숨김 폼 */
    .hidden-form {
      display: none;
      padding-top: 16px;
      border-top: 1px solid #333;
      margin-top: 16px;
    }

    .hidden-form.show {
      display: block;
    }

    /* 도움말 링크 */
    .help-link {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 16px;
      background: #172554;
      border: 1px solid #1e3a5f;
      border-radius: 8px;
      margin-top: 16px;
      text-decoration: none;
      color: #93c5fd;
      font-size: 14px;
      transition: all 0.2s;
    }

    .help-link:hover {
      background: #1e3a5f;
    }

    /* 프로필 섹션 */
    .profile-info {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .profile-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #333;
    }

    .profile-row:last-child {
      border-bottom: none;
    }

    .profile-row .label {
      color: #888;
      font-size: 14px;
    }

    .profile-row .value {
      font-size: 14px;
    }

    /* 토스트 */
    .toast {
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 15px 20px;
      border-radius: 8px;
      color: white;
      font-weight: 500;
      transform: translateY(100px);
      opacity: 0;
      transition: all 0.3s;
      z-index: 1000;
    }

    .toast.show {
      transform: translateY(0);
      opacity: 1;
    }

    .toast.success { background: #10b981; }
    .toast.error { background: #ef4444; }

    .site-footer {
      margin-top: 60px;
      padding: 20px 0;
      border-top: 1px solid #333;
      text-align: center;
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

    /* 로딩 */
    .loading {
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 2px solid #ffffff40;
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-right: 6px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="header-left">
        <div class="channel-selector">
          <button class="channel-btn" onclick="toggleChannelDropdown()">
            <span class="icon">📺</span>
            <span>채널 선택</span>
            <span class="arrow">▼</span>
          </button>
          <div class="channel-dropdown" id="channelDropdown">
            ${userChannels.map(ch => `
              <a href="/channels/${ch.id}" class="dropdown-item">
                <span class="channel-icon">📺</span>
                <span class="channel-name">${escapeHtml(ch.youtube.channelTitle)}</span>
              </a>
            `).join('')}
            <a href="/oauth/start" class="dropdown-item add-new">
              <span class="channel-icon">➕</span>
              <span>새 채널 추가</span>
            </a>
          </div>
        </div>
      </div>
      <div class="header-right">
        <a href="/channels" class="nav-link">📋 채널 목록</a>
        <a href="/settings" class="nav-link active">⚙️ 계정 설정</a>
        <button onclick="logout()" class="btn btn-danger">🚪 로그아웃</button>
      </div>
    </header>

    <h1 style="margin-bottom: 8px;">⚙️ 계정 설정</h1>
    <p style="color: #888; font-size: 14px; margin-bottom: 30px;">
      AI API Key와 프로필을 관리합니다. 채널별 응답 지침은 각 채널 대시보드에서 설정하세요.
    </p>

    <!-- OpenRouter API Key 섹션 -->
    <div class="settings-section">
      <h2>🔑 OpenRouter API Key</h2>
      <p class="description">
        AI 분류 및 응답 생성 기능을 사용하려면 OpenRouter API Key가 필요합니다.<br>
        API Key 없이도 댓글 수집 및 게시 기능은 사용할 수 있습니다.
      </p>

      <div class="current-value">
        <div>
          <span style="color: #888; font-size: 13px;">현재 설정:</span>
          <span class="value ${hasApiKey ? '' : 'none'}" id="currentKeyDisplay">
            ${hasApiKey ? maskedKey : '설정되지 않음'}
          </span>
        </div>
        <div class="actions">
          ${hasApiKey ? `
            <button class="btn btn-sm btn-text" onclick="toggleApiKeyForm()">변경</button>
            <button class="btn btn-sm btn-text danger" onclick="removeApiKey()">삭제</button>
          ` : `
            <button class="btn btn-sm btn-primary" onclick="toggleApiKeyForm()">설정하기</button>
          `}
        </div>
      </div>

      <div class="hidden-form" id="apiKeyForm">
        <div class="form-group">
          <label for="apiKey">새 API Key</label>
          <div class="input-group">
            <input
              type="password"
              id="apiKey"
              placeholder="sk-or-v1-..."
              autocomplete="off"
            >
            <button class="btn btn-secondary" type="button" onclick="toggleKeyVisibility()">👁</button>
          </div>
        </div>
        <div style="display: flex; gap: 10px;">
          <button class="btn btn-primary" onclick="saveApiKey()" id="saveKeyBtn">
            저장
          </button>
          <button class="btn btn-secondary" onclick="toggleApiKeyForm()">취소</button>
        </div>
      </div>

      <a href="https://openrouter.ai/keys" target="_blank" class="help-link">
        <span>🔗</span>
        <span>OpenRouter에서 API Key 발급받기 →</span>
      </a>
    </div>

    <!-- 프로필 섹션 -->
    <div class="settings-section">
      <h2>👤 내 프로필</h2>
      <div class="profile-info">
        <div class="profile-row">
          <span class="label">이름</span>
          <span class="value">${escapeHtml(user.name)}</span>
        </div>
        <div class="profile-row">
          <span class="label">이메일</span>
          <span class="value">${escapeHtml(user.email)}</span>
        </div>
        <div class="profile-row">
          <span class="label">가입일</span>
          <span class="value">${formatDate(user.createdAt)}</span>
        </div>
      </div>
    </div>

    <!-- 비밀번호 변경 섹션 -->
    <div class="settings-section">
      <h2>🔒 비밀번호 변경</h2>
      <p class="description">계정 보안을 위해 주기적으로 비밀번호를 변경하세요.</p>

      <button class="btn btn-secondary" onclick="togglePasswordForm()" id="changePasswordToggle">
        비밀번호 변경하기
      </button>

      <div class="hidden-form" id="passwordForm">
        <div class="form-group">
          <label for="currentPassword">현재 비밀번호</label>
          <input type="password" id="currentPassword" placeholder="현재 비밀번호">
        </div>
        <div class="form-group">
          <label for="newPassword">새 비밀번호</label>
          <input type="password" id="newPassword" placeholder="6자 이상">
        </div>
        <div class="form-group">
          <label for="confirmPassword">새 비밀번호 확인</label>
          <input type="password" id="confirmPassword" placeholder="새 비밀번호 다시 입력">
        </div>
        <div style="display: flex; gap: 10px;">
          <button class="btn btn-primary" onclick="changePassword()" id="changePasswordBtn">
            변경하기
          </button>
          <button class="btn btn-secondary" onclick="togglePasswordForm()">취소</button>
        </div>
      </div>
    </div>

    <footer class="site-footer">
      <div class="footer-copy">
        © 2025 Autonomey. All rights reserved.<br>
        <a href="https://www.youtube.com/@AI%EC%9E%A1%EB%8F%8C%EC%9D%B4" target="_blank" rel="noopener">Made with ❤️ by <span>AI잡돌이</span></a>
      </div>
    </footer>
  </div>

  <div class="toast" id="toast"></div>

  <script>
    // 채널 드롭다운 토글
    function toggleChannelDropdown() {
      const dropdown = document.getElementById('channelDropdown');
      dropdown.classList.toggle('show');
    }

    // 드롭다운 외부 클릭 시 닫기
    document.addEventListener('click', (e) => {
      const dropdown = document.getElementById('channelDropdown');
      const btn = e.target.closest('.channel-btn');
      if (!btn && dropdown.classList.contains('show')) {
        dropdown.classList.remove('show');
      }
    });

    // API 호출 헬퍼
    async function apiCall(url, options = {}) {
      const token = localStorage.getItem('token');
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json'
        }
      });
    }

    function toggleApiKeyForm() {
      const form = document.getElementById('apiKeyForm');
      form.classList.toggle('show');
      if (form.classList.contains('show')) {
        document.getElementById('apiKey').focus();
      }
    }

    function toggleKeyVisibility() {
      const input = document.getElementById('apiKey');
      input.type = input.type === 'password' ? 'text' : 'password';
    }

    async function saveApiKey() {
      const btn = document.getElementById('saveKeyBtn');
      const apiKey = document.getElementById('apiKey').value.trim();

      if (!apiKey) {
        showToast('API Key를 입력해주세요', 'error');
        return;
      }

      if (!apiKey.startsWith('sk-or-')) {
        showToast('올바른 OpenRouter API Key 형식이 아닙니다', 'error');
        return;
      }

      btn.disabled = true;
      btn.innerHTML = '<span class="loading"></span>저장 중...';

      try {
        const res = await apiCall('/api/user/apikey', {
          method: 'PUT',
          body: JSON.stringify({ apiKey })
        });

        const data = await res.json();

        if (data.success) {
          showToast('API Key가 저장되었습니다', 'success');
          setTimeout(() => location.reload(), 1000);
        } else {
          showToast(data.error || '저장에 실패했습니다', 'error');
        }
      } catch (err) {
        showToast('네트워크 오류가 발생했습니다', 'error');
      } finally {
        btn.disabled = false;
        btn.innerHTML = '저장';
      }
    }

    async function removeApiKey() {
      if (!confirm('API Key를 삭제하시겠습니까?\\nAI 분류 및 응답 생성 기능을 사용할 수 없게 됩니다.')) {
        return;
      }

      try {
        const res = await apiCall('/api/user/apikey', {
          method: 'DELETE'
        });

        const data = await res.json();

        if (data.success) {
          showToast('API Key가 삭제되었습니다', 'success');
          setTimeout(() => location.reload(), 1000);
        } else {
          showToast(data.error || '삭제에 실패했습니다', 'error');
        }
      } catch (err) {
        showToast('네트워크 오류가 발생했습니다', 'error');
      }
    }

    function togglePasswordForm() {
      const form = document.getElementById('passwordForm');
      const toggle = document.getElementById('changePasswordToggle');
      form.classList.toggle('show');
      toggle.style.display = form.classList.contains('show') ? 'none' : 'block';
    }

    async function changePassword() {
      const btn = document.getElementById('changePasswordBtn');
      const currentPassword = document.getElementById('currentPassword').value;
      const newPassword = document.getElementById('newPassword').value;
      const confirmPassword = document.getElementById('confirmPassword').value;

      if (!currentPassword || !newPassword || !confirmPassword) {
        showToast('모든 필드를 입력해주세요', 'error');
        return;
      }

      if (newPassword.length < 6) {
        showToast('새 비밀번호는 6자 이상이어야 합니다', 'error');
        return;
      }

      if (newPassword !== confirmPassword) {
        showToast('새 비밀번호가 일치하지 않습니다', 'error');
        return;
      }

      btn.disabled = true;
      btn.innerHTML = '<span class="loading"></span>변경 중...';

      try {
        const res = await apiCall('/api/user/password', {
          method: 'PUT',
          body: JSON.stringify({ currentPassword, newPassword })
        });

        const data = await res.json();

        if (data.success) {
          showToast('비밀번호가 변경되었습니다', 'success');
          document.getElementById('currentPassword').value = '';
          document.getElementById('newPassword').value = '';
          document.getElementById('confirmPassword').value = '';
          togglePasswordForm();
        } else {
          showToast(data.error || '변경에 실패했습니다', 'error');
        }
      } catch (err) {
        showToast('네트워크 오류가 발생했습니다', 'error');
      } finally {
        btn.disabled = false;
        btn.innerHTML = '변경하기';
      }
    }

    function logout() {
      if (!confirm('로그아웃 하시겠습니까?')) return;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      document.cookie = 'token=; path=/; max-age=0';
      window.location.href = '/login';
    }

    function showToast(message, type) {
      const toast = document.getElementById('toast');
      toast.textContent = message;
      toast.className = 'toast ' + type + ' show';
      setTimeout(() => toast.classList.remove('show'), 3000);
    }
  </script>
</body>
</html>`
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function formatDate(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
