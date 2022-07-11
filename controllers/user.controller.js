const User = require('../models/User');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');

// Create a supplier
const registerUser = async(req, res) => {
    const {
        fullName,
        email,
        password,
        phone,
        address,
        notificationSettings,
        profileImg,
        sex,
        role,
        supplier
    } = req.body;

    const emailAlreadyExists = await User.findOne({ email });
    if (emailAlreadyExists) {
        throw new CustomError.BadRequestError('Email in use')
    }

    // registered user is an admin

    const user = await User.create({
        fullName,
        email,
        password,
        role,
        phone,
        address,
        notificationSettings,
        profileImg,
        sex,
        supplier

    });

    res.status(StatusCodes.CREATED).json({ user });
};
const updateUser = async(req, res) => {
    const { id: userId } = req.params;
    const {
        fullName,
        email,
        profileImg,
        sex,
    } = req.body;
    if (!email || !fullName) {
        throw new CustomError.BadRequestError('Please provide email & Full Name')
    };

    const user = await User.findOne({ _id: userId }).select('-password');
    if (!user) {
        throw new CustomError.NotFoundError(`user with id: ${userId} not found`)
    }

    user.email = email;
    user.fullName = fullName;
    user.profileImg = profileImg;
    user.sex = sex;
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

}

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
}