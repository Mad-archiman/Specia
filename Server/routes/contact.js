import express from 'express';
import Contact from '../models/Contact.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// 연락처 메시지 생성 (POST) - 비로그인 사용자도 문의 가능
router.post('/', async (req, res) => {
    try {
        const { name, email, phone, subject, message, category } = req.body || {};

        // 데이터 검증 (상세 연락처 폼: name, email, subject, message)
        const hasDetailForm = name != null && String(name).trim() && email != null && String(email).trim() && subject != null && String(subject).trim() && message != null && String(message).trim();
        if (!hasDetailForm) {
            return res.status(400).json({
                success: false,
                message: '필수 필드(회사/담당자명, 이메일, 제목, 내용)를 모두 입력해주세요.'
            });
        }

        const validCategory = ['general', 'service', 'partnership', 'support', 'other'].includes(category) ? category : 'general';

        const contact = new Contact({
            name: String(name).trim(),
            email: String(email).trim().toLowerCase(),
            phone: (phone != null ? String(phone) : '').trim(),
            subject: String(subject).trim(),
            message: String(message).trim(),
            category: validCategory
        });

        await contact.save();

        res.status(201).json({
            success: true,
            message: '메시지가 성공적으로 전송되었습니다',
            data: contact
        });
    } catch (error) {
        console.error('연락처 저장 오류:', error);
        if (error.name === 'ValidationError') {
            const firstError = error.errors && Object.values(error.errors)[0];
            return res.status(400).json({
                success: false,
                message: firstError ? firstError.message : '입력값을 확인해주세요.'
            });
        }
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다',
            error: error.message
        });
    }
});

// 모든 연락처 메시지 조회 (GET) - admin 전용, 페이지네이션(페이지당 최대 50건)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 50));
        const skip = (page - 1) * limit;

        const [contacts, total] = await Promise.all([
            Contact.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            Contact.countDocuments()
        ]);

        res.status(200).json({
            success: true,
            data: contacts,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error('연락처 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다',
            error: error.message
        });
    }
});

// 여러 문의 일괄 삭제 (DELETE) - admin 전용
router.delete('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: '삭제할 문의 ID 목록이 필요합니다.'
            });
        }
        const result = await Contact.deleteMany({ _id: { $in: ids } });
        res.status(200).json({
            success: true,
            message: `${result.deletedCount}개의 문의가 삭제되었습니다.`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error('문의 일괄 삭제 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다',
            error: error.message
        });
    }
});

// 특정 연락처 메시지 조회 (GET) - admin 전용
router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const contact = await Contact.findById(req.params.id);
        
        if (!contact) {
            return res.status(404).json({
                success: false,
                message: '메시지를 찾을 수 없습니다'
            });
        }

        res.status(200).json({
            success: true,
            data: contact
        });
    } catch (error) {
        console.error('연락처 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다',
            error: error.message
        });
    }
});

export default router;
