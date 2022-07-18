const kartModel = require('../models/Kart');
const eventModel = require('../models/Event');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const { default: mongoose } = require('mongoose');
const crypto = require('crypto');
const { eventStatus } = require('../constants');

// router.get('/', kartController.getUserKart);
// router.get('/inc/event/eventId', kartController.addEventToKart);
// router.get('/dec/event/eventId', kartController.removeEventFrmKart);
// router.get('/del/event/eventId', kartController.deleteEventFromKart);
// router.get('/clear', kartController.clearUserKart);

const getUserKart = async(req, res) => {

    const userId = req.user.userId;

    let kartItems = await kartModel.aggregate([{
        "$match": {
            "customer": mongoose.Types.ObjectId(userId)
        }
    }, {
        "$lookup": {
            "from": "events",
            "localField": "event",
            "foreignField": "_id",
            "as": "event"
        }
    }, {
        "$unwind": '$event'
    }, {
        "$lookup": {
            "from": "dishes",
            "localField": "event.dishes",
            "foreignField": "_id",
            "as": "event.dishes"
        }
    }, {
        "$project": {
            "_id": 1,
            "quantity":1,
            "event.itemName": 1,
            "event.itemDescription": 1,
            "event.activeTill": 1,
            "event.deliveryDate": 1,
            "event.deliveryTime": 1,
            "event.cuisine": 1,
            "event.category": 1,        
            "event.pricePerOrder": 1,                
            "event.dishes.name": 1,
            "event.dishes.viewId": 1,
            "event.dishes.images": 1,
            "event.dishes.description": 1,
            "event.dishes.cuisine": 1,
            "event.dishes.category": 1            
        }
    }])

    if (kartItems.length < 1) {
        return res.status(StatusCodes.OK).json({ kart: null });
    }

    let totalCost = 0;
    
    // calculate total kart cons
    kartItems.forEach(ki=>{
        totalCost = totalCost + (ki.quantity*ki.event.pricePerOrder)
    })

    return res.status(StatusCodes.OK).json({ kart: {kartItems}, totalCost });

}

// currently manual payments require just one create order api
// this is will be udpate to have a checkout process one platform payments are enabled
const addEventToKart = async(req, res) => {

    const eventId = req.params.eventId;

    // check event is open to receive orders
    const event = await eventModel.findById(eventId, `status`);
    if (event.status != eventStatus.PENDING){
        throw new CustomError.BadRequestError(`Item not available`);        
    }

    // check if max event orders are alredy complete
    
    
    // check if event already present in kart
    const eventInKart = await kartModel.find({
        $and: [
            {customer: req.user.userId},
            {event: eventId},
        ]
    }).countDocuments();

    if (eventInKart){
        // if yes, increase the count
        await kartModel.updateOne(
            {
                $and: [
                    {customer: req.user.userId},
                    {event: eventId},
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
            event:eventId,
            quantity:1
        })
    }

    // cart updated response
    return res.status(StatusCodes.OK).json({message: 'Kart updated!' });
}

const removeEventFrmKart = async (req, res)=>{

    const eventId = req.params.eventId;

    // check if event is present in kart
    const eventInKart = await kartModel.findOne({
        $and: [
            {customer: req.user.userId},
            {event: eventId},
        ]
    }, `quantity`);

    if (!eventInKart){
        throw new CustomError.BadRequestError(`Invalid operation`);   
    }

    if (eventInKart.quantity > 1){
        // decrese the qunatity
        await kartModel.updateOne(
            {
                $and: [
                    {customer: req.user.userId},
                    {event: eventId},
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
                    {event: eventId},
                ]
            })        
    }

    // cart updated response
    return res.status(StatusCodes.OK).json({message: 'Kart updated!' });    

}
const deleteEventFromKart = async (req, res)=>{

    const eventId = req.params.eventId;

    // remove any record of that event from user kart
    await kartModel.deleteOne(
        {
            $and: [
                {customer: req.user.userId},
                {event: eventId},
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
    addEventToKart,
    removeEventFrmKart,
    deleteEventFromKart,
    clearUserKart
}