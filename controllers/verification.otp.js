const User = require('../models/User');
const { StatusCodes } = require('http-status-codes');
const customError = require('../errors');
const { sendOTP, createUserToken } = require('../utils');
const OTP = require('../models/OTP');



const sendOTPOnPhone = async(req, res) => {
    const { phone, reason } = req.body;

    const user = await User.findOne({ phone });

    if (!user) {
        throw new customError.BadRequestError('User Not found')
    }

    sendOTP(user, reason);

    res.status(StatusCodes.OK).json({ msg: "OTP sent on your phone" })
}
const verfyOTP = async(req, res) => {
    const { email, phone, otp } = req.body;
    //use redis for this in case we implement redis
    let user;
    if (!email) { user = await User.findOne({ phone }) } else { user = await User.findOne({ email }) };
    if (!user) {
        throw new customError.BadRequestError('user not found')
    }
    console.log(user);


    const dBOTP = await OTP.findOne({ user: user });
    if (!dBOTP) {
        throw new customError.BadRequestError('OTP not found');
    }
    if (!dBOTP.otp === otp) {
        throw new customError.BadRequestError('Invalid OTP')
    }
    if (email) { user.isEmailVerified = true; }
    if (phone) { user.isPhoneVerified = true; }
    await user.save();
    const token = createUserToken(user)
    res.status(StatusCodes.OK).json({ msg: "OTP verified", token })

}

module.exports = {
        sendOTPOnPhone,
        verfyOTP
    }
    // sendOtp function bangea
    // user phone number bhjega
    // I'll find the user from the db and assign OTP to that as well as I'll send the otp to users phone

// otp verfy con*
// user apna otp bhjega phone sahit fir yeh otp verify karwa do either model mein check password ki tarah function bana k ya yahin performance

//fir routes bano
// fir app