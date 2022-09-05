
const { StatusCodes } = require('http-status-codes');
const User = require('../models/User');
const { SetupIntentFrCard } = require('../utils/stripe');

const setupIntent = async (req, res) => {

    const { stripeCustId } = await User.findById(req.user.userId, `stripeCustId`);

    const setupIntent = await SetupIntentFrCard(stripeCustId);

    return res.status(StatusCodes.CREATED).json({ setupIntent });

}

module.exports = {
    setupIntent
}