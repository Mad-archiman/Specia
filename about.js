// ABOUT 페이지 전용 JavaScript

// DOM 요소 선택
const companyInfoForm = document.getElementById('company-info-form');
const resetBtn = document.getElementById('reset-btn');
const companyInfoContent = document.getElementById('company-info-content');
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');
const navLinks = document.querySelectorAll('.nav-link');

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

// 페이지 로드 시 저장된 회사 정보 불러오기
document.addEventListener('DOMContentLoaded', () => {
    loadCompanyInfo();
});

// 회사 정보 불러오기
async function loadCompanyInfo() {
    try {
        const response = await fetch((window.API_BASE || 'http://localhost:5000/api') + '/company');
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
                displayCompanyInfo(data.data);
                fillForm(data.data);
            }
        }
    } catch (error) {
        console.log('회사 정보를 불러올 수 없습니다. 새로 등록해주세요.');
    }
}

// 회사 정보 표시
function displayCompanyInfo(data) {
    const html = `
        ${data.companyName ? `
            <div class="company-info-item">
                <h3>회사명</h3>
                <p>${data.companyName}</p>
            </div>
        ` : ''}
        
        ${data.description ? `
            <div class="company-info-item">
                <h3>회사 소개</h3>
                <p>${data.description}</p>
            </div>
        ` : ''}
        
        ${data.vision ? `
            <div class="company-info-item">
                <h3>비전</h3>
                <p>${data.vision}</p>
            </div>
        ` : ''}
        
        ${(data.address || data.phone || data.email || data.website) ? `
            <div class="company-info-item">
                <h3>연락처 정보</h3>
                <div class="company-contact-info">
                    ${data.address ? `<div class="contact-item"><strong>주소:</strong> ${data.address}</div>` : ''}
                    ${data.phone ? `<div class="contact-item"><strong>전화:</strong> ${data.phone}</div>` : ''}
                    ${data.email ? `<div class="contact-item"><strong>이메일:</strong> ${data.email}</div>` : ''}
                    ${data.website ? `<div class="contact-item"><strong>웹사이트:</strong> <a href="${data.website}" target="_blank">${data.website}</a></div>` : ''}
                </div>
            </div>
        ` : ''}
        
        ${data.values ? `
            <div class="company-info-item">
                <h3>핵심 가치</h3>
                <ul>
                    ${data.values.split(',').map(value => `<li>${value.trim()}</li>`).join('')}
                </ul>
            </div>
        ` : ''}
    `;
    
    companyInfoContent.innerHTML = html || '<div class="info-placeholder"><p>아직 등록된 회사 정보가 없습니다.</p></div>';
}

// 폼에 데이터 채우기
function fillForm(data) {
    document.getElementById('company-name').value = data.companyName || '';
    document.getElementById('company-description').value = data.description || '';
    document.getElementById('company-vision').value = data.vision || '';
    document.getElementById('company-address').value = data.address || '';
    document.getElementById('company-phone').value = data.phone || '';
    document.getElementById('company-email').value = data.email || '';
    document.getElementById('company-website').value = data.website || '';
    document.getElementById('company-values').value = data.values || '';
}

// 폼 제출 처리
if (companyInfoForm) {
    companyInfoForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitButton = companyInfoForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        
        // 로딩 상태
        submitButton.disabled = true;
        submitButton.textContent = '저장 중...';
        
        const formData = {
            companyName: document.getElementById('company-name').value,
            description: document.getElementById('company-description').value,
            vision: document.getElementById('company-vision').value,
            address: document.getElementById('company-address').value,
            phone: document.getElementById('company-phone').value,
            email: document.getElementById('company-email').value,
            website: document.getElementById('company-website').value,
            values: document.getElementById('company-values').value
        };

        try {
            const response = await fetch((window.API_BASE || 'http://localhost:5000/api') + '/company', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok && data.success) {
                alert('회사 정보가 성공적으로 저장되었습니다!');
                displayCompanyInfo(formData);
            } else {
                alert(data.message || '저장에 실패했습니다. 다시 시도해주세요.');
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

// 초기화 버튼
if (resetBtn) {
    resetBtn.addEventListener('click', () => {
        if (confirm('모든 입력 내용을 초기화하시겠습니까?')) {
            companyInfoForm.reset();
        }
    });
}
