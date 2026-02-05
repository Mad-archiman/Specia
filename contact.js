// CONTACT 페이지 전용 JavaScript (IIFE로 전역 변수 충돌 방지)
(function () {
    const contactForm = document.getElementById('contact-form');
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    if (hamburger) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            hamburger.classList.toggle('active');
        });
    }

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            hamburger.classList.remove('active');
        });
    });

    document.addEventListener('DOMContentLoaded', () => {
        loadCompanyContactInfo();
    });

    async function loadCompanyContactInfo() {
        try {
            const response = await fetch((window.API_BASE || 'http://localhost:5000/api') + '/company');
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                    updateContactInfo(data.data);
                }
            }
        } catch (error) {
            console.log('회사 정보를 불러올 수 없습니다. 기본 정보를 표시합니다.');
        }
    }

    function updateMap(address) {
        const mapAddressText = document.getElementById('map-address-text');
        const mapLink = document.querySelector('.map-link');
        const mapIframe = document.getElementById('google-map-iframe');
        if (mapAddressText) mapAddressText.textContent = address;
        const encodedAddress = encodeURIComponent(address);
        const mapsSearchUrl = 'https://www.google.com/maps/search/?api=1&query=' + encodedAddress;
        const mapsEmbedUrl = 'https://www.google.com/maps?q=' + encodedAddress + '&hl=ko&z=16&output=embed';
        if (mapLink) mapLink.href = mapsSearchUrl;
        if (mapIframe) mapIframe.src = mapsEmbedUrl;
    }

    function updateContactInfo(companyData) {
        if (companyData.address) {
            document.getElementById('contact-address').textContent = companyData.address;
            updateMap(companyData.address);
        }
        if (companyData.phone) {
            document.getElementById('contact-phone').textContent = companyData.phone;
        }
        if (companyData.email) {
            document.getElementById('contact-email').textContent = companyData.email;
        }
        if (companyData.website) {
            const websiteElement = document.getElementById('contact-website');
            if (websiteElement) {
                websiteElement.textContent = companyData.website;
                websiteElement.parentElement.innerHTML = `
                    <div class="info-icon">🌐</div>
                    <div class="info-text">
                        <h3>웹사이트</h3>
                        <p><a href="${companyData.website}" target="_blank" style="color: var(--primary-color); text-decoration: none;">${companyData.website}</a></p>
                    </div>
                `;
            }
        }
    }

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitButton = contactForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        
        // 개인정보 동의 확인
        const privacyCheck = document.getElementById('contact-privacy');
        if (!privacyCheck.checked) {
            alert('개인정보 수집 및 이용에 동의해주세요.');
            return;
        }
        
        // 로딩 상태
        submitButton.disabled = true;
        submitButton.textContent = '전송 중...';
        
        const formData = {
            name: document.getElementById('contact-name').value,
            email: document.getElementById('contact-form-email').value,
            phone: document.getElementById('contact-phone-input').value || '',
            subject: document.getElementById('contact-subject').value,
            message: document.getElementById('contact-message').value,
            category: document.getElementById('contact-category').value
        };

        try {
            const response = await fetch((window.API_BASE || 'http://localhost:5000/api') + '/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            let data = {};
            try {
                data = await response.json();
            } catch (_) {
                data = { success: false, message: '서버 응답을 읽을 수 없습니다.' };
            }

            if (response.ok && data.success) {
                alert('문의가 성공적으로 전송되었습니다!\n빠른 시일 내에 답변드리겠습니다.');
                contactForm.reset();
            } else {
                alert(data.message || '문의 전송에 실패했습니다. 다시 시도해주세요.');
            }
        } catch (error) {
            console.error('폼 제출 오류:', error);
            alert('서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요. (주소: http://localhost:5000)');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }
        });
    }
})();
