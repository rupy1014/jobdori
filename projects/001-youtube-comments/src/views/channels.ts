/**
 * 채널 선택 페이지 HTML 렌더링
 */

import type { Channel, User } from '../types'

interface ChannelWithStats extends Channel {
  stats?: {
    total: number
    unclassified: number
    pending: number
    generated: number
    replied: number
  }
}

export function renderChannelList(user: User, channels: ChannelWithStats[]): string {
  const hasApiKey = !!user.openrouterApiKey

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>내 채널 - Autonomey</title>
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
      max-width: 1000px;
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

    .header-left h1 {
      font-size: 24px;
      margin-bottom: 4px;
    }

    .header-left .welcome {
      color: #888;
      font-size: 14px;
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

    .btn-secondary {
      background: #333;
      color: #fff;
    }

    .btn-secondary:hover {
      background: #444;
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

    /* API Key 배너 */
    .api-key-banner {
      background: linear-gradient(135deg, #1e3a5f 0%, #172554 100%);
      border: 1px solid #3b82f6;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 30px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .api-key-banner.warning {
      background: linear-gradient(135deg, #422006 0%, #451a03 100%);
      border-color: #f59e0b;
    }

    .api-key-banner .message {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .api-key-banner .icon {
      font-size: 24px;
    }

    .api-key-banner .text h3 {
      font-size: 16px;
      margin-bottom: 4px;
    }

    .api-key-banner .text p {
      font-size: 13px;
      color: #94a3b8;
    }

    .api-key-banner.warning .text p {
      color: #fcd34d;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover {
      background: #2563eb;
    }

    /* 채널 그리드 */
    .section-title {
      font-size: 18px;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .channels-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }

    .channel-card {
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 12px;
      padding: 20px;
      transition: all 0.2s;
      cursor: pointer;
      text-decoration: none;
      color: inherit;
      display: block;
    }

    .channel-card:hover {
      border-color: #555;
      transform: translateY(-2px);
    }

    .channel-card.add-new {
      border: 2px dashed #333;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 180px;
      color: #666;
    }

    .channel-card.add-new:hover {
      border-color: #3b82f6;
      color: #3b82f6;
    }

    .channel-card.add-new .icon {
      font-size: 32px;
      margin-bottom: 10px;
    }

    .channel-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
    }

    .channel-info h3 {
      font-size: 16px;
      margin-bottom: 4px;
    }

    .channel-info .channel-id {
      font-size: 12px;
      color: #666;
      font-family: monospace;
    }

    .channel-status {
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
    }

    .channel-status.active {
      background: #052e16;
      color: #10b981;
    }

    .channel-status.inactive {
      background: #27272a;
      color: #71717a;
    }

    .channel-stats {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-bottom: 16px;
    }

    .stat-item {
      background: #222;
      padding: 10px;
      border-radius: 8px;
    }

    .stat-item .label {
      font-size: 11px;
      color: #666;
      margin-bottom: 4px;
    }

    .stat-item .value {
      font-size: 18px;
      font-weight: 600;
    }

    .stat-item .value.pending { color: #f59e0b; }
    .stat-item .value.generated { color: #3b82f6; }

    .channel-schedule {
      font-size: 12px;
      color: #666;
      padding-top: 12px;
      border-top: 1px solid #333;
    }

    .channel-schedule span {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    /* 빈 상태 */
    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #666;
    }

    .empty-state .icon {
      font-size: 48px;
      margin-bottom: 16px;
    }

    .empty-state h3 {
      font-size: 18px;
      color: #888;
      margin-bottom: 8px;
    }

    .empty-state p {
      margin-bottom: 20px;
    }

    /* 자동화 현황 */
    .automation-section {
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 12px;
      padding: 20px;
    }

    .automation-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .automation-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      background: #222;
      border-radius: 8px;
    }

    .automation-item .channel-name {
      font-weight: 500;
    }

    .automation-item .schedule-info {
      font-size: 13px;
      color: #888;
    }

    .automation-item .status-badge {
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 11px;
    }

    .automation-item .status-badge.running {
      background: #052e16;
      color: #10b981;
    }

    .automation-item .status-badge.paused {
      background: #422006;
      color: #f59e0b;
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

    /* 온보딩 가이드 */
    .onboarding-guide {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border: 1px solid #333;
      border-radius: 16px;
      padding: 32px;
      margin-bottom: 40px;
    }

    .onboarding-header {
      text-align: center;
      margin-bottom: 32px;
    }

    .onboarding-header h2 {
      font-size: 24px;
      margin-bottom: 8px;
    }

    .onboarding-header p {
      color: #888;
      font-size: 14px;
    }

    .onboarding-steps {
      display: flex;
      flex-direction: column;
      gap: 0;
      max-width: 500px;
      margin: 0 auto;
    }

    .step {
      display: flex;
      gap: 16px;
      padding: 20px;
      background: #1a1a1a;
      border-radius: 12px;
      border: 2px solid #333;
      transition: all 0.2s;
    }

    .step.current {
      border-color: #3b82f6;
      background: #172554;
    }

    .step.completed {
      border-color: #10b981;
      background: #052e16;
    }

    .step.disabled {
      opacity: 0.5;
    }

    .step-number {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #333;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 16px;
      flex-shrink: 0;
    }

    .step.current .step-number {
      background: #3b82f6;
    }

    .step.completed .step-number {
      background: #10b981;
    }

    .step-content {
      flex: 1;
    }

    .step-content h3 {
      font-size: 16px;
      margin-bottom: 4px;
    }

    .step-content p {
      font-size: 13px;
      color: #888;
      margin-bottom: 12px;
    }

    .step-done {
      color: #10b981;
      font-size: 13px;
      font-weight: 500;
    }

    .step-locked {
      color: #666;
      font-size: 13px;
    }

    .step-connector {
      width: 2px;
      height: 24px;
      background: #3b82f6;
      margin-left: 37px;
    }

    .step-connector.disabled {
      background: #333;
    }

    .btn-sm {
      padding: 8px 14px;
      font-size: 13px;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="header-left">
        <h1>Autonomey</h1>
        <p class="welcome">👋 ${escapeHtml(user.name)}님, 환영합니다</p>
      </div>
      <div class="header-right">
        <a href="/channels" class="nav-link active">📋 채널 목록</a>
        <a href="/settings" class="nav-link">⚙️ 계정 설정</a>
        <button onclick="logout()" class="btn btn-danger">🚪 로그아웃</button>
      </div>
    </header>

    ${!hasApiKey ? `
    <div class="api-key-banner warning">
      <div class="message">
        <span class="icon">⚠️</span>
        <div class="text">
          <h3>OpenRouter API Key가 설정되지 않았습니다</h3>
          <p>AI 분류 및 응답 생성 기능을 사용하려면 API Key를 설정해주세요. 댓글 수집/게시는 가능합니다.</p>
        </div>
      </div>
      <a href="/settings" class="btn btn-primary">API Key 설정하기</a>
    </div>
    ` : `
    <div class="api-key-banner">
      <div class="message">
        <span class="icon">✅</span>
        <div class="text">
          <h3>AI 기능 사용 가능</h3>
          <p>OpenRouter API Key가 설정되어 있습니다. 모든 기능을 사용할 수 있습니다.</p>
        </div>
      </div>
      <a href="/settings" class="btn btn-secondary">설정 변경</a>
    </div>
    `}

    <h2 class="section-title">📺 내 채널</h2>

    ${channels.length === 0 ? `
    <!-- 첫 방문 온보딩 가이드 -->
    <div class="onboarding-guide">
      <div class="onboarding-header">
        <h2>🚀 시작하기</h2>
        <p>3단계만 완료하면 YouTube 댓글 자동 응답을 시작할 수 있습니다</p>
      </div>

      <div class="onboarding-steps">
        <div class="step ${hasApiKey ? 'completed' : 'current'}">
          <div class="step-number">${hasApiKey ? '✓' : '1'}</div>
          <div class="step-content">
            <h3>OpenRouter API Key 설정</h3>
            <p>AI 분류 및 응답 생성에 필요합니다</p>
            ${!hasApiKey ? `<a href="/settings" class="btn btn-primary btn-sm">설정하러 가기</a>` : `<span class="step-done">완료됨</span>`}
          </div>
        </div>

        <div class="step-connector ${hasApiKey ? '' : 'disabled'}"></div>

        <div class="step ${hasApiKey ? 'current' : 'disabled'}">
          <div class="step-number">2</div>
          <div class="step-content">
            <h3>YouTube 채널 연동</h3>
            <p>댓글을 가져올 채널을 연결합니다</p>
            ${hasApiKey ? `<a href="/oauth/start" class="btn btn-primary btn-sm">채널 연동하기</a>` : `<span class="step-locked">🔒 1단계를 먼저 완료하세요</span>`}
          </div>
        </div>

        <div class="step-connector disabled"></div>

        <div class="step disabled">
          <div class="step-number">3</div>
          <div class="step-content">
            <h3>첫 댓글 수집</h3>
            <p>대시보드에서 "댓글 가져오기" 클릭</p>
            <span class="step-locked">🔒 채널 연동 후 진행</span>
          </div>
        </div>
      </div>
    </div>
    ` : `
    <div class="channels-grid">
      ${channels.map(channel => `
        <a href="/channels/${channel.id}" class="channel-card">
          <div class="channel-header">
            <div class="channel-info">
              <h3>🎬 ${escapeHtml(channel.youtube.channelTitle)}</h3>
              <span class="channel-id">${channel.youtube.channelId}</span>
            </div>
            <span class="channel-status ${channel.isActive ? 'active' : 'inactive'}">
              ${channel.isActive ? '활성' : '비활성'}
            </span>
          </div>
          <div class="channel-stats">
            <div class="stat-item">
              <div class="label">미응답</div>
              <div class="value pending">${channel.stats?.pending || 0}</div>
            </div>
            <div class="stat-item">
              <div class="label">승인대기</div>
              <div class="value generated">${channel.stats?.generated || 0}</div>
            </div>
          </div>
          <div class="channel-schedule">
            <span>⏰ ${getScheduleLabel(channel.schedule.fetchInterval)}</span>
            ${channel.schedule.autoApprove
              ? `<span style="margin-left: 12px;">🤖 자동승인</span>`
              : `<span style="margin-left: 12px;">✋ 수동승인</span>`
            }
          </div>
        </a>
      `).join('')}

      <a href="/oauth/start" class="channel-card add-new">
        <span class="icon">+</span>
        <span>채널 추가하기</span>
      </a>
    </div>

    ${channels.length > 0 ? `
    <h2 class="section-title">⏰ 자동화 현황</h2>
    <div class="automation-section">
      <div class="automation-list">
        ${channels.map(channel => `
          <div class="automation-item">
            <div>
              <span class="channel-name">${escapeHtml(channel.youtube.channelTitle)}</span>
              <span class="schedule-info">
                • ${getScheduleLabel(channel.schedule.fetchInterval)} 수집
                ${channel.schedule.autoApprove
                  ? `, ${channel.schedule.approveTimes.join('/')} 승인`
                  : ', 수동 승인'
                }
              </span>
            </div>
            <span class="status-badge ${channel.isActive ? 'running' : 'paused'}">
              ${channel.isActive ? '실행 중' : '일시정지'}
            </span>
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}
    `}

    <footer class="site-footer">
      <div class="footer-copy">
        © 2025 Autonomey. All rights reserved.<br>
        <a href="https://www.youtube.com/@AI%EC%9E%A1%EB%8F%8C%EC%9D%B4" target="_blank" rel="noopener">Made with ❤️ by <span>AI잡돌이</span></a>
      </div>
    </footer>
  </div>

  <div class="toast" id="toast"></div>

  <script>
    function logout() {
      if (!confirm('로그아웃 하시겠습니까?')) return;

      // 토큰 삭제
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      document.cookie = 'token=; path=/; max-age=0';

      // 로그인 페이지로 이동
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

function getScheduleLabel(interval: string): string {
  const labels: Record<string, string> = {
    'hourly': '매시간',
    'every30min': '30분마다',
    'every15min': '15분마다'
  }
  return labels[interval] || interval
}
