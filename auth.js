// 로그인 상태 관리 - JWT 토큰 기반
(function() {
    const API_BASE = (typeof window !== 'undefined' && window.API_BASE) ? window.API_BASE : 'http://localhost:5000/api';
    const TOKEN_KEY = 'specia-token';
    const USER_KEY = 'user';

    function getToken() {
        return localStorage.getItem(TOKEN_KEY);
    }

    function setAuth(token, user) {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    }

    function clearAuth() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    }

    // API 요청 시 토큰 포함 (다른 모듈에서 사용 가능)
    window.getAuthHeaders = function() {
        const token = getToken();
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = 'Bearer ' + token;
        return headers;
    };

    window.isLoggedIn = function() {
        return !!getToken();
    };

    window.logout = function() {
        clearAuth();
        window.location.reload();
    };

    async function validateToken() {
        const token = getToken();
        if (!token) return null;

        try {
            const res = await fetch(`${API_BASE}/auth/me`, {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            
            // 네트워크 에러 체크
            if (!res.ok) {
                // 401 Unauthorized는 토큰이 유효하지 않다는 의미이므로 정상적인 처리
                if (res.status === 401) {
                    clearAuth();
                    return null;
                }
                // 다른 HTTP 에러는 서버 문제일 수 있지만, 토큰은 유지
                const errorData = await res.json().catch(() => null);
                console.warn('토큰 검증 실패:', errorData?.message || res.statusText);
                // 서버 에러인 경우 토큰은 유지하고 null 반환 (오프라인 모드 지원)
                return null;
            }
            
            const data = await res.json();

            if (data.success) {
                setAuth(token, data.data);
                return data.data;
            }
            clearAuth();
            return null;
        } catch (err) {
            // 네트워크 에러인 경우 (서버가 꺼져있거나 연결 불가)
            if (err instanceof TypeError && err.message.includes('fetch')) {
                console.warn('서버에 연결할 수 없습니다. 오프라인 모드로 진행합니다.');
                // 네트워크 에러인 경우 토큰은 유지 (오프라인 모드 지원)
                // localStorage에 저장된 사용자 정보가 있으면 사용
                const savedUser = localStorage.getItem(USER_KEY);
                if (savedUser) {
                    try {
                        return JSON.parse(savedUser);
                    } catch (e) {
                        return null;
                    }
                }
                return null;
            }
            // 기타 에러는 토큰 삭제
            console.error('토큰 검증 오류:', err);
            clearAuth();
            return null;
        }
    }

    function updateNavForAuth(user) {
        const loginLink = document.querySelector('.nav-login');
        const welcomeSpan = document.querySelector('.nav-welcome');
        const navItem = (loginLink || welcomeSpan)?.closest('li');
        if (!navItem) return;

        if (user && user.name) {
            const isAdmin = user.userType === 'admin';
            if (isAdmin) {
                navItem.classList.add('nav-dropdown', 'nav-welcome-dropdown');
                navItem.innerHTML =
                    '<span class="nav-welcome-wrap">' +
                    '<a href="javascript:void(0)" class="nav-link nav-welcome">' + user.name + '님 환영합니다</a>' +
                    '<button type="button" class="nav-logout" onclick="logout()" aria-label="로그아웃">로그아웃</button>' +
                    '</span>' +
                    '<ul class="nav-dropdown-menu"><li><a href="admin-inquiries.html">문의관리</a></li><li><a href="admin-users.html">관리페이지</a></li></ul>';
            } else {
                navItem.classList.add('nav-dropdown', 'nav-welcome-dropdown');
                navItem.innerHTML =
                    '<span class="nav-welcome-wrap">' +
                    '<a href="javascript:void(0)" class="nav-link nav-welcome">' + user.name + '님 환영합니다</a>' +
                    '<button type="button" class="nav-logout" onclick="logout()" aria-label="로그아웃">로그아웃</button>' +
                    '</span>' +
                    '<ul class="nav-dropdown-menu"><li><a href="mypage.html">마이페이지</a></li></ul>';
            }
        } else {
            navItem.classList.remove('nav-dropdown', 'nav-welcome-dropdown');
            navItem.innerHTML = '<a href="login.html" class="nav-link nav-login">LOGIN</a>';
        }
    }

    async function init() {
        const user = await validateToken();
        updateNavForAuth(user);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
