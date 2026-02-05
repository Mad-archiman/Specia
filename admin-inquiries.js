// 관리자 문의 목록 - 로그인 필수, 페이지당 50건, 클릭 시 상세 펼침
(function () {
    const API_BASE = (typeof window !== 'undefined' && window.API_BASE) ? window.API_BASE : 'http://localhost:5000/api';
    const LIMIT = 50;

    const tbody = document.getElementById('inquiries-tbody');
    const loadingEl = document.getElementById('inquiries-loading');
    const errorEl = document.getElementById('inquiries-error');
    const contentEl = document.getElementById('inquiries-content');
    const emptyEl = document.getElementById('inquiries-empty');
    const paginationEl = document.getElementById('inquiries-pagination');
    const selectAllCheckbox = document.getElementById('select-all-checkbox');
    const deleteSelectedBtn = document.getElementById('delete-selected-btn');
    const selectedIds = new Set();

    function getAuthHeaders() {
        const token = localStorage.getItem('specia-token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = 'Bearer ' + token;
        return headers;
    }

    function formatDate(dateStr) {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const h = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        return `${y}-${m}-${day} ${h}:${min}`;
    }

    function categoryLabel(value) {
        const map = {
            general: '서비스 문의',
            service: '견적 문의',
            partnership: '파트너십 제안',
            support: '방문 요청',
            other: '기타'
        };
        return map[value] || value;
    }

    function show(state, message) {
        loadingEl.style.display = state === 'loading' ? 'block' : 'none';
        errorEl.style.display = state === 'error' ? 'block' : 'none';
        contentEl.style.display = state === 'content' ? 'block' : 'none';
        emptyEl.style.display = state === 'empty' ? 'block' : 'none';
        if (message) errorEl.textContent = message;
    }

    function renderDetailRow(item) {
        return `
            <div class="inquiries-detail-inner">
                <div class="inquiries-detail-grid">
                    <div>
                        <h4>이메일</h4>
                        <p>${escapeHtml(item.email || '-')}</p>
                    </div>
                    <div>
                        <h4>문의 유형</h4>
                        <p>${escapeHtml(categoryLabel(item.category))}</p>
                    </div>
                </div>
                <div style="margin-top:1rem;">
                    <h4>내용</h4>
                    <p>${escapeHtml((item.message || '').replace(/\n/g, '<br>'))}</p>
                </div>
            </div>
        `;
    }

    function escapeHtml(str) {
        if (str == null) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function buildRow(item, isExpanded) {
        const tr = document.createElement('tr');
        tr.dataset.id = item._id;
        tr.classList.toggle('expanded', isExpanded);
        const isChecked = selectedIds.has(item._id);
        tr.innerHTML = `
            <td class="cell-checkbox"><input type="checkbox" class="row-checkbox" data-id="${item._id}" ${isChecked ? 'checked' : ''}></td>
            <td class="cell-name" title="${escapeHtml(item.name || '')}">${escapeHtml(item.name || '-')}</td>
            <td class="cell-subject" title="${escapeHtml(item.subject || '')}">${escapeHtml(item.subject || '-')}</td>
            <td class="cell-phone">${escapeHtml(item.phone || '-')}</td>
            <td class="cell-date">${formatDate(item.createdAt)}</td>
            <td class="cell-expand">▼</td>
        `;
        return tr;
    }

    function buildDetailTr(item) {
        const tr = document.createElement('tr');
        tr.className = 'inquiries-detail-row';
        tr.dataset.detailFor = item._id;
        const td = document.createElement('td');
        td.colSpan = 6;
        td.innerHTML = renderDetailRow(item);
        tr.appendChild(td);
        return tr;
    }

    function updateDeleteButton() {
        deleteSelectedBtn.disabled = selectedIds.size === 0;
    }

    function handleCheckboxChange(checkbox, itemId) {
        if (checkbox.checked) {
            selectedIds.add(itemId);
            checkbox.closest('tr').classList.add('selected');
        } else {
            selectedIds.delete(itemId);
            checkbox.closest('tr').classList.remove('selected');
        }
        updateDeleteButton();
        updateSelectAllState();
    }

    function updateSelectAllState() {
        if (!selectAllCheckbox) return;
        const checkboxes = tbody.querySelectorAll('.row-checkbox');
        const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
        selectAllCheckbox.checked = checkboxes.length > 0 && checkedCount === checkboxes.length;
        selectAllCheckbox.indeterminate = checkedCount > 0 && checkedCount < checkboxes.length;
    }

    async function deleteSelected() {
        if (selectedIds.size === 0) return;
        if (!confirm(`선택한 ${selectedIds.size}개의 문의를 삭제하시겠습니까?`)) return;
        try {
            const ids = Array.from(selectedIds);
            const res = await fetch(`${API_BASE}/contact`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
                body: JSON.stringify({ ids })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                alert(`${ids.length}개의 문의가 삭제되었습니다.`);
                selectedIds.clear();
                const params = new URLSearchParams(window.location.search);
                const page = Math.max(1, parseInt(params.get('page'), 10) || 1);
                loadPage(page);
            } else {
                alert(data.message || '삭제에 실패했습니다.');
            }
        } catch (err) {
            console.error(err);
            alert('삭제 중 오류가 발생했습니다.');
        }
    }

    async function loadPage(page) {
        show('loading');
        try {
            const res = await fetch(`${API_BASE}/contact?page=${page}&limit=${LIMIT}`, {
                headers: getAuthHeaders()
            });
            const data = await res.json();

            if (res.status === 401) {
                window.location.href = 'login.html?redirect=' + encodeURIComponent('admin-inquiries.html');
                return;
            }
            if (res.status === 403) {
                window.location.href = 'index.html';
                return;
            }

            if (!res.ok) {
                show('error', data.message || '목록을 불러오지 못했습니다.');
                return;
            }

            const list = data.data || [];
            const total = data.total || 0;
            const totalPages = data.totalPages || 1;

            if (list.length === 0 && page === 1) {
                show('empty');
                return;
            }

            tbody.innerHTML = '';
            const fragment = document.createDocumentFragment();
            const detailMap = new Map();

            list.forEach(function (item) {
                const mainTr = buildRow(item, false);
                const detailTr = buildDetailTr(item);
                detailTr.style.display = 'none';
                detailMap.set(item._id, { mainTr, detailTr, item });

                const checkbox = mainTr.querySelector('.row-checkbox');
                if (checkbox) {
                    checkbox.addEventListener('change', function (e) {
                        e.stopPropagation();
                        handleCheckboxChange(checkbox, item._id);
                    });
                    checkbox.addEventListener('click', function (e) {
                        e.stopPropagation();
                    });
                }

                mainTr.addEventListener('click', function (e) {
                    if (e.target.type === 'checkbox') return;
                    const id = mainTr.dataset.id;
                    const stored = detailMap.get(id);
                    if (!stored) return;
                    const isExpanded = mainTr.classList.contains('expanded');
                    if (isExpanded) {
                        mainTr.classList.remove('expanded');
                        stored.detailTr.style.display = 'none';
                    } else {
                        mainTr.classList.add('expanded');
                        stored.detailTr.style.display = '';
                    }
                });

                fragment.appendChild(mainTr);
                fragment.appendChild(detailTr);
            });

            if (selectAllCheckbox) {
                selectAllCheckbox.addEventListener('change', function () {
                    const checkboxes = tbody.querySelectorAll('.row-checkbox');
                    checkboxes.forEach(function (cb) {
                        const id = cb.dataset.id;
                        cb.checked = selectAllCheckbox.checked;
                        if (selectAllCheckbox.checked) {
                            selectedIds.add(id);
                            cb.closest('tr').classList.add('selected');
                        } else {
                            selectedIds.delete(id);
                            cb.closest('tr').classList.remove('selected');
                        }
                    });
                    updateDeleteButton();
                });
            }

            if (deleteSelectedBtn) {
                deleteSelectedBtn.addEventListener('click', deleteSelected);
            }

            updateSelectAllState();
            updateDeleteButton();

            tbody.appendChild(fragment);

            paginationEl.innerHTML = '';
            if (totalPages > 1) {
                const info = document.createElement('span');
                info.className = 'pagination-info';
                info.textContent = `총 ${total}건 (${page} / ${totalPages}페이지)`;
                paginationEl.appendChild(info);

                const prevBtn = document.createElement('button');
                prevBtn.textContent = '이전';
                prevBtn.disabled = page <= 1;
                prevBtn.addEventListener('click', function () { if (page > 1) loadPage(page - 1); });
                paginationEl.appendChild(prevBtn);

                for (let i = 1; i <= totalPages; i++) {
                    const btn = document.createElement('button');
                    btn.textContent = i;
                    if (i === page) btn.classList.add('active');
                    btn.addEventListener('click', function () { loadPage(i); });
                    paginationEl.appendChild(btn);
                }

                const nextBtn = document.createElement('button');
                nextBtn.textContent = '다음';
                nextBtn.disabled = page >= totalPages;
                nextBtn.addEventListener('click', function () { if (page < totalPages) loadPage(page + 1); });
                paginationEl.appendChild(nextBtn);
            } else if (total > 0) {
                const info = document.createElement('span');
                info.className = 'pagination-info';
                info.textContent = `총 ${total}건`;
                paginationEl.appendChild(info);
            }

            show('content');
        } catch (err) {
            console.error(err);
            show('error', '서버에 연결할 수 없습니다.');
        }
    }

    async function init() {
        if (!window.getAuthHeaders || !localStorage.getItem('specia-token')) {
            window.location.href = 'login.html?redirect=' + encodeURIComponent('admin-inquiries.html');
            return;
        }
        try {
            const res = await fetch(`${API_BASE}/auth/me`, { headers: getAuthHeaders() });
            const data = await res.json();
            if (!res.ok || !data.success || (data.data && data.data.userType !== 'admin')) {
                window.location.href = 'index.html';
                return;
            }
        } catch (err) {
            window.location.href = 'index.html';
            return;
        }
        const params = new URLSearchParams(window.location.search);
        const page = Math.max(1, parseInt(params.get('page'), 10) || 1);
        loadPage(page);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
