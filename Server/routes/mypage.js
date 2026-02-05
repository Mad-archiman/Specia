import express from 'express';
import UserService from '../models/UserService.js';
import DC from '../models/DC.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// 모든 mypage API는 로그인 필수
router.use(authenticateToken);

// 이용중인 서비스 개수 (일반형/구독형/D/C)
router.get('/services/counts', async (req, res) => {
    try {
        const [generalCount, subscriptionCount, dcCount] = await Promise.all([
            UserService.countDocuments({ userId: req.user._id, serviceType: 'general' }),
            UserService.countDocuments({ userId: req.user._id, serviceType: 'subscription' }),
            DC.countDocuments({ userId: req.user._id })
        ]);

        res.json({
            success: true,
            data: {
                general: generalCount,
                subscription: subscriptionCount,
                dc: dcCount
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '서비스 개수 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 서비스 추가 (테스트/데이터 입력용)
router.post('/services', async (req, res) => {
    try {
        const { serviceType, status, contractDate, companyName, managerName, projectName, totalAmount, modificationList } = req.body;

        if (!serviceType || !contractDate || !companyName) {
            return res.status(400).json({
                success: false,
                message: '서비스유형, 계약일, 회사명은 필수입니다.'
            });
        }

        const payload = {
            userId: req.user._id,
            serviceType: serviceType === 'subscription' ? 'subscription' : 'general',
            status: status === 'completed' ? 'completed' : 'progress',
            contractDate: new Date(contractDate),
            companyName,
            managerName: managerName || '',
            projectName: projectName || '',
            totalAmount: totalAmount || 0,
            modificationList: modificationList || ''
        };
        if (serviceType === 'subscription') {
            payload.subscriptionType = req.body.subscriptionType || '';
            payload.modificationMemo = req.body.modificationMemo || '';
        }
        const service = await UserService.create(payload);

        res.status(201).json({
            success: true,
            message: '서비스가 등록되었습니다.',
            data: service
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '서비스 등록 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 일반형 서비스 목록 (페이지네이션, 페이지당 10개)
router.get('/services/general', async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = 10;
        const skip = (page - 1) * limit;

        const [items, total] = await Promise.all([
            UserService.find({
                userId: req.user._id,
                serviceType: 'general'
            })
                .sort({ contractDate: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            UserService.countDocuments({
                userId: req.user._id,
                serviceType: 'general'
            })
        ]);

        const totalPages = Math.ceil(total / limit);

        res.json({
            success: true,
            data: {
                items,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '일반형 서비스 목록 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 구독형 서비스 목록 (페이지네이션, 페이지당 10개)
router.get('/services/subscription', async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = 10;
        const skip = (page - 1) * limit;

        const [items, total] = await Promise.all([
            UserService.find({
                userId: req.user._id,
                serviceType: 'subscription'
            })
                .sort({ contractDate: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            UserService.countDocuments({
                userId: req.user._id,
                serviceType: 'subscription'
            })
        ]);

        const totalPages = Math.ceil(total / limit);

        res.json({
            success: true,
            data: {
                items,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '구독형 서비스 목록 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// D/C 목록 (페이지네이션, 페이지당 10개)
router.get('/dc', async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = 10;
        const skip = (page - 1) * limit;

        const [items, total] = await Promise.all([
            DC.find({ userId: req.user._id })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            DC.countDocuments({ userId: req.user._id })
        ]);

        const totalPages = Math.ceil(total / limit);

        res.json({
            success: true,
            data: {
                items,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'D/C 목록 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// D/C 추가 (테스트용)
router.post('/dc', async (req, res) => {
    try {
        const { recommendedCompanyName, managerName, meetingStatus, contractStatus, contractName, discountRate, cumulativeDiscountRate } = req.body;

        const dc = await DC.create({
            userId: req.user._id,
            recommendedCompanyName: recommendedCompanyName || '',
            managerName: managerName || '',
            meetingStatus: meetingStatus || '',
            contractStatus: contractStatus || '',
            contractName: contractName || '',
            discountRate: discountRate || 0,
            cumulativeDiscountRate: cumulativeDiscountRate || 0
        });

        res.status(201).json({
            success: true,
            message: 'D/C가 등록되었습니다.',
            data: dc
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'D/C 등록 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

export default router;
