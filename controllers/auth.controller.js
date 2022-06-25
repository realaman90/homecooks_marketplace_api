const User = require('../models/User');
const { StatusCodes } = require('http-status-codes');
const customError = require('../errors');
const { attachedCookiesToResponse, createUserToken } = require('../utils');

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
        notificationSettings
    });
    const tokenUser = createUserToken(user);

    attachedCookiesToResponse({ res, user: tokenUser });
    res.status(StatusCodes.CREATED).json({ user });
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
    attachedCookiesToResponse({ res, user: tokenUser });
    res.status(StatusCodes.OK).json({ user });
};

const logout = async(req, res) => {
    res.cookie('token', 'logout', {
        httpOnly: true,
        expires: new Date(Date.now()),
    });
    res.status(StatusCodes.OK).json({ message: 'logged out' })
}
module.exports = {
    register,
    login,
    logout
}