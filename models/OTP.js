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
        expires: 10 * 60 * 1000
    },
});
module.exports = mongoose.model('OTP', OtpSchema);