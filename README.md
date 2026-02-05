# SPECIA 웹사이트

클라이언트와 서버가 분리된 풀스택 웹 애플리케이션입니다.

## 프로젝트 구조

```
SPECIA-웹사이트/
├── Client/          # 프론트엔드 (React + Vite)
│   ├── src/
│   ├── package.json
│   └── vite.config.js
├── Server/          # 백엔드 (Node.js + Express)
│   ├── models/      # MongoDB 모델
│   ├── routes/      # API 라우트
│   ├── server.js
│   └── package.json
└── README.md
```

## 시작하기

### 사전 요구사항

- Node.js (v18 이상 권장)
- MongoDB Atlas 계정 및 클러스터

### 1. MongoDB Atlas 설정

1. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)에 가입하고 로그인
2. 새 클러스터 생성
3. "Database Access"에서 데이터베이스 사용자 생성
4. "Network Access"에서 IP 주소 추가 (개발 중에는 `0.0.0.0/0`로 모든 IP 허용 가능)
5. "Database" → "Connect" → "Connect your application" 선택
6. 연결 문자열 복사 (형식: `mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority`)

### 2. 환경 변수 설정

`Server` 폴더에 `.env` 파일을 생성하고 다음 내용을 추가하세요:

```env
MONGODB_URI=your_mongodb_atlas_connection_string_here
PORT=5000
```

`.env.example` 파일을 참고하세요.

### 3. 의존성 설치

#### 클라이언트
```bash
cd Client
npm install
```

#### 서버
```bash
cd Server
npm install
```

### 4. 실행

#### 개발 모드

**터미널 1 - 서버 실행:**
```bash
cd Server
npm run dev
```

**터미널 2 - 클라이언트 실행:**
```bash
cd Client
npm run dev
```

서버는 `http://localhost:5000`에서 실행되고, 클라이언트는 `http://localhost:3000`에서 실행됩니다.

#### 프로덕션 모드

**서버 빌드 및 실행:**
```bash
cd Server
npm start
```

**클라이언트 빌드:**
```bash
cd Client
npm run build
```

## API 엔드포인트

### 헬스 체크
- `GET /api/health` - 서버 상태 확인

### 테스트
- `GET /api/test` - API 및 데이터베이스 연결 상태 확인

### 사용자 관리 (예제)
- `GET /api/users` - 모든 사용자 조회
- `GET /api/users/:id` - 특정 사용자 조회
- `POST /api/users` - 새 사용자 생성
- `PUT /api/users/:id` - 사용자 정보 업데이트
- `DELETE /api/users/:id` - 사용자 삭제

## 기술 스택

### 클라이언트
- React 18
- Vite
- Axios

### 서버
- Node.js
- Express
- MongoDB (MongoDB Atlas)
- Mongoose

## 라이선스

MIT
