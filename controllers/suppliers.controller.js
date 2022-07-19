const User = require('../models/User');
const Supplier = require('../models/Supplier');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const crypto = require('crypto');

// Create a supplier
const createSupplier = async(req, res) => {
    const viewId = 'caterer_' + crypto.randomBytes(6).toString('hex');
    const {
        businessName,
        speciality,
        description,
        licenses,
        businessImages,
        address,
        contactInfo,
        pickupAddress,
        bankInfo
    } = req.body;
    if (!businessName || !address) {
        throw new CustomError.BadRequestError('businessName and address mandatory')
    }

    // registered user is an admin
    const supplier = await Supplier.create({
        businessName,
        viewId,
        speciality,
        description,
        licenses,
        businessImages,
        address,
        contactInfo,
        pickupAddress,
        bankInfo
    });

    res.status(StatusCodes.CREATED).json({ supplier });
};

// udpdate suppliers name and email
const updateSupplier = async(req, res) => {
    const { id: supplierId } = req.params;
    const {
        businessName,
        description,
        speciality,
        licenses,
        businessImages,
        address,
        contactInfo,
        pickupAddress,
        bankInfo
    } = req.body;
    if (!businessName || !contactInfo.businessPhone) {
        throw new CustomError.BadRequestError('Business Name and Phone mandatory')
    };

    const supplier = await Supplier.findOne({ _id: supplierId }).select('-password');
    if (!supplier) {
        throw new CustomError.NotFoundError(`Supplier with id: ${supplierId} not found`)
    }

    supplier.businessName = businessName;
    supplier.licenses = licenses;
    supplier.address = address;
    supplier.businessImages = businessImages;
    supplier.contactInfo = contactInfo;
    supplier.speciality = speciality;
    supplier.pickupAddress = pickupAddress;
    supplier.bankInfo = bankInfo;
    supplier.description = description;

    await supplier.save()
    res.status(StatusCodes.OK).json({ supplier })
}

// delete a supplier

const deleteSupplier = async(req, res) => {
    const supplier = await Supplier.findOneAndDelete({ _id: req.params.id });
    if (!supplier) {
        throw new CustomError.NotFoundError(`Supplier with id: ${supplierId} not found`)
    }
    res.status(StatusCodes.OK).json({ message: "Supplier permanently deleted" })

}

// get all suppliers

const getAllSuppliers = async(req, res) => {

    let query = {};

    const skip = req.query.skip ? Number(req.query.skip) : 0;
    const limit = req.query.limit ? Number(req.query.limit) : 10;

    if (req.query.search) {
        query = {
            $or: [
                { businessName: { $regex: req.query.search, $options: 'i' } },
                { speciality: { $regex: req.query.search, $options: 'i' } },
            ]
        }
    }

    const suppliers = await Supplier
        .find(query)
        .skip(skip)
        .limit(limit);

    res.status(StatusCodes.OK).json({ suppliers });
}

// get single supplier

const getSingleSupplier = async(req, res) => {
    const supplier = await Supplier.findOne({ _id: req.params.id });
    if (!supplier) {
        throw new CustomError.NotFoundError(`Supplier with id: ${req.params.id} not found`)
    }
    res.status(StatusCodes.OK).json({ supplier });
}


module.exports = {
    createSupplier,
    updateSupplier,
    deleteSupplier,
    getAllSuppliers,
    getSingleSupplier,
}