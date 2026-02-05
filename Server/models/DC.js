import mongoose from 'mongoose';

const dcSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    recommendedCompanyName: {
        type: String,
        trim: true,
        default: ''
    },
    managerName: {
        type: String,
        trim: true,
        default: ''
    },
    meetingStatus: {
        type: String,
        trim: true,
        default: ''
    },
    contractStatus: {
        type: String,
        trim: true,
        default: ''
    },
    contractName: {
        type: String,
        trim: true,
        default: ''
    },
    discountRate: {
        type: Number,
        default: 0
    },
    cumulativeDiscountRate: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

dcSchema.index({ userId: 1 });

const DC = mongoose.model('DC', dcSchema);

export default DC;
