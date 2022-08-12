const eventModel = require('../models/Event');
const dishModel = require('../models/Dish');
const dishItemModel = require('../models/DishItem');
const supplierModel = require('../models/Supplier');
const bikerPickupPointModel = require('../models/BikerPickupPoint');
const clientPickupPointModel = require('../models/ClientPickupPoint');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const { default: mongoose } = require('mongoose');
const { eventStatus } = require('../constants');
const { pickWith_idFromObjectArray, convertIdArrayToObjectID } = require('../utils/array');
const { format, parseISO, differenceInCalendarDays, add, getDay, getDate, sub } = require('date-fns');
const eventTemplateModel = require('../models/EventTemplate');
const crypto = require('crypto');
const { update } = require('../models/Event');

const createEvent = async(req, res) => {

    const eventData = req.body;
    let event = null;
    try {
        event = await eventModel.create(eventData);
    } catch (err) {
        throw new CustomError.BadRequestError(err.message);
    }
    return res.status(StatusCodes.CREATED).json({ event });

}

// const AttachPickUpPointsToEvents = async(events) => {

//     if (events.length < 1) {
//         return events
//     }

//     // get biker and client pickup information
//     let bikerPickupIds = [];
//     events.forEach(g => {
//         bikerPickupIds = g.bikerPickups && g.bikerPickups.length > 0 ? g.bikerPickups.map((r) => r.bikerPickupPoint) : [];
//     })
//     let clientPickupIds = [];
//     events.forEach(g => {
//         clientPickupIds = g.clientPickups && g.clientPickups.length > 0 ? g.clientPickups.map((r) => r.clientPickupPoint) : [];
//     })

//     const getBikerPickupPromise = bikerPickupPointModel.find({ _id: { $in: convertIdArrayToObjectID(bikerPickupIds) } });
//     const getClientPickupPromise = clientPickupPointModel.find({ _id: { $in: convertIdArrayToObjectID(clientPickupIds) } });
//     const pickPointsRes = await Promise.all([getBikerPickupPromise, getClientPickupPromise]);
//     // attach biker and client pickup information

//     events.forEach((g) => {
//         // console.log(g)
//         g.bikerPickups.forEach(b => {
//             b.bikerPickupPoint = pickWith_idFromObjectArray(pickPointsRes[0], b.bikerPickupPoint)
//         })

//         g.clientPickups.forEach(b => {
//             b.clientPickupPoint = pickWith_idFromObjectArray(pickPointsRes[1], b.clientPickupPoint)
//         })
//     })

// }

const getAllEvents = async(req, res) => {

    const skip = req.query.skip ? Number(req.query.skip) : 0;
    const limit = req.query.limit ? Number(req.query.limit) : 10;

    let andQuery = [];

    // manage filters
    if (req.query.status) {
        andQuery.push({
            status: req.query.status
        })
    }
    if (req.query.category) {
        andQuery.push({
            category: req.query.category
        })
    }
    if (req.query.mealTag) {
        andQuery.push({
            mealTags: { $elemMatch: { $regex: req.query.mealTag } }
        })
    }
    if (req.query.search) {
        andQuery.push({
            "$or": [
                { name: { $regex: req.query.search, $options: 'i' }, },
                { description: { $regex: req.query.search, $options: 'i' }, },
                { cuisine: { $regex: req.query.search, $options: 'i' }, },
                { category: { $regex: req.query.search, $options: 'i' }, },
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
                "from": "dishitems",
                "localField": "dishItems",
                "foreignField": "_id",
                "as": "dishItems"
            }
        })
        // aggreagatePipelineQueries.push({"$unwind": '$dish'})
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
            "supplier.businessName": 1,
            "supplier.businessImages": 1,
            "supplier.address": 1,
            "supplier.contactInfo": 1,
            "dishItems._id": 1,
            "dishItems.name": 1,
            "dishItems.viewId": 1,
            "dishItems.images": 1,
            "dishItems.description": 1,
            "dishItems.cuisine": 1,
            "dishItems.category": 1,
            "dishItems.mealTags": 1,
            "dishItems.minOrders": 1,
            "dishItems.maxOrders": 1,
            "dishItems.pricePerOrder": 1,
            "dishItems.costToSupplierPerOrder": 1,
            "eventDate": 1,
            "closingDate": 1,
            "bikerPickup": 1,
            "clientPickups": 1,
            "name": 1,
            "images": 1,
            "activeTill": 1,
            "description": 1,
            "deliveryDate": 1,
            "deliveryTime": 1,
            "viewId": 1,
            "status": 1,
        }
    })

    let events = await eventModel.aggregate(aggreagatePipelineQueries)

    return res.status(StatusCodes.OK).json({ events });

}

const getSupplierEvents = async(req, res) => {

    const supplierId = req.params.supplierId;
    const skip = req.query.skip ? Number(req.query.skip) : 0;
    const limit = req.query.limit ? Number(req.query.limit) : 10;

    let events = await eventModel.aggregate([{
            "$match": {
                "supplier": mongoose.Types.ObjectId(supplierId)
            }
        }, {
            "$sort": { "createdAt": -1 }
        }, {
            "$skip": skip
        }, {
            "$limit": limit
        }, {
            "$lookup": {
                "from": "suppliers",
                "localField": "supplier",
                "foreignField": "_id",
                "as": "supplier"
            }
        }, {
            "$unwind": '$supplier'
        },
        {
            "$lookup": {
                "from": "dishitems",
                "localField": "dishItems",
                "foreignField": "_id",
                "as": "dishItems"
            }
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
                "supplier.businessName": 1,
                "supplier.businessImages": 1,
                "supplier.address": 1,
                "supplier.contactInfo": 1,
                "dishitems._id": 1,
                "dishitems.name": 1,
                "dishitems.viewId": 1,
                "dishitems.images": 1,
                "dishitems.description": 1,
                "dishItems.cuisine": 1,
                "dishItems.category": 1,
                "dishItems.mealTags": 1,
                "dishItems.minOrders": 1,
                "dishItems.maxOrders": 1,
                "dishItems.pricePerOrder": 1,
                "dishItems.costToSupplierPerOrder": 1,
                "eventDate": 1,
                "closingDate": 1,
                "bikerPickup": 1,
                "name": 1,
                "images": 1,
                "activeTill": 1,
                "description": 1,
                "maxOrders": 1,
                "minOrders": 1,
                "clientPickups._id": 1,
                "clientPickups.name": 1,
                "viewId": 1,
                "status": 1,
            }
        }
    ])

    return res.status(StatusCodes.OK).json({ events });

}

const getEventById = async(req, res) => {

    const eventId = req.params.eventId;

    let events = await eventModel.aggregate([{
            "$match": {
                "_id": mongoose.Types.ObjectId(eventId)
            }
        },
        {
            "$lookup": {
                "from": "suppliers",
                "localField": "supplier",
                "foreignField": "_id",
                "as": "supplier"
            }
        }, {
            "$lookup": {
                "from": "dishitems",
                "localField": "dishItems",
                "foreignField": "_id",
                "as": "dishItems"
            }
        },
        {
            "$lookup": {
                "from": "clientpickuppoints",
                "localField": "clientPickups",
                "foreignField": "_id",
                "as": "clientPickups"
            }
        },
        {
            "$project": {
                "_id": 1,
                "supplier.businessName": 1,
                "supplier.businessImages": 1,
                "supplier.address": 1,
                "supplier.contactInfo": 1,
                "dishitems._id": 1,
                "dishItems.name": 1,
                "dishItems.viewId": 1,
                "dishItems.category": 1,
                "dishItems.mealTags": 1,
                "eventDate": 1,
                "closingDate": 1,
                "bikerPickup": 1,
                "clientPickups": 1,
                "name": 1,
                "images": 1,
                "activeTill": 1,
                "pricePerOrder": 1,
                "costToSupplierPerOrder": 1,
                "pickupLocation": 1,
                // "category": 1,
                "description": 1,
                // "maxOrders": 1,
                // "minOrders": 1,
                "deliveryDate": 1,
                "deliveryTime": 1,
                // "cuisine": 1,
                "viewId": 1,
                "status": 1,
                // "mealTags": 1,
            }
        }
    ])

    if (events.length < 1) {
        throw new CustomError.BadRequestError('Invalid Event Id');
    }

    return res.status(StatusCodes.OK).json({ event: events[0] });

}

const editEvent = async(req, res) => {

    const eventId = req.params.eventId;
    const updateEventData = req.body;
    updateEventData.eventVisibilityDate = sub(parseISO(updateEventData.eventDate), { 'days': 7 });
    // console.log(updateEventData);

    let updateResp = null;

    try {
        updateResp = await eventModel.updateOne({
            _id: eventId
        }, {
            $set: updateEventData
        });
    } catch (err) {
        throw new CustomError.BadRequestError(err.message);
    }

    if (!updateResp.modifiedCount) {
        throw new CustomError.BadRequestError('Failed to update data');
    }

    return res.status(StatusCodes.OK).json({ msg: `Event data updated!` });

}

// hard delete
const deleteEvent = async(req, res) => {

    const eventId = req.params.eventId;

    let deleteResp = null;

    try {
        deleteResp = await eventModel.deleteOne({
            $and: [
                { _id: eventId },
                { status: { $in: [eventStatus.PENDING, eventStatus.CANCELLED] } }
            ]
        });
    } catch (err) {
        throw new CustomError.BadRequestError(err.message);
    }

    if (!deleteResp.deletedCount) {
        throw new CustomError.BadRequestError('Failed remove the event');
    }

    return res.status(StatusCodes.OK).json({ msg: `Event removed!` });

}


const calculateDatesFromEventFrequencyData = (eventFrequncyData) => {

    let dates = [];

    // loop from start date to end date and filter the dates based on the "recurringType" and "days" fields
    const startDateISO = parseISO(eventFrequncyData.startDate)
    const endDateISO = parseISO(eventFrequncyData.endDate)

    const calendarDays = differenceInCalendarDays(endDateISO, startDateISO) + 1;

    if (eventFrequncyData.eventFrequency == "recurring") {
        
        for (let i = 0; i < calendarDays; i++) {
            const nextISODate = add(startDateISO, {
                days: i
            });

            // 0 | 1 | 2 | 3 | 4 | 5 | 6 the day of week, 0 represents Sunday
            const dayOfWeek = getDay(nextISODate);

            if (eventFrequncyData.days.indexOf('Mon') > -1 && dayOfWeek == 1 ||
                eventFrequncyData.days.indexOf('Tue') > -1 && dayOfWeek == 2 ||
                eventFrequncyData.days.indexOf('Wed') > -1 && dayOfWeek == 3 ||
                eventFrequncyData.days.indexOf('Thur') > -1 && dayOfWeek == 4 ||
                eventFrequncyData.days.indexOf('Fri') > -1 && dayOfWeek == 5 ||
                eventFrequncyData.days.indexOf('Sat') > -1 && dayOfWeek == 6 ||
                eventFrequncyData.days.indexOf('Sun') > -1 && dayOfWeek == 0
            ) {
                dates.push(nextISODate)
            }
        }
    } else {

        for (let i = 0; i < calendarDays; i++) {
            const nextISODate = add(startDateISO, {
                days: i
            });

            // 0 | 1 | 2 | 3 | 4 | 5 | 6 the day of week, 0 represents Sunday
            const dayOfWeek = getDay(nextISODate);

            if (eventFrequncyData.days.indexOf('Mon') > -1 && dayOfWeek == 1 ||
                eventFrequncyData.days.indexOf('Tue') > -1 && dayOfWeek == 2 ||
                eventFrequncyData.days.indexOf('Wed') > -1 && dayOfWeek == 3 ||
                eventFrequncyData.days.indexOf('Thur') > -1 && dayOfWeek == 4 ||
                eventFrequncyData.days.indexOf('Fri') > -1 && dayOfWeek == 5 ||
                eventFrequncyData.days.indexOf('Sat') > -1 && dayOfWeek == 6 ||
                eventFrequncyData.days.indexOf('Sun') > -1 && dayOfWeek == 0
            ) {

                console.log(dates)
                if (dates.length < eventFrequncyData.days.length) {
                    dates.push(nextISODate)
                }else {
                    break;
                }

            }
        }

    }

    // console.log(dates)
    return dates;
}

// calculateDatesFromEventFrequencyData(
// {   "eventFrequency": "one_time",    
//     "startDate": "2022-08-28",
//     "endDate": "2022-09-28",    
//     "days": ["Mon", "Thur"]
// })
// calculateDatesFromEventFrequencyData({
//     "eventFrequency": "recurring",    
//     "startDate": "2022-08-28",
//     "endDate": "2022-09-28",    
//     "days": ["Mon", "Thur"]
// })

const createEventUsingEventTemplate = async(req, res) => {

    // create event template

    // save the event template in the db (saving this can be kept optional)
    const eventTemplate = await eventTemplateModel.create(req.body);

    // find out the event dates
    const eventDates = calculateDatesFromEventFrequencyData({
        "eventFrequency": eventTemplate.eventFrequency,        
        "startDate": eventTemplate.startDate,
        "endDate": eventTemplate.endDate,
        "days": eventTemplate.days        
    });

    // create event objects
    const events = [];
    eventDates.forEach(ed => {
        let closingDate = sub(ed, { hours: eventTemplate.finalOrderCloseHours });
        const event = {};
        event._id = new mongoose.Types.ObjectId();
        event.status = eventStatus.ACTIVE;
        event.viewId = 'event_' + crypto.randomBytes(6).toString('hex');
        event.supplier = eventTemplate.supplier;
        event.name = eventTemplate.name;
        event.description = eventTemplate.description;
        event.images = eventTemplate.images;
        event.eventDate = ed;
        event.eventTime = eventTemplate.eventTime;
        event.closingDate = closingDate;
        event.eventVisibilityDate = sub(ed, { 'days': 7 });
        event.clientPickups = eventTemplate.clientPickups;
        event.eventTemplate = eventTemplate._id;
        events.push(event);
    })

    const dishItems = [];

    const dishes = await dishModel.find({
        _id: { $in: eventTemplate.dishes }
    })

    // create dish items
    events.forEach(e => {
        const dishItemsIds = [];
        dishes.forEach(d => {
            const dishItemId = new mongoose.Types.ObjectId();
            dishItemsIds.push(dishItemId);
            dishItems.push({
                _id: dishItemId,
                // dish related data
                status: eventStatus.ACTIVE,
                event: e._id,
                supplier: d.supplier,
                name: d.name,
                viewId: d.viewId,
                images: d.images,
                description: d.description,
                mealTags: d.mealTags,
                cuisine: d.cuisine,
                category: d.category,
                quantity: d.quantity,
                size: d.size,
                minOrders: d.minOrders,
                maxOrders: d.maxOrders,
                pricePerOrder: d.pricePerOrder,
                costToSupplierPerOrder: d.costToSupplierPerOrder,
                bikerPickupPoint: d.bikerPickupPoint,
                clientPickups: e.clientPickups,
                // event date related data
                eventDate: e.eventDate,
                eventVisibilityDate: e.eventVisibilityDate,
                closingDate: e.closingDate,
            })
        })
        e.dishItems = dishItemsIds
    })

    // insert many events, create events based on those dates
    const respEvents = await eventModel.create(events);

    const respDishItems = await dishItemModel.create(dishItems);

    return res.status(StatusCodes.CREATED).json({ msg: `${respEvents.length} event created, ${respDishItems.length} dish items created` });
}

// case: recurring
// createEventUsingEventTemplate({
    // "supplier":"{{supplierId}}",
    // "dishes":[ "62f6780c8bd7c51502c5253b", "62f678508bd7c51502c52543"],
    // "name":"Murg Biryani",
    // "description":"a spiced mix of meat and rice, traditionally cooked over an open fire in a leather pot. It is combined in different ways with a variety of components to create a number of highly tasty and unique flavor combinations",
    // "images":["https://images.unsplash.com/photo-1599043513900-ed6fe01d3833?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8NHx8YmlyeWFuaXxlbnwwfHwwfHw%3D&auto=format&fit=crop&w=500&q=60"],    
    // "eventFrequency": "one_time",    
    // "startDate": "2022-08-19",
    // "endDate": "2022-10-22",    
    // "days": ["Mon", "Thur"],    
    // "clientPickups": [
    //      "62f63a6caac1332c63a5a1c1"       
    // ],
    // "eventTime":"09:00 AM"
// })

// case: one time
// createEventUsingEventTemplate({
    // "supplier":"{{supplierId}}",
    // "dishes":[ "62f6780c8bd7c51502c5253b", "62f678508bd7c51502c52543"],
    // "name":"Murg Biryani",
    // "description":"a spiced mix of meat and rice, traditionally cooked over an open fire in a leather pot. It is combined in different ways with a variety of components to create a number of highly tasty and unique flavor combinations",
    // "images":["https://images.unsplash.com/photo-1599043513900-ed6fe01d3833?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8NHx8YmlyeWFuaXxlbnwwfHwwfHw%3D&auto=format&fit=crop&w=500&q=60"],    
    // "eventFrequency": "recurring",    
    // "startDate": "2022-08-19",
    // "endDate": "2022-10-22",    
    // "days": ["Thur", "Mon"],   
    // "clientPickups": [
    //      "62f63a6caac1332c63a5a1c1"       
    // ]
// })


module.exports = {
    createEvent,
    getAllEvents,
    getEventById,
    editEvent,
    deleteEvent,
    getSupplierEvents,
    createEventUsingEventTemplate
}