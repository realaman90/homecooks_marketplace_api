const User = require('../models/User');
const { StatusCodes } = require('http-status-codes');
const customError = require('../errors');
const { sendOTP, createUserToken } = require('../utils');

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

    const emailAlreadyExists = await User.findOne({ email });
    if (emailAlreadyExists) {
        throw new customError.BadRequestError('Email in use')
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

    const reason = 'First verification';
    sendOTP(user, reason);

    res.status(StatusCodes.CREATED).json({ msg: "OTP sent on your phone" });
};

const login = async(req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new customError.BadRequestError('Please provide email and password')
    }
    const user = await User.findOne({ email });
    if (!user) {
        throw new customError.UnauthenticatedError('Invalid Credentials')
    }
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
        throw new customError.UnauthenticatedError('Invalid Credentials')
    }

    const tokenUser = createUserToken(user);
    res.status(StatusCodes.OK).json({ user, token: tokenUser });
};


//reset Password initate send otp on the phone number
// create model
//user
//otp, expiry date, reason
// verify otp and reset password use phone no.
module.exports = {
    register,
    login,

}