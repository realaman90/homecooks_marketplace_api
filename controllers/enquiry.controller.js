const enquiryModel = require('../models/Enquiry');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');

const create = async(req, res) => {
    const enquiryData = req.body;
    let enquiry = null;
    try {
        enquiry = await enquiryModel.create(enquiryData);
    } catch (err) {
        throw new CustomError.BadRequestError(err.message);
    }
    return res.status(StatusCodes.CREATED).json({ ok: true });
}

module.exports = {
    create
}