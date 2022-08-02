const User = require('../models/User');
const { StatusCodes } = require('http-status-codes');
const customError = require('../errors');
const { sendOTP, createUserToken } = require('../utils');
const notificationController = require('./notification.controller');

const register = async(req, res) => {
    const {
        fullName,
        email,
        password,
        profileImg,
        phone,
        sex,
        location,
        notificationSettings
    } = req.body;

    const phoneAlreadyExists = await User.findOne({ phone });
    if (phoneAlreadyExists) {
        throw new customError.BadRequestError('Phone Number already registered')
    }

    // registered user is an admin

    const role = 'admin'
    const user = await User.create({
        fullName,
        email,
        password,
        profileImg,
        phone,
        sex,
        location,
        notificationSettings,
        role
    });

    const reason = 'Signup verification';
    sendOTP(user, reason);

    process.nextTick(()=>{
        // send welcome notification
        notificationController.CreateUserWelcomeNotification(user._id);
    })

    res.status(StatusCodes.CREATED).json({ msg: "OTP sent on your phone" });
};

const login = async(req, res) => {
    const { phone, password } = req.body;

    if (!phone || !password) {
        throw new customError.BadRequestError('Please provide phone and password')
    }
    const user = await User.findOne({ phone });
    if (!user) {
        throw new customError.BadRequestError('User not registerd')
    }
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
        throw new customError.UnauthenticatedError('Invalid Credentials')
    }
    if (!user.isPhoneVerified) {
        sendOTP(user, 'first verification');
        res.status(StatusCodes.OK).json({ msg: 'Please verify phone number' })
        return
    }
    const tokenUser = createUserToken(user);
    res.status(StatusCodes.OK).json({ user, token: tokenUser });
};

const resetPasswordOTP = async(req, res) => {
    const { phone } = req.body;
    const user = await User.findOne({ phone });
    if (!user) {
        throw new customError.BadRequestError('User not registerd')
    }
    sendOTP(user, 'Reset Password');
    res.status(StatusCodes.OK).json({ msg: 'Otp sent! Please verify' })
}
const resetPassword = async(req, res) => {
    const { phone, password } = req.body;
    const user = await User.findOne({ phone });
    if (!user) {
        throw new customError.BadRequestError('User not registerd')
    }
    user.password = password;
    await user.save();
    const token = createUserToken(user)
    res.status(StatusCodes.OK).json({ msg: 'Password changerd successfully', token })
}



//reset Password initate send otp on the phone number
// create model
//user
//otp, expiry date, reason
// verify otp and reset password use phone no.
module.exports = {
    register,
    login,
    resetPasswordOTP,
    resetPassword

}