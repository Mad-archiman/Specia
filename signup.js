// 회원가입 페이지 전용 JavaScript (IIFE로 전역 변수 충돌 방지)
(function() {
const signupForm = document.getElementById('signup-form');
const phoneInput = document.getElementById('signup-phone');
const hamburgerBtn = document.querySelector('.hamburger');
const navMenuEl = document.querySelector('.nav-menu');
const navLinksEl = document.querySelectorAll('.nav-link');
const API_BASE = (typeof window !== 'undefined' && window.API_BASE) ? window.API_BASE : 'http://localhost:5000/api';

// 전화번호 자동 포맷 (한국 전화번호 형식)
if (phoneInput) {
    phoneInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/[^0-9]/g, '');
        let formatted = '';

        if (value.startsWith('02')) {
            // 서울: 02-XXX-XXXX 또는 02-XXXX-XXXX
            if (value.length <= 2) formatted = value;
            else if (value.length <= 5) formatted = value.slice(0, 2) + '-' + value.slice(2);
            else if (value.length <= 9) formatted = value.slice(0, 2) + '-' + value.slice(2, 5) + '-' + value.slice(5, 9);
            else formatted = value.slice(0, 2) + '-' + value.slice(2, 6) + '-' + value.slice(6, 10);
        } else if (value.startsWith('010') || value.startsWith('011') || value.startsWith('016') ||
                   value.startsWith('017') || value.startsWith('018') || value.startsWith('019')) {
            // 휴대폰: 010-XXXX-XXXX
            if (value.length <= 3) formatted = value;
            else if (value.length <= 7) formatted = value.slice(0, 3) + '-' + value.slice(3);
            else formatted = value.slice(0, 3) + '-' + value.slice(3, 7) + '-' + value.slice(7, 11);
        } else {
            // 지역번호: 031-XXX-XXXX 등
            if (value.length <= 3) formatted = value;
            else if (value.length <= 6) formatted = value.slice(0, 3) + '-' + value.slice(3);
            else formatted = value.slice(0, 3) + '-' + value.slice(3, 6) + '-' + value.slice(6, 10);
        }

        e.target.value = formatted;
    });
}

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

// 회원가입 폼 제출
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const password = document.getElementById('signup-password').value;
        const passwordConfirm = document.getElementById('signup-password-confirm').value;

        if (password !== passwordConfirm) {
            alert('비밀번호가 일치하지 않습니다.');
            return;
        }

        const btn = signupForm.querySelector('button[type="submit"]');
        const originalText = btn.textContent;
        btn.disabled = true;
        btn.textContent = '가입 중...';

        try {
            const response = await fetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: document.getElementById('signup-name').value,
                    email: document.getElementById('signup-email').value,
                    password: password,
                    phone: document.getElementById('signup-phone').value || undefined
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                alert('회원가입이 완료되었습니다! 로그인해주세요.');
                window.location.href = 'login.html';
            } else {
                alert(data.message || '회원가입에 실패했습니다.');
            }
        } catch (error) {
            console.error('회원가입 오류:', error);
            alert('서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.');
        } finally {
            btn.disabled = false;
            btn.textContent = originalText;
        }
    });
}

})();
