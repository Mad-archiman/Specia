import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, '유효한 이메일 주소를 입력해주세요']
    },
    phone: {
        type: String,
        trim: true
    },
    subject: {
        type: String,
        required: [true, '제목을 입력해주세요'],
        trim: true
    },
    message: {
        type: String,
        required: [true, '메시지를 입력해주세요'],
        trim: true
    },
    category: {
        type: String,
        enum: ['general', 'service', 'partnership', 'support', 'other'],
        default: 'general'
    },
    status: {
        type: String,
        enum: ['pending', 'read', 'replied'],
        default: 'pending'
    }
}, {
    timestamps: true
});

const Contact = mongoose.model('Contact', contactSchema);

export default Contact;
