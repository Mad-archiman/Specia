import express from 'express';
import Company from '../models/Company.js';

const router = express.Router();

// 회사 정보 조회 (GET)
router.get('/', async (req, res) => {
    try {
        // 가장 최근에 저장된 회사 정보 조회
        const company = await Company.findOne().sort({ createdAt: -1 });
        
        if (!company) {
            return res.status(200).json({
                success: true,
                message: '등록된 회사 정보가 없습니다',
                data: null
            });
        }

        res.status(200).json({
            success: true,
            data: company
        });
    } catch (error) {
        console.error('회사 정보 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다',
            error: error.message
        });
    }
});

// 회사 정보 저장/업데이트 (POST)
router.post('/', async (req, res) => {
    try {
        const {
            companyName,
            description,
            vision,
            address,
            phone,
            email,
            website,
            values
        } = req.body;

        // 필수 필드 검증
        if (!companyName || !description) {
            return res.status(400).json({
                success: false,
                message: '회사명과 회사 설명은 필수 입력 항목입니다'
            });
        }

        // 기존 회사 정보 확인
        const existingCompany = await Company.findOne().sort({ createdAt: -1 });

        let company;
        if (existingCompany) {
            // 기존 정보 업데이트
            existingCompany.companyName = companyName;
            existingCompany.description = description;
            existingCompany.vision = vision || '';
            existingCompany.address = address || '';
            existingCompany.phone = phone || '';
            existingCompany.email = email || '';
            existingCompany.website = website || '';
            existingCompany.values = values || '';
            
            company = await existingCompany.save();
        } else {
            // 새 회사 정보 생성
            company = new Company({
                companyName,
                description,
                vision,
                address,
                phone,
                email,
                website,
                values
            });
            
            company = await company.save();
        }

        res.status(201).json({
            success: true,
            message: '회사 정보가 성공적으로 저장되었습니다',
            data: company
        });
    } catch (error) {
        console.error('회사 정보 저장 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다',
            error: error.message
        });
    }
});

export default router;
