import mongoose from 'mongoose';

const userServiceSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    serviceType: {
        type: String,
        enum: ['general', 'subscription'],
        required: true
    },
    status: {
        type: String,
        enum: ['progress', 'completed'],
        default: 'progress'
    },
    contractDate: {
        type: Date,
        required: true
    },
    companyName: {
        type: String,
        required: true,
        trim: true
    },
    managerName: {
        type: String,
        trim: true,
        default: ''
    },
    projectName: {
        type: String,
        trim: true,
        default: ''
    },
    totalAmount: {
        type: Number,
        default: 0
    },
    modificationList: {
        type: String,
        trim: true,
        default: ''
    },
    subscriptionType: {
        type: String,
        trim: true,
        default: ''
    },
    modificationMemo: {
        type: String,
        trim: true,
        default: ''
    }
}, {
    timestamps: true
});

userServiceSchema.index({ userId: 1, serviceType: 1 });

const UserService = mongoose.model('UserService', userServiceSchema);

export default UserService;
