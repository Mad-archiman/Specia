/**
 * API 기본 URL 설정
 * - 개발: localhost:5000 또는 같은 출처
 * - 배포: 현재 출처 기준 (같은 서버) 또는 window.API_BASE_URL로 재정의 가능
 *
 * 별도 API 서버 사용 시 HTML에 추가:
 * <script>window.API_BASE_URL = 'https://your-api-domain.com';</script>
 */
(function () {
    if (typeof window.API_BASE_URL === 'string' && window.API_BASE_URL.trim()) {
        window.API_BASE = window.API_BASE_URL.replace(/\/$/, '').trim() + '/api';
        return;
    }
    var host = window.location.hostname;
    var port = window.location.port;
    var isLocal = host === 'localhost' || host === '127.0.0.1';
    var base = isLocal && port !== '5000'
        ? 'http://localhost:5000'
        : '';
    window.API_BASE = base ? base + '/api' : '/api';
})();
