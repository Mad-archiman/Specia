// 관리페이지 - 유저 목록 (20개씩, 회사명/메모장 편집)
(function () {
    const API_BASE = (typeof window !== 'undefined' && window.API_BASE) ? window.API_BASE : 'http://localhost:5000/api';

    const tbody = document.getElementById('admin-users-tbody');
    const loadingEl = document.getElementById('admin-users-loading');
    const errorEl = document.getElementById('admin-users-error');
    const contentEl = document.getElementById('admin-users-content');
    const emptyEl = document.getElementById('admin-users-empty');
    const paginationEl = document.getElementById('admin-users-pagination');

    function getAuthHeaders() {
        const token = localStorage.getItem('specia-token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = 'Bearer ' + token;
        return headers;
    }

    function redirectToLogin() {
        window.location.href = 'login.html?redirect=' + encodeURIComponent('admin-users.html');
    }

    function show(state, message) {
        loadingEl.style.display = state === 'loading' ? 'block' : 'none';
        errorEl.style.display = state === 'error' ? 'block' : 'none';
        contentEl.style.display = state === 'content' ? 'block' : 'none';
        emptyEl.style.display = state === 'empty' ? 'block' : 'none';
        if (message) errorEl.textContent = message;
    }

    function formatDate(dateStr) {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return y + '-' + m + '-' + day;
    }

    function escapeHtml(str) {
        if (str == null) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    async function saveUser(userId, companyName, memo) {
        try {
            const res = await fetch(API_BASE + '/admin/users/' + userId, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ companyName, memo })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                return true;
            }
            alert(data.message || '저장에 실패했습니다.');
            return false;
        } catch (err) {
            console.error('저장 오류:', err);
            alert('저장 중 오류가 발생했습니다.');
            return false;
        }
    }

    function renderRow(user) {
        const tr = document.createElement('tr');
        tr.dataset.id = user._id;

        const companyInput = document.createElement('input');
        companyInput.type = 'text';
        companyInput.value = user.companyName || '';
        companyInput.placeholder = '회사명 입력';

        const memoTextarea = document.createElement('textarea');
        memoTextarea.value = user.memo || '';
        memoTextarea.placeholder = '메모 입력';

        let saveTimeout = null;
        function scheduleSave() {
            if (saveTimeout) clearTimeout(saveTimeout);
            saveTimeout = setTimeout(function () {
                saveUser(user._id, companyInput.value.trim(), memoTextarea.value.trim());
            }, 500);
        }

        companyInput.addEventListener('blur', scheduleSave);
        companyInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                companyInput.blur();
            }
        });
        memoTextarea.addEventListener('blur', scheduleSave);

        const dateTd = document.createElement('td');
        dateTd.className = 'cell-date';
        dateTd.textContent = formatDate(user.createdAt);

        const companyTd = document.createElement('td');
        companyTd.className = 'cell-company';
        companyTd.appendChild(companyInput);

        const nameTd = document.createElement('td');
        nameTd.className = 'cell-name';
        const nameLink = document.createElement('a');
        nameLink.href = 'javascript:void(0)';
        nameLink.className = 'cell-name-link';
        nameLink.textContent = user.name || '-';
        nameLink.dataset.userId = user._id;
        nameLink.dataset.userName = user.name || '';
        nameTd.appendChild(nameLink);

        const phoneTd = document.createElement('td');
        phoneTd.className = 'cell-phone';
        phoneTd.textContent = user.phone || '-';

        const emailTd = document.createElement('td');
        emailTd.className = 'cell-email';
        emailTd.textContent = user.email || '-';

        const memoTd = document.createElement('td');
        memoTd.className = 'cell-memo';
        memoTd.appendChild(memoTextarea);

        tr.appendChild(dateTd);
        tr.appendChild(companyTd);
        tr.appendChild(nameTd);
        tr.appendChild(phoneTd);
        tr.appendChild(emailTd);
        tr.appendChild(memoTd);

        return tr;
    }

    function renderRows(users) {
        tbody.innerHTML = '';
        users.forEach(function (user) {
            tbody.appendChild(renderRow(user));
        });
        tbody.querySelectorAll('.cell-name-link').forEach(function (link) {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                var userId = link.dataset.userId;
                var userName = link.dataset.userName || '';
                if (userId) openMypageModal(userId, userName);
            });
        });
    }

    function renderPagination(p) {
        if (!p || p.totalPages <= 1) {
            paginationEl.innerHTML = '';
            return;
        }
        const page = p.page;
        const totalPages = p.totalPages;
        const total = p.total;

        let html = '';
        if (page > 1) {
            html += '<button type="button" data-page="' + (page - 1) + '">이전</button>';
        }
        html += '<span class="page-info">' + page + ' / ' + totalPages + ' (' + total + '건)</span>';
        if (page < totalPages) {
            html += '<button type="button" data-page="' + (page + 1) + '">다음</button>';
        }
        paginationEl.innerHTML = html;

        paginationEl.querySelectorAll('button').forEach(function (btn) {
            btn.addEventListener('click', function () {
                const pNum = parseInt(btn.getAttribute('data-page'), 10);
                if (pNum) loadUsers(pNum);
            });
        });
    }

    async function loadUsers(page) {
        page = page || 1;
        if (!loadingEl || !errorEl || !contentEl || !emptyEl || !tbody || !paginationEl) {
            console.error('관리페이지 DOM 요소를 찾을 수 없습니다.');
            return;
        }
        show('loading');

        try {
            const res = await fetch(API_BASE + '/admin/users?page=' + page, {
                headers: getAuthHeaders()
            });

            let data;
            try {
                data = await res.json();
            } catch (parseErr) {
                show('error', '서버 응답을 파싱할 수 없습니다. (상태: ' + res.status + ')');
                return;
            }

            if (res.status === 401) {
                redirectToLogin();
                return;
            }
            if (res.status === 403) {
                show('error', '관리자 권한이 필요합니다.');
                return;
            }
            if (!res.ok) {
                show('error', (data && data.message) || '목록을 불러올 수 없습니다. (상태: ' + res.status + ')');
                return;
            }

            if (!data || !data.success) {
                show('error', (data && data.message) || '목록을 불러올 수 없습니다.');
                return;
            }

            const items = (data.data && data.data.items) ? data.data.items : [];
            const pagination = data.data && data.data.pagination;

            if (items.length === 0 && page === 1) {
                show('empty');
                return;
            }

            renderRows(items);
            renderPagination(pagination || {});
            show('content');
        } catch (err) {
            console.error('유저 목록 조회 오류:', err);
            show('error', '서버에 연결할 수 없습니다. (서버가 실행 중인지 확인: ' + API_BASE + ')');
        }
    }

    // === 유저 마이페이지 관리 모달 ===
    var currentTargetUserId = null;
    var mypageData = { general: [], subscription: [], dc: [] };

    var mypageModal = document.getElementById('admin-mypage-modal');
    var mypageBackdrop = document.getElementById('admin-mypage-backdrop');
    var mypageClose = document.getElementById('admin-mypage-close');
    var mypageUserName = document.getElementById('admin-mypage-user-name');

    function formatAmount(n) {
        if (n == null || n === '') return '-';
        return new Intl.NumberFormat('ko-KR').format(n) + '원';
    }
    function formatRate(n) {
        if (n == null || n === '') return '-';
        return n + '%';
    }

    async function openMypageModal(userId, userName) {
        currentTargetUserId = userId;
        mypageUserName.textContent = userName;
        mypageModal.classList.add('is-open');
        document.body.style.overflow = 'hidden';
        await loadMypageData();
    }

    function closeMypageModal() {
        mypageModal.classList.remove('is-open');
        document.body.style.overflow = '';
        currentTargetUserId = null;
    }

    async function loadMypageData() {
        if (!currentTargetUserId) return;
        try {
            var res = await fetch(API_BASE + '/admin/users/' + currentTargetUserId + '/mypage', {
                headers: getAuthHeaders()
            });
            var data = await res.json();
            if (!res.ok || !data.success) {
                alert(data.message || '데이터를 불러올 수 없습니다.');
                return;
            }
            mypageData = {
                general: data.data.general || [],
                subscription: data.data.subscription || [],
                dc: data.data.dc || []
            };
            renderMypageTab('general');
            renderMypageTab('subscription');
            renderMypageTab('dc');
            document.querySelectorAll('.admin-mypage-tab').forEach(function (t) { t.classList.remove('active'); });
            document.querySelector('.admin-mypage-tab[data-tab="general"]').classList.add('active');
            document.querySelectorAll('.admin-mypage-tab-content').forEach(function (c) { c.classList.remove('active'); });
            document.getElementById('tab-general').classList.add('active');
        } catch (e) {
            console.error(e);
            alert('데이터 로드 실패');
        }
    }

    function renderMypageTab(tab) {
        var tbody = document.getElementById('mypage-' + tab + '-tbody');
        if (!tbody) return;
        var items = mypageData[tab] || [];
        var html = '';
        if (tab === 'general') {
            items.forEach(function (it) {
                var d = it.contractDate ? new Date(it.contractDate).toISOString().slice(0, 10) : '';
                html += '<tr data-id="' + it._id + '">' +
                    '<td>' + (it.status === 'completed' ? '완료' : '진행중') + '</td>' +
                    '<td>' + d + '</td>' +
                    '<td>' + escapeHtml(it.companyName) + '</td>' +
                    '<td>' + escapeHtml(it.managerName) + '</td>' +
                    '<td>' + escapeHtml(it.projectName) + '</td>' +
                    '<td>' + formatAmount(it.totalAmount) + '</td>' +
                    '<td>' + escapeHtml((it.modificationList || '').slice(0, 30)) + '</td>' +
                    '<td><button type="button" class="admin-mypage-btn-edit" data-edit="general">수정</button>' +
                    '<button type="button" class="admin-mypage-btn-del" data-del="general">삭제</button></td></tr>';
            });
        } else if (tab === 'subscription') {
            items.forEach(function (it) {
                var d = it.contractDate ? new Date(it.contractDate).toISOString().slice(0, 10) : '';
                html += '<tr data-id="' + it._id + '">' +
                    '<td>' + escapeHtml(it.subscriptionType) + '</td>' +
                    '<td>' + escapeHtml(it.companyName) + '</td>' +
                    '<td>' + escapeHtml(it.managerName) + '</td>' +
                    '<td>' + escapeHtml(it.projectName) + '</td>' +
                    '<td>' + formatAmount(it.totalAmount) + '</td>' +
                    '<td>' + escapeHtml((it.modificationMemo || '').slice(0, 30)) + '</td>' +
                    '<td><button type="button" class="admin-mypage-btn-edit" data-edit="subscription">수정</button>' +
                    '<button type="button" class="admin-mypage-btn-del" data-del="subscription">삭제</button></td></tr>';
            });
        } else {
            items.forEach(function (it) {
                html += '<tr data-id="' + it._id + '">' +
                    '<td>' + escapeHtml(it.recommendedCompanyName) + '</td>' +
                    '<td>' + escapeHtml(it.managerName) + '</td>' +
                    '<td>' + escapeHtml(it.meetingStatus) + '</td>' +
                    '<td>' + escapeHtml(it.contractStatus) + '</td>' +
                    '<td>' + escapeHtml(it.contractName) + '</td>' +
                    '<td>' + formatRate(it.discountRate) + '</td>' +
                    '<td>' + formatRate(it.cumulativeDiscountRate) + '</td>' +
                    '<td><button type="button" class="admin-mypage-btn-edit" data-edit="dc">수정</button>' +
                    '<button type="button" class="admin-mypage-btn-del" data-del="dc">삭제</button></td></tr>';
            });
        }
        tbody.innerHTML = html || '<tr><td colspan="8" style="text-align:center;color:var(--text-light);">데이터 없음</td></tr>';
        tbody.querySelectorAll('.admin-mypage-btn-edit').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var tr = btn.closest('tr');
                var id = tr && tr.dataset.id;
                if (id) showEditForm(tab, id);
            });
        });
        tbody.querySelectorAll('.admin-mypage-btn-del').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var tr = btn.closest('tr');
                var id = tr && tr.dataset.id;
                if (id && confirm('삭제하시겠습니까?')) deleteItem(tab, id);
            });
        });
    }

    function showAddForm(tab) {
        var formWrap = document.getElementById('form-' + tab);
        formWrap.style.display = 'block';
        formWrap.dataset.mode = 'add';
        formWrap.dataset.editId = '';
        formWrap.innerHTML = buildFormHtml(tab, null);
        bindFormSubmit(tab, formWrap);
    }

    function showEditForm(tab, id) {
        var item = mypageData[tab].find(function (x) { return x._id === id; });
        if (!item) return;
        document.getElementById('form-general').style.display = 'none';
        document.getElementById('form-subscription').style.display = 'none';
        document.getElementById('form-dc').style.display = 'none';
        var formWrap = document.getElementById('form-' + tab);
        formWrap.style.display = 'block';
        formWrap.dataset.mode = 'edit';
        formWrap.dataset.editId = id;
        formWrap.innerHTML = buildFormHtml(tab, item);
        bindFormSubmit(tab, formWrap);
    }

    function buildFormHtml(tab, item) {
        var isEdit = !!item;
        if (tab === 'general') {
            var d = item && item.contractDate ? new Date(item.contractDate).toISOString().slice(0, 10) : '';
            return '<div class="form-row"><label>진행상태</label><select name="status"><option value="progress"' + (!isEdit || item.status === 'progress' ? ' selected' : '') + '>진행중</option><option value="completed"' + (isEdit && item.status === 'completed' ? ' selected' : '') + '>완료</option></select></div>' +
                '<div class="form-row"><label>계약일</label><input type="date" name="contractDate" value="' + (d || '') + '" required></div>' +
                '<div class="form-row"><label>회사명</label><input type="text" name="companyName" value="' + escapeHtml(item ? item.companyName : '') + '" required></div>' +
                '<div class="form-row"><label>담당자</label><input type="text" name="managerName" value="' + escapeHtml(item ? item.managerName : '') + '"></div>' +
                '<div class="form-row"><label>프로젝트</label><input type="text" name="projectName" value="' + escapeHtml(item ? item.projectName : '') + '"></div>' +
                '<div class="form-row"><label>누적금액</label><input type="number" name="totalAmount" value="' + (item ? item.totalAmount : 0) + '"></div>' +
                '<div class="form-row"><label>수정목록</label><textarea name="modificationList" rows="2">' + escapeHtml(item ? item.modificationList : '') + '</textarea></div>' +
                '<div class="form-actions"><button type="button" class="admin-mypage-btn-save">저장</button><button type="button" class="admin-mypage-btn-cancel">취소</button></div>';
        }
        if (tab === 'subscription') {
            var d = item && item.contractDate ? new Date(item.contractDate).toISOString().slice(0, 10) : '';
            return '<div class="form-row"><label>진행상태</label><select name="status"><option value="progress"' + (!isEdit || item.status === 'progress' ? ' selected' : '') + '>진행중</option><option value="completed"' + (isEdit && item.status === 'completed' ? ' selected' : '') + '>완료</option></select></div>' +
                '<div class="form-row"><label>구독타입</label><input type="text" name="subscriptionType" value="' + escapeHtml(item ? item.subscriptionType : '') + '"></div>' +
                '<div class="form-row"><label>계약일</label><input type="date" name="contractDate" value="' + (d || '') + '" required></div>' +
                '<div class="form-row"><label>회사명</label><input type="text" name="companyName" value="' + escapeHtml(item ? item.companyName : '') + '" required></div>' +
                '<div class="form-row"><label>담당자</label><input type="text" name="managerName" value="' + escapeHtml(item ? item.managerName : '') + '"></div>' +
                '<div class="form-row"><label>프로젝트</label><input type="text" name="projectName" value="' + escapeHtml(item ? item.projectName : '') + '"></div>' +
                '<div class="form-row"><label>누적금액</label><input type="number" name="totalAmount" value="' + (item ? item.totalAmount : 0) + '"></div>' +
                '<div class="form-row"><label>수정금액</label><textarea name="modificationMemo" rows="2">' + escapeHtml(item ? item.modificationMemo : '') + '</textarea></div>' +
                '<div class="form-actions"><button type="button" class="admin-mypage-btn-save">저장</button><button type="button" class="admin-mypage-btn-cancel">취소</button></div>';
        }
        if (tab === 'dc') {
            return '<div class="form-row"><label>추천회사</label><input type="text" name="recommendedCompanyName" value="' + escapeHtml(item ? item.recommendedCompanyName : '') + '"></div>' +
                '<div class="form-row"><label>담당자</label><input type="text" name="managerName" value="' + escapeHtml(item ? item.managerName : '') + '"></div>' +
                '<div class="form-row"><label>미팅여부</label><input type="text" name="meetingStatus" value="' + escapeHtml(item ? item.meetingStatus : '') + '"></div>' +
                '<div class="form-row"><label>계약여부</label><input type="text" name="contractStatus" value="' + escapeHtml(item ? item.contractStatus : '') + '"></div>' +
                '<div class="form-row"><label>계약명</label><input type="text" name="contractName" value="' + escapeHtml(item ? item.contractName : '') + '"></div>' +
                '<div class="form-row"><label>할인률</label><input type="number" name="discountRate" value="' + (item ? item.discountRate : 0) + '"></div>' +
                '<div class="form-row"><label>누적할인률</label><input type="number" name="cumulativeDiscountRate" value="' + (item ? item.cumulativeDiscountRate : 0) + '"></div>' +
                '<div class="form-actions"><button type="button" class="admin-mypage-btn-save">저장</button><button type="button" class="admin-mypage-btn-cancel">취소</button></div>';
        }
        return '';
    }

    function bindFormSubmit(tab, formWrap) {
        var saveBtn = formWrap.querySelector('.admin-mypage-btn-save');
        var cancelBtn = formWrap.querySelector('.admin-mypage-btn-cancel');
        if (cancelBtn) {
            cancelBtn.onclick = function () {
                formWrap.style.display = 'none';
            };
        }
        if (saveBtn) {
            saveBtn.onclick = function () {
                var form = formWrap;
                var mode = formWrap.dataset.mode;
                var editId = formWrap.dataset.editId;
                var payload = {};
                form.querySelectorAll('input, select, textarea').forEach(function (el) {
                    if (el.name) {
                        if (el.type === 'number') payload[el.name] = Number(el.value) || 0;
                        else payload[el.name] = el.value;
                    }
                });
                if (tab === 'general' || tab === 'subscription') {
                    payload.serviceType = tab;
                    if (!payload.contractDate) { alert('계약일을 입력하세요.'); return; }
                    if (!payload.companyName) { alert('회사명을 입력하세요.'); return; }
                }
                submitServiceForm(tab, mode, editId, payload, formWrap);
            };
        }
    }

    async function submitServiceForm(tab, mode, editId, payload, formWrap) {
        if (!currentTargetUserId) return;
        try {
            var url, method, body;
            if (tab === 'dc') {
                if (mode === 'add') {
                    url = API_BASE + '/admin/users/' + currentTargetUserId + '/dc';
                    method = 'POST';
                    body = payload;
                } else {
                    url = API_BASE + '/admin/users/' + currentTargetUserId + '/dc/' + editId;
                    method = 'PUT';
                    body = payload;
                }
            } else {
                if (mode === 'add') {
                    url = API_BASE + '/admin/users/' + currentTargetUserId + '/services';
                    method = 'POST';
                    body = payload;
                } else {
                    url = API_BASE + '/admin/users/' + currentTargetUserId + '/services/' + editId;
                    method = 'PUT';
                    body = payload;
                }
            }
            var res = await fetch(url, {
                method: method,
                headers: getAuthHeaders(),
                body: JSON.stringify(body)
            });
            var data = await res.json();
            if (!res.ok || !data.success) {
                alert(data.message || '저장 실패');
                return;
            }
            formWrap.style.display = 'none';
            await loadMypageData();
        } catch (e) {
            console.error(e);
            alert('저장 중 오류');
        }
    }

    async function deleteItem(tab, id) {
        if (!currentTargetUserId) return;
        try {
            var url;
            if (tab === 'dc') {
                url = API_BASE + '/admin/users/' + currentTargetUserId + '/dc/' + id;
            } else {
                url = API_BASE + '/admin/users/' + currentTargetUserId + '/services/' + id;
            }
            var res = await fetch(url, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            var data = await res.json();
            if (!res.ok || !data.success) {
                alert(data.message || '삭제 실패');
                return;
            }
            await loadMypageData();
        } catch (e) {
            console.error(e);
            alert('삭제 중 오류');
        }
    }

    document.querySelectorAll('.admin-mypage-tab').forEach(function (tab) {
        tab.addEventListener('click', function () {
            var t = this.dataset.tab;
            document.getElementById('form-general').style.display = 'none';
            document.getElementById('form-subscription').style.display = 'none';
            document.getElementById('form-dc').style.display = 'none';
            document.querySelectorAll('.admin-mypage-tab').forEach(function (x) { x.classList.remove('active'); });
            document.querySelector('.admin-mypage-tab[data-tab="' + t + '"]').classList.add('active');
            document.querySelectorAll('.admin-mypage-tab-content').forEach(function (x) { x.classList.remove('active'); });
            document.getElementById('tab-' + t).classList.add('active');
        });
    });

    document.getElementById('btn-add-general').addEventListener('click', function () {
        document.getElementById('form-subscription').style.display = 'none';
        document.getElementById('form-dc').style.display = 'none';
        showAddForm('general');
    });
    document.getElementById('btn-add-subscription').addEventListener('click', function () {
        document.getElementById('form-general').style.display = 'none';
        document.getElementById('form-dc').style.display = 'none';
        showAddForm('subscription');
    });
    document.getElementById('btn-add-dc').addEventListener('click', function () {
        document.getElementById('form-general').style.display = 'none';
        document.getElementById('form-subscription').style.display = 'none';
        showAddForm('dc');
    });

    if (mypageBackdrop) mypageBackdrop.addEventListener('click', closeMypageModal);
    if (mypageClose) mypageClose.addEventListener('click', closeMypageModal);
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && mypageModal && mypageModal.classList.contains('is-open')) {
            closeMypageModal();
        }
    });

    document.addEventListener('DOMContentLoaded', function () {
        var token = localStorage.getItem('specia-token');
        if (!token) {
            redirectToLogin();
            return;
        }
        loadUsers(1);
    });
})();
