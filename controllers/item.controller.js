const dishItemModel = require('../models/DishItem');
const orderModel = require('../models/Order');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const { default: mongoose } = require('mongoose');
const crypto = require('crypto');
const { eventStatus, orderStatus } = require('../constants');
const { parseWZeroTime, todayDateWithZeroTime} = require('../utils/datetime');

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
                // { description: { $regex: req.query.search, $options: 'i' }, },
                // { viewId: { $regex: req.query.search, $options: 'i' }, },
                // { cuisine: { $regex: req.query.search, $options: 'i' }, },
                // { category: { $regex: req.query.search, $options: 'i' }, },
                // { mealTags: { $elemMatch: { $regex: req.query.search } }, }
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
            "dish":1,
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
            "eventDate":1,
            "eventVisibilityDate":1,
            "closingDate":1,
            "closingTime":1,
            "supplierPickupTime":1,
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
                // { description: { $regex: req.query.search, $options: 'i' }, },
                // { viewId: { $regex: req.query.search, $options: 'i' }, },
                // { cuisine: { $regex: req.query.search, $options: 'i' }, },
                // { category: { $regex: req.query.search, $options: 'i' }, },
                // { mealTags: { $elemMatch: { $regex: req.query.search } }, }
            ]
        })
    }

    let eventDateFilterCount = 0;
    if (req.query.eventDate){
        let eventDate = req.query.eventDate;
        eventDate = eventDate.split('|')
        let dateOrQuery = []
        dateOrQuery = [];
        eventDate.forEach(e=>{
            dateOrQuery.push({
                "eventDate": new Date(e)
            })
        })
        andQuery.push(
            {
                "$or": dateOrQuery
            })        
        eventDateFilterCount = eventDate.length - 1
    }

    const aggreagatePipelineQueries = [];
    if (andQuery.length > 0) {
        aggreagatePipelineQueries.push({
            "$match": {
                "$and": andQuery
            }
        })
    }
    // loopkup to get the dish based count
    aggreagatePipelineQueries.push({ 
        "$lookup": {
            from: "dishitems",
            let: { "dishId": "$dish" },
            pipeline: [          
                { "$match" : {
                    "$and": andQuery, 
                    }, 
                }, { 
                    "$match": { "$expr": { "$eq": ["$$dishId", "$dish"] }}
                }, {
                    "$group": {
                        "_id": "$dish",                            
                        "count": { $sum: 1 },                    
                    }
                }, {
                    "$project":{
                        "count": 1
                    }
                }
            ],
            as: "dishes"
        }
    })
    aggreagatePipelineQueries.push({ "$unwind": '$dishes' })
    aggreagatePipelineQueries.push({"$match": {
            "dishes.count": {$gt: eventDateFilterCount}
        }
    })  
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
            "eventDate":1,
            "eventVisibilityDate":1,
            "closingDate":1,
            "closingTime":1,
            "supplierPickupTime":1,
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
            "supplier._id": 1,
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
            "eventDate":1,
            "eventVisibilityDate":1,
            "closingDate":1,
            "closingTime":1,
            "supplierPickupTime":1,
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

    if (status == 'active') {
        andQuery.push({
            "$or": [
                { "status": eventStatus.PENDING },
                { "status": eventStatus.ACTIVE }
            ]
        })
    }
    if (status == 'completed') {
        andQuery.push({ status: eventStatus.FULFILLED })
    }
    if (status == 'closed') {
        andQuery.push({ status: eventStatus.CANCELLED })
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
                // { description: { $regex: req.query.search, $options: 'i' }, },
                // { viewId: { $regex: req.query.search, $options: 'i' }, },
                // { cuisine: { $regex: req.query.search, $options: 'i' }, },
                // { category: { $regex: req.query.search, $options: 'i' }, },
                // { mealTags: { $elemMatch: { $regex: req.query.search } }, }
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
        // aggreagatePipelineQueries.push({
        //     "$project": {
        //         "_id": 1,
        //         "name": 1,
        //         "viewId": 1,
        //         "eventDate": 1,
        //         "closingDate": 1,
        //         "minOrders": 1,
        //         "maxOrders": 1
        //     }
        // })
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
        "$project": {
            "_id": 1,
            "bikerPickupPoint.name": 1,
            "bikerPickupPoint.text": 1,
            "bikerPickupPoint.viewId": 1,
            "bikerPickupPoint.address": 1,
            "bikerPickupPoint.suitableTimes": 1,
            "supplier._id": 1,
            "supplier.businessName": 1,
            "_id": 1,
            "name": 1,
            "viewId": 1,
            "eventDate":1,
            "eventVisibilityDate":1,
            "closingDate":1,
            "closingTime":1,
            "supplierPickupTime":1,
            "minOrders": 1,
            "maxOrders": 1

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
    const itemIds = items.map(i => i._id);
    const orders = await orderModel.find({
        item: { $in: itemIds }
    }, `_id item quantity`)

    // create order count map
    const orderMap = {}
    orders.forEach(o => {
        if (orderMap[o.item] != undefined) {
            orderMap[o.item] = orderMap[o.item] + Number(o.quantity)
        } else {
            orderMap[o.item] = Number(o.quantity);
        }
    })

    items.forEach(i => {
        i.totalOrders = orderMap[i._id] || 0;
    })

    return res.status(StatusCodes.OK).json({ items, itemCount });
}

const getItemByItemId = async(req, res) => {

    const skip = req.query.skip ? Number(req.query.skip) : 0;
    const limit = req.query.limit ? Number(req.query.limit) : 10;

    const itemId = req.params.itemId;
    const item = await dishItemModel
        .findById(itemId, `_id name viewId minOrders maxOrders eventDate eventVisibilityDate closingDate closingTime supplierPickupTime`)
        .populate('clientPickups', `name text viewId address suitableTimes`)
        .populate(`supplier`, `businessName viewId`)

    const orders = await orderModel.aggregate([{
        "$match": {
            item: mongoose.Types.ObjectId(itemId)
        }
    }, {
        "$sort": { "createdAt": -1 }
    }, {
        "$skip": skip
    }, {
        "$limit": limit
    }, {
        "$lookup": {
            "from": "users",
            "localField": "customer",
            "foreignField": "_id",
            "as": "customer"
        }
    }, {
        "$unwind": '$customer'
    }, {
        "$project": {
            "customer.fullName": 1,
            "viewId": 1,
            "quantity": 1,
            "status": 1,
            "cost": 1,
            "costToSupplier": 1
        }
    }]);

    let totalOrders = 0;
    orders.forEach(o => {
        totalOrders = totalOrders + Number(o.quantity);
    })

    const product = {
        "_id": item._id,
        "name": item.name,
        "viewId": item.viewId,        
        "minOrders": item.minOrders,
        "maxOrders": item.maxOrders,
        "clientPickups": item.clientPickups,
        "eventDate": item.eventDate,
        "eventVisibilityDate": item.eventVisibilityDate,
        "closingDate": item.closingDate,
        "closingTime": item.closingTime,
        "supplierPickupTime": item.supplierPickupTime,
        "totalOrders": totalOrders
    }

    return res.status(StatusCodes.OK).json({ product, orders });

}


const ListProducts = async (req, res)  => {

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
                // { description: { $regex: req.query.search, $options: 'i' }, },
                // { viewId: { $regex: req.query.search, $options: 'i' }, },
                // { cuisine: { $regex: req.query.search, $options: 'i' }, },
                // { category: { $regex: req.query.search, $options: 'i' }, },
                // { mealTags: { $elemMatch: { $regex: req.query.search } }, }
            ]
        })
    }

    let eventDateFilterCount = 0;
    if (req.query.eventDate){
        let eventDate = req.query.eventDate;
        eventDate = eventDate.split('|')
        let dateOrQuery = []
        dateOrQuery = [];
        eventDate.forEach(e=>{
            dateOrQuery.push({
                "eventDate": new Date(e)
            })
        })
        andQuery.push(
            {
                "$or": dateOrQuery
            })        
        eventDateFilterCount = eventDate.length - 1
    }

    // status filter (active)
    andQuery.push({
        status: 'active'
    })

    andQuery.push({
        eventVisibilityDate: {"$lte": todayDateWithZeroTime()} 
    })

    andQuery.push({
        closingDate: {"$gt": todayDateWithZeroTime()} 
    })
    
    const aggreagatePipelineQueries = [];
    if (andQuery.length > 0) {
        aggreagatePipelineQueries.push({
            "$match": {
                "$and": andQuery
            }
        })
    }

    // loopkup to get the dish based count
    aggreagatePipelineQueries.push({ 
        "$lookup": {
            from: "dishitems",
            let: { "dishId": "$dish" },
            pipeline: [          
                { "$match" : {
                    "$and": andQuery, 
                    }, 
                }, { 
                    "$match": { "$expr": { "$eq": ["$$dishId", "$dish"] }}
                }, {
                    "$group": {
                        "_id": "$dish",                            
                        "count": { $sum: 1 },                    
                    }
                }, {
                    "$project":{
                        "count": 1
                    }
                }
            ],
            as: "dishes"
        }
    })

    aggreagatePipelineQueries.push({ "$unwind": '$dishes' })

    aggreagatePipelineQueries.push({"$match": {
            "dishes.count": {$gt: eventDateFilterCount}
        }
    })  

    aggreagatePipelineQueries.push({
        "$lookup": {
            "from": "suppliers",
            "localField": "supplier",
            "foreignField": "_id",
            "as": "supplier"
        }
    })
    aggreagatePipelineQueries.push({ "$unwind": '$supplier' })

    // get order details
    aggreagatePipelineQueries.push({ $lookup: {
        from: "orders",
        let: { "itemId": "$_id" },
        pipeline: [          
            { "$match": { "$expr": { "$eq": ["$$itemId", "$item"] }}},
            { "$match": { "status": {"$in": [orderStatus.PENDING, orderStatus.CONFIRMED, orderStatus.ACTIVE] }}},                 
            {
                "$group": {
                    "_id": {
                        "item": "$item",                        
                    },
                    "count": { $sum: '$quantity' },                    
                }
            }, {
                "$project":{
                    "count": 1
                }
            }
        ],
        as: "orders"
      }
    }),
    aggreagatePipelineQueries.push({
      "$unwind": {
        path: '$orders',
        preserveNullAndEmptyArrays: true
      }
    })
    aggreagatePipelineQueries.push({
        "$set": {
            "order_count": "$orders.count"
        }
      })
    aggreagatePipelineQueries.push({
        "$project": {
            "_id": 1,
            // "dishes":1,
            "supplierName": "$supplier.businessName",
            "supplierId": "$supplier._id",
            "dish":1,
            "name": 1,
            "images": 1,
            "category": 1,
            "cuisine": 1,
            "mealTags": 1,
            "minOrders": 1,
            "maxOrders": 1,
            "pricePerOrder": 1,                        
            "eventDate":1,
            "eventVisibilityDate":1,
            "closingDate":1,
            "closingTime":1,                        
            "order_count":{ $ifNull: [ "$order_count", 0 ] }   
        }
    })
    aggreagatePipelineQueries.push({ "$sort": { "order_count": -1 } })
    aggreagatePipelineQueries.push({ "$skip": skip })
    aggreagatePipelineQueries.push({ "$limit": limit })

    let items = await dishItemModel.aggregate(aggreagatePipelineQueries)

    // count
    const aggreagatePipelineQueriesCount = []
    if (andQuery.length > 0) {
        aggreagatePipelineQueriesCount.push({
            "$match": {
                "$and": andQuery
            }
        })
    }

    // loopkup to get the dish based count
    aggreagatePipelineQueriesCount.push({ 
        "$lookup": {
            from: "dishitems",
            let: { "dishId": "$dish" },
            pipeline: [          
                { "$match" : {
                    "$and": andQuery, 
                    }, 
                }, { 
                    "$match": { "$expr": { "$eq": ["$$dishId", "$dish"] }}
                }, {
                    "$group": {
                        "_id": "$dish",                            
                        "count": { $sum: 1 },                    
                    }
                }, {
                    "$project":{
                        "count": 1
                    }
                }
            ],
            as: "dishes"
        }
    })

    aggreagatePipelineQueriesCount.push({ "$unwind": '$dishes' })

    aggreagatePipelineQueriesCount.push({"$match": {
            "dishes.count": {$gt: eventDateFilterCount}
        }
    })  

    aggreagatePipelineQueriesCount.push(
        {
            "$count": "count"
        })  

    let itemCount = await dishItemModel.aggregate(aggreagatePipelineQueriesCount)

    itemCount = itemCount && itemCount.length > 0 ? itemCount[0].count : 0

    return res.status(StatusCodes.OK).json({ items, itemCount });

}

const ListProductDateFilters = async (req, res) => {

    const skip = req.query.skip ? Number(req.query.skip) : 0;
    const limit = req.query.limit ? Number(req.query.limit) : 10;

    const dates = await dishItemModel.aggregate([
        {
            "$match": {
                "$and": [
                    { status : 'active' },
                ]
            }
        },
        {
            "$group": {
                "_id": "$eventDate"
            }
        }, 
        {
            "$sort": {"_id": 1}
        }, 
        {
            "$skip": skip
        },
        {
            "$limit": limit
        }
    ])

    return res.status(StatusCodes.OK).json({ dates });
}


const GetProductDetails = async (req, res) => {

    const productId = req.params.itemId;

    let aggreagatePipelineQueries = [];

    aggreagatePipelineQueries.push({
        "$match": {
            "_id": mongoose.Types.ObjectId(productId)
        }
    })

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
            "from": "clientpickuppoints",
            "localField": "clientPickups",
            "foreignField": "_id",
            "as": "clientPickups"
        }
    })

    // get order details
    aggreagatePipelineQueries.push({ $lookup: {
        from: "orders",
        let: { "itemId": "$_id" },
        pipeline: [          
            { "$match": { "$expr": { "$eq": ["$$itemId", "$item"] }}},
            { "$match": { "status": {"$in": [orderStatus.PENDING, orderStatus.CONFIRMED, orderStatus.ACTIVE] }}},          
            {
                "$group": {
                    "_id": {
                        "item": "$item",                        
                    },
                    "count": { $sum: '$quantity' },                    
                }
            }, {
                "$project":{
                    "count": 1
                }
            }
        ],
        as: "orders"
    }
    }),
    aggreagatePipelineQueries.push({
    "$unwind": {
        path: '$orders',
        preserveNullAndEmptyArrays: true
    }
    })
    aggreagatePipelineQueries.push({
        "$set": {
            "order_count": "$orders.count"
        }
    })
    aggreagatePipelineQueries.push({
        "$project": {
            "_id": 1,            
            "supplierName": "$supplier.businessName",
            "clientPickups.name": 1,
            "clientPickups.text": 1,
            "clientPickups.viewId": 1,
            "clientPickups.address": 1,
            "clientPickups.suitableTimes": 1,
            "name": 1,
            "images": 1,
            "category": 1,
            "cuisine": 1,
            "mealTags": 1,
            "minOrders": 1,
            "maxOrders": 1,
            "pricePerOrder": 1,                        
            "eventDate":1,
            "eventVisibilityDate":1,
            "closingDate":1,
            "closingTime":1,                        
            "order_count":{ $ifNull: [ "$order_count", 0 ] }   
        }
    })

    let items = await dishItemModel.aggregate(aggreagatePipelineQueries)

    return res.status(StatusCodes.OK).json({ item: items[0] });
}

// GetProductDetails({
//     "params":{
//         "itemId":"630dd797337962486eae516d"
//     }
// })

const getAvailableCuisines = async (req, res) => {

    let matchQuery = {
        "$and": [
            {status: 'active'}
        ]
    }

    let eventDateFilterCount = 0;
    if (req.query.eventDate){
        let eventDate = req.query.eventDate;
        eventDate = eventDate.split('|')
        let dateOrQuery = []
        dateOrQuery = [];
        eventDate.forEach(e=>{
            dateOrQuery.push({
                "eventDate": new Date(e)
            })
        })
        matchQuery["$and"].push(
            {
                "$or": dateOrQuery
            })        
        eventDateFilterCount = eventDate.length - 1
    }

    if (req.query.supplierId){
        matchQuery["$and"].push({
            "supplier": mongoose.Types.ObjectId(req.query.supplierId)
        })                
    }

    const availableCuisines = await dishItemModel.aggregate([
        {
            "$match": matchQuery
        }, {
            "$project":{
                "cuisine":1,
                "eventDate":1                
            }
        }, {
            "$group": {
                _id: "$cuisine",                 
                count:{$sum:1}
            }
        }, {
            "$match": {
                count: {$gt: eventDateFilterCount}
            }
        }, {
            "$lookup": {
                "from": "cuisines",
                "localField": "_id",
                "foreignField": "name",
                "as": "cuisines"
            }
        }, {
            "$unwind":"$cuisines"
        }, {
            "$project": {
                "_id":0,
                "name":"$cuisines.name",
                "image":"$cuisines.image",
            }
        }
    ])

    return res.status(StatusCodes.OK).json(availableCuisines);
}

const getAvailableEventDates = async (req, res) => {

    let matchQuery = {
        status: 'active'
    }
    
    if (req.query.supplierId){
        matchQuery.supplier = mongoose.Types.ObjectId(req.query.supplierId)
    }

    if (req.query.cuisine){
        matchQuery.cuisine = req.query.cuisine
    }

    matchQuery.eventVisibilityDate = {"$lte": todayDateWithZeroTime()} 
    matchQuery.closingDate = {"$gt": todayDateWithZeroTime()} 
    
    const availableCuisines = await dishItemModel.aggregate([
        {
            "$match": matchQuery
        }, {
            "$group": {
                _id: null, 
                eventDate: {
                    $addToSet: "$eventDate"
                }
            }
        }, {
            "$project": {
                "_id": 0,
                'eventDate':1
            }
        }, {
            "$unwind":"$eventDate"
        }, {
            "$sort": {
                'eventDate': 1
            }
        }, {
            "$limit": 8
        }
    ])

    return res.status(StatusCodes.OK).json(availableCuisines);  
}

// const SearchItem = async (req, res) => {
const SearchItem = async (req, res) => {

    let andQuery = [];

    if (!req.query.search) {
        res.status(StatusCodes.OK).json({ items:[], itemCount:0 });
        return  
    } 

    andQuery.push({
        status: 'active'
    })
    andQuery.push({
        eventVisibilityDate: {"$lte": todayDateWithZeroTime()} 
    })
    andQuery.push({
        closingDate: {"$gt": todayDateWithZeroTime()} 
    })
    
    let searchItems = await dishItemModel.aggregate([
        {
            "$match": {
                "$and": [
                    {
                        status: 'active'
                    },{
                        eventVisibilityDate: {"$lte": todayDateWithZeroTime()} 
                    },{
                        closingDate: {"$gt": todayDateWithZeroTime()} 
                    }
                ]
            }
        }, { 
            "$lookup": {
                "from": "dishes",
                "localField": "dish",
                "foreignField": "_id",
                "as": "dish"
            }
        }, {
            "$unwind": '$dish' 
        }, {
            "$match":{ 
                name: { $regex: req.query.search, $options: 'i' }, 
            }
        }, {
            "$group": {
            "_id": "$dish._id",                            
            "name": {$first: '$name'},
            }
        }
    ])


    res.status(StatusCodes.OK).json({ items:searchItems });

    return
}

module.exports = {
    SearchItem,
    getItem,
    getAllItems,
    getAllItemsBySupplier,
    getAllItemsForAdmin,
    getItemByItemId,
    ListProducts,
    ListProductDateFilters,
    GetProductDetails,
    getAvailableCuisines,
    getAvailableEventDates
}
