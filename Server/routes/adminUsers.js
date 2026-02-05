import express from 'express';
import User from '../models/User.js';
import UserService from '../models/UserService.js';
import DC from '../models/DC.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);
router.use(requireAdmin);

// 유저 목록 (페이지당 20개)
router.get('/users', async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = 20;
        const skip = (page - 1) * limit;

        const [users, total] = await Promise.all([
            User.find({ userType: { $ne: 'admin' } })
                .select('-password')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            User.countDocuments({ userType: { $ne: 'admin' } })
        ]);

        res.json({
            success: true,
            data: {
                items: users,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '유저 목록 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 유저 회사명/메모 수정
router.put('/users/:id', async (req, res) => {
    try {
        const { companyName, memo } = req.body;

        const updateData = {};
        if (companyName !== undefined) updateData.companyName = String(companyName).trim();
        if (memo !== undefined) updateData.memo = String(memo).trim();
        updateData.updatedAt = Date.now();

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: '사용자를 찾을 수 없습니다.'
            });
        }

        res.json({
            success: true,
            message: '수정되었습니다.',
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '수정 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// === 유저 마이페이지 관리 (관리자용) ===

// 대상 유저의 마이페이지 데이터 전체 조회
router.get('/users/:userId/mypage', async (req, res) => {
    try {
        const targetUserId = req.params.userId;
        const targetUser = await User.findById(targetUserId).select('-password');
        if (!targetUser || targetUser.userType === 'admin') {
            return res.status(404).json({ success: false, message: '유저를 찾을 수 없습니다.' });
        }

        const [general, subscription, dc] = await Promise.all([
            UserService.find({ userId: targetUserId, serviceType: 'general' }).sort({ contractDate: -1 }).lean(),
            UserService.find({ userId: targetUserId, serviceType: 'subscription' }).sort({ contractDate: -1 }).lean(),
            DC.find({ userId: targetUserId }).sort({ createdAt: -1 }).lean()
        ]);

        res.json({
            success: true,
            data: {
                user: targetUser,
                general,
                subscription,
                dc
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '마이페이지 데이터 조회 실패.',
            error: error.message
        });
    }
});

// 서비스 추가 (일반형/구독형)
router.post('/users/:userId/services', async (req, res) => {
    try {
        const targetUserId = req.params.userId;
        const targetUser = await User.findById(targetUserId);
        if (!targetUser || targetUser.userType === 'admin') {
            return res.status(404).json({ success: false, message: '유저를 찾을 수 없습니다.' });
        }

        const { serviceType, status, contractDate, companyName, managerName, projectName, totalAmount, modificationList, subscriptionType, modificationMemo } = req.body;

        if (!serviceType || !contractDate || !companyName) {
            return res.status(400).json({ success: false, message: '서비스유형, 계약일, 회사명은 필수입니다.' });
        }

        const payload = {
            userId: targetUserId,
            serviceType: serviceType === 'subscription' ? 'subscription' : 'general',
            status: status === 'completed' ? 'completed' : 'progress',
            contractDate: new Date(contractDate),
            companyName,
            managerName: managerName || '',
            projectName: projectName || '',
            totalAmount: Number(totalAmount) || 0,
            modificationList: modificationList || ''
        };
        if (serviceType === 'subscription') {
            payload.subscriptionType = subscriptionType || '';
            payload.modificationMemo = modificationMemo || '';
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
            message: '서비스 등록 실패.',
            error: error.message
        });
    }
});

// 서비스 수정
router.put('/users/:userId/services/:serviceId', async (req, res) => {
    try {
        const { userId: targetUserId, serviceId } = req.params;
        const service = await UserService.findOne({ _id: serviceId, userId: targetUserId });
        if (!service) {
            return res.status(404).json({ success: false, message: '서비스를 찾을 수 없습니다.' });
        }

        const { status, contractDate, companyName, managerName, projectName, totalAmount, modificationList, subscriptionType, modificationMemo } = req.body;

        const update = {};
        if (status !== undefined) update.status = status === 'completed' ? 'completed' : 'progress';
        if (contractDate !== undefined) update.contractDate = new Date(contractDate);
        if (companyName !== undefined) update.companyName = companyName;
        if (managerName !== undefined) update.managerName = managerName;
        if (projectName !== undefined) update.projectName = projectName;
        if (totalAmount !== undefined) update.totalAmount = Number(totalAmount) || 0;
        if (modificationList !== undefined) update.modificationList = modificationList;
        if (subscriptionType !== undefined) update.subscriptionType = subscriptionType;
        if (modificationMemo !== undefined) update.modificationMemo = modificationMemo;

        const updated = await UserService.findByIdAndUpdate(serviceId, { $set: update }, { new: true }).lean();

        res.json({
            success: true,
            message: '수정되었습니다.',
            data: updated
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '수정 실패.',
            error: error.message
        });
    }
});

// 서비스 삭제
router.delete('/users/:userId/services/:serviceId', async (req, res) => {
    try {
        const { userId: targetUserId, serviceId } = req.params;
        const result = await UserService.deleteOne({ _id: serviceId, userId: targetUserId });
        if (result.deletedCount === 0) {
            return res.status(404).json({ success: false, message: '서비스를 찾을 수 없습니다.' });
        }
        res.json({ success: true, message: '삭제되었습니다.' });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '삭제 실패.',
            error: error.message
        });
    }
});

// D/C 추가
router.post('/users/:userId/dc', async (req, res) => {
    try {
        const targetUserId = req.params.userId;
        const targetUser = await User.findById(targetUserId);
        if (!targetUser || targetUser.userType === 'admin') {
            return res.status(404).json({ success: false, message: '유저를 찾을 수 없습니다.' });
        }

        const { recommendedCompanyName, managerName, meetingStatus, contractStatus, contractName, discountRate, cumulativeDiscountRate } = req.body;

        const dc = await DC.create({
            userId: targetUserId,
            recommendedCompanyName: recommendedCompanyName || '',
            managerName: managerName || '',
            meetingStatus: meetingStatus || '',
            contractStatus: contractStatus || '',
            contractName: contractName || '',
            discountRate: Number(discountRate) || 0,
            cumulativeDiscountRate: Number(cumulativeDiscountRate) || 0
        });

        res.status(201).json({
            success: true,
            message: 'D/C가 등록되었습니다.',
            data: dc
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'D/C 등록 실패.',
            error: error.message
        });
    }
});

// D/C 수정
router.put('/users/:userId/dc/:dcId', async (req, res) => {
    try {
        const { userId: targetUserId, dcId } = req.params;
        const dc = await DC.findOne({ _id: dcId, userId: targetUserId });
        if (!dc) {
            return res.status(404).json({ success: false, message: 'D/C를 찾을 수 없습니다.' });
        }

        const { recommendedCompanyName, managerName, meetingStatus, contractStatus, contractName, discountRate, cumulativeDiscountRate } = req.body;

        const update = {};
        if (recommendedCompanyName !== undefined) update.recommendedCompanyName = recommendedCompanyName;
        if (managerName !== undefined) update.managerName = managerName;
        if (meetingStatus !== undefined) update.meetingStatus = meetingStatus;
        if (contractStatus !== undefined) update.contractStatus = contractStatus;
        if (contractName !== undefined) update.contractName = contractName;
        if (discountRate !== undefined) update.discountRate = Number(discountRate) || 0;
        if (cumulativeDiscountRate !== undefined) update.cumulativeDiscountRate = Number(cumulativeDiscountRate) || 0;

        const updated = await DC.findByIdAndUpdate(dcId, { $set: update }, { new: true }).lean();

        res.json({
            success: true,
            message: '수정되었습니다.',
            data: updated
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '수정 실패.',
            error: error.message
        });
    }
});

// D/C 삭제
router.delete('/users/:userId/dc/:dcId', async (req, res) => {
    try {
        const { userId: targetUserId, dcId } = req.params;
        const result = await DC.deleteOne({ _id: dcId, userId: targetUserId });
        if (result.deletedCount === 0) {
            return res.status(404).json({ success: false, message: 'D/C를 찾을 수 없습니다.' });
        }
        res.json({ success: true, message: '삭제되었습니다.' });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '삭제 실패.',
            error: error.message
        });
    }
});

export default router;
