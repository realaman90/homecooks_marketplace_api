const cuisineModel = require('../models/Cuisine');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');

const createCuisine = async(req, res) => {
    const cuisineData = req.body;
    let cuisine = null;
    try {
        cuisine = await cuisineModel.create(cuisineData);
    } catch (err) {
        throw new CustomError.BadRequestError(err.message);
    }
    return res.status(StatusCodes.CREATED).json({ cuisine });
}

const getAllCuisine = async(req, res) => {
    const cuisineList = await cuisineModel.find({}, `name image`);
    return res.status(StatusCodes.CREATED).json({ cuisineList });
}

module.exports = {
    createCuisine,
    getAllCuisine
}