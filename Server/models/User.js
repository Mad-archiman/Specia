import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, '이름은 필수입니다.'],
    trim: true
  },
  email: {
    type: String,
    required: [true, '이메일은 필수입니다.'],
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  companyName: {
    type: String,
    trim: true,
    default: ''
  },
  memo: {
    type: String,
    trim: true,
    default: ''
  },
  password: {
    type: String,
    select: false
  },
  socialProvider: {
    type: String,
    enum: ['kakao', 'naver', 'google'],
    default: null
  },
  socialId: {
    type: String,
    default: null
  },
  userType: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 업데이트 시 updatedAt 자동 갱신
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// 비밀번호 암호화
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

const User = mongoose.model('User', userSchema);

export default User;
