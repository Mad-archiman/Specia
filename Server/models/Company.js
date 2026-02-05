import mongoose from 'mongoose';

const companySchema = new mongoose.Schema({
    companyName: {
        type: String,
        required: [true, '회사명을 입력해주세요'],
        trim: true
    },
    description: {
        type: String,
        required: [true, '회사 설명을 입력해주세요'],
        trim: true
    },
    vision: {
        type: String,
        trim: true
    },
    address: {
        type: String,
        trim: true
    },
    phone: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, '유효한 이메일 주소를 입력해주세요']
    },
    website: {
        type: String,
        trim: true
    },
    values: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// 단일 회사 정보만 유지하기 위한 인덱스
companySchema.index({ createdAt: -1 });

const Company = mongoose.model('Company', companySchema);

export default Company;
