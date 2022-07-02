const bikerPickupPointModel = require('../models/BikerPickupPoint');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const { default: mongoose } = require('mongoose');

const createBikerPickupPoint = async (req, res) => {

    const bikerPickupPointData = req.body;        
    let bikerPickupPoint = null;
    try {
        bikerPickupPoint = await bikerPickupPointModel.create(bikerPickupPointData);
    } catch(err){
        throw new CustomError.BadRequestError(err.message);
    }
    return res.status(StatusCodes.CREATED).json({ bikerPickupPoint });
}

const getAllBikerPickupPoint = async (req, res) => {

    const skip = req.query.skip ? Number(req.query.skip) : 0;
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    
    let andQuery = [];

    // manage filters        
    if (req.query.search){
        andQuery.push({
            "$or": [
                { name: { $regex: req.query.search, $options: 'i' },},
                { text: { $regex: req.query.search, $options: 'i' },},
                { 'address.street': { $regex: req.query.search, $options: 'i' },},
                { 'address.appartment_house': { $regex: req.query.search, $options: 'i' },},     
                { 'address.city': { $regex: req.query.search, $options: 'i' },},   
                { 'address.state': { $regex: req.query.search, $options: 'i' },},                
            ]     
        })
    }

    const aggreagatePipelineQueries = [];
    if (andQuery.length > 0){
        aggreagatePipelineQueries.push({
            "$match": {
                "$and": andQuery
            }
        })
    }
    aggreagatePipelineQueries.push({"$sort": {"createdAt":-1}})
    aggreagatePipelineQueries.push({"$skip": skip})
    aggreagatePipelineQueries.push({"$limit": limit})    
    aggreagatePipelineQueries.push({
        "$lookup": {
          "from": "suppliers",
          "localField": "supplier",
          "foreignField": "_id",
          "as": "supplier"
        }
    })
    aggreagatePipelineQueries.push({"$unwind": '$supplier'})
    aggreagatePipelineQueries.push({
        "$project":{
            "_id":1,
            "name":1,
            "supplier.businessName":1,
            "supplier.businessImages":1,
            "supplier.address":1,
            "supplier.contactInfo":1,
            "text":1,
            "address":1,
            "createdAt":1,
            "updatedAt":1,   
          }
    })

    let bikerPickupPoints = await bikerPickupPointModel.aggregate(aggreagatePipelineQueries)
    
    return res.status(StatusCodes.OK).json({ bikerPickupPoints });

}

const getAllBikerPickupPointForSupplier = async (req, res) => {

    const supplierId = req.params.supplierId;

    const skip = req.query.skip ? Number(req.query.skip) : 0;
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    
    let andQuery = [];

    andQuery.push({
        supplier: mongoose.Types.ObjectId(supplierId) 
    })

    // manage filters        
    if (req.query.search){
        andQuery.push({
            "$or": [
                { name: { $regex: req.query.search, $options: 'i' },},
                { text: { $regex: req.query.search, $options: 'i' },},
                { 'address.street': { $regex: req.query.search, $options: 'i' },},
                { 'address.appartment_house': { $regex: req.query.search, $options: 'i' },},     
                { 'address.city': { $regex: req.query.search, $options: 'i' },},   
                { 'address.state': { $regex: req.query.search, $options: 'i' },},                
            ]     
        })
    }

    const aggreagatePipelineQueries = [];
    if (andQuery.length > 0){
        aggreagatePipelineQueries.push({
            "$match": {
                "$and": andQuery
            }
        })
    }
    aggreagatePipelineQueries.push({"$sort": {"createdAt":-1}})
    aggreagatePipelineQueries.push({"$skip": skip})
    aggreagatePipelineQueries.push({"$limit": limit})    
    aggreagatePipelineQueries.push({
        "$lookup": {
          "from": "suppliers",
          "localField": "supplier",
          "foreignField": "_id",
          "as": "supplier"
        }
    })
    aggreagatePipelineQueries.push({"$unwind": '$supplier'})
    aggreagatePipelineQueries.push({
        "$project":{
            "_id":1,
            "name":1,
            "supplier.businessName":1,
            "supplier.businessImages":1,
            "supplier.address":1,
            "supplier.contactInfo":1,
            "text":1,
            "address":1,
            "createdAt":1,
            "updatedAt":1,   
          }
    })

    let bikerPickupPoints = await bikerPickupPointModel.aggregate(aggreagatePipelineQueries)
    
    return res.status(StatusCodes.OK).json({ bikerPickupPoints });

}

const getBikerPickupPoint = async (req, res) => {

    const bikerPickupPointId = req.params.bikerPickupPointId;

    let bikerPickupPoints = await bikerPickupPointModel.aggregate([
        {
            "$match": {
                "_id": mongoose.Types.ObjectId(bikerPickupPointId)
            } 
        },{        
          "$lookup": {
            "from": "suppliers",
            "localField": "supplier",
            "foreignField": "_id",
            "as": "supplier"
          }
        },{      
          "$unwind": '$supplier'      
        },{
          "$project":{                        
            "_id":1,
            "name":1,
            "supplier.businessName":1,
            "supplier.businessImages":1,
            "supplier.address":1,
            "supplier.contactInfo":1,
            "text":1,
            "address":1,
            "createdAt":1,
            "updatedAt":1,   
          }
        }])
    
    if (bikerPickupPoints.length < 1){
        throw new CustomError.BadRequestError('Invalid BikerPickupPoint Id');
    }

    return res.status(StatusCodes.OK).json({ bikerPickupPoint: bikerPickupPoints[0] });

}

const editBikerPickupPoint = async (req, res) => {

    const bikerPickupPointId = req.params.bikerPickupPointId;
    const updateBikerPickupPointData = req.body;

    let updateResp = null;

    try {
        updateResp = await bikerPickupPointModel.updateOne({
            _id: bikerPickupPointId
        }, {
            $set: updateBikerPickupPointData
        });
    } catch(err) {
        throw new CustomError.BadRequestError(err.message);
    }

    if (!updateResp.modifiedCount){
        throw new CustomError.BadRequestError('Failed to update data');
    }

    return res.status(StatusCodes.OK).json({ msg: `Biker Pickup point data updated!` });
}

const deleteBikerPickupPoint = async (req, res) => {

    const bikerPickupPointId = req.params.bikerPickupPointId;

    let deleteResp = null;

    try {
        deleteResp = await bikerPickupPointModel.deleteOne({
            $and : [
                {_id: bikerPickupPointId}                
            ]
        });
    } catch(err) {
        throw new CustomError.BadRequestError(err.message);
    }

    if (!deleteResp.deletedCount){
        throw new CustomError.BadRequestError('Failed remove the biker pickup point');
    }

    return res.status(StatusCodes.OK).json({ msg: `Biker pickup point removed!` });

}

module.exports = {
    createBikerPickupPoint,
    getAllBikerPickupPoint,
    getAllBikerPickupPointForSupplier,
    getBikerPickupPoint,
    editBikerPickupPoint,
    deleteBikerPickupPoint
}
