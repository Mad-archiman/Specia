import express from 'express';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import { authenticateToken, generateToken } from '../middleware/auth.js';

const router = express.Router();

// 이메일(아이디) 중복확인
router.get('/check-email', async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        available: false,
        message: '이메일을 입력해주세요.'
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });

    res.json({
      available: !existingUser,
      message: existingUser ? '이미 사용 중인 이메일입니다.' : '사용 가능한 이메일입니다.'
    });
  } catch (error) {
    res.status(500).json({
      available: false,
      message: '중복 확인 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 회원가입
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: '이름, 이메일, 비밀번호를 모두 입력해주세요.'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: '비밀번호는 8자 이상이어야 합니다.'
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '이미 가입된 이메일입니다.'
      });
    }

    const user = new User({
      name,
      email: email.toLowerCase(),
      password,
      phone: phone || ''
    });

    await user.save();

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: '회원가입이 완료되었습니다.',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType || 'user',
        token
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: '이미 가입된 이메일입니다.'
      });
    }
    res.status(500).json({
      success: false,
      message: '회원가입 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 로그인
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: '이메일과 비밀번호를 입력해주세요.'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '이메일 또는 비밀번호가 올바르지 않습니다.'
      });
    }

    if (!user.password) {
      return res.status(401).json({
        success: false,
        message: '소셜 로그인으로 가입된 계정입니다. 소셜 로그인을 이용해주세요.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: '이메일 또는 비밀번호가 올바르지 않습니다.'
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: '로그인 성공',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType || 'user',
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '로그인 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// JWT 토큰 검증 - 현재 로그인된 사용자 정보 반환
router.get('/me', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      userType: req.user.userType || 'user'
    }
  });
});

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5500';

// 카카오 OAuth 리다이렉트 (설정 필요)
router.get('/kakao', (req, res) => {
  const clientId = process.env.KAKAO_CLIENT_ID;
  if (!clientId) {
    return res.redirect(`${FRONTEND_URL}/login.html?error=kakao_not_configured`);
  }
  const redirectUri = encodeURIComponent(`${process.env.API_URL || 'http://localhost:5000'}/api/auth/kakao/callback`);
  res.redirect(`https://kauth.kakao.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code`);
});

// 네이버 OAuth 리다이렉트 (설정 필요)
router.get('/naver', (req, res) => {
  const clientId = process.env.NAVER_CLIENT_ID;
  if (!clientId) {
    return res.redirect(`${FRONTEND_URL}/login.html?error=naver_not_configured`);
  }
  const redirectUri = encodeURIComponent(`${process.env.API_URL || 'http://localhost:5000'}/api/auth/naver/callback`);
  const state = Math.random().toString(36).substring(7);
  res.redirect(`https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}`);
});

// 구글 OAuth 리다이렉트 (설정 필요)
router.get('/google', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return res.redirect(`${FRONTEND_URL}/login.html?error=google_not_configured`);
  }
  const redirectUri = encodeURIComponent(`${process.env.API_URL || 'http://localhost:5000'}/api/auth/google/callback`);
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=email%20profile`);
});

export default router;
