const clientPickupPointModel = require('../models/ClientPickupPoint');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const { default: mongoose } = require('mongoose');
const crypto = require('crypto')

const createClientPickupPoint = async(req, res) => {

    const clientPickupPointData = req.body;
    clientPickupPointData.viewId = 'custpickup_' + crypto.randomBytes(6).toString('hex');
    let clientPickupPoint = null;
    try {
        clientPickupPoint = await clientPickupPointModel.create(clientPickupPointData);
    } catch (err) {
        throw new CustomError.BadRequestError(err.message);
    }
    return res.status(StatusCodes.CREATED).json({ clientPickupPoint });
}

const getAllClientPickupPoint = async(req, res) => {

    const skip = req.query.skip ? Number(req.query.skip) : 0;
    const limit = req.query.limit ? Number(req.query.limit) : 10;

    let andQuery = [];

    // manage filters        
    if (req.query.search) {
        andQuery.push({
            "$or": [
                { name: { $regex: req.query.search, $options: 'i' }, },
                { text: { $regex: req.query.search, $options: 'i' }, },
                { 'address.street': { $regex: req.query.search, $options: 'i' }, },
                { 'address.appartment_house': { $regex: req.query.search, $options: 'i' }, },
                { 'address.city': { $regex: req.query.search, $options: 'i' }, },
                { 'address.state': { $regex: req.query.search, $options: 'i' }, },
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
        "$lookup": {
            "from": "pickupareas",
            "localField": "pickupArea",
            "foreignField": "_id",
            "as": "pickupArea"
        }
    })
    aggreagatePipelineQueries.push({
        "$unwind": '$pickupArea'
    })    
    aggreagatePipelineQueries.push({
        "$project": {            
            "_id": 1,            
            "pickupArea._id":1,
            "pickupArea.name":1,
            "pickupArea.text":1,
            "pickupArea.viewId":1,
            "pickupArea.fullAddress":1,
            "name": 1,
            "text": 1,
            "address": 1,
            "createdAt": 1,
            "updatedAt": 1,
        }
    })

    let clientPickupPoints = await clientPickupPointModel.aggregate(aggreagatePipelineQueries)

    return res.status(StatusCodes.OK).json({ clientPickupPoints });

}

const getClientPickupPoint = async(req, res) => {

    const clientPickupPointId = req.params.clientPickupPointId;

    let clientPickupPoints = await clientPickupPointModel.aggregate([{
        "$match": {
            "_id": mongoose.Types.ObjectId(clientPickupPointId)
        }
        },{ "$lookup": 
            {
            "from": "pickupareas",
            "localField": "pickupArea",
            "foreignField": "_id",
            "as": "pickupArea"
            }
        },{
            "$unwind": '$pickupArea'
        },{
        "$project": {
            "_id": 1,
            "pickupArea._id":1,
            "pickupArea.name":1,
            "pickupArea.text":1,
            "pickupArea.viewId":1,
            "pickupArea.fullAddress":1,
            "name": 1,
            "text": 1,
            "address": 1,
            "createdAt": 1,
            "updatedAt": 1,
        }
    }])

    if (clientPickupPoints.length < 1) {
        throw new CustomError.BadRequestError('Invalid ClientPickupPoint Id');
    }

    return res.status(StatusCodes.OK).json({ clientPickupPoint: clientPickupPoints[0] });

}

const editClientPickupPoint = async(req, res) => {

    const clientPickupPointId = req.params.clientPickupPointId;
    const updateClientPickupPointData = req.body;

    let updateResp = null;

    try {
        updateResp = await clientPickupPointModel.updateOne({
            _id: clientPickupPointId
        }, {
            $set: updateClientPickupPointData
        });
    } catch (err) {
        throw new CustomError.BadRequestError(err.message);
    }

    if (!updateResp.modifiedCount) {
        throw new CustomError.BadRequestError('Failed to update data');
    }

    return res.status(StatusCodes.OK).json({ msg: `Client Pickup point data updated!` });
}

const deleteClientPickupPoint = async(req, res) => {

    const clientPickupPointId = req.params.clientPickupPointId;

    let deleteResp = null;

    try {
        deleteResp = await clientPickupPointModel.deleteOne({
            $and: [
                { _id: clientPickupPointId }
            ]
        });
    } catch (err) {
        throw new CustomError.BadRequestError(err.message);
    }

    if (!deleteResp.deletedCount) {
        throw new CustomError.BadRequestError('Failed remove the client pickup point');
    }

    return res.status(StatusCodes.OK).json({ msg: `Client pickup point removed!` });

}

module.exports = {
    createClientPickupPoint,
    getAllClientPickupPoint,
    getClientPickupPoint,
    editClientPickupPoint,
    deleteClientPickupPoint
}