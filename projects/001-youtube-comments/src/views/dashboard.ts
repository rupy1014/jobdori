/**
 * 대시보드 HTML 렌더링
 */

import type { Env } from '../types'
import { getStats, getLastFetchedAt } from '../lib/kv'

export async function renderDashboard(env: Env): Promise<string> {
  const stats = await getStats(env.KV)
  const lastFetchedAt = await getLastFetchedAt(env.KV)

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>YouTube 댓글 자동 응답 봇</title>
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
      max-width: 1200px;
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

    h1 {
      font-size: 24px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .stat-card {
      background: #1a1a1a;
      border-radius: 12px;
      padding: 20px;
      border: 1px solid #333;
    }

    .stat-card h3 {
      font-size: 14px;
      color: #888;
      margin-bottom: 8px;
    }

    .stat-card .value {
      font-size: 32px;
      font-weight: bold;
    }

    .stat-card .value.unclassified {
      color: #a78bfa;
    }

    .stat-card .value.pending {
      color: #f59e0b;
    }

    .stat-card .value.generated {
      color: #3b82f6;
    }

    .stat-card .value.replied {
      color: #10b981;
    }

    .actions {
      display: flex;
      gap: 15px;
      margin-bottom: 30px;
    }

    button {
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
    }

    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-fetch {
      background: #3b82f6;
      color: white;
    }

    .btn-fetch:hover:not(:disabled) {
      background: #2563eb;
    }

    .btn-reply {
      background: #10b981;
      color: white;
    }

    .btn-classify {
      background: #8b5cf6;
      color: white;
    }

    .btn-classify:hover:not(:disabled) {
      background: #7c3aed;
    }

    .btn-generate {
      background: #f59e0b;
      color: white;
    }

    .btn-generate:hover:not(:disabled) {
      background: #d97706;
    }

    .btn-approve {
      background: #10b981;
      color: white;
    }

    .btn-approve:hover:not(:disabled) {
      background: #059669;
    }

    .btn-approve-sm {
      padding: 4px 10px;
      background: #10b981;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
    }

    .btn-approve-sm:hover:not(:disabled) {
      background: #059669;
    }

    .btn-approve-sm:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-edit-sm {
      padding: 4px 10px;
      background: #6b7280;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
      margin-right: 5px;
    }

    .btn-edit-sm:hover {
      background: #4b5563;
    }

    /* 모달 스타일 */
    .modal-overlay {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      z-index: 1000;
      justify-content: center;
      align-items: center;
    }

    .modal-overlay.show {
      display: flex;
    }

    .modal {
      background: #1a1a1a;
      border-radius: 12px;
      padding: 24px;
      width: 90%;
      max-width: 600px;
      border: 1px solid #333;
    }

    .modal h2 {
      margin-bottom: 15px;
      font-size: 18px;
    }

    .modal-comment {
      background: #222;
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 15px;
      font-size: 14px;
      color: #aaa;
    }

    .modal-comment strong {
      color: #fff;
      display: block;
      margin-bottom: 5px;
    }

    .modal textarea {
      width: 100%;
      height: 120px;
      background: #222;
      border: 1px solid #444;
      border-radius: 8px;
      padding: 12px;
      color: #fff;
      font-size: 14px;
      resize: vertical;
      margin-bottom: 15px;
    }

    .modal textarea:focus {
      outline: none;
      border-color: #3b82f6;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }

    .btn-cancel {
      padding: 10px 20px;
      background: #333;
      color: #fff;
      border: none;
      border-radius: 6px;
      cursor: pointer;
    }

    .btn-cancel:hover {
      background: #444;
    }

    .btn-save {
      padding: 10px 20px;
      background: #3b82f6;
      color: #fff;
      border: none;
      border-radius: 6px;
      cursor: pointer;
    }

    .btn-save:hover {
      background: #2563eb;
    }

    .filter-tabs {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
    }

    .filter-tab {
      padding: 8px 16px;
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 20px;
      color: #888;
      cursor: pointer;
      font-size: 14px;
    }

    .filter-tab.active {
      background: #333;
      color: #fff;
      border-color: #555;
    }

    .comments-table {
      width: 100%;
      border-collapse: collapse;
      background: #1a1a1a;
      border-radius: 12px;
      overflow: hidden;
    }

    .comments-table th,
    .comments-table td {
      padding: 15px;
      text-align: left;
      border-bottom: 1px solid #333;
    }

    .comments-table th {
      background: #222;
      font-weight: 600;
      color: #888;
      font-size: 12px;
      text-transform: uppercase;
    }

    .comments-table tr:hover {
      background: #222;
    }

    .badge {
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }

    .badge.unclassified {
      background: #2e1065;
      color: #a78bfa;
    }

    .badge.pending {
      background: #422006;
      color: #f59e0b;
    }

    .badge.generated {
      background: #172554;
      color: #3b82f6;
    }

    .badge.replied {
      background: #052e16;
      color: #10b981;
    }

    .reply-preview {
      max-width: 300px;
      font-size: 12px;
      color: #888;
      white-space: pre-wrap;
      word-break: break-word;
      line-height: 1.5;
    }

    .reply-preview.has-reply {
      color: #3b82f6;
    }

    .badge.positive { background: #052e16; color: #10b981; }
    .badge.negative { background: #450a0a; color: #ef4444; }
    .badge.question { background: #172554; color: #3b82f6; }
    .badge.suggestion { background: #3f3f46; color: #a78bfa; }
    .badge.reaction { background: #422006; color: #fbbf24; }
    .badge.other { background: #27272a; color: #a1a1aa; }

    .comment-text {
      max-width: 400px;
      white-space: pre-wrap;
      word-break: break-word;
      line-height: 1.5;
    }

    .comment-text a,
    .reply-preview a {
      color: #3b82f6;
      text-decoration: none;
    }

    .comment-text a:hover,
    .reply-preview a:hover {
      text-decoration: underline;
    }

    .pagination {
      display: flex;
      justify-content: center;
      gap: 10px;
      margin-top: 20px;
    }

    .pagination button {
      padding: 8px 16px;
      background: #333;
      color: #fff;
      border-radius: 6px;
    }

    .pagination button:hover:not(:disabled) {
      background: #444;
    }

    .pagination .current {
      padding: 8px 16px;
      color: #888;
    }

    .loading {
      display: none;
      margin-left: 10px;
    }

    .loading.show {
      display: inline-block;
    }

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

    .toast.success {
      background: #10b981;
    }

    .toast.error {
      background: #ef4444;
    }

    .last-fetch {
      font-size: 12px;
      color: #666;
    }

    .btn-oauth {
      padding: 6px 12px;
      background: #333;
      color: #fff;
      border-radius: 6px;
      font-size: 12px;
      text-decoration: none;
      transition: background 0.2s;
    }

    .btn-oauth:hover {
      background: #444;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #666;
    }

    .empty-state h3 {
      margin-bottom: 10px;
      font-size: 18px;
    }

    /* 설정 섹션 스타일 */
    .settings-section {
      background: #1a1a1a;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 30px;
      border: 1px solid #333;
    }

    .settings-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      cursor: pointer;
    }

    .settings-header h2 {
      font-size: 18px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .settings-toggle {
      font-size: 12px;
      color: #888;
    }

    .settings-content {
      display: none;
    }

    .settings-content.show {
      display: block;
    }

    .type-instructions {
      display: grid;
      gap: 20px;
    }

    .type-card {
      background: #222;
      border-radius: 8px;
      padding: 16px;
      border: 1px solid #333;
    }

    .type-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .type-card-title {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .type-card-title .badge {
      font-size: 14px;
    }

    .toggle-switch {
      position: relative;
      width: 44px;
      height: 24px;
    }

    .toggle-switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .toggle-slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: #444;
      border-radius: 24px;
      transition: 0.3s;
    }

    .toggle-slider:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background: white;
      border-radius: 50%;
      transition: 0.3s;
    }

    .toggle-switch input:checked + .toggle-slider {
      background: #10b981;
    }

    .toggle-switch input:checked + .toggle-slider:before {
      transform: translateX(20px);
    }

    .type-card label {
      display: block;
      font-size: 12px;
      color: #888;
      margin-bottom: 6px;
    }

    .type-card textarea {
      width: 100%;
      background: #1a1a1a;
      border: 1px solid #444;
      border-radius: 6px;
      padding: 10px;
      color: #fff;
      font-size: 13px;
      resize: vertical;
      margin-bottom: 12px;
    }

    .type-card textarea:focus {
      outline: none;
      border-color: #3b82f6;
    }

    .type-card textarea.instruction {
      height: 50px;
    }

    .common-instructions {
      background: #222;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 20px;
      border: 1px solid #444;
    }

    .common-instructions label {
      display: block;
      font-size: 14px;
      font-weight: 600;
      color: #fff;
      margin-bottom: 10px;
    }

    .common-instructions textarea {
      width: 100%;
      height: 80px;
      background: #1a1a1a;
      border: 1px solid #444;
      border-radius: 6px;
      padding: 10px;
      color: #fff;
      font-size: 13px;
      resize: vertical;
    }

    .common-instructions textarea:focus {
      outline: none;
      border-color: #3b82f6;
    }

    .common-instructions .hint {
      font-size: 12px;
      color: #666;
      margin-top: 8px;
    }

    .settings-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #333;
    }

    .btn-reset {
      padding: 10px 20px;
      background: #333;
      color: #fff;
      border: none;
      border-radius: 6px;
      cursor: pointer;
    }

    .btn-reset:hover {
      background: #444;
    }

    .btn-save-settings {
      padding: 10px 20px;
      background: #10b981;
      color: #fff;
      border: none;
      border-radius: 6px;
      cursor: pointer;
    }

    .btn-save-settings:hover {
      background: #059669;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🤖 YouTube 댓글 자동 응답 봇</h1>
      <div style="display: flex; align-items: center; gap: 15px;">
        <span class="last-fetch">
          마지막 동기화: ${lastFetchedAt ? new Date(lastFetchedAt).toLocaleString('ko-KR') : '없음'}
        </span>
        <a href="/oauth/start" class="btn-oauth" title="YouTube 권한 갱신">🔑 재인증</a>
      </div>
    </header>

    <div class="stats">
      <div class="stat-card">
        <h3>전체 댓글</h3>
        <div class="value">${stats.total}</div>
      </div>
      <div class="stat-card">
        <h3>미분류</h3>
        <div class="value unclassified">${stats.unclassified}</div>
      </div>
      <div class="stat-card">
        <h3>미응답</h3>
        <div class="value pending">${stats.pending}</div>
      </div>
      <div class="stat-card">
        <h3>승인대기</h3>
        <div class="value generated">${stats.generated}</div>
      </div>
      <div class="stat-card">
        <h3>응답완료</h3>
        <div class="value replied">${stats.replied}</div>
      </div>
    </div>

    <div class="actions">
      <button class="btn-fetch" id="fetchBtn" onclick="fetchComments()">
        📥 댓글 가져오기
        <span class="loading" id="fetchLoading">⏳</span>
      </button>
      <button class="btn-classify" id="classifyBtn" onclick="classifyComments()">
        🏷️ 자동 분류
        <span class="loading" id="classifyLoading">⏳</span>
      </button>
      <button class="btn-generate" id="generateBtn" onclick="generateReplies()">
        ✍️ 응답 생성
        <span class="loading" id="generateLoading">⏳</span>
      </button>
      <button class="btn-approve" id="approveAllBtn" onclick="approveAll()">
        ✅ 전체 승인
        <span class="loading" id="approveAllLoading">⏳</span>
      </button>
    </div>

    <!-- 응답 지침 설정 섹션 -->
    <div class="settings-section">
      <div class="settings-header" onclick="toggleSettings()">
        <h2>⚙️ 분류별 응답 지침</h2>
        <span class="settings-toggle" id="settingsToggle">▼ 펼치기</span>
      </div>
      <div class="settings-content" id="settingsContent">
        <!-- 공통 지침 -->
        <div class="common-instructions">
          <label>📋 공통 응답 지침</label>
          <textarea id="commonInstructions" placeholder="모든 댓글 유형에 공통으로 적용되는 지침을 입력하세요..."></textarea>
          <p class="hint">모든 분류에 공통으로 적용됩니다. (예: 글자수 제한, 이모지 사용, 말투 등)</p>
        </div>

        <p style="color: #888; margin-bottom: 15px; font-size: 14px;">
          <strong>분류별 추가 지침</strong> - 토글을 끄면 해당 유형은 응답을 생성하지 않습니다.
        </p>
        <div class="type-instructions" id="typeInstructions">
          <!-- JS로 동적 생성 -->
        </div>
        <div class="settings-actions">
          <button class="btn-reset" onclick="resetSettings()">기본값으로 초기화</button>
          <button class="btn-save-settings" onclick="saveSettings()">
            💾 설정 저장
            <span class="loading" id="saveSettingsLoading">⏳</span>
          </button>
        </div>
      </div>
    </div>

    <div class="filter-tabs">
      <button class="filter-tab active" data-status="all" onclick="filterComments('all')">전체</button>
      <button class="filter-tab" data-status="unclassified" onclick="filterComments('unclassified')">미분류</button>
      <button class="filter-tab" data-status="pending" onclick="filterComments('pending')">미응답</button>
      <button class="filter-tab" data-status="generated" onclick="filterComments('generated')">승인대기</button>
      <button class="filter-tab" data-status="replied" onclick="filterComments('replied')">응답완료</button>
    </div>

    <table class="comments-table">
      <thead>
        <tr>
          <th>상태</th>
          <th>분류</th>
          <th>작성자</th>
          <th>댓글</th>
          <th>생성된 응답</th>
          <th>액션</th>
        </tr>
      </thead>
      <tbody id="commentsBody">
        <tr>
          <td colspan="6" class="empty-state">
            <h3>댓글이 없습니다</h3>
            <p>📥 댓글 가져오기 버튼을 클릭하세요</p>
          </td>
        </tr>
      </tbody>
    </table>

    <div class="pagination" id="pagination"></div>
  </div>

  <div class="toast" id="toast"></div>

  <!-- 수정 모달 -->
  <div class="modal-overlay" id="editModal">
    <div class="modal">
      <h2>✏️ 응답 수정</h2>
      <div class="modal-comment">
        <strong>원본 댓글:</strong>
        <span id="modalOriginalComment"></span>
      </div>
      <textarea id="modalReplyText" placeholder="응답 내용을 입력하세요..."></textarea>
      <div class="modal-actions">
        <button class="btn-cancel" onclick="closeEditModal()">취소</button>
        <button class="btn-save" onclick="saveEditedReply()">저장</button>
      </div>
    </div>
  </div>

  <script>
    let currentPage = 1;
    let currentStatus = 'all';
    const limit = 20;
    let editingCommentId = null;
    let commentsCache = [];

    // 인증 정보를 가져오는 함수 (현재 페이지의 Basic Auth 사용)
    function getAuthHeaders() {
      // 페이지 로드 시 이미 인증된 상태이므로, 쿠키나 세션 대신 credentials: 'include' 사용
      return {};
    }

    // API 호출 헬퍼 (인증 포함)
    async function apiCall(url, options = {}) {
      return fetch(url, {
        ...options,
        credentials: 'include',  // 같은 origin이므로 쿠키/인증 포함
      });
    }

    // 설정 캐시
    let settingsCache = null;

    // 기본 설정 (서버에서 가져올 수 없을 때 사용)
    const DEFAULT_COMMON_INSTRUCTIONS = \`- 200자 이내로 짧게
- 이모지 1-2개만
- "안녕하세요" 같은 형식적 인사 금지
- 절대 방어적이지 않게
- 시청자 이름 언급하지 않기\`;

    const DEFAULT_TYPE_INSTRUCTIONS = {
      positive: {
        enabled: true,
        instruction: '진심어린 감사를 표현하세요. 응원이 큰 힘이 된다는 것을 전달하세요.'
      },
      negative: {
        enabled: true,
        instruction: '품위있게 대응하세요. 비판에서 배울 점이 있다면 인정하고, 악플은 짧게 마무리하세요.'
      },
      question: {
        enabled: true,
        instruction: '친절하고 전문적으로 답변하세요. 모르는 건 솔직히 모른다고 하고, 알아보겠다고 하세요.'
      },
      suggestion: {
        enabled: true,
        instruction: '제안에 감사하고 공감하세요. 좋은 아이디어는 반영하겠다고 하세요.'
      },
      reaction: {
        enabled: true,
        instruction: '가볍고 유머러스하게 반응하세요. 짧지만 따뜻하게!'
      },
      other: {
        enabled: false,
        instruction: '친근하게 응대하세요.'
      }
    };

    // 유형별 라벨
    const TYPE_LABELS = {
      positive: { label: '긍정', desc: '칭찬, 응원, 감사 댓글' },
      negative: { label: '부정', desc: '비난, 악플, 불만 댓글' },
      question: { label: '질문', desc: '궁금한 점, 도움 요청' },
      suggestion: { label: '제안', desc: '콘텐츠 요청, 개선점' },
      reaction: { label: '반응', desc: '단순 반응 (ㅋㅋ, 와 등)' },
      other: { label: '기타', desc: '분류되지 않는 기타 댓글' }
    };

    // 페이지 로드시 댓글 불러오기
    document.addEventListener('DOMContentLoaded', () => {
      loadComments();
      loadSettings();
    });

    // 댓글 목록 불러오기
    async function loadComments() {
      try {
        const res = await apiCall(\`/api/comments?page=\${currentPage}&limit=\${limit}&status=\${currentStatus}\`);
        const data = await res.json();

        if (data.success) {
          commentsCache = data.data.comments;
          renderComments(data.data.comments);
          renderPagination(data.data.page, data.data.totalPages, data.data.total);
        }
      } catch (error) {
        showToast('댓글을 불러오는데 실패했습니다', 'error');
      }
    }

    // 댓글 렌더링
    function renderComments(comments) {
      const tbody = document.getElementById('commentsBody');

      if (!comments || comments.length === 0) {
        tbody.innerHTML = \`
          <tr>
            <td colspan="6" class="empty-state">
              <h3>댓글이 없습니다</h3>
              <p>📥 댓글 가져오기 버튼을 클릭하세요</p>
            </td>
          </tr>
        \`;
        return;
      }

      tbody.innerHTML = comments.map(comment => {
        const sanitizedText = sanitizeHtml(comment.text || '');
        const sanitizedReply = comment.replyText ? sanitizeHtml(comment.replyText) : '';
        const decodedAuthor = decodeHtmlEntities(comment.authorName || '');
        return \`
        <tr>
          <td><span class="badge \${comment.status}">\${getStatusLabel(comment.status)}</span></td>
          <td><span class="badge \${comment.type || 'other'}">\${getTypeLabel(comment.type)}</span></td>
          <td>\${escapeHtml(decodedAuthor)}</td>
          <td class="comment-text">\${sanitizedText}</td>
          <td class="reply-preview \${comment.replyText ? 'has-reply' : ''}">\${sanitizedReply || '-'}</td>
          <td>\${comment.status === 'generated' ? \`<button class="btn-edit-sm" onclick="openEditModal('\${comment.id}')">✏️ 수정</button><button class="btn-approve-sm" onclick="approveComment('\${comment.id}')">✅ 승인</button>\` : '-'}</td>
        </tr>
      \`;
      }).join('');
    }

    // 페이지네이션 렌더링
    function renderPagination(page, totalPages, total) {
      const pagination = document.getElementById('pagination');

      if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
      }

      pagination.innerHTML = \`
        <button \${page === 1 ? 'disabled' : ''} onclick="goToPage(\${page - 1})">이전</button>
        <span class="current">\${page} / \${totalPages} (총 \${total}개)</span>
        <button \${page === totalPages ? 'disabled' : ''} onclick="goToPage(\${page + 1})">다음</button>
      \`;
    }

    // 페이지 이동
    function goToPage(page) {
      currentPage = page;
      loadComments();
    }

    // 필터 변경
    function filterComments(status) {
      currentStatus = status;
      currentPage = 1;

      document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.status === status);
      });

      loadComments();
    }

    // 댓글 가져오기
    async function fetchComments() {
      const btn = document.getElementById('fetchBtn');
      const loading = document.getElementById('fetchLoading');

      btn.disabled = true;
      loading.classList.add('show');

      try {
        const res = await apiCall('/api/fetch', { method: 'POST' });
        const data = await res.json();

        if (data.success) {
          showToast(data.message, 'success');
          loadComments();
          setTimeout(() => location.reload(), 1000);
        } else {
          showToast(data.error || '실패했습니다', 'error');
        }
      } catch (error) {
        showToast('네트워크 오류가 발생했습니다', 'error');
      } finally {
        btn.disabled = false;
        loading.classList.remove('show');
      }
    }

    // 자동 분류
    async function classifyComments() {
      const btn = document.getElementById('classifyBtn');
      const loading = document.getElementById('classifyLoading');

      btn.disabled = true;
      loading.classList.add('show');

      try {
        const res = await apiCall('/api/classify', { method: 'POST' });
        const data = await res.json();

        if (data.success) {
          showToast(data.message, 'success');
          loadComments();
          setTimeout(() => location.reload(), 1000);
        } else {
          showToast(data.error || '실패했습니다', 'error');
        }
      } catch (error) {
        showToast('네트워크 오류가 발생했습니다', 'error');
      } finally {
        btn.disabled = false;
        loading.classList.remove('show');
      }
    }

    // 응답 생성
    async function generateReplies() {
      const btn = document.getElementById('generateBtn');
      const loading = document.getElementById('generateLoading');

      btn.disabled = true;
      loading.classList.add('show');

      try {
        const res = await apiCall('/api/generate', { method: 'POST' });
        const data = await res.json();

        if (data.success) {
          showToast(data.message, 'success');
          loadComments();
          setTimeout(() => location.reload(), 1000);
        } else {
          showToast(data.error || '실패했습니다', 'error');
        }
      } catch (error) {
        showToast('네트워크 오류가 발생했습니다', 'error');
      } finally {
        btn.disabled = false;
        loading.classList.remove('show');
      }
    }

    // 전체 승인
    async function approveAll() {
      const btn = document.getElementById('approveAllBtn');
      const loading = document.getElementById('approveAllLoading');

      btn.disabled = true;
      loading.classList.add('show');

      try {
        const res = await apiCall('/api/approve-all', { method: 'POST' });
        const data = await res.json();

        if (data.success) {
          showToast(data.message, 'success');
          loadComments();
          setTimeout(() => location.reload(), 1000);
        } else {
          showToast(data.error || '실패했습니다', 'error');
        }
      } catch (error) {
        showToast('네트워크 오류가 발생했습니다', 'error');
      } finally {
        btn.disabled = false;
        loading.classList.remove('show');
      }
    }

    // 개별 승인
    async function approveComment(commentId) {
      try {
        const res = await apiCall(\`/api/comments/\${commentId}/approve\`, { method: 'POST' });
        const data = await res.json();

        if (data.success) {
          showToast(data.message, 'success');
          loadComments();
          setTimeout(() => location.reload(), 1000);
        } else {
          showToast(data.error || '실패했습니다', 'error');
        }
      } catch (error) {
        showToast('네트워크 오류가 발생했습니다', 'error');
      }
    }

    // 수정 모달 열기
    function openEditModal(commentId) {
      const comment = commentsCache.find(c => c.id === commentId);
      if (!comment) {
        showToast('댓글을 찾을 수 없습니다', 'error');
        return;
      }

      editingCommentId = commentId;
      document.getElementById('modalOriginalComment').textContent = comment.text;
      document.getElementById('modalReplyText').value = comment.replyText || '';
      document.getElementById('editModal').classList.add('show');
    }

    // 수정 모달 닫기
    function closeEditModal() {
      editingCommentId = null;
      document.getElementById('editModal').classList.remove('show');
    }

    // 수정된 응답 저장
    async function saveEditedReply() {
      if (!editingCommentId) return;

      const replyText = document.getElementById('modalReplyText').value;

      try {
        const res = await apiCall(\`/api/comments/\${editingCommentId}/reply\`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ replyText })
        });
        const data = await res.json();

        if (data.success) {
          showToast(data.message, 'success');
          closeEditModal();
          loadComments();
        } else {
          showToast(data.error || '저장에 실패했습니다', 'error');
        }
      } catch (error) {
        showToast('네트워크 오류가 발생했습니다', 'error');
      }
    }

    // 모달 바깥 클릭시 닫기
    document.getElementById('editModal').addEventListener('click', (e) => {
      if (e.target.id === 'editModal') {
        closeEditModal();
      }
    });

    // 토스트 메시지
    function showToast(message, type) {
      const toast = document.getElementById('toast');
      toast.textContent = message;
      toast.className = \`toast \${type} show\`;

      setTimeout(() => {
        toast.classList.remove('show');
      }, 3000);
    }

    // 상태 라벨
    function getStatusLabel(status) {
      const labels = {
        unclassified: '미분류',
        pending: '미응답',
        generated: '승인대기',
        replied: '완료'
      };
      return labels[status] || status;
    }

    // 분류 라벨
    function getTypeLabel(type) {
      const labels = {
        positive: '긍정',
        negative: '부정',
        question: '질문',
        suggestion: '제안',
        reaction: '반응',
        other: '기타'
      };
      return labels[type] || '-';
    }

    // HTML 이스케이프
    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    // HTML 엔티티 디코딩 (YouTube API에서 &amp; 등으로 인코딩된 텍스트 처리)
    function decodeHtmlEntities(text) {
      const textarea = document.createElement('textarea');
      textarea.innerHTML = text;
      return textarea.value;
    }

    // YouTube 댓글 HTML 처리 (안전한 링크만 허용, 나머지는 이스케이프)
    function sanitizeHtml(text) {
      if (!text) return '';

      // 먼저 HTML 엔티티 디코딩
      const decoded = decodeHtmlEntities(text);

      // <a> 태그를 임시 플레이스홀더로 대체
      const linkPattern = /<a\\s+href="(https?:\\/\\/[^"]+)"[^>]*>([^<]+)<\\/a>/gi;
      const links = [];
      let processed = decoded.replace(linkPattern, (match, href, linkText) => {
        const index = links.length;
        // YouTube/안전한 링크만 허용
        const safeHref = escapeHtml(href);
        const safeLinkText = escapeHtml(linkText);
        links.push(\`<a href="\${safeHref}" target="_blank" rel="noopener" style="color: #3b82f6;">\${safeLinkText}</a>\`);
        return \`__LINK_\${index}__\`;
      });

      // 나머지 텍스트 이스케이프
      processed = escapeHtml(processed);

      // 플레이스홀더를 다시 링크로 복원
      links.forEach((link, index) => {
        processed = processed.replace(\`__LINK_\${index}__\`, link);
      });

      return processed;
    }

    // 설정 토글
    function toggleSettings() {
      const content = document.getElementById('settingsContent');
      const toggle = document.getElementById('settingsToggle');
      const isShown = content.classList.toggle('show');
      toggle.textContent = isShown ? '▲ 접기' : '▼ 펼치기';
    }

    // 설정 불러오기
    async function loadSettings() {
      try {
        const res = await apiCall('/api/settings');
        const data = await res.json();

        if (data.success && data.data) {
          settingsCache = data.data;
          // 기본값 적용
          if (!settingsCache.commonInstructions) {
            settingsCache.commonInstructions = DEFAULT_COMMON_INSTRUCTIONS;
          }
          if (!settingsCache.typeInstructions) {
            settingsCache.typeInstructions = DEFAULT_TYPE_INSTRUCTIONS;
          }
        } else {
          settingsCache = {
            commonInstructions: DEFAULT_COMMON_INSTRUCTIONS,
            typeInstructions: DEFAULT_TYPE_INSTRUCTIONS
          };
        }

        renderSettings();
      } catch (error) {
        console.error('Failed to load settings:', error);
        settingsCache = {
          commonInstructions: DEFAULT_COMMON_INSTRUCTIONS,
          typeInstructions: DEFAULT_TYPE_INSTRUCTIONS
        };
        renderSettings();
      }
    }

    // 설정 렌더링
    function renderSettings() {
      // 공통 지침
      const commonInput = document.getElementById('commonInstructions');
      commonInput.value = settingsCache?.commonInstructions || DEFAULT_COMMON_INSTRUCTIONS;

      // 분류별 지침
      const container = document.getElementById('typeInstructions');
      const types = ['positive', 'negative', 'question', 'suggestion', 'reaction', 'other'];

      container.innerHTML = types.map(type => {
        const typeInfo = TYPE_LABELS[type];
        const instruction = settingsCache?.typeInstructions?.[type] || DEFAULT_TYPE_INSTRUCTIONS[type];

        return \`
          <div class="type-card">
            <div class="type-card-header">
              <div class="type-card-title">
                <span class="badge \${type}">\${typeInfo.label}</span>
                <span style="color: #888; font-size: 13px;">\${typeInfo.desc}</span>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" id="enabled_\${type}" \${instruction.enabled ? 'checked' : ''}>
                <span class="toggle-slider"></span>
              </label>
            </div>
            <textarea class="instruction" id="instruction_\${type}" placeholder="이 유형에 대한 추가 지침...">\${escapeHtml(instruction.instruction || '')}</textarea>
          </div>
        \`;
      }).join('');
    }

    // 설정 저장
    async function saveSettings() {
      const loading = document.getElementById('saveSettingsLoading');
      loading.classList.add('show');

      try {
        const types = ['positive', 'negative', 'question', 'suggestion', 'reaction', 'other'];
        const typeInstructions = {};

        types.forEach(type => {
          typeInstructions[type] = {
            enabled: document.getElementById(\`enabled_\${type}\`).checked,
            instruction: document.getElementById(\`instruction_\${type}\`).value
          };
        });

        // 기존 설정과 병합
        const updatedSettings = {
          ...settingsCache,
          commonInstructions: document.getElementById('commonInstructions').value,
          typeInstructions
        };

        const res = await apiCall('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedSettings)
        });

        const data = await res.json();

        if (data.success) {
          settingsCache = updatedSettings;
          showToast('설정이 저장되었습니다', 'success');
        } else {
          showToast(data.error || '저장에 실패했습니다', 'error');
        }
      } catch (error) {
        showToast('네트워크 오류가 발생했습니다', 'error');
      } finally {
        loading.classList.remove('show');
      }
    }

    // 설정 초기화
    function resetSettings() {
      if (!confirm('모든 지침을 기본값으로 초기화하시겠습니까?')) return;

      settingsCache = {
        ...settingsCache,
        commonInstructions: DEFAULT_COMMON_INSTRUCTIONS,
        typeInstructions: DEFAULT_TYPE_INSTRUCTIONS
      };
      renderSettings();
      showToast('기본값으로 초기화되었습니다. 저장 버튼을 눌러 적용하세요.', 'success');
    }
  </script>
</body>
</html>`
}
