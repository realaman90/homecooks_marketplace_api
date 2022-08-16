const newsLetterModel = require('../models/NewsLetter');
const { StatusCodes } = require('http-status-codes');

const Subscribe = async(req, res) => {
    const newsLetterData = req.body;
    let newsLetter = null;
    try {
        newsLetter = await newsLetterModel.create(newsLetterData);
    } catch (err) {
        throw new CustomError.BadRequestError(err.message);
    }
    return res.status(StatusCodes.CREATED).json({ ok: true });
}

module.exports = {
    Subscribe
}