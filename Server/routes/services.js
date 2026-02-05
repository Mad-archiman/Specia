import express from 'express';
import ServiceContent from '../models/ServiceContent.js';

const router = express.Router();

// 제공되는 서비스 조회 (GET) - 메인/SERVICE 페이지 공통
router.get('/', async (req, res) => {
  try {
    let doc = await ServiceContent.findOne();
    if (!doc) {
      doc = await ServiceContent.create({});
    }
    res.status(200).json({
      success: true,
      data: doc.services
    });
  } catch (error) {
    console.error('서비스 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '서비스를 불러오는 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 제공되는 서비스 수정 (PUT) - SERVICE 페이지 편집 저장
router.put('/', async (req, res) => {
  try {
    const { services } = req.body;
    if (!Array.isArray(services) || services.length === 0) {
      return res.status(400).json({
        success: false,
        message: '서비스 배열을 입력해주세요.'
      });
    }

    let doc = await ServiceContent.findOne();
    if (!doc) {
      doc = await ServiceContent.create({ services });
    } else {
      doc.services = services;
      await doc.save();
    }

    res.status(200).json({
      success: true,
      message: '서비스가 저장되었습니다.',
      data: doc.services
    });
  } catch (error) {
    console.error('서비스 저장 오류:', error);
    res.status(500).json({
      success: false,
      message: '서비스 저장 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

export default router;
