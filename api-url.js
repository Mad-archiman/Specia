/**
 * 배포 환경 API URL 설정
 * - 로컬(localhost): 미설정 → api-config.js가 localhost:5000 사용
 * - Vercel 배포: 아래 YOUR_HEROKU_APP을 Heroku 앱 이름으로 교체
 *
 * 예: Heroku 앱이 specia-api 라면
 *     window.API_BASE_URL = 'https://specia-api.herokuapp.com';
 */
(function () {
    var host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') return; // 로컬 개발은 api-config.js 기본값 사용
    // 프로덕션: Heroku URL로 교체하세요
    window.API_BASE_URL = 'https://YOUR_HEROKU_APP.herokuapp.com';
})();
