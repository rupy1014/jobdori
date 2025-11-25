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
      max-width: 250px;
      font-size: 12px;
      color: #888;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
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
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
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

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #666;
    }

    .empty-state h3 {
      margin-bottom: 10px;
      font-size: 18px;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🤖 YouTube 댓글 자동 응답 봇</h1>
      <span class="last-fetch">
        마지막 동기화: ${lastFetchedAt ? new Date(lastFetchedAt).toLocaleString('ko-KR') : '없음'}
      </span>
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

  <script>
    let currentPage = 1;
    let currentStatus = 'all';
    const limit = 20;

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

    // 페이지 로드시 댓글 불러오기
    document.addEventListener('DOMContentLoaded', () => {
      loadComments();
    });

    // 댓글 목록 불러오기
    async function loadComments() {
      try {
        const res = await apiCall(\`/api/comments?page=\${currentPage}&limit=\${limit}&status=\${currentStatus}\`);
        const data = await res.json();

        if (data.success) {
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

      tbody.innerHTML = comments.map(comment => \`
        <tr>
          <td><span class="badge \${comment.status}">\${getStatusLabel(comment.status)}</span></td>
          <td><span class="badge \${comment.type || 'other'}">\${getTypeLabel(comment.type)}</span></td>
          <td>\${escapeHtml(comment.authorName)}</td>
          <td class="comment-text" title="\${escapeHtml(comment.text)}">\${escapeHtml(comment.text)}</td>
          <td class="reply-preview \${comment.replyText ? 'has-reply' : ''}" title="\${comment.replyText ? escapeHtml(comment.replyText) : ''}">\${comment.replyText ? escapeHtml(comment.replyText) : '-'}</td>
          <td>\${comment.status === 'generated' ? \`<button class="btn-approve-sm" onclick="approveComment('\${comment.id}')">✅ 승인</button>\` : '-'}</td>
        </tr>
      \`).join('');
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
        } else {
          showToast(data.error || '실패했습니다', 'error');
        }
      } catch (error) {
        showToast('네트워크 오류가 발생했습니다', 'error');
      }
    }

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
  </script>
</body>
</html>`
}
