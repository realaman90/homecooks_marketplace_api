const pickupAreaModel = require('../models/PickupArea');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const { default: mongoose } = require('mongoose');
const crypto = require('crypto')

const createPickUpArea  = async (req, res) => {

    const pickupAreaData = req.body;
    pickupAreaData.viewId = 'pickup_area_' + crypto.randomBytes(6).toString('hex');
    let pickupArea = null;
    try {
        pickupArea = await pickupAreaModel.create(pickupAreaData);
    } catch (err) {
        throw new CustomError.BadRequestError(err.message);
    }
    return res.status(StatusCodes.CREATED).json({ pickupArea });

}

const getAllPickupAreas  = async (req, res) => {

    const skip = req.query.skip ? Number(req.query.skip) : 0;
    const limit = req.query.limit ? Number(req.query.limit) : 10;

    let andQuery = [];

    // manage filters        
    if (req.query.search) {
        andQuery.push({
            "$or": [
                { name: { $regex: req.query.search, $options: 'i' }, },
                { text: { $regex: req.query.search, $options: 'i' }, },
                { 'fullAddress': { $regex: req.query.search, $options: 'i' }, },                
            ]
        })
    }

    const aggreagatePipelineQueries = [];
    if (andQuery.length > 0) {
        aggreagatePipelineQueries.push({
            "$match": {
                "$and": andQuery
            }
        })
    }
    aggreagatePipelineQueries.push({ "$sort": { "createdAt": -1 } })
    aggreagatePipelineQueries.push({ "$skip": skip })
    aggreagatePipelineQueries.push({ "$limit": limit })
    aggreagatePipelineQueries.push({
        "$project": {
            "_id": 1,
            "name": 1,
            "text": 1,
            "viewId":1,
            "fullAddress":1,            
            "createdAt": 1,
            "updatedAt": 1,
        }
    })

    let pickupAreas = await pickupAreaModel.aggregate(aggreagatePipelineQueries)

    return res.status(StatusCodes.OK).json({ pickupAreas });

}

const getById  = async (req, res) => {

    const pickupAreaId = req.params.pickupAreaId;

    let pickupArea = await pickupAreaModel.aggregate([{
        "$match": {
            "_id": mongoose.Types.ObjectId(pickupAreaId)
        }
    }, {
        "$project": {
            "_id": 1,
            "name": 1,
            "text": 1,
            "address": 1,
            "createdAt": 1,
            "updatedAt": 1,
        }
    }])

    if (pickupArea.length < 1) {
        throw new CustomError.BadRequestError('Invalid pickupArea Id');
    }

    return res.status(StatusCodes.OK).json({ pickupArea: pickupArea[0] });

}

const updatePickUpArea = async (req, res) => {

    const pickupAreaId = req.params.pickupAreaId;
    const updatePickupAreaData = req.body;

    let updateResp = null;

    try {
        updateResp = await pickupAreaModel.updateOne({
            _id: pickupAreaId
        }, {
            $set: updatePickupAreaData
        });
    } catch (err) {
        throw new CustomError.BadRequestError(err.message);
    }

    if (!updateResp.modifiedCount) {
        throw new CustomError.BadRequestError('Failed to update data');
    }

    return res.status(StatusCodes.OK).json({ msg: `Pickup Aread updated!` });

}

const removeById = async (req, res) => {

    const pickupAreaId = req.params.pickupAreaId;

    let deleteResp = null;

    try {
        deleteResp = await pickupAreaModel.deleteOne({
            $and: [
                { _id: pickupAreaId }
            ]
        });
    } catch (err) {
        throw new CustomError.BadRequestError(err.message);
    }

    if (!deleteResp.deletedCount) {
        throw new CustomError.BadRequestError('Failed remove the pickup area');
    }

    return res.status(StatusCodes.OK).json({ msg: `pickup area removed!` });

}

module.exports = {
    createPickUpArea,
    getAllPickupAreas,
    getById,
    updatePickUpArea,
    removeById
}