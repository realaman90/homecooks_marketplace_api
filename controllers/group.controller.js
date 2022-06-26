const groupModel = require('../models/Group');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const { default: mongoose } = require('mongoose');
const { groupStatus } = require('../constants');

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
    if (req.query.searchStr){
        andQuery.push({
            "$or": [
                { itemName: { $regex: req.query.searchStr, $options: 'i' },},
                { itemDescription: { $regex: req.query.searchStr, $options: 'i' },},
                { cuisine: { $regex: req.query.searchStr, $options: 'i' },},     
                { category: { $regex: req.query.searchStr, $options: 'i' },},                
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
            "supplier.businessName":1,
            "supplier.businessImages":1,
            "supplier.address":1,
            "supplier.contactInfo":1,
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
          "$project":{
            "_id":1,
            "supplier.businessName":1,
            "supplier.businessImages":1,
            "supplier.address":1,
            "supplier.contactInfo":1,
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
          "$project":{
            "_id":1,
            "supplier.businessName":1,
            "supplier.businessImages":1,
            "supplier.address":1,
            "supplier.contactInfo":1,
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