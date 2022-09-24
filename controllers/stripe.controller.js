
const { StatusCodes } = require('http-status-codes');
const User = require('../models/User');
const { SetupIntentFrCard, FetchPaymentMethods, DetachPaymentMethod, AttachPaymentMethod } = require('../utils/stripe');

const setupIntent = async (req, res) => {
    const { stripeCustId } = await User.findById(req.user.userId, `stripeCustId`);
    const setupIntent = await SetupIntentFrCard(stripeCustId);
    return res.status(StatusCodes.CREATED).json({ setupIntent });
}

const paymentMethodList = async (req, res) => {
    const { stripeCustId } = await User.findById(req.user.userId, `stripeCustId`);
    const paymentMehods = await FetchPaymentMethods(stripeCustId);
    return res.status(StatusCodes.OK).json({ paymentMehods });
}

const detachPaymentMethod = async (req, res) => {
    await DetachPaymentMethod(req.params.payment_method)
    return res.status(StatusCodes.OK).json({ msg: "payment method detached!" });
}

const attachPaymentMethod = async (req, res) => {
    const { stripeCustId } = await User.findById(req.user.userId, `stripeCustId`);
    await AttachPaymentMethod(stripeCustId, req.params.payment_method)
    return res.status(StatusCodes.OK).json({ msg: "payment method attached!" });
}

module.exports = {
    setupIntent,
    paymentMethodList,
    detachPaymentMethod,
    attachPaymentMethod
}