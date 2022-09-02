const kartModel = require('../models/Kart');
const dishItemModel = require('../models/DishItem');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const { default: mongoose } = require('mongoose');
const crypto = require('crypto');
const { eventStatus } = require('../constants');

const getUserKart = async(req, res) => {

    const userId = req.user.userId;

    let kartItems = await kartModel.aggregate([{
        "$match": {
            "customer": mongoose.Types.ObjectId(userId)
        }
    }, {
        "$lookup": {
            "from": "dishitems",
            "localField": "item",
            "foreignField": "_id",
            "as": "item"
        }
    }, {
        "$unwind": '$item'
    }, {
        "$project": {
            "_id": 1,
            "quantity":1,
            "item._id": 1,
            "item.name": 1,
            "item.images": 1,
            "item.category": 1,
            "item.cuisine": 1,
            "item.mealTags": 1,
            "item.minOrders": 1,
            "item.maxOrders": 1,
            "item.pricePerOrder":1,
            "item.costToSupplierPerOrder": 1,
            "item.description": 1,
            "item.eventDate":1,
            "item.eventVisibilityDate":1,
            "item.closingDate":1,                     
        }
    }])

    if (kartItems.length < 1) {
        return res.status(StatusCodes.OK).json({ kart: null });
    }

    let totalCost = 0;
    
    // calculate total kart cons
    kartItems.forEach(ki=>{
        totalCost = totalCost + (ki.quantity*ki.item.pricePerOrder)
    })

    return res.status(StatusCodes.OK).json({ kart: {kartItems}, totalCost });

}

// currently manual payments require just one create order api
// this is will be udpate to have a checkout process one platform payments are enabled
const addItemToKart = async(req, res) => {

    const itemId = req.params.itemId;

    // check event is open to receive orders
    const item = await dishItemModel.findById(itemId, `status event supplier`);
    if (item.status != eventStatus.ACTIVE){
        throw new CustomError.BadRequestError(`Item not available`);        
    }

    // check if max event orders are alredy complete
    
    
    // check if event already present in kart
    const itemInKart = await kartModel.find({
        $and: [
            {customer: req.user.userId},
            {item: itemId},
        ]
    }, `supplier`);

    if (itemInKart && itemInKart.length > 0){

        // check item added is from the same supplier
        // current kart supplier
        const currSupplier = itemInKart[0].supplier

        if (!item.supplier.equals(currSupplier)){            
            throw new CustomError.BadRequestError(`can only order items from one supplier`);     
        }

        // if yes, increase the count
        await kartModel.updateOne(
            {
                $and: [
                    {customer: req.user.userId},
                    {item: itemId},
                ]
            }, {
                $inc: {
                    quantity: 1       
                }
            })
    } else {
        // if no, create an entry in cart model
        await kartModel.create({
            customer:req.user.userId,
            item: itemId,
            event: item.event,
            supplier: item.supplier,
            quantity:1
        })
    }

    // cart updated response
    return res.status(StatusCodes.OK).json({message: 'Kart updated!' });

}

const removeItemFrmKart = async (req, res)=>{

    const itemId = req.params.itemId;

    // check if event is present in kart
    const itemInKart = await kartModel.findOne({
        $and: [
            {customer: req.user.userId},
            {item: itemId},
        ]
    }, `quantity`);

    if (!itemInKart){
        throw new CustomError.BadRequestError(`Invalid operation`);   
    }

    if (itemInKart.quantity > 1){
        // decrese the qunatity
        await kartModel.updateOne(
            {
                $and: [
                    {customer: req.user.userId},
                    {item: itemId},
                ]
            }, {
                $inc: {
                    quantity: -1       
                }
            })
    }else {
        // remove event from kart
        await kartModel.deleteOne(
            {
                $and: [
                    {customer: req.user.userId},
                    {item: itemId},
                ]
            })        
    }

    // cart updated response
    return res.status(StatusCodes.OK).json({message: 'Kart updated!' });    

}

const deleteItemFromKart = async (req, res)=>{

    const itemId = req.params.itemId;

    // remove any record of that event from user kart
    await kartModel.deleteOne(
        {
            $and: [
                {customer: req.user.userId},
                {item: itemId},
            ]
        })        

    // cart updated response
    return res.status(StatusCodes.OK).json({message: 'Kart updated!' });    

}

const clearUserKart = async (req, res)=>{

    // clear user kart
    await kartModel.deleteMany({customer: req.user.userId})        

    // cart updated response
    return res.status(StatusCodes.OK).json({message: 'Kart cleared!' });    

}

module.exports = {
    getUserKart,
    addItemToKart,
    removeItemFrmKart,
    deleteItemFromKart,
    clearUserKart,
}

