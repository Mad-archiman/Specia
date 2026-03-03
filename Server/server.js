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
const isProduction = process.env.NODE_ENV === 'production' || process.env.PORT; // Heroku는 PORT 환경변수를 자동 설정

// 프로덕션 환경에서 필수 환경변수 체크 (경고만, 서버는 시작)
if (isProduction) {
  const requiredVars = ['MONGODB_ATLAS_URL', 'JWT_SECRET'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]?.trim());
  
  if (missingVars.length > 0) {
    console.warn('⚠️ [경고] 프로덕션 환경에서 필수 환경변수가 설정되지 않았습니다:');
    missingVars.forEach(varName => {
      console.warn(`   - ${varName}`);
    });
    console.warn('\n💡 해결 방법:');
    console.warn('   Heroku 대시보드 → Settings → Config Vars에서 다음을 설정하세요:');
    console.warn('   - MONGODB_ATLAS_URL: MongoDB Atlas 연결 문자열');
    console.warn('   - JWT_SECRET: JWT 토큰 암호화 키');
    console.warn('\n   또는 CLI로:');
    console.warn(`   heroku config:set MONGODB_ATLAS_URL="mongodb+srv://..." -a 앱이름`);
    console.warn(`   heroku config:set JWT_SECRET="your-secret-key" -a 앱이름`);
    console.warn('\n⚠️ 서버는 시작되지만 일부 기능이 작동하지 않을 수 있습니다.');
  }
}

// CORS - Heroku 배포 시 FRONTEND_URL(Vercel)만 허용, 개발은 모든 출처
const corsOptions = {
  origin: process.env.FRONTEND_URL || true, // FRONTEND_URL 없으면 모든 출처 허용
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB 연결 - MONGODB_ATLAS_URL 우선, 없을 때만 로컬 사용
const MONGODB_ATLAS_URL = process.env.MONGODB_ATLAS_URL?.trim() || '';
const MONGODB_URI = MONGODB_ATLAS_URL || 'mongodb://localhost:27017/specia';

if (!MONGODB_ATLAS_URL) {
  if (isProduction) {
    console.warn('⚠️ [경고] 프로덕션 환경에서 MONGODB_ATLAS_URL이 설정되지 않았습니다.');
    console.warn('   서버는 시작되지만 MongoDB 연결이 실패할 수 있습니다.');
  } else {
    console.log('📌 MONGODB_ATLAS_URL 미설정 → 로컬 MongoDB 사용 (mongodb://localhost:27017/specia)');
  }
} else {
  console.log('📌 MONGODB_ATLAS_URL 사용 (MongoDB Atlas)');
}

const startServer = () => {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SPECIA API] 서버가 포트 ${PORT}에서 실행 중입니다.`);
    console.log(`📍 http://localhost:${PORT}`);
    if (isProduction) {
      console.log(`🌐 프로덕션 모드로 실행 중`);
    }
  });
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[SPECIA API] ❌ 포트 ${PORT}이(가) 이미 사용 중입니다. 다른 프로그램을 종료하거나 .env에서 PORT를 변경하세요.`);
    } else {
      console.error('[SPECIA API] ❌ 서버 시작 실패:', err.message);
    }
    process.exit(1);
  });
};

// MongoDB 연결 함수
const connectMongoDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      retryWrites: true,
      w: 'majority',
      serverSelectionTimeoutMS: 10000, // 10초 타임아웃
      socketTimeoutMS: 45000
    });
    
    console.log('✅ MongoDB 연결 성공 (specia DB)');
    
    // 기존 사용자에게 userType 없으면 'user'로 설정
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
    
    return true;
  } catch (error) {
    console.error('❌ MongoDB 연결 실패:', error.message);
    if (isProduction) {
      console.error('\n💡 프로덕션 환경에서 MongoDB 연결이 필수입니다.');
      console.error('   Heroku Config Vars에서 MONGODB_ATLAS_URL을 확인하세요.');
      console.error('   연결 문자열 형식: mongodb+srv://사용자:비밀번호@클러스터주소/데이터베이스?retryWrites=true&w=majority');
    } else {
      console.log('💡 로컬 MongoDB가 실행 중인지 확인하세요. 또는 Server/.env에 MONGODB_ATLAS_URL를 설정해주세요.');
    }
    return false;
  }
};

// MongoDB 연결 이벤트 핸들러
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB 연결이 끊어졌습니다. 재연결을 시도합니다...');
  // 자동 재연결 시도
  if (MONGODB_ATLAS_URL) {
    setTimeout(() => {
      connectMongoDB().catch(err => {
        console.error('❌ MongoDB 재연결 실패:', err.message);
      });
    }, 5000); // 5초 후 재시도
  }
});

mongoose.connection.on('error', (error) => {
  console.error('❌ MongoDB 연결 오류:', error.message);
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB 재연결 성공');
});

// 예외 처리: 프로세스가 예기치 않게 종료되지 않도록 보호
process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('⚠️ Uncaught Exception:', error);
});

// ========== 모든 라우트를 먼저 등록한 뒤 서버 시작 ==========
// 루트(/) 요청 - 503 방지를 위해 서버가 반드시 응답
app.get('/', (req, res) => {
  res.json({
    message: 'SPECIA API 서버가 실행 중입니다.',
    health: '/api/health',
    timestamp: new Date().toISOString()
  });
});

// favicon 요청 - 204 No Content로 콘솔 오류 방지
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// 기본 라우트
app.get('/api/health', (req, res) => {
  res.json({ 
    message: '서버가 정상적으로 작동 중입니다!',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/test', async (req, res) => {
  try {
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

// 정적 파일 서빙 - 개발 환경에서만
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

// ========== 라우트 등록 후 서버 시작 ==========
try {
  startServer();
  console.log('✅ 서버 시작 완료');
} catch (error) {
  console.error('❌ 서버 시작 실패:', error.message);
}

// MongoDB 연결 시도 (비동기) - 서버와 무관하게 백그라운드에서만 실행
setTimeout(() => {
  connectMongoDB()
    .then((connected) => {
      if (!connected && isProduction) {
        console.warn('⚠️ MongoDB 연결 실패. 서버는 실행 중입니다.');
        console.warn('   MongoDB Atlas → Network Access → 0.0.0.0/0 허용 필요.');
        const retryInterval = setInterval(() => {
          if (MONGODB_ATLAS_URL && mongoose.connection.readyState === 0) {
            console.log('🔄 MongoDB 재연결 시도 중...');
            connectMongoDB()
              .then((reconnected) => {
                if (reconnected) {
                  console.log('✅ MongoDB 재연결 성공!');
                  clearInterval(retryInterval);
                }
              })
              .catch(() => {});
          }
        }, 30000);
      }
    })
    .catch((error) => {
      console.error('❌ MongoDB 연결 중 오류:', error.message);
    });
}, 100);

