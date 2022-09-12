const Wishlist = require('../models/Wishlist');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const { default: mongoose } = require('mongoose');
const { todayDateWithZeroTime} = require('../utils/datetime');

// Create a supplier or a customer
const ToggleAddToWishlist = async(req, res) => {
    const customer = req.user.userId;
    
    const {item} = req.params;
    // try removing, if updated count is zero, add it to the wish list

    const delResp = await Wishlist.deleteOne({
        $and:[
            {customer},
            {item}
        ]
    })

    if (delResp && delResp.deletedCount == 0){
        // add item to wishlist
        await Wishlist.create({
            customer,
            item,
            updatedAt:new Date()
        })
    }

    res.status(StatusCodes.OK).json({ message: "toggle item in wishlist" })
    return
};

const GetWishList = async (req, res) => {

    const skip = req.query.skip ? Number(req.query.skip) : 0;
    const limit = req.query.limit ? Number(req.query.limit) : 10;

    const items = await Wishlist.aggregate([
        {
            "$match":{
                customer: mongoose.Types.ObjectId(req.user.userId)
            }
        },
        {
            "$lookup": {
                "from": "dishitems",
                "localField": "item",
                "foreignField": "_id",
                "as": "item"
            }
        }, {
            "$unwind":"$item"
        }, {
            "$replaceRoot": { 
                "newRoot": { $ifNull: [ "$item", {} ] } 
            }
        }, {
            "$match":{
                $and: [
                    {status: 'active'},
                    {eventVisibilityDate: {"$lte": todayDateWithZeroTime()}},
                    {closingDate: {"$gt": todayDateWithZeroTime()}}
                ]                    
            }
        }, {
            "$skip": skip
        }, {
            "$limit":limit
        }, {
            "$lookup": {
                "from": "dishes",
                "localField": "dish",
                "foreignField": "_id",
                "as": "dish"
            }
        }, {
            "$unwind":"$dish"
        }, {
            "$lookup":{
                "from": "suppliers",
                "localField": "supplier",
                "foreignField": "_id",
                "as": "supplier"
            }
        }, {
            "$unwind":"$supplier"
        }, {
            "$project": {
                "_id": 1,
                // "dishes":1,
                "supplierName": "$supplier.businessName",
                "supplierId": "$supplier._id",
                "dish.name": 1,
                "dish.viewId": 1,
                "dish.images": 1,
                "dish.description": 1,
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
            }
        }
    ])

    const wishlistCount = await Wishlist.aggregate([
        {
            "$match":{
                customer: mongoose.Types.ObjectId(req.user.userId)
            }
        },
        {
            "$lookup": {
                "from": "dishitems",
                "localField": "item",
                "foreignField": "_id",
                "as": "item"
            }
        }, {
            "$unwind":"$item"
        }, {
            "$replaceRoot": { 
                "newRoot": { $ifNull: [ "$item", {} ] } 
            }
        }, {
            "$match":{
                $and: [
                    {status: 'active'},
                    {eventVisibilityDate: {"$lte": todayDateWithZeroTime()}},
                    {closingDate: {"$gt": todayDateWithZeroTime()}}
                ]                    
            }
        }, {
            "$count":"count"
        }
    ])

    res.status(StatusCodes.OK).json({ items, itemCount: wishlistCount[0].count })
    return 

};


module.exports = {
    ToggleAddToWishlist,
    GetWishList
}