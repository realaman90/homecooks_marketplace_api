//create
//delete
//Update

//get all catrers
//get single catrer
const User = require('../models/User');
const { StatusCodes } = require('http-status-codes');
const customError = require('../errors');
const { attachedCookiesToResponse, createUserToken } = require('../utils')



const register_caterer = async(req, res) => {
    const { fullName, email, password, phone, location, notificationSettings } = req.body;

    const emailAlreadyExists = await User.findOne({ email });
    if (emailAlreadyExists) {
        throw new customError.BadRequestError('Email in use')
    }

    // registered user is an admin

    const role = 'supplier'
    const user = await User.create({ fullName, email, password, role, phone, location, notificationSettings });
    const tokenUser = createUserToken(user);

    attachedCookiesToResponse({ res, user: tokenUser });
    res.status(StatusCodes.CREATED).json({ user });
};