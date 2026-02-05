import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// 모든 사용자 조회
router.get('/', async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 특정 사용자 조회
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 사용자 생성
router.post('/', async (req, res) => {
  try {
    const { name, email } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ error: '이름과 이메일은 필수입니다.' });
    }

    const user = new User({ name, email });
    await user.save();
    res.status(201).json(user);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ error: '이미 존재하는 이메일입니다.' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// 사용자 업데이트
router.put('/:id', async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 사용자 삭제
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }
    res.json({ message: '사용자가 삭제되었습니다.', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
