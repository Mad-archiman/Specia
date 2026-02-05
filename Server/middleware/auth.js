import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'specia-jwt-secret-key-change-in-production';

// JWT 토큰 검증 미들웨어
export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, message: '인증 토큰이 필요합니다.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: '토큰이 만료되었습니다. 다시 로그인해주세요.' });
    }
    return res.status(403).json({ success: false, message: '유효하지 않은 토큰입니다.' });
  }
};

// admin 권한 확인 (authenticateToken 이후 사용)
export const requireAdmin = (req, res, next) => {
  if (req.user && req.user.userType === 'admin') {
    return next();
  }
  return res.status(403).json({ success: false, message: '관리자 권한이 필요합니다.' });
};

export const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    JWT_SECRET,
    { expiresIn: '7d' } // 7일 유효
  );
};
