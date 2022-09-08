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
const editCuisine = async(req, res) => {
    const { id: cuisineId } = req.params
    console.log(cuisineId)
    const cuisineData = req.body;
    let cuisine = null;
    try {
        cuisine = await cuisineModel.updateOne({ _id: cuisineId }, {
            $set: cuisineData
        });

    } catch (error) {
        throw new CustomError.BadRequestError(`Cuisine with ${cuisineId} not found`);
    }
    return res.status(StatusCodes.OK).json({ msg: 'Cuisine Modified' });


}

const getAllCuisine = async(req, res) => {
    const cuisineList = await cuisineModel.find({}, `name image`);
    return res.status(StatusCodes.OK).json({ cuisineList });
}

module.exports = {
    createCuisine,
    getAllCuisine,
    editCuisine,
}