const dishItemModel = require('../models/DishItem');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const { default: mongoose } = require('mongoose');
const crypto = require('crypto');

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
            "from": "orders",
            "localField": "_id",
            "foreignField": "item",
            "as": "orders"
        }
    });
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
            "orders.viewId": 1,

        }
    })

    let items = await dishItemModel.aggregate(aggreagatePipelineQueries)
    let itemCount
    if (andQuery.length === 0) {
        itemCount = await dishItemModel.find().countDocuments();

    } else {
        itemCount = await dishItemModel.find({ "$and": andQuery }).countDocuments();
    }


    return res.status(StatusCodes.OK).json({ items, itemCount });

}
module.exports = {
    getItem,
    getAllItems,
    getAllItemsBySupplier,
    getAllItemsForAdmin
}