const dishModel = require('../models/Dish');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const { default: mongoose } = require('mongoose');
const crypto = require('crypto');

const createDish = async(req, res) => {

    const dishData = req.body;
    dishData.viewId = 'dish_' + crypto.randomBytes(6).toString('hex');

    let dish = null;
    try {
        dish = await dishModel.create(dishData);
    } catch (err) {
        throw new CustomError.BadRequestError(err.message);
    }
    return res.status(StatusCodes.CREATED).json({ dish });
}

const getAllDishs = async(req, res) => {

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
        "$project": {
            "_id": 1,
            "bikerPickupPoint.name": 1,
            "bikerPickupPoint.text": 1,
            "bikerPickupPoint.viewId": 1,
            "bikerPickupPoint.address": 1,
            "bikerPickupPoint.suitableTimes": 1,
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
        }
    })

    let dishes = await dishModel.aggregate(aggreagatePipelineQueries)

    return res.status(StatusCodes.OK).json({ dishes });


}

const getAllDishsBySupplier = async(req, res) => {

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
        "$project": {
            "_id": 1,
            "bikerPickupPoint.name": 1,
            "bikerPickupPoint.text": 1,
            "bikerPickupPoint.viewId": 1,
            "bikerPickupPoint.address": 1,
            "bikerPickupPoint.suitableTimes": 1,
            "supplier.businessName": 1,
            "supplier.businessImages": 1,
            "supplier.address": 1,
            "supplier.contactInfo": 1,
            "name": 1,
            "images": 1,
            "category": 1,
            "cuisine": 1,
            "description": 1,
            "price": 1,
            "viewId": 1,
            "mealTags": 1,
            "minOrders": 1,
            "maxOrders": 1,
            "pricePerOrder": 1,
            "costToSupplierPerOrder": 1,
            "suitableTimes": 1,
        }
    })

    let dishes = await dishModel.aggregate(aggreagatePipelineQueries)

    return res.status(StatusCodes.OK).json({ dishes });

}

const getDish = async(req, res) => {

    const dishId = req.params.dishId;

    let dishes = await dishModel.aggregate([{
            "$match": {
                "_id": mongoose.Types.ObjectId(dishId)
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
        },
        {
            "$unwind": '$bikerPickupPoint'
        }, {
            "$project": {
                "_id": 1,
                "bikerPickupPoint.name": 1,
                "bikerPickupPoint.text": 1,
                "bikerPickupPoint.viewId": 1,
                "bikerPickupPoint.address": 1,
                "bikerPickupPoint.suitableTimes": 1,
                "supplier.businessName": 1,
                "supplier.businessImages": 1,
                "supplier.address": 1,
                "supplier.contactInfo": 1,
                "name": 1,
                "images": 1,
                "category": 1,
                "cuisine": 1,
                "description": 1,
                "suitableTimings": 1,
                "price": 1,
                "quantity": 1,
                "size": 1,
                "mealTags": 1,
                "minOrders": 1,
                "maxOrders": 1,
                "pricePerOrder": 1,
                "costToSupplierPerOrder": 1,
                "suitableTimes": 1,
            }
        }
    ])

    if (dishes.length < 1) {
        throw new CustomError.BadRequestError('Invalid Dish Id');
    }

    return res.status(StatusCodes.OK).json({ dish: dishes[0] });

}

const editDish = async(req, res) => {

    const dishId = req.params.dishId;
    const updateDishData = req.body;

    let updateResp = null;

    try {
        updateResp = await dishModel.updateOne({
            _id: dishId
        }, {
            $set: updateDishData
        });
    } catch (err) {
        throw new CustomError.BadRequestError(err.message);
    }

    if (!updateResp.modifiedCount) {
        throw new CustomError.BadRequestError('Failed to update data');
    }

    return res.status(StatusCodes.OK).json({ msg: `Dish data updated!` });
}

const deleteDish = async(req, res) => {

    const dishId = req.params.dishId;

    let deleteResp = null;

    try {
        deleteResp = await dishModel.deleteOne({
            $and: [
                { _id: dishId }
            ]
        });
    } catch (err) {
        throw new CustomError.BadRequestError(err.message);
    }

    if (!deleteResp.deletedCount) {
        throw new CustomError.BadRequestError('Failed remove the dish');
    }

    return res.status(StatusCodes.OK).json({ msg: `Dish removed!` });

}

module.exports = {
    createDish,
    getAllDishs,
    getAllDishsBySupplier,
    getDish,
    editDish,
    deleteDish,
}