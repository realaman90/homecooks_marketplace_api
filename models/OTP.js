const mongoose = require('mongoose');

const OtpSchema = mongoose.Schema({
    user: {
        type: mongoose.Types.ObjectId,
        ref: 'User'
    },
    otp: {
        type: Number,
        required: true,
    },
    reason: String,
    createdAt: {
        type: Date,
        default: Date.now,
        expires: '10m'
    },
});
module.exports = mongoose.model('OTP', OtpSchema);