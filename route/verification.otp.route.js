const express = require('express');

const router = express.Router();

const {
    sendOTPOnPhone,
    verfyOTP
} = require('../controllers/verification.otp');

router.route('/sendOTP').post(sendOTPOnPhone);
router.route('/verifyOTP').post(verfyOTP);

module.exports = router