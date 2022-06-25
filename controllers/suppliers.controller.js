const User = require('../models/User');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');




// Create a supplier
const registerSupplier = async(req, res) => {
    const {
        fullName,
        email,
        password,
        phone,
        profileImg,
        sex,
        location,
        notificationSettings,
        businessName,
        licenses,
        businessImages
    } = req.body;

    const emailAlreadyExists = await User.findOne({ email });
    if (emailAlreadyExists) {
        throw new CustomError.BadRequestError('Email in use')
    }

    // registered user is an admin

    const role = 'supplier'
    const user = await User.create({
        fullName,
        email,
        password,
        role,
        phone,
        profileImg,
        sex,
        location,
        notificationSettings,
        businessName,
        licenses,
        businessImages
    });

    res.status(StatusCodes.CREATED).json({ user });
};

// udpdate suppliers name and email
const updateSupplier = async(req, res) => {
    const { id: supplierId } = req.params;
    const {
        fullName,
        email,
        profileImg,
        sex,
    } = req.body;
    if (!email || !fullName) {
        throw new CustomError.BadRequestError('Please provide email & Full Name')
    };

    const user = await User.findOne({ _id: supplierId }).select('-password');
    if (!user) {
        throw new CustomError.NotFoundError(`Supplier with id: ${supplierId} not found`)
    }

    user.email = email;
    user.fullName = fullName;
    user.profileImg = profileImg;
    user.sex = sex;
    await user.save()
    res.status(StatusCodes.OK).json({ user })
}

// update supplier's phone
const updateSupplierPhone = async(req, res) => {
    const { id: supplierId } = req.params;
    const { phone } = req.body;
    if (!phone) {
        throw new CustomError.BadRequestError("Please provide Supplier's phone")
    };
    const user = await User.findOne({ _id: supplierId }).select('-password');
    if (!user) {
        throw new CustomError.NotFoundError(`Supplier with id: ${supplierId} not found`)
    }
    user.phone = phone;
    await user.save();
    res.status(StatusCodes.OK).json({ user })
}

// update supplier's location
const updateSupplierLocation = async(req, res) => {
    const { id: supplierId } = req.params;
    const { location } = req.body;
    if (!location) {
        throw new CustomError.BadRequestError("Please provide Supplier's location ")
    };
    const user = await User.findOne({ _id: supplierId }).select('-password');
    if (!user) {
        throw new CustomError.NotFoundError(`Supplier with id: ${supplierId} not found`)
    }
    user.location = location;
    await user.save()

    res.status(StatusCodes.OK).json({ user })
}

// update supplier's notification settings
const updateSupplierNotificationSettings = async(req, res) => {
    const { id: supplierId } = req.params;
    const { notificationSettings } = req.body;
    if (!notificationSettings) {
        throw new CustomError.BadRequestError("Please provide Supplier's notificaton settings")
    };
    const user = await User.findOne({ _id: supplierId }).select('-password');
    if (!user) {
        throw new CustomError.NotFoundError(`Supplier with id: ${supplierId} not found`)
    }
    user.notificationSettings = notificationSettings;
    await user.save()

    res.status(StatusCodes.OK).json({ user })
};

// update supplier's businessName, licenses, businessImages
const updateSupplierBusinessDetails = async(req, res) => {
    const { id: supplierId } = req.params;
    const { businessName, licenses, businessImages } = req.body;
    if (!businessName || !licenses || !businessImages) {
        throw new CustomError.BadRequestError("Please provide  Business Name, Licenses & Business Images")
    };
    const user = await User.findOne({ _id: supplierId }).select('-password');
    if (!user) {
        throw new CustomError.NotFoundError(`Supplier with id: ${supplierId} not found`)
    }
    user.businessName = businessName;
    user.licenses = licenses;
    user.businessImages = businessImages
    await user.save()

    res.status(StatusCodes.OK).json({ user })
};

// Update supplier's Password
const updateSupplierPassword = async(req, res) => {
    const { id: supplierId } = req.params;
    const { newPassword, oldPassword } = req.body;

    if (!newPassword || !oldPassword) {
        throw new CustomError.BadRequestError('Please provide both passwords')
    }
    const user = await User.findOne({ _id: supplierId });
    if (!user) {
        throw new CustomError.NotFoundError(`Supplier with id: ${supplierId} not found`)
    }

    const isPasswordCorrect = await user.comparePassword(oldPassword);
    if (!isPasswordCorrect) {
        throw new CustomError.UnauthenticatedError('Invalid Credentials')
    };
    user.password = newPassword;
    await user.save();
    res.status(StatusCodes.OK).json({ message: 'Success! Password Updated' })
}


// delete a supplier

const deleteSupplier = async(req, res) => {
    const user = await User.findOneAndDelete({ _id: req.params.id });
    if (!user) {
        throw new CustomError.NotFoundError(`Supplier with id: ${supplierId} not found`)
    }
    res.status(StatusCodes.OK).json({ message: "Supplier permanently deleted" })

}


//get all suppliers

const getAllSuppliers = async(req, res) => {
    const users = await User.find({ role: 'supplier' }).select('-password');
    res.status(StatusCodes.OK).json({ users });
}

//get single supplier

const getSingleSupplier = async(req, res) => {
    const user = await User.findOne({ _id: req.params.id });
    if (!user) {
        throw new CustomError.NotFoundError(`Supplier with id: ${req.params.id} not found`)
    }
    res.status(StatusCodes.OK).json({ user });
}


module.exports = {
    registerSupplier,
    updateSupplier,
    updateSupplierPhone,
    updateSupplierLocation,
    updateSupplierNotificationSettings,
    updateSupplierBusinessDetails,
    updateSupplierPassword,
    deleteSupplier,
    getAllSuppliers,
    getSingleSupplier,
}