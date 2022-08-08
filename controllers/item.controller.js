const dishItemModel = require('../models/DishItem');
const orderModel = require('../models/Order');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const { default: mongoose } = require('mongoose');
const crypto = require('crypto');
const { eventStatus } = require('../constants');

const getAllItems = async(req, res) => {

    const skip = req.query.skip ? Number(req.query.skip) : 0;
    const limit = req.query.limit ? Number(req.query.limit) : 10;

    let andQuery = [];

    // manage filters    
    if (req.query.cuisine) {
        andQuery.push({
            cuisine: { $regex: req.query.cuisine, $options: 'i' }
        })
    }
    if (req.query.category) {
        andQuery.push({
            category: req.query.category
        })
    }
    if (req.query.search) {
        andQuery.push({
            "$or": [
                { name: { $regex: req.query.search, $options: 'i' }, },
                { description: { $regex: req.query.search, $options: 'i' }, },
                { viewId: { $regex: req.query.search, $options: 'i' }, },
                { cuisine: { $regex: req.query.search, $options: 'i' }, },
                { category: { $regex: req.query.search, $options: 'i' }, },
                { mealTags: { $elemMatch: { $regex: req.query.search } }, }
            ]
        })
    }

    console.log(andQuery)

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
            "from": "suppliers",
            "localField": "supplier",
            "foreignField": "_id",
            "as": "supplier"
        }
    })
    aggreagatePipelineQueries.push({ "$unwind": '$supplier' })
    aggreagatePipelineQueries.push({
        "$lookup": {
            "from": "bikerpickuppoints",
            "localField": "bikerPickupPoint",
            "foreignField": "_id",
            "as": "bikerPickupPoint"
        }
    })
    aggreagatePipelineQueries.push({ "$unwind": '$bikerPickupPoint' })
    aggreagatePipelineQueries.push({
        "$lookup": {
            "from": "clientpickuppoints",
            "localField": "clientPickups",
            "foreignField": "_id",
            "as": "clientPickups"
        }
    })
    aggreagatePipelineQueries.push({
        "$project": {
            "_id": 1,
            "bikerPickupPoint.name": 1,
            "bikerPickupPoint.text": 1,
            "bikerPickupPoint.viewId": 1,
            "bikerPickupPoint.address": 1,
            "bikerPickupPoint.suitableTimes": 1,
            "clientPickups.name": 1,
            "clientPickups.text": 1,
            "clientPickups.viewId": 1,
            "clientPickups.address": 1,
            "clientPickups.suitableTimes": 1,
            "supplier.businessName": 1,
            "supplier.businessImages": 1,
            "supplier.address": 1,
            "supplier.contactInfo": 1,
            "name": 1,
            "images": 1,
            "category": 1,
            "cuisine": 1,
            "mealTags": 1,
            "minOrders": 1,
            "maxOrders": 1,
            "pricePerOrder": 1,
            "costToSupplierPerOrder": 1,
            "description": 1,
            "eventDate": 1,
            "eventVisibilityDate": 1,
            "closingDate": 1,
        }
    })

    let items = await dishItemModel.aggregate(aggreagatePipelineQueries)

    return res.status(StatusCodes.OK).json({ items });

}

const getAllItemsBySupplier = async(req, res) => {

    const supplierId = req.params.supplierId;

    const skip = req.query.skip ? Number(req.query.skip) : 0;
    const limit = req.query.limit ? Number(req.query.limit) : 10;

    let andQuery = [];

    andQuery.push({
        supplier: mongoose.Types.ObjectId(supplierId)
    })

    // manage filters    
    if (req.query.cuisine) {
        andQuery.push({
            cuisine: { $regex: req.query.cuisine, $options: 'i' }
        })
    }
    if (req.query.category) {
        andQuery.push({
            category: req.query.category
        })
    }
    if (req.query.search) {
        andQuery.push({
            "$or": [
                { name: { $regex: req.query.search, $options: 'i' }, },
                { description: { $regex: req.query.search, $options: 'i' }, },
                { viewId: { $regex: req.query.search, $options: 'i' }, },
                { cuisine: { $regex: req.query.search, $options: 'i' }, },
                { category: { $regex: req.query.search, $options: 'i' }, },
                { mealTags: { $elemMatch: { $regex: req.query.search } }, }
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
            "from": "suppliers",
            "localField": "supplier",
            "foreignField": "_id",
            "as": "supplier"
        }
    })
    aggreagatePipelineQueries.push({ "$unwind": '$supplier' })
    aggreagatePipelineQueries.push({
        "$lookup": {
            "from": "bikerpickuppoints",
            "localField": "bikerPickupPoint",
            "foreignField": "_id",
            "as": "bikerPickupPoint"
        }
    })
    aggreagatePipelineQueries.push({ "$unwind": '$bikerPickupPoint' })
    aggreagatePipelineQueries.push({
        "$lookup": {
            "from": "clientpickuppoints",
            "localField": "clientPickups",
            "foreignField": "_id",
            "as": "clientPickups"
        }
    })
    aggreagatePipelineQueries.push({
        "$project": {
            "_id": 1,
            "bikerPickupPoint.name": 1,
            "bikerPickupPoint.text": 1,
            "bikerPickupPoint.viewId": 1,
            "bikerPickupPoint.address": 1,
            "bikerPickupPoint.suitableTimes": 1,
            "clientPickups.name": 1,
            "clientPickups.text": 1,
            "clientPickups.viewId": 1,
            "clientPickups.address": 1,
            "clientPickups.suitableTimes": 1,
            "supplier.businessName": 1,
            "supplier.businessImages": 1,
            "supplier.address": 1,
            "supplier.contactInfo": 1,
            "name": 1,
            "images": 1,
            "category": 1,
            "cuisine": 1,
            "mealTags": 1,
            "minOrders": 1,
            "maxOrders": 1,
            "pricePerOrder": 1,
            "costToSupplierPerOrder": 1,
            "description": 1,
            "eventDate": 1,
            "eventVisibilityDate": 1,
            "closingDate": 1,
        }
    })

    let items = await dishItemModel.aggregate(aggreagatePipelineQueries)

    return res.status(StatusCodes.OK).json({ items });

}

const getItem = async(req, res) => {

    const dishItemId = req.params.itemId;

    let dishes = await dishItemModel.aggregate([{
        "$match": {
            "_id": mongoose.Types.ObjectId(dishItemId)
        }
    }, {
        "$lookup": {
            "from": "suppliers",
            "localField": "supplier",
            "foreignField": "_id",
            "as": "supplier"
        }
    }, {
        "$unwind": '$supplier'
    }, {
        "$lookup": {
            "from": "bikerpickuppoints",
            "localField": "bikerPickupPoint",
            "foreignField": "_id",
            "as": "bikerPickupPoint"
        },
    }, {
        "$unwind": '$bikerPickupPoint'
    }, {
        "$lookup": {
            "from": "clientpickuppoints",
            "localField": "clientPickups",
            "foreignField": "_id",
            "as": "clientPickups"
        }
    }, {
        "$project": {
            "_id": 1,
            "bikerPickupPoint.name": 1,
            "bikerPickupPoint.text": 1,
            "bikerPickupPoint.viewId": 1,
            "bikerPickupPoint.address": 1,
            "bikerPickupPoint.suitableTimes": 1,
            "clientPickups.name": 1,
            "clientPickups.text": 1,
            "clientPickups.viewId": 1,
            "clientPickups.address": 1,
            "clientPickups.suitableTimes": 1,
            "supplier.businessName": 1,
            "supplier.businessImages": 1,
            "supplier.address": 1,
            "supplier.contactInfo": 1,
            "name": 1,
            "images": 1,
            "category": 1,
            "cuisine": 1,
            "mealTags": 1,
            "minOrders": 1,
            "maxOrders": 1,
            "pricePerOrder": 1,
            "costToSupplierPerOrder": 1,
            "description": 1,
            "eventDate": 1,
            "eventVisibilityDate": 1,
            "closingDate": 1,
        }
    }])

    if (dishes.length < 1) {
        throw new CustomError.BadRequestError('Invalid Dish Id');
    }

    return res.status(StatusCodes.OK).json({ dish: dishes[0] });

}

const getAllItemsForAdmin = async(req, res) => {

    const skip = req.query.skip ? Number(req.query.skip) : 0;
    const limit = req.query.limit ? Number(req.query.limit) : 20;

    const status = req.query.status || 'active';

    let andQuery = [];

    if (status == 'active'){        
        andQuery.push({
        "$or": [                
            {"status":eventStatus.PENDING},
            {"status":eventStatus.ACTIVE}
        ]})
    }
    if (status == 'completed'){
        andQuery.push({status:eventStatus.FULFILLED})
    }
    if (status == 'closed'){
        andQuery.push({status:eventStatus.CANCELLED})        
    }

    // andQuery.push({"eventVisibilityDate":{"$lte": new Date()}})

    // manage filters    
    if (req.query.cuisine) {
        andQuery.push({
            cuisine: { $regex: req.query.cuisine, $options: 'i' }
        })
    }
    if (req.query.category) {
        andQuery.push({
            category: req.query.category
        })
    }
    if (req.query.search) {
        andQuery.push({
            "$or": [
                { name: { $regex: req.query.search, $options: 'i' }, },
                { description: { $regex: req.query.search, $options: 'i' }, },
                { viewId: { $regex: req.query.search, $options: 'i' }, },
                { cuisine: { $regex: req.query.search, $options: 'i' }, },
                { category: { $regex: req.query.search, $options: 'i' }, },
                { mealTags: { $elemMatch: { $regex: req.query.search } }, }
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
    aggreagatePipelineQueries.push({"$sort": { "createdAt": -1 } })
    aggreagatePipelineQueries.push({"$skip": skip })
    aggreagatePipelineQueries.push({"$limit": limit })    
    aggreagatePipelineQueries.push({
        "$project": {
            "_id": 1,
            "name": 1,
            "viewId": 1,
            "eventDate":1,
            "closingDate":1,
            "minOrders":1,
            "maxOrders":1
        }
    })

    let items = await dishItemModel.aggregate(aggreagatePipelineQueries)

    let itemCount
    if (andQuery.length === 0) {
        itemCount = await dishItemModel.find().countDocuments();
    } else {
        itemCount = await dishItemModel.find({ "$and": andQuery }).countDocuments();
    }

    // attach order counts
    const itemIds = items.map(i=> i._id);
    const orders = await orderModel.find({
        item: {$in: itemIds}
    }, `_id item quantity`)

    // create order count map
    const orderMap = {}
    orders.forEach(o=>{
        if (orderMap[o.item] != undefined){
            orderMap[o.item] = orderMap[o.item] + Number(o.quantity)
        }else {
            orderMap[o.item] = Number(o.quantity);
        }
    })
    
    items.forEach(i=>{
        i.totalOrders = orderMap[i._id] || 0;
    })

    return res.status(StatusCodes.OK).json({ items, itemCount });
}

const getItemByItemId = async (req, res) => {

    const skip = req.query.skip ? Number(req.query.skip) : 0;
    const limit = req.query.limit ? Number(req.query.limit) : 10;

    const itemId = req.params.itemId;
    const item = await dishItemModel
    .findById(itemId, `_id name viewId eventDate closingDate minOrders maxOrders`)
    .populate('clientPickups', `name text viewId address suitableTimes`)

    const orders = await orderModel.aggregate([
        {
            "$match": {
                item: mongoose.Types.ObjectId(itemId)
            }
        }, {
            "$sort": { "createdAt": -1 } 
        },{
            "$skip": skip
        }, {
            "$limit": limit
        },{
            "$lookup": {
                "from": "users",
                "localField": "customer",
                "foreignField": "_id",
                "as": "customer"
            }
        }, { 
            "$unwind": '$customer' 
        }, {
            "$project":{
                "customer.fullName":1,
                "viewId":1,
                "quantity":1,                
                "status":1,
                "cost":1,
                "costToSupplier":1
            }
        }
    ]);
    
    let totalOrders = 0;
    orders.forEach(o=>{
        totalOrders = totalOrders + Number(o.quantity);
    })

    const product = {
        "_id": item._id,
        "name": item.name,
        "viewId": item.viewId,
        "eventDate": item.eventDate,
        "closingDate": item.closingDate,
        "minOrders": item.minOrders,
        "maxOrders": item.maxOrders,
        "clientPickups":item.clientPickups,
        "totalOrders": totalOrders
    }

    return res.status(StatusCodes.OK).json({ product, orders });

}


module.exports = {
    getItem,
    getAllItems,
    getAllItemsBySupplier,
    getAllItemsForAdmin,
    getItemByItemId
}