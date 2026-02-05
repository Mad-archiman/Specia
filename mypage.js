// 마이페이지 전용 JavaScript
(function () {
    const API_BASE = (typeof window !== 'undefined' && window.API_BASE) ? window.API_BASE : 'http://localhost:5000/api';

    const boxGeneral = document.getElementById('box-general');
    const boxSubscription = document.getElementById('box-subscription');
    const countGeneral = document.getElementById('count-general');
    const countSubscription = document.getElementById('count-subscription');
    const generalModal = document.getElementById('general-modal');
    const modalBackdrop = document.getElementById('modal-backdrop');
    const modalClose = document.getElementById('modal-close');
    const generalListBody = document.getElementById('general-list-body');
    const generalEmpty = document.getElementById('general-empty');
    const generalPagination = document.getElementById('general-pagination');

    const subscriptionModal = document.getElementById('subscription-modal');
    const subscriptionModalBackdrop = document.getElementById('subscription-modal-backdrop');
    const subscriptionModalClose = document.getElementById('subscription-modal-close');
    const subscriptionListBody = document.getElementById('subscription-list-body');
    const subscriptionEmpty = document.getElementById('subscription-empty');
    const subscriptionPagination = document.getElementById('subscription-pagination');

    const boxDc = document.getElementById('box-dc');
    const countDc = document.getElementById('count-dc');
    const dcModal = document.getElementById('dc-modal');
    const dcModalBackdrop = document.getElementById('dc-modal-backdrop');
    const dcModalClose = document.getElementById('dc-modal-close');
    const dcListBody = document.getElementById('dc-list-body');
    const dcEmpty = document.getElementById('dc-empty');
    const dcPagination = document.getElementById('dc-pagination');

    let currentPage = 1;

    function getAuthHeaders() {
        const token = localStorage.getItem('specia-token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = 'Bearer ' + token;
        return headers;
    }

    function redirectToLogin() {
        if (!window.isLoggedIn || !window.isLoggedIn()) {
            window.location.href = 'login.html?redirect=' + encodeURIComponent('mypage.html');
        }
    }

    async function loadServiceCounts() {
        try {
            const res = await fetch(API_BASE + '/mypage/services/counts', {
                headers: getAuthHeaders()
            });
            if (res.status === 401) {
                redirectToLogin();
                return;
            }
            const data = await res.json();
            if (data.success) {
                countGeneral.textContent = data.data.general;
                countSubscription.textContent = data.data.subscription;
                if (countDc) countDc.textContent = data.data.dc != null ? data.data.dc : 0;
            }
        } catch (err) {
            console.error('서비스 개수 조회 실패:', err);
        }
    }

    function formatDate(dateStr) {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return y + '-' + m + '-' + day;
    }

    function formatAmount(amount) {
        if (amount == null || amount === '') return '-';
        return new Intl.NumberFormat('ko-KR').format(amount) + '원';
    }

    function formatRate(rate) {
        if (rate == null || rate === '') return '-';
        return rate + '%';
    }

    function renderGeneralList(items) {
        if (!items || items.length === 0) {
            generalListBody.innerHTML = '';
            generalEmpty.style.display = 'block';
            return;
        }
        generalEmpty.style.display = 'none';

        generalListBody.innerHTML = items.map((item, idx) => {
            const statusText = item.status === 'completed' ? '완료' : '진행중';
            const statusClass = item.status === 'completed' ? 'status-completed' : 'status-progress';
            const modList = item.modificationList || '';
            const hasMod = modList.trim().length > 0;

            return '<tr data-idx="' + idx + '">' +
                '<td><span class="' + statusClass + '">' + statusText + '</span></td>' +
                '<td>' + formatDate(item.contractDate) + '</td>' +
                '<td>' + (item.companyName || '-') + '</td>' +
                '<td>' + (item.managerName || '-') + '</td>' +
                '<td>' + (item.projectName || '-') + '</td>' +
                '<td>' + formatAmount(item.totalAmount) + '</td>' +
                '<td class="mypage-modification-cell">' +
                (hasMod
                    ? '<button type="button" class="mypage-modification-toggle" data-idx="' + idx + '" aria-expanded="false">' +
                    '수정목록 <span class="arrow">▼</span></button>' +
                    '<div class="mypage-modification-content" data-idx="' + idx + '">' +
                    escapeHtml(modList) + '</div>'
                    : '-') +
                '</td>' +
                '</tr>';
        }).join('');

        // 수정목록 토글 바인딩
        generalListBody.querySelectorAll('.mypage-modification-toggle').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                const idx = btn.getAttribute('data-idx');
                const content = generalListBody.querySelector('.mypage-modification-content[data-idx="' + idx + '"]');
                if (content) {
                    const isExpanded = content.classList.toggle('is-visible');
                    btn.classList.toggle('is-expanded', isExpanded);
                    btn.setAttribute('aria-expanded', isExpanded);
                }
            });
        });
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function renderPagination(pagination) {
        if (!pagination || pagination.totalPages <= 1) {
            generalPagination.innerHTML = '';
            return;
        }

        const page = pagination.page;
        const totalPages = pagination.totalPages;
        const total = pagination.total;

        let html = '';
        if (page > 1) {
            html += '<button type="button" data-page="' + (page - 1) + '">이전</button>';
        }
        html += '<span class="page-info">' + page + ' / ' + totalPages + ' (' + total + '건)</span>';
        if (page < totalPages) {
            html += '<button type="button" data-page="' + (page + 1) + '">다음</button>';
        }

        generalPagination.innerHTML = html;

        generalPagination.querySelectorAll('button').forEach(function (btn) {
            btn.addEventListener('click', function () {
                const p = parseInt(btn.getAttribute('data-page'), 10);
                if (p) loadGeneralList(p);
            });
        });
    }

    function renderSubscriptionPagination(pagination) {
        if (!pagination || pagination.totalPages <= 1) {
            subscriptionPagination.innerHTML = '';
            return;
        }
        const page = pagination.page;
        const totalPages = pagination.totalPages;
        const total = pagination.total;
        let html = '';
        if (page > 1) {
            html += '<button type="button" data-page="' + (page - 1) + '">이전</button>';
        }
        html += '<span class="page-info">' + page + ' / ' + totalPages + ' (' + total + '건)</span>';
        if (page < totalPages) {
            html += '<button type="button" data-page="' + (page + 1) + '">다음</button>';
        }
        subscriptionPagination.innerHTML = html;
        subscriptionPagination.querySelectorAll('button').forEach(function (btn) {
            btn.addEventListener('click', function () {
                const p = parseInt(btn.getAttribute('data-page'), 10);
                if (p) loadSubscriptionList(p);
            });
        });
    }

    function renderSubscriptionList(items) {
        if (!items || items.length === 0) {
            subscriptionListBody.innerHTML = '';
            subscriptionEmpty.style.display = 'block';
            return;
        }
        subscriptionEmpty.style.display = 'none';
        subscriptionListBody.innerHTML = items.map((item, idx) => {
            const modMemo = item.modificationMemo || '';
            const hasMod = modMemo.trim().length > 0;
            return '<tr data-idx="' + idx + '">' +
                '<td>' + (item.subscriptionType || '-') + '</td>' +
                '<td>' + (item.companyName || '-') + '</td>' +
                '<td>' + (item.managerName || '-') + '</td>' +
                '<td>' + (item.projectName || '-') + '</td>' +
                '<td>' + formatAmount(item.totalAmount) + '</td>' +
                '<td class="mypage-modification-cell">' +
                (hasMod
                    ? '<button type="button" class="mypage-modification-toggle" data-idx="' + idx + '" aria-expanded="false">' +
                    '수정금액 <span class="arrow">▼</span></button>' +
                    '<div class="mypage-modification-content" data-idx="' + idx + '">' +
                    escapeHtml(modMemo) + '</div>'
                    : '-') +
                '</td>' +
                '</tr>';
        }).join('');
        subscriptionListBody.querySelectorAll('.mypage-modification-toggle').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                const idx = btn.getAttribute('data-idx');
                const content = subscriptionListBody.querySelector('.mypage-modification-content[data-idx="' + idx + '"]');
                if (content) {
                    const isExpanded = content.classList.toggle('is-visible');
                    btn.classList.toggle('is-expanded', isExpanded);
                    btn.setAttribute('aria-expanded', isExpanded);
                }
            });
        });
    }

    function renderDcList(items) {
        if (!items || items.length === 0) {
            dcListBody.innerHTML = '';
            dcEmpty.style.display = 'block';
            return;
        }
        dcEmpty.style.display = 'none';
        dcListBody.innerHTML = items.map(function (item) {
            return '<tr>' +
                '<td>' + (item.recommendedCompanyName || '-') + '</td>' +
                '<td>' + (item.managerName || '-') + '</td>' +
                '<td>' + (item.meetingStatus || '-') + '</td>' +
                '<td>' + (item.contractStatus || '-') + '</td>' +
                '<td>' + (item.contractName || '-') + '</td>' +
                '<td>' + formatRate(item.discountRate) + '</td>' +
                '<td>' + formatRate(item.cumulativeDiscountRate) + '</td>' +
                '</tr>';
        }).join('');
    }

    function renderDcPagination(pagination) {
        if (!pagination || pagination.totalPages <= 1) {
            dcPagination.innerHTML = '';
            return;
        }
        const page = pagination.page;
        const totalPages = pagination.totalPages;
        const total = pagination.total;
        let html = '';
        if (page > 1) {
            html += '<button type="button" data-page="' + (page - 1) + '">이전</button>';
        }
        html += '<span class="page-info">' + page + ' / ' + totalPages + ' (' + total + '건)</span>';
        if (page < totalPages) {
            html += '<button type="button" data-page="' + (page + 1) + '">다음</button>';
        }
        dcPagination.innerHTML = html;
        dcPagination.querySelectorAll('button').forEach(function (btn) {
            btn.addEventListener('click', function () {
                const p = parseInt(btn.getAttribute('data-page'), 10);
                if (p) loadDcList(p);
            });
        });
    }

    async function loadGeneralList(page) {
        page = page || 1;
        currentPage = page;
        try {
            const res = await fetch(API_BASE + '/mypage/services/general?page=' + page, {
                headers: getAuthHeaders()
            });
            if (res.status === 401) {
                redirectToLogin();
                return;
            }
            const data = await res.json();
            if (data.success) {
                renderGeneralList(data.data.items);
                renderPagination(data.data.pagination);
            }
        } catch (err) {
            console.error('일반형 목록 조회 실패:', err);
        }
    }

    function openGeneralModal() {
        generalModal.classList.add('is-open');
        generalModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        loadGeneralList(1);
    }

    function closeGeneralModal() {
        generalModal.classList.remove('is-open');
        generalModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    async function loadSubscriptionList(page) {
        page = page || 1;
        try {
            const res = await fetch(API_BASE + '/mypage/services/subscription?page=' + page, {
                headers: getAuthHeaders()
            });
            if (res.status === 401) {
                redirectToLogin();
                return;
            }
            const data = await res.json();
            if (data.success) {
                renderSubscriptionList(data.data.items);
                renderSubscriptionPagination(data.data.pagination);
            }
        } catch (err) {
            console.error('구독형 목록 조회 실패:', err);
        }
    }

    function openSubscriptionModal() {
        subscriptionModal.classList.add('is-open');
        subscriptionModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        loadSubscriptionList(1);
    }

    function closeSubscriptionModal() {
        subscriptionModal.classList.remove('is-open');
        subscriptionModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    async function loadDcList(page) {
        page = page || 1;
        try {
            const res = await fetch(API_BASE + '/mypage/dc?page=' + page, {
                headers: getAuthHeaders()
            });
            if (res.status === 401) {
                redirectToLogin();
                return;
            }
            const data = await res.json();
            if (data.success) {
                renderDcList(data.data.items);
                renderDcPagination(data.data.pagination);
            }
        } catch (err) {
            console.error('D/C 목록 조회 실패:', err);
        }
    }

    function openDcModal() {
        dcModal.classList.add('is-open');
        dcModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        loadDcList(1);
    }

    function closeDcModal() {
        dcModal.classList.remove('is-open');
        dcModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    if (boxGeneral) {
        boxGeneral.addEventListener('click', function () {
            if (window.isLoggedIn && window.isLoggedIn()) {
                openGeneralModal();
            } else {
                redirectToLogin();
            }
        });
        boxGeneral.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                boxGeneral.click();
            }
        });
    }

    if (boxSubscription) {
        boxSubscription.addEventListener('click', function () {
            if (window.isLoggedIn && window.isLoggedIn()) {
                openSubscriptionModal();
            } else {
                redirectToLogin();
            }
        });
        boxSubscription.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                boxSubscription.click();
            }
        });
    }

    if (boxDc) {
        boxDc.addEventListener('click', function () {
            if (window.isLoggedIn && window.isLoggedIn()) {
                openDcModal();
            } else {
                redirectToLogin();
            }
        });
        boxDc.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                boxDc.click();
            }
        });
    }

    if (modalBackdrop) modalBackdrop.addEventListener('click', closeGeneralModal);
    if (modalClose) modalClose.addEventListener('click', closeGeneralModal);
    if (subscriptionModalBackdrop) subscriptionModalBackdrop.addEventListener('click', closeSubscriptionModal);
    if (subscriptionModalClose) subscriptionModalClose.addEventListener('click', closeSubscriptionModal);
    if (dcModalBackdrop) dcModalBackdrop.addEventListener('click', closeDcModal);
    if (dcModalClose) dcModalClose.addEventListener('click', closeDcModal);

    document.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape') return;
        if (generalModal && generalModal.classList.contains('is-open')) {
            closeGeneralModal();
        } else if (subscriptionModal && subscriptionModal.classList.contains('is-open')) {
            closeSubscriptionModal();
        } else if (dcModal && dcModal.classList.contains('is-open')) {
            closeDcModal();
        }
    });

    document.addEventListener('DOMContentLoaded', function () {
        if (window.isLoggedIn && window.isLoggedIn()) {
            loadServiceCounts();
        } else {
            redirectToLogin();
        }
    });

    // auth.js 로드 후 네비 갱신될 수 있으므로, 로그인 상태면 카운트 재로드
    setTimeout(function () {
        if (window.isLoggedIn && window.isLoggedIn()) {
            loadServiceCounts();
        }
    }, 500);
})();
