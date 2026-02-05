// DOM 요소 선택
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');
const navLinks = document.querySelectorAll('.nav-link');
const contactFormEl = document.getElementById('contact-form');
const ctaButton = document.getElementById('cta-button');

// 모바일 메뉴 토글
if (hamburger) {
    hamburger.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        hamburger.classList.toggle('active');
    });
}

// 네비게이션 링크 클릭 시 모바일 메뉴 닫기
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        hamburger.classList.remove('active');
    });
});

// 스크롤 시 활성 네비게이션 링크 업데이트
const sections = document.querySelectorAll('section[id]');

function updateActiveNav() {
    const scrollY = window.pageYOffset;

    sections.forEach(section => {
        const sectionHeight = section.offsetHeight;
        const sectionTop = section.offsetTop - 100;
        const sectionId = section.getAttribute('id');

        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
            navLinks.forEach(link => {
                link.classList.remove('active');
                const href = link.getAttribute('href');
                if (href === `#${sectionId}`) {
                    link.classList.add('active');
                }
            });
        }
    });
}

window.addEventListener('scroll', updateActiveNav);

// 부드러운 스크롤
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        
        // 외부 링크(.html로 끝나는 경우)는 기본 동작 허용
        if (href && href.endsWith('.html')) {
            return; // 기본 링크 동작 허용
        }
        
        // 같은 페이지 내 앵커 링크인 경우에만 스크롤 처리
        if (href && href.startsWith('#')) {
            e.preventDefault();
            const targetId = href;
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const offsetTop = targetSection.offsetTop - 80;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        }
    });
});

// CTA 버튼 클릭 이벤트 - CONTACT 페이지로 이동
if (ctaButton) {
    ctaButton.addEventListener('click', () => {
        window.location.href = 'contact.html';
    });
}

// 연락처 폼 제출 처리 (메인 등 contact-form이 있는 페이지)
if (contactFormEl) {
    contactFormEl.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitButton = contactFormEl.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        
        // 로딩 상태
        submitButton.disabled = true;
        submitButton.textContent = '전송 중...';
        
        const formData = {
            subject: document.getElementById('subject').value,
            phone: document.getElementById('phone').value,
            message: document.getElementById('message').value
        };

        try {
            const response = await fetch((window.API_BASE || 'http://localhost:5000/api') + '/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // 성공 메시지 표시
                alert('메시지가 성공적으로 전송되었습니다!');
                // 폼 리셋
                contactFormEl.reset();
            } else {
                // 에러 메시지 표시
                alert(data.message || '메시지 전송에 실패했습니다. 다시 시도해주세요.');
            }
        } catch (error) {
            console.error('폼 제출 오류:', error);
            alert('서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.');
        } finally {
            // 버튼 상태 복원
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }
    });
}

// 스크롤 애니메이션
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// 관찰할 요소들
const animateElements = document.querySelectorAll('.service-card, .about-text');
animateElements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

const API_BASE_SERVICES = (typeof window !== 'undefined' && window.API_BASE) ? window.API_BASE : 'http://localhost:5000/api';

// 제공되는 서비스 API에서 불러와 렌더 (메인/SERVICE 페이지 공통)
function renderServiceCard(item, dataService) {
    const longDesc = (item.longDesc || '').trim();
    return `<div class="service-card" data-service="${dataService}">
        <div class="service-icon"><img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}"></div>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.shortDesc)}</p>
        <div class="service-card-description"><p>${escapeHtml(longDesc || item.shortDesc)}</p></div>
    </div>`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function loadAndRenderServices() {
    const grid = document.getElementById('services-grid');
    if (!grid) return;
    grid.innerHTML = '<p class="services-loading" style="text-align:center;padding:2rem;color:var(--text-light);">서비스를 불러오는 중...</p>';
    const defaultServices = [
        { title: '모델링', shortDesc: '사실적이고 디테일하며 엔지니어링 중심의 현실적인 모델링을 제공합니다.', image: 'assets/service-building.png', longDesc: '건축·인테리어·제품 등 다양한 분야의 3D 모델을 제작합니다. 설계 도면과 의도를 반영한 사실적인 표현으로 검토와 의사결정을 지원합니다.' },
        { title: '3D시뮬레이션, 프레젠테이션', shortDesc: '최신기술이 접목된 소개영상 및 프레젠테이션을 통해 회의를 성공적으로 이끕니다.', image: 'assets/service-presentation.png', longDesc: '프로젝트 소개 영상, 워크스루, 애니메이션을 제작합니다. 회의와 제안 시 시각 자료로 활용할 수 있어 효과적인 커뮤니케이션을 돕습니다.' },
        { title: 'AR기술 지원', shortDesc: 'AR비전을 통해 분야별 기술을 현실공간에 표현해 합리적인 협의결과를 도출합니다.', image: 'assets/service-ar.png', longDesc: '증강현실(AR)을 활용해 공간·제품을 실제 환경에서 확인할 수 있도록 합니다. 현장 검토와 클라이언트 협의 시 활용 가능합니다.' }
    ];
    try {
        const res = await fetch(`${API_BASE_SERVICES}/services`);
        const json = await res.json();
        if (res.ok && json.success && Array.isArray(json.data) && json.data.length > 0) {
            const dataServices = ['modeling', 'presentation', 'ar'];
            grid.innerHTML = json.data.slice(0, 3).map((item, i) => renderServiceCard(item, dataServices[i] || 'service')).join('');
        } else {
            const dataServices = ['modeling', 'presentation', 'ar'];
            grid.innerHTML = defaultServices.map((item, i) => renderServiceCard(item, dataServices[i])).join('');
        }
    } catch (err) {
        console.error('서비스 로드 오류:', err);
        const dataServices = ['modeling', 'presentation', 'ar'];
        grid.innerHTML = defaultServices.map((item, i) => renderServiceCard(item, dataServices[i])).join('');
    }
}
window.loadAndRenderServices = loadAndRenderServices;

// 제공되는 서비스 카드 클릭: 선택 시 나머지 흑백·블러·투명, 설명박스 표시 / 재클릭·외부클릭 시 해제
let serviceCardClickBound = false;
function initServiceCardSelection() {
    if (serviceCardClickBound) return;
    serviceCardClickBound = true;
    document.addEventListener('click', function (e) {
        const card = e.target.closest('.service-card');
        const grid = card ? card.closest('.services-grid') : null;
        if (card && grid) {
            e.stopPropagation();
            if (card.classList.contains('selected')) {
                grid.classList.remove('has-selection');
                card.classList.remove('selected');
            } else {
                grid.querySelectorAll('.service-card').forEach(c => c.classList.remove('selected'));
                grid.classList.add('has-selection');
                card.classList.add('selected');
            }
        } else {
            document.querySelectorAll('.services-grid').forEach(g => {
                g.classList.remove('has-selection');
                g.querySelectorAll('.service-card').forEach(c => c.classList.remove('selected'));
            });
        }
    });
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', async () => {
    updateActiveNav();
    await loadAndRenderServices();
    initServiceCardSelection();
});
