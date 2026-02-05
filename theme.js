// 다크모드 / 라이트모드 토글 (라이트모드 기본)
(function() {
    const STORAGE_KEY = 'specia-theme';

    function getTheme() {
        return localStorage.getItem(STORAGE_KEY) || 'light';
    }

    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(STORAGE_KEY, theme);
        updateIcon(theme);
    }

    function toggleTheme() {
        const current = getTheme();
        const next = current === 'light' ? 'dark' : 'light';
        setTheme(next);
    }

    function updateIcon(theme) {
        const btn = document.getElementById('theme-toggle');
        if (!btn) return;
        btn.setAttribute('title', theme === 'light' ? '다크모드로 전환' : '라이트모드로 전환');
        // 전구 아이콘 (아이디어/라이트 불)
        btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 01.423-2.765L9 12.75l1.236.393a4.5 4.5 0 01.423 2.765v.996zM12 2.25c-4.97 0-9 3.694-9 8.25 0 2.518 1.11 4.797 2.872 6.344.434.38.718.89.718 1.456v2.7a.75.75 0 001.125.65l3.075-1.842a.75.75 0 01.375-.112h.632a.75.75 0 01.375.112l3.075 1.842a.75.75 0 001.125-.65v-2.7c0-.566.284-1.076.718-1.456C19.89 15.047 21 12.768 21 10.5c0-4.556-4.03-8.25-9-8.25z"/></svg>';
    }

    function init() {
        const theme = getTheme();
        document.documentElement.setAttribute('data-theme', theme);

        const btn = document.getElementById('theme-toggle');
        if (btn) {
            updateIcon(theme);
            btn.addEventListener('click', toggleTheme);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
