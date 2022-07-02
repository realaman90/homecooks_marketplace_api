const groupModel = require('../models/Group');
const bikerPickupPointModel = require('../models/BikerPickupPoint');
const clientPickupPointModel = require('../models/ClientPickupPoint');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const { default: mongoose } = require('mongoose');
const { groupStatus } = require('../constants');
const { pickWith_idFromObjectArray, convertIdArrayToObjectID} = require('../utils/array');

const createGroup = async (req, res)=> {

    const groupData = req.body;    
    let group = null;
    try {
        group = await groupModel.create(groupData);
    } catch(err){
        throw new CustomError.BadRequestError(err.message);
    }
    return res.status(StatusCodes.CREATED).json({ group });

}

const AttachPickUpPointsToGroups = async (groups) => {

    if (groups.length < 1){
        return groups
    }

    // get biker and client pickup information
    let bikerPickupIds = [];
    groups.forEach(g=>{
        bikerPickupIds = g.bikerPickups && g.bikerPickups.length > 0 ? g.bikerPickups.map((r)=>r.bikerPickupPoint) : [];
    })
    let clientPickupIds = [];
    groups.forEach(g=>{
        clientPickupIds = g.clientPickups && g.clientPickups.length > 0 ? g.clientPickups.map((r)=>r.clientPickupPoint): [];    
    })
    
    const getBikerPickupPromise = bikerPickupPointModel.find({_id: {$in: convertIdArrayToObjectID(bikerPickupIds)}});
    const getClientPickupPromise = clientPickupPointModel.find({_id: {$in: convertIdArrayToObjectID(clientPickupIds)}});
    const pickPointsRes = await Promise.all([getBikerPickupPromise, getClientPickupPromise]);
    // attach biker and client pickup information

    groups.forEach((g)=>{
        // console.log(g)
        g.bikerPickups.forEach(b=>{
            b.bikerPickupPoint = pickWith_idFromObjectArray(pickPointsRes[0], b.bikerPickupPoint)
        })

        g.clientPickups.forEach(b=>{
            b.clientPickupPoint = pickWith_idFromObjectArray(pickPointsRes[1], b.clientPickupPoint)
        })
    })      

}

const getAllGroups = async (req, res)=> {

    const skip = req.query.skip ? Number(req.query.skip) : 0;
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    
    let andQuery = [];

    // manage filters
    if (req.query.status){
        andQuery.push({
            status: req.query.status
        })
    }
    if (req.query.category){
        andQuery.push({
            category: req.query.category
        })
    }
    if (req.query.search){
        andQuery.push({
            "$or": [
                { itemName: { $regex: req.query.search, $options: 'i' },},
                { itemDescription: { $regex: req.query.search, $options: 'i' },},
                { cuisine: { $regex: req.query.search, $options: 'i' },},     
                { category: { $regex: req.query.search, $options: 'i' },},                
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
        "$lookup": {
          "from": "products",
          "localField": "product",
          "foreignField": "_id",
          "as": "product"
        }
    })
    aggreagatePipelineQueries.push({"$unwind": '$product'})
    aggreagatePipelineQueries.push({
        "$project":{
            "_id":1,
            "supplier.businessName":1,
            "supplier.businessImages":1,
            "supplier.address":1,
            "supplier.contactInfo":1,
            "product.name":1,
            "product.viewId":1,
            "product.images":1,
            "product.description":1,
            "product.cuisine":1,
            "product.category":1,
            "bikerPickups":1,
            "clientPickups":1,
            "itemName":1,
            "images":1,
            "activeTill":1,
            "pricePerOrder":1,
            "costToSupplierPerOrder":1,
            "pickupLocation":1,
            "category":1,
            "itemDescription":1,
            "maxOrders":1,
            "minOrders":1,
            "deliveryDate":1,
            "deliveryTime":1,
            "cuisine":1,
          }
    })

    let groups = await groupModel.aggregate(aggreagatePipelineQueries)
    
    await AttachPickUpPointsToGroups(groups);

    return res.status(StatusCodes.OK).json({ groups });

}

const getSupplierGroups = async (req, res) => {

    const supplierId = req.params.supplierId;
    const skip = req.query.skip ? Number(req.query.skip) : 0;
    const limit = req.query.limit ? Number(req.query.limit) : 10;

    let groups = await groupModel.aggregate([
        {
            "$match": {
                "supplier": mongoose.Types.ObjectId(supplierId)
            }
        },{
          "$sort": {"createdAt":-1}      
        },{
          "$skip": skip
        },{
          "$limit": limit
        },{
            "$lookup": {
            "from": "suppliers",
            "localField": "supplier",
            "foreignField": "_id",
            "as": "supplier"
          }
        },{
            "$unwind": '$supplier'
        },
        {
            "$lookup": {
                "from": "products",
                "localField": "product",
                "foreignField": "_id",
                "as": "product"
          }
        },{
            "$unwind": '$product'
        },
        {
          "$project":{
            "_id":1,
            "supplier.businessName":1,
            "supplier.businessImages":1,
            "supplier.address":1,
            "supplier.contactInfo":1,
            "product.name":1,
            "product.viewId":1,
            "product.images":1,
            "product.description":1,
            "product.cuisine":1,
            "product.category":1,
            "bikerPickups":1,
            "clientPickups":1,
            "itemName":1,
            "images":1,
            "activeTill":1,
            "pricePerOrder":1,
            "costToSupplierPerOrder":1,
            "pickupLocation":1,
            "category":1,
            "itemDescription":1,
            "maxOrders":1,
            "minOrders":1,
            "bikerPickups":1, 
            "clientPickups":1,
            "deliveryDate":1,
            "deliveryTime":1,
            "cuisine":1,
          }
        }])

    await AttachPickUpPointsToGroups(groups);
    
    return res.status(StatusCodes.OK).json({ groups });

}

const getGroupById = async (req, res)=> {

    const groupId = req.params.groupId;

    let groups = await groupModel.aggregate([
        {
            "$match": {
                "_id": mongoose.Types.ObjectId(groupId)
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
            "$lookup": {
                "from": "products",
                "localField": "product",
                "foreignField": "_id",
                "as": "product"
          }
        },{
            "$unwind": '$product'
        },{
          "$project":{
                "_id":1,
                "supplier.businessName":1,
                "supplier.businessImages":1,
                "supplier.address":1,
                "supplier.contactInfo":1,
                "product.name":1,
                "product.viewId":1,
                "product.images":1,
                "product.description":1,
                "product.cuisine":1,
                "product.category":1,
                "bikerPickups":1,
                "clientPickups":1,
                "itemName":1,
                "images":1,
                "activeTill":1,
                "pricePerOrder":1,
                "costToSupplierPerOrder":1,
                "pickupLocation":1,
                "category":1,
                "itemDescription":1,
                "maxOrders":1,
                "minOrders":1,
                "deliveryDate":1,
                "deliveryTime":1,
                "cuisine":1,
          }
        }])
    
    if (groups.length < 1){
        throw new CustomError.BadRequestError('Invalid Group Id');
    }

    await AttachPickUpPointsToGroups(groups);

    return res.status(StatusCodes.OK).json({ group: groups[0] });

}

const editGroup = async (req, res)=> {

    const groupId = req.params.groupId;
    const updateGroupData = req.body;

    let updateResp = null;

    try {
        updateResp = await groupModel.updateOne({
            _id: groupId
        }, {
            $set: updateGroupData
        });
    } catch(err) {
        throw new CustomError.BadRequestError(err.message);
    }

    if (!updateResp.modifiedCount){
        throw new CustomError.BadRequestError('Failed to update data');
    }

    return res.status(StatusCodes.OK).json({ msg: `Group data updated!` });

}

// hard delete
const deleteGroup = async (req, res)=> {

    const groupId = req.params.groupId;

    let deleteResp = null;

    try {
        deleteResp = await groupModel.deleteOne({
            $and : [
                {_id: groupId},
                {status: {$in: [groupStatus.PENDING, groupStatus.CANCELLED]}}
            ]
        });
    } catch(err) {
        throw new CustomError.BadRequestError(err.message);
    }

    if (!deleteResp.deletedCount){
        throw new CustomError.BadRequestError('Failed remove the group');
    }

    return res.status(StatusCodes.OK).json({ msg: `Group removed!` });

}

module.exports = {
    createGroup,
    getAllGroups,
    getGroupById,
    editGroup,
    deleteGroup,
    getSupplierGroups
}
