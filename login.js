// LOGIN 페이지 전용 JavaScript (IIFE로 전역 변수 충돌 방지)
(function() {
// DOM 요소
const loginForm = document.getElementById('login-form');
const hamburgerBtn = document.querySelector('.hamburger');
const navMenuEl = document.querySelector('.nav-menu');
const navLinksEl = document.querySelectorAll('.nav-link');
const API_BASE = (typeof window !== 'undefined' && window.API_BASE) ? window.API_BASE : 'http://localhost:5000/api';
const urlParams = new URLSearchParams(window.location.search);

// 모바일 메뉴
if (hamburgerBtn) {
    hamburgerBtn.addEventListener('click', () => {
        navMenuEl.classList.toggle('active');
        hamburgerBtn.classList.toggle('active');
    });
}

navLinksEl.forEach(link => {
    link.addEventListener('click', () => {
        navMenuEl.classList.remove('active');
        hamburgerBtn.classList.remove('active');
    });
});

// 로그인 폼 제출
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const btn = loginForm.querySelector('button[type="submit"]');
        const originalText = btn.textContent;
        btn.disabled = true;
        btn.textContent = '로그인 중...';
        
        try {
            const response = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: document.getElementById('login-email').value,
                    password: document.getElementById('login-password').value
                })
            });
            
            if (!response.ok) {
                // 네트워크 에러가 아닌 HTTP 에러
                const errorData = await response.json().catch(() => ({ message: '로그인에 실패했습니다.' }));
                alert(errorData.message || '로그인에 실패했습니다.');
                return;
            }
            
            const data = await response.json();
            
            if (data.success) {
                localStorage.setItem('specia-token', data.data.token);
                localStorage.setItem('user', JSON.stringify({ id: data.data.id, name: data.data.name, email: data.data.email, userType: data.data.userType || 'user' }));
                alert('로그인 성공!');
                const redirect = urlParams.get('redirect');
                window.location.href = redirect && /^[a-zA-Z0-9_.-]+\.html$/.test(redirect) ? redirect : 'index.html';
            } else {
                alert(data.message || '로그인에 실패했습니다.');
            }
        } catch (error) {
            console.error('로그인 오류:', error);
            // 네트워크 에러인지 확인
            if (error instanceof TypeError && error.message.includes('fetch')) {
                alert('서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.');
            } else {
                alert('로그인 중 오류가 발생했습니다: ' + error.message);
            }
        } finally {
            btn.disabled = false;
            btn.textContent = originalText;
        }
    });
}

})();
