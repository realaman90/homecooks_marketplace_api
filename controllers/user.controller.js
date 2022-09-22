const User = require('../models/User');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const crypto = require('crypto');
const { CreateStripeCustomer, SetupIntentFrCard } = require('../utils/stripe');

// Create a supplier or a customer
const registerUser = async(req, res) => {
    const userData = req.body;

    if (userData.role === 'user') {

        const chars = userData.fullName.substr(0, 3).toUpperCase();
        userData.viewId = 'CUS' + Math.floor(10000 + Math.random() * 90000) + chars;
        const emailAlreadyExists = await User.findOne({ email: userData.email });
        const phoneAlreadyExists = await User.findOneAndDelete({ phone: userData.phone });

        if (emailAlreadyExists || phoneAlreadyExists) {
            throw new CustomError.BadRequestError('Email or Phone is already registered in the platform')
        }

        // create stripe customer id
        userData.stripeCustId = await CreateStripeCustomer();

        const user = await User.create(userData);

        res.status(StatusCodes.CREATED).json({ user })

    } else {

        const emailAlreadyExists = await User.findOne({ email: userData.email });
        const phoneAlreadyExists = await User.findOneAndDelete({ phone: userData.phone });

        if (emailAlreadyExists || phoneAlreadyExists) {
            throw new CustomError.BadRequestError('Email or Phone is already registered in the platform')
        }

        const user = await User.create(userData);

        res.status(StatusCodes.CREATED).json({ user })
    }

};
const updateUser = async(req, res) => {
    const userId = req.user.userId;
    console.log(userId);

    const userData = req.body;
    const user = await User.findOne({ _id: userId }).select('-password');
    if (!user) {
        throw new CustomError.NotFoundError(`user with id: ${userId} not found`)
    }

    user.email = userData.email;
    user.fullName = userData.fullName;
    user.phone = userData.phone;
    await user.save()
    res.status(StatusCodes.OK).json({ user })
};
// update user's phone
const updateUserPhone = async(req, res) => {
    const { id: userId } = req.params;
    const { phone } = req.body;
    if (!phone) {
        throw new CustomError.BadRequestError("Please provide user's phone")
    };
    const user = await User.findOne({ _id: userId }).select('-password');
    if (!user) {
        throw new CustomError.NotFoundError(`user with id: ${userId} not found`)
    }
    user.phone = phone;
    await user.save();
    res.status(StatusCodes.OK).json({ user })
};

// update user's location
const updateUserAddress = async(req, res) => {
    const { id: userId } = req.params;
    const { address } = req.body;
    if (!address) {
        throw new CustomError.BadRequestError("Please provide user's address ")
    };
    const user = await User.findOne({ _id: userId }).select('-password');
    if (!user) {
        throw new CustomError.NotFoundError(`user with id: ${userId} not found`)
    }
    user.address = address;
    await user.save()

    res.status(StatusCodes.OK).json({ user })
};

// update user's notification settings
const updateUserNotificationSettings = async(req, res) => {
    const { id: userId } = req.params;
    const { notificationSettings } = req.body;
    if (!notificationSettings) {
        throw new CustomError.BadRequestError("Please provide user's notificaton settings")
    };
    const user = await User.findOne({ _id: userId }).select('-password');
    if (!user) {
        throw new CustomError.NotFoundError(`user with id: ${userId} not found`)
    }
    user.notificationSettings = notificationSettings;
    await user.save()

    res.status(StatusCodes.OK).json({ user })
};

// Update user's Password
const updateUserPassword = async(req, res) => {
    const { id: userId } = req.params;
    const { newPassword, oldPassword } = req.body;


    if (!newPassword || !oldPassword) {
        throw new CustomError.BadRequestError('Please provide both passwords')
    }
    const user = await User.findOne({ _id: userId });
    if (!user) {
        throw new CustomError.NotFoundError(`user with id: ${userId} not found`)
    }

    const isPasswordCorrect = await user.comparePassword(oldPassword);
    if (!isPasswordCorrect) {
        throw new CustomError.UnauthenticatedError('Invalid Credentials')
    };
    user.password = newPassword;
    await user.save();
    res.status(StatusCodes.OK).json({ message: 'Success! Password Updated' })
};

// delete a User

const deleteUser = async(req, res) => {
    const user = await User.findOneAndDelete({ _id: req.params.id });
    if (!user) {
        throw new CustomError.NotFoundError(`user with id: ${req.params.id } not found`)
    }
    res.status(StatusCodes.OK).json({ message: "user permanently deleted" })

};


//get all Users

const getAllUsers = async(req, res) => {
    const users = await User.find({ role: 'user' }).select('-password');
    res.status(StatusCodes.OK).json({ users });
};

//get single User

const getSingleUser = async(req, res) => {
    const user = await User.findOne({ _id: req.params.id });
    if (!user) {
        throw new CustomError.NotFoundError(`user with id: ${req.params.id} not found`)
    }
    res.status(StatusCodes.OK).json({ user });
};

const getAllCustomers = async(req, res) => {
    const users = await User.find({ role: "user" });
    if (!users) {
        throw new CustomError.NotFoundError(`users not found`)
    }
    res.status(StatusCodes.OK).json({ users });

};
const getSingleCustomer = async(req, res) => {
    const { id } = req.params;
    const user = await User.findOne({ _id: id });
    if (!user) {
        throw new CustomError.NotFoundError(`user with id: ${req.params.id} not found`)
    }
    res.status(StatusCodes.OK).json({ user });

};
const getUserBySupplierId = async(req, res) => {

    const user = await User.findOne({ supplier: req.params.id });
    if (!user) {
        throw new CustomError.NotFoundError(`user with id: ${req.params.id} not found`)
    }
    res.status(StatusCodes.OK).json({ user });
};
const updateUserBySupplierId = async(req, res) => {
    const userData = req.body;
    const user = await User.findOne({ supplier: req.params.id }, '-password');
    if (!user) {
        throw new CustomError.NotFoundError(`user with id: ${req.params.id} not found`)
    }
    user.fullName = userData.fullName;
    user.email = userData.email;
    user.profileImg = userData.profileImg;
    user.phone = userData.phone;
    user.address = userData.address;
    await user.save();


    res.status(StatusCodes.OK).json({ user });
};

// setup stripe cust id
const setStripeCustId = async(userId) => {

    const stripeCustId = await CreateStripeCustomer()

    const resp = await User.updateOne({
        _id: userId
    }, {
        stripeCustId,
        updatedAt: new Date()
    })

    console.log(resp);
}

// setStripeCustId("62f989526253b49a1bc0696a")




module.exports = {
    registerUser,
    updateUser,
    updateUserPhone,
    updateUserAddress,
    updateUserNotificationSettings,
    updateUserPassword,
    deleteUser,
    getAllUsers,
    getSingleUser,
    getAllCustomers,
    getSingleCustomer,
    getUserBySupplierId,
    updateUserBySupplierId,
}