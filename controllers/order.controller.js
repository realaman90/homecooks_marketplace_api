const User = require('../models/User');
const crypto = require('crypto');
const orderModel = require('../models/Order');
const kartModel = require('../models/Kart');
const paymentModel = require('../models/Payment');
const { multiply, sum, round } = require('mathjs');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const { default: mongoose } = require('mongoose');
const { orderStatus, paymentStatus } = require('../constants');
const payoutController = require('./payout.controller');
const notificationController = require('./notification.controller');

const { SetupIntentFrCard } = require('../utils/stripe');
const utils = require('nodemon/lib/utils');

const tryToCompleteTransaction = async (paymentId) => {

    let payment = await paymentModel.aggregate([
        {
            "$match":{
                "_id": mongoose.Types.ObjectId(paymentId)
            }
        }, { 
            "$lookup": {
                "from": "orders",
                "let": { "orders": "$orders" },
                "pipeline": [
                    { 
                        "$match": 
                        { 
                            "$expr": { "$in": [ "$_id", "$$orders"] } 
                        }
                    }, {
                        "$project": {
                            "status":1
                        }
                    }
                ],
                "as": "orders"
            }
        }, {
            "$project":{
                "orders":1
            }
        }
    ])

    payment = payment[0];

    let isTransactionCompleted = true;

    if (payment){
        payment.orders.forEach(o=>{
            if (o.status != orderStatus.COMPLETED && o.status !=  orderStatus.DELIVERED && o.status !=  orderStatus.CANCELLED){
                isTransactionCompleted = false
            }
        })
    }

    console.log(isTransactionCompleted);

    if (isTransactionCompleted){
        await paymentModel.updateOne({
            "_id":paymentId
        }, {
            "$set":{
                "status": paymentStatus.COMPLETED,
                "updatedAt": new Date()
            }
        })
    }
    
    console.log("tryToCompleteTransaction completed!")

    return
}

// tryToCompleteTransaction("631b1ca5325d726fc9a47142")

// currently manual payments require just one creat order api
// this is will be udpate to have a checkout process one platform payments are enabled
const createOrder = async(req, res) => {

    const orderData = req.body;
    orderData.viewId = crypto.randomBytes(3).toString('hex');

    // check if the event has not reached max orders ??

    // check if the event is still accepting orders ??

    orderData.status = orderStatus.PENDING;
    orderData.isPaid = false;

    // calculate totalCost
    orderData.cost = 1000;
    orderData.costToSupplier = 2000;

    let order = null;
    try {
        order = await orderModel.create(orderData);
    } catch (err) {
        throw new CustomError.BadRequestError(err.message);
    }
    return res.status(StatusCodes.CREATED).json({ order });

}

const getAllOrders = async(req, res) => {

    /**
     * filters
     * 1. isPaid = "true" | "false"
     * 2. status
     * 3. skip
     * 4. limit
     */

    const skip = req.query.skip ? Number(req.query.skip) : 0;
    const limit = req.query.limit ? Number(req.query.limit) : 10;

    let andQuery = [];

    // manage filters
    if (req.query.status) {
        andQuery.push({
            status: req.query.status
        })
    }

    andQuery.push({
        status: { $ne: orderStatus.PENDING_CHECKOUT }
    })

    if (req.query.isPaid) {
        andQuery.push({
            isPaid: req.query.isPaid == "true" ? true : false
        })
    }

    andQuery.push({
        pickupPoint: { $exists: true }
    })
    andQuery.push({
        pickupPoint: { $ne: null }
    })
    andQuery.push({
        pickupPoint: { $ne: undefined }
    })


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
            "from": "users",
            "localField": "customer",
            "foreignField": "_id",
            "as": "customer"
        }
    })
    aggreagatePipelineQueries.push({ "$unwind": '$customer' })
    aggreagatePipelineQueries.push({
        "$lookup": {
            "from": "dishitems",
            "localField": "item",
            "foreignField": "_id",
            "as": "item"
        }
    })
    aggreagatePipelineQueries.push({ "$unwind": '$item' })
    aggreagatePipelineQueries.push({
        "$lookup": {
            "from": "suppliers",
            "localField": "item.supplier",
            "foreignField": "_id",
            "as": "item.supplier"
        }
    })
    aggreagatePipelineQueries.push({ "$unwind": '$item.supplier' })
    aggreagatePipelineQueries.push({
        "$lookup": {
            "from": "clientpickuppoints",
            "localField": "pickupPoint",
            "foreignField": "_id",
            "as": "pickupPoint"
        }
    })
    aggreagatePipelineQueries.push({ "$unwind": '$pickupPoint' })
    aggreagatePipelineQueries.push({
        "$project": {
            "_id": 1,
            "viewId": 1,
            "quantity": 1,
            "cost": 1,
            "isPaid": 1,
            "status": 1,
            "createdAt": 1,
            "item._id": 1,
            "item.name": 1,
            "item.images": 1,
            "item.category": 1,
            "item.cuisine": 1,
            "item.mealTags": 1,
            "item.minOrders": 1,
            "item.maxOrders": 1,
            "item.pricePerOrder": 1,
            "item.costToSupplierPerOrder": 1,
            "item.description": 1,
            "item.eventDate": 1,
            "item.eventVisibilityDate": 1,
            "item.closingDate": 1,
            "item.supplier.businessName": 1,
            "item.supplier.businessImages": 1,
            "item.supplier.address": 1,
            "item.supplier.contactInfo": 1,
            "customer.fullName": 1,
            "customer.profileImg": 1,
            "customer.email": 1,
            "customer.phone": 1,
            "pickupPoint.name": 1,
            "pickupPoint.text": 1,
            "pickupPoint.address": 1,
        }
    })

    let orders = await orderModel.aggregate(aggreagatePipelineQueries)
    itemCount = await orderModel.find({ "$and": andQuery }).countDocuments();

    return res.status(StatusCodes.OK).json({ orders, itemCount });

}

const getOrderById = async(req, res) => {

    const orderId = req.params.orderId;

    let orders = await orderModel.aggregate([{
        "$match": {
            "_id": mongoose.Types.ObjectId(orderId)
        }
    }, {
        "$lookup": {
            "from": "users",
            "localField": "customer",
            "foreignField": "_id",
            "as": "customer"
        },
    }, {
        "$unwind": '$customer'
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
        "$lookup": {
            "from": "suppliers",
            "localField": "item.supplier",
            "foreignField": "_id",
            "as": "item.supplier"
        }
    }, {
        "$unwind": '$item.supplier'
    }, {
        "$lookup": {
            "from": "clientpickuppoints",
            "localField": "pickupPoint",
            "foreignField": "_id",
            "as": "pickupPoint"
        }
    }, {
        "$unwind": '$pickupPoint'
    }, {
        "$project": {
            "_id": 1,
            "quantity": 1,
            "instruction": 1,
            "viewId": 1,
            "createdAt": 1,
            "item._id": 1,
            "item.name": 1,
            "item.images": 1,
            "item.viewId": 1,
            "item.category": 1,
            "item.cuisine": 1,
            "item.mealTags": 1,
            "item.minOrders": 1,
            "item.maxOrders": 1,
            "item.pricePerOrder": 1,
            "item.costToSupplierPerOrder": 1,
            "item.description": 1,
            "item.eventDate": 1,
            "item.eventVisibilityDate": 1,
            "item.closingDate": 1,
            "item.supplier.businessName": 1,
            "item.supplier.businessImages": 1,
            "item.supplier.address": 1,
            "item.supplier.contactInfo": 1,
            "customer.fullName": 1,
            "customer.profileImg": 1,
            "customer.email": 1,
            "customer.phone": 1,
            "cost": 1,
            "isPaid": 1,
            "status": 1,
            "pickupPoint.name": 1,
            "pickupPoint.text": 1,
            "pickupPoint.address": 1,
        }
    }])

    if (orders.length < 1) {
        throw new CustomError.BadRequestError('Invalid Order Id');
    }

    return res.status(StatusCodes.OK).json({ order: orders[0] });

}

const getCustomerOrders = async(req, res) => {
    const customerId = req.params.customerId;
    const skip = req.query.skip ? Number(req.query.skip) : 0;
    const limit = req.query.limit ? Number(req.query.limit) : 10;

    let andQuery = [];

    // manage filters
    if (req.query.status) {
        andQuery.push({
            status: req.query.status
        })
    }

    if (req.query.isPaid) {
        andQuery.push({
            isPaid: req.query.isPaid == "true" ? true : false
        })
    }

    andQuery.push({
        pickupPoint: { $ne: null }
    })
    andQuery.push({
        "customer": mongoose.Types.ObjectId(customerId)
    })


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
            "from": "users",
            "localField": "customer",
            "foreignField": "_id",
            "as": "customer"
        }
    })
    aggreagatePipelineQueries.push({ "$unwind": '$customer' })
    aggreagatePipelineQueries.push({
        "$lookup": {
            "from": "dishitems",
            "localField": "item",
            "foreignField": "_id",
            "as": "item"
        }
    })
    aggreagatePipelineQueries.push({ "$unwind": '$item' })
    aggreagatePipelineQueries.push({
        "$lookup": {
            "from": "suppliers",
            "localField": "item.supplier",
            "foreignField": "_id",
            "as": "item.supplier"
        }
    })
    aggreagatePipelineQueries.push({ "$unwind": '$item.supplier' })
    aggreagatePipelineQueries.push({
        "$lookup": {
            "from": "clientpickuppoints",
            "localField": "pickupPoint",
            "foreignField": "_id",
            "as": "pickupPoint"
        }
    })
    aggreagatePipelineQueries.push({ "$unwind": '$pickupPoint' })
    aggreagatePipelineQueries.push({
        "$project": {
            "_id": 1,
            "viewId": 1,
            "quantity": 1,
            "cost": 1,
            "isPaid": 1,
            "status": 1,
            "createdAt": 1,
            "item._id": 1,
            "item.name": 1,
            "item.images": 1,
            "item.category": 1,
            "item.cuisine": 1,
            "item.mealTags": 1,
            "item.minOrders": 1,
            "item.maxOrders": 1,
            "item.pricePerOrder": 1,
            "item.costToSupplierPerOrder": 1,
            "item.description": 1,
            "item.eventDate": 1,
            "item.eventVisibilityDate": 1,
            "item.closingDate": 1,
            "item.supplier.businessName": 1,
            "item.supplier.businessImages": 1,
            "item.supplier.address": 1,
            "item.supplier.contactInfo": 1,
            "customer.fullName": 1,
            "customer.profileImg": 1,
            "customer.email": 1,
            "customer.phone": 1,
            "pickupPoint.name": 1,
            "pickupPoint.text": 1,
            "pickupPoint.address": 1,
        }
    })

    let orders = await orderModel.aggregate(aggreagatePipelineQueries)
    if (andQuery.length === 0) {
        itemCount = await orderModel.find().countDocuments();
    } else {
        itemCount = await orderModel.find({ "$and": andQuery }).countDocuments();
    }



    return res.status(StatusCodes.OK).json({ orders, itemCount });

}

const editOrder = async(req, res) => {

    const orderId = req.params.orderId;
    const updateOrderData = req.body;

    let updateResp = null;

    try {
        updateResp = await orderModel.updateOne({
            _id: orderId
        }, {
            $set: updateOrderData
        });
    } catch (err) {
        throw new CustomError.BadRequestError(err.message);
    }

    if (!updateResp.modifiedCount) {
        throw new CustomError.BadRequestError('Failed to update data');
    }

    return res.status(StatusCodes.OK).json({ msg: `Order data updated!` });

}

const deleteOrder = async(req, res) => {

    const orderId = req.params.orderId;

    let deleteResp = null;

    try {
        deleteResp = await orderModel.deleteOne({
            $and: [
                { _id: orderId },
                { status: { $in: [orderStatus.PENDING, orderStatus.CANCELLED] } }
            ]
        });
    } catch (err) {
        throw new CustomError.BadRequestError(err.message);
    }

    if (!deleteResp.deletedCount) {
        throw new CustomError.BadRequestError('Failed remove the order');
    }

    return res.status(StatusCodes.OK).json({ msg: `Order removed!` });

}

// perform checkout calculations on kart data
const paymentCalcOnKartItems = (kartItems) => {

    let totalCost = 0;
    let totalCostToSupplier = 0;

    // calculate total kart cons
    kartItems.forEach(ki => {
        totalCost = totalCost + (ki.quantity * ki.item.pricePerOrder)
        totalCostToSupplier = totalCostToSupplier + (ki.quantity * ki.item.costToSupplierPerOrder)
    })

    let itemTotal = totalCost;

    let serviceFee = multiply(itemTotal, .2)

    let deliveryFee = 4.99

    let taxableAmpunt = sum(itemTotal, serviceFee, deliveryFee);

    let tax = round(multiply(".09375", taxableAmpunt), 2)

    let total = round(sum(taxableAmpunt, tax), 2)

    return {
        cost: totalCost,
        serviceFee,
        deliveryFee,
        tax,
        total,
        costToSupplier: totalCostToSupplier
    }

}

// paymentCalcOnKartItems(
//     [
//         {
//             "quantity":1,
//             "item":{
//                 "pricePerOrder":100,
//                 "costToSupplierPerOrder":120
//             },

//         },
//         {
//             "quantity":2,
//             "item":{
//                 "pricePerOrder":100,
//                 "costToSupplierPerOrder":120
//             },

//         }
//     ]
// )

// refreshOrders("62f989526253b49a1bc0696a")


const createOrdersFromKart = async(kartItems, prevOrders) => {

    const prevOrderMeta = {};
    if (prevOrders && prevOrders.length > 0) {
        prevOrders = await orderModel.find({
            "_id": { $in: prevOrders }
        }, `item pickupPoint instruction`)
        prevOrders.forEach((po) => {
            prevOrderMeta[po.item] = {
                pickupPoint: po.pickupPoint,
                instruction: po.instruction,
                orderId: po._id
            }
        })
    }

    let prevOrderIds = prevOrders.map(o=> o._id);

    // remove prev orders
    await orderModel.deleteMany({
        _id: { $in: prevOrderIds }
    })

    const orders = []

    kartItems.forEach(ki => {

        orders.push({
            _id: prevOrderMeta[ki.item._id] ? prevOrderMeta[ki.item._id].orderId : mongoose.Types.ObjectId(),
            customer: ki.customer,
            viewId: 'order_' + crypto.randomBytes(6).toString('hex'),
            item: ki.item._id,
            event: ki.event,
            supplier: ki.supplier,
            quantity: ki.quantity,
            cost: ki.quantity * ki.item.pricePerOrder,
            costToSupplier: ki.quantity * ki.item.costToSupplierPerOrder,
            isPaid: false,
            status: paymentStatus.PENDING_CHECKOUT,
            pickupPoint: prevOrderMeta[ki.item._id] ? prevOrderMeta[ki.item._id].pickupPoint : null,
            instruction: prevOrderMeta[ki.item._id] ? prevOrderMeta[ki.item._id].instruction : null,
        })

    })

    // insert all
    const ordersResp = await orderModel.create(orders);
    const orderIds = ordersResp.map(o => o._id);
    return orderIds;
}


const getCheckout = async(req, res) => {

    const userId = req.user.userId;

    // initial
    // get orders data from kart
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
            "customer": 1,
            "quantity": 1,
            "pickupPoint": 1,
            "event": 1,
            "supplier": 1,
            "item._id": 1,
            "item.supplier": 1,
            "item.pricePerOrder": 1,
            "item.costToSupplierPerOrder": 1
        }
    }]);

    if (kartItems.length == 0) {
        throw new Error(`No item in kart to checkout`);
    }

    // check for any pending checkouts    
    let pendingCheckout = await paymentModel.aggregate([{
        "$match": {
            $and: [
                { "customer": mongoose.Types.ObjectId(userId) },
                { "status": paymentStatus.PENDING_CHECKOUT }
            ]
        }
    }]);

    pendingCheckout = pendingCheckout[0];

    const calcObj = paymentCalcOnKartItems(kartItems)

    let orders = await createOrdersFromKart(kartItems, pendingCheckout ? pendingCheckout.orders : []);

    let payment = {
        customer: userId,
        supplier: kartItems[0].item.supplier,
        cost: calcObj.cost,
        serviceFee: calcObj.serviceFee,
        deliveryFee: calcObj.deliveryFee,
        tax: calcObj.tax,
        total: calcObj.total,
        costToSupplier: calcObj.costToSupplier,
        status: paymentStatus.PENDING_CHECKOUT,
        orders,
    }

    if (kartItems.length == 0) {
        throw new Error(`There are no items in the cart to checkout`);
    }

    if (!pendingCheckout) {

        payment = await paymentModel.create(payment);

    } else {

        payment._id = pendingCheckout._id

        // update payment object
        await paymentModel.updateOne({ "_id": pendingCheckout._id }, {
            $set: {
                supplier: payment.supplier,
                cost: payment.cost,
                deliveryFee: payment.deliveryFee,
                serviceFee: payment.serviceFee,
                tax: payment.tax,
                total: payment.total,
                costToSupplier: payment.costToSupplier,
                orders
            }
        })

    }

    orders = await orderModel.aggregate([{
        "$match": {
            "_id": { "$in": payment.orders }
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
        "$lookup": {
            "from": "clientpickuppoints",
            "localField": "item.clientPickups",
            "foreignField": "_id",
            "as": "item.clientPickups"
        }
    }, {
        "$project": {
            "_id": 1,
            "quantity": 1,
            "pickupPoint": 1,
            "instruction": 1,
            "item._id": 1,
            "item.name": 1,
            "item.description": 1,
            "item.eventDate": 1,
            "item.images": 1,
            "item.pricePerOrder": 1,
            "item.costToSupplierPerOrder": 1,
            "item.clientPickups._id": 1,
            "item.clientPickups.name": 1,
            "item.clientPickups.text": 1,
            "item.clientPickups.viewId": 1,
            "item.clientPickups.address": 1,
            "item.clientPickups.suitableTimes": 1
        }
    }]);

    return res.status(StatusCodes.OK).json({ checkout: payment, orders });

}

const updatePickupAddressOnOrder = async(req, res) => {

    const orders = req.body.orders;

    console.log("request body");
    console.log(orders)

    for (let i = 0; i < orders.length; i++) {
        let o = orders[i];

        console.log(`order: ${i}`)
        console.log(o)
        
        let resp = await orderModel.updateOne({
            _id: o.orderId
        }, {
            $set: {
                pickupPoint: o.pickupPoint,
                instruction: o.instruction,
            }
        })
        console.log("resp")
        console.log(resp)

        let orderUpdated = await orderModel.findOne({ _id: o.orderId });
        console.log(orderUpdated)
    }

    return res.status(StatusCodes.OK).json({ message: "pickup point updated on the order", });
}


const updatePaymentMethod = async(req, res) => {

    const paymentId = req.params.paymentId;
    const paymentMethod = req.body.paymentMethod;

    await paymentModel.updateOne({
        _id: paymentId
    }, {
        $set: {
            paymentMethodType: 'card',
            paymentMethod,
            updatedAt: new Date()
        }
    })

    return res.status(StatusCodes.OK).json({ message: "payment method updated" });

}

const placeOrder = async(req, res) => {

    const paymentId = req.params.paymentId;

    const payment = await paymentModel.findById(paymentId);

    // update payment status to order_placed
    await paymentModel.updateOne({
        _id: paymentId
    }, {
        $set: {
            status: paymentStatus.ORDER_PLACED
        }
    })

    // update order status to pending
    await orderModel.updateMany({
        _id: {
            $in: payment.orders
        }
    }, {
        $set: {
            status: orderStatus.ACTIVE
        }
    })

    await payoutController.createPayoutsForPayment(paymentId);

    //clear user kart
    await kartModel.deleteMany({ customer: req.user.userId })

    process.nextTick(() => {
        notificationController.OrderCreatedNotificationForAdmin(paymentId)
    })

    return res.status(StatusCodes.OK).json({ message: "order placed successfully" });
}

const getPayments = async (req, res) => {

    const skip = req.query.skip ? Number(req.query.skip) : 0;
    const limit = req.query.limit ? Number(req.query.limit) : 10;

    let status = req.query.status;
    if (status) {        
        if (status == "active"){
            status = paymentStatus.ORDER_PLACED
        } else if (status == "past") {
            status = paymentStatus.COMPLETED
        }  
    } else {
        status = paymentStatus.ORDER_PLACED
    }

    const payments = await paymentModel.aggregate([                
        {
            "$match": {
                "status": status
            }
        },  {
            "$skip": skip
        }, {
            "$limit": limit
        }, 
        {
            "$lookup": {
                "from": "users",
                "localField": "customer",
                "foreignField": "_id",
                "as": "customer"
                }
        }, { 
            "$unwind": '$customer' 
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
                "from": "orders",
                "let": { "orders": "$orders" },
                "pipeline": [
                    { "$match": 
                        { 
                            "$expr": { "$in": [ "$_id", "$$orders"] } 
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
                        "$unwind": '$item'
                    }, 
                ],
                "as": "orders"
            }
        }, {
            "$project": {                
                "cost":1,
                "serviceFee":1,
                "deliveryFee":1,
                "tax":1,
                "total":1,
                "costToSupplier":1,
                "eventPickupAddressMapping":1,                
                "isPaid":1,
                "false":1,
                "status":1,
                "customer.fullName": 1,
                "customer.profileImg": 1,
                "customer.email": 1,
                "customer.phone": 1,
                "supplier.businessName": 1,
                "supplier.businessImages": 1,
                "supplier.address": 1,
                "supplier.contactInfo": 1,
                "orders":1                
            }  
        } 
    ])

    const paymentCount = await paymentModel.find({"status": paymentStatus.ORDER_PLACED}).countDocuments()

    return res.status(StatusCodes.OK).json({ payments, paymentCount });

}
// getPayments()

const getPaymentsFrCustomer = async (req, res) => {

    const skip = req.query.skip ? Number(req.query.skip) : 0;
    const limit = req.query.limit ? Number(req.query.limit) : 10;

    let status = req.query.status;
    if (status) {        
        if (status == "active"){
            status = paymentStatus.ORDER_PLACED
        } else if (status == "past") {
            status = paymentStatus.COMPLETED
        }  
    } else {
        status = paymentStatus.ORDER_PLACED
    }

    const payments = await paymentModel.aggregate([                
        {
            "$match": {
                "$and":[
                    {"status": status},
                    {"customer": mongoose.Types.ObjectId(req.user.userId)}
                ]                
            }
        },  {
            "$skip": skip
        }, {
            "$limit": limit
        }, 
        {
            "$lookup": {
                "from": "users",
                "localField": "customer",
                "foreignField": "_id",
                "as": "customer"
                }
        }, { 
            "$unwind": '$customer' 
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
                "from": "orders",
                "let": { "orders": "$orders" },
                "pipeline": [
                    { "$match": 
                        { 
                            "$expr": { "$in": [ "$_id", "$$orders"] } 
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
                        "$unwind": '$item'
                    }, 
                ],
                "as": "orders"
            }
        }, {
            "$project": {                
                "cost":1,
                "serviceFee":1,
                "deliveryFee":1,
                "tax":1,
                "total":1,
                "costToSupplier":1,
                "eventPickupAddressMapping":1,                
                "isPaid":1,
                "false":1,
                "status":1,
                "customer.fullName": 1,
                "customer.profileImg": 1,
                "customer.email": 1,
                "customer.phone": 1,
                "supplier.businessName": 1,
                "supplier.businessImages": 1,
                "supplier.address": 1,
                "supplier.contactInfo": 1,
                "orders":1                
            }  
        } 
    ])

    const paymentCount = await paymentModel.find({"status": paymentStatus.ORDER_PLACED}).countDocuments()

    return res.status(StatusCodes.OK).json({ payments, paymentCount });

}

function checkMongoIdsAreSame(_id1, _id2) {
    const id1 = mongoose.Types.ObjectId(_id1);
    const id2 = mongoose.Types.ObjectId(_id2);
    if (id1.equals(id2)) {
      return true;
    }
    return false;
}

const updateOrder = async (req, res) => {

    const orderId = req.params.orderId;
    const status = req.body.status;

     // get orders data for recalculations
     let payment = await paymentModel.aggregate([                
        {
            "$match": {
                orders: { $elemMatch: { $eq: mongoose.Types.ObjectId(orderId) } },
            }
        }, { 
            "$lookup": {
                "from": "orders",
                "let": { "orders": "$orders" },
                "pipeline": [
                    { "$match": 
                        { 
                            "$expr": { "$in": [ "$_id", "$$orders"] } 
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
                        "$unwind": '$item'
                    }, {
                        "$project":{
                            "_id":1,
                            "status":1,
                            "quantity":1,
                            "item.pricePerOrder":1,
                            "item.costToSupplierPerOrder":1
                        }                    
                    }
                ],
                "as": "orders"
            }
        }, {
            "$project":{
                "_id":1,
                "total":1,
                "orders":1
            }
        }
    ])

    payment = payment[0];   
    
    if (status == "cancelled") {

        let unCancelledOrders = payment.orders.filter(o=>{
            if (checkMongoIdsAreSame(o._id, orderId) || o.status == "cancelled"){
                return false
            } else {
                return true
            }
        })

        const update = paymentCalcOnKartItems(unCancelledOrders)
        update.updatedAt = new Date();

        let updateResp = await paymentModel.updateOne({
            _id: payment._id
        }, {
            "$set": update
        })

        console.log(updateResp)
    }

        
    await orderModel.updateOne({
        _id: orderId
    }, {
        "$set": {
            status,
            updatedAt: new Date()
        }
    })

    await tryToCompleteTransaction(payment._id);

    return res.status(StatusCodes.OK).json({ message: `order ${status}!` });
}


module.exports = {
    updateOrder,
    getPaymentsFrCustomer,
    createOrder,
    getAllOrders,
    getOrderById,
    getCustomerOrders,
    editOrder,
    deleteOrder,
    getCheckout,
    placeOrder,
    updatePickupAddressOnOrder,
    updatePaymentMethod,
    getPayments
}