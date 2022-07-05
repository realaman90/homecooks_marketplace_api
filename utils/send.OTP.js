const twilioClient = require('./twilio.client');
const OTP = require('../models/OTP');
const sendOTP = async(userFromDB, reason) => {
    const fourDigitOTP = Math.floor(Math.random() * 9000);

    const message = `Hi! ${userFromDB.fullName}! Your verificaton code is ${fourDigitOTP}`;
    const otp = await OTP.create({
        user: userFromDB,
        otp: fourDigitOTP,
        reason
    });
    const response = await twilioClient.messages.create({
        from: process.env.TWILIO_PHONE_NUMBER,
        to: "+" + userFromDB.phone,
        body: message,
    });

}
module.exports = sendOTP;