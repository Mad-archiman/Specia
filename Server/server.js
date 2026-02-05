import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import userRoutes from './routes/users.js';
import companyRoutes from './routes/company.js';
import contactRoutes from './routes/contact.js';
import authRoutes from './routes/auth.js';
import servicesRoutes from './routes/services.js';
import mypageRoutes from './routes/mypage.js';
import adminUsersRoutes from './routes/adminUsers.js';
import User from './models/User.js';

// 환경 변수 로드
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// CORS - Heroku 배포 시 FRONTEND_URL(Vercel)만 허용, 개발은 모든 출처
const corsOptions = {
  origin: process.env.FRONTEND_URL || true, // FRONTEND_URL 없으면 모든 출처 허용
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB 연결 (모든 데이터가 MongoDB에 저장되도록 연결 후 서버 시작)
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI 환경 변수가 설정되지 않았습니다.');
  console.log('📝 Server/.env 파일에 MONGODB_URI를 추가해주세요.');
}

const startServer = () => {
  app.listen(PORT, () => {
    console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다.`);
    console.log(`📍 http://localhost:${PORT}`);
  });
};

mongoose.connect(MONGODB_URI || 'mongodb://localhost:27017/specia', {
  retryWrites: true,
  w: 'majority'
})
  .then(async () => {
    console.log('✅ MongoDB 연결 성공 (specia DB)');
    // 기존 사용자에게 userType 없으면 'user'로 설정 (MongoDB Compass에서 admin/user 구분용)
    try {
      const result = await User.updateMany(
        { userType: { $exists: false } },
        { $set: { userType: 'user' } }
      );
      if (result.modifiedCount > 0) {
        console.log(`📌 기존 사용자 ${result.modifiedCount}명에 userType: 'user' 적용됨`);
      }
    } catch (e) {
      console.warn('⚠️ userType 마이그레이션:', e.message);
    }
    startServer();
  })
  .catch((error) => {
    console.error('❌ MongoDB 연결 실패:', error.message);
    if (!MONGODB_URI) {
      console.log('💡 Server/.env에 MONGODB_URI를 설정해주세요.');
    }
    process.exit(1);
  });

// 기본 라우트
app.get('/api/health', (req, res) => {
  res.json({ 
    message: '서버가 정상적으로 작동 중입니다!',
    timestamp: new Date().toISOString()
  });
});

// API 라우트 예제
app.get('/api/test', async (req, res) => {
  try {
    // MongoDB 연결 상태 확인
    const dbStatus = mongoose.connection.readyState;
    const statusMessages = {
      0: '연결 안 됨',
      1: '연결됨',
      2: '연결 중',
      3: '연결 해제 중'
    };

    res.json({
      message: 'API 테스트 성공',
      database: statusMessages[dbStatus] || '알 수 없음',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API 라우트
app.use('/api/users', userRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/mypage', mypageRoutes);
app.use('/api/admin', adminUsersRoutes);

// 정적 파일 서빙 - 개발 환경에서만 (Vercel 배포 시 프론트는 별도 서빙)
if (process.env.NODE_ENV !== 'production') {
  const projectRoot = join(__dirname, '..');
  app.use(express.static(projectRoot));
}

// 에러 핸들링 미들웨어
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: '서버 오류가 발생했습니다.',
    message: err.message 
  });
});

// 404 핸들러
app.use((req, res) => {
  res.status(404).json({ error: '요청한 경로를 찾을 수 없습니다.' });
});

