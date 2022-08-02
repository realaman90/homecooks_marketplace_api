const orderModel = require('../models/Order');
const kartModel = require('../models/Kart');
const paymentModel = require('../models/Payment');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const { default: mongoose } = require('mongoose');
const { orderStatus, paymentStatus } = require('../constants');
const crypto = require('crypto');

// currently manual payments require just one creat order api
// this is will be udpate to have a checkout process one platform payments are enabled
const createOrder = async(req, res) => {

    const orderData = req.body;
    orderData.viewId = 'order_' + crypto.randomBytes(6).toString('hex');

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
    if (req.query.isPaid) {
        andQuery.push({
            isPaid: req.query.isPaid == "true" ? true : false
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
        // aggreagatePipelineQueries.push({
        //     "$lookup": {
        //         "from": "clientpickuppoints",
        //         "localField": "pickupPoint",
        //         "foreignField": "_id",
        //         "as": "pickupPoint"
        //     }
        // })
        // aggreagatePipelineQueries.push({ "$unwind": '$pickupPoint' })
    aggreagatePipelineQueries.push({
        "$project": {
            "_id": 1,
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
            "totalCost": 1,
            "isPaid": 1,
            "status": 1,
            "pickupPoint.name": 1,
            "pickupPoint.text": 1,
            "pickupPoint.address": 1,
        }
    })

    let orders = await orderModel.aggregate(aggreagatePipelineQueries)

    return res.status(StatusCodes.OK).json({ orders });

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
            "totalCost": 1,
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

    // service fee
    let serviceFee = 20

    // tax and charges
    let tax = 30

    // subtotal
    let subTotal = totalCost + serviceFee + tax

    return {
        cost: totalCost,
        serviceFee,
        tax,
        subTotal,
        costToSupplier: totalCostToSupplier
    }

}

const createOrdersFromKart = async(kartItems) => {

    const orders = []

    kartItems.forEach(ki => {

        orders.push({
            customer: ki.customer,
            viewId: 'order_' + crypto.randomBytes(6).toString('hex'),
            item: ki.item._id,
            quantity: ki.quantity,
            cost: ki.quantity * ki.item.pricePerOrder,
            costToSupplier: ki.quantity * ki.item.costToSupplierPerOrder,
            isPaid: false,
            status: paymentStatus.PENDING_CHECKOUT
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
            "item._id": 1,
            "item.supplier": 1,
            "item.pricePerOrder": 1,
            "item.costToSupplierPerOrder": 1
        }
    }]);

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

    let payment = null;

    if (!pendingCheckout) {

        if (kartItems.length == 0) {
            throw new Error(`There are no items in the cart to checkout`);
        }

        // create and insert orders
        const orders = await createOrdersFromKart(kartItems);

        // create the object save and return
        payment = {
            customer: userId,
            supplier: kartItems[0].item.supplier,
            cost: calcObj.cost,
            serviceFee: calcObj.serviceFee,
            tax: calcObj.tax,
            subTotal: calcObj.subTotal,
            costToSupplier: calcObj.costToSupplier,
            status: paymentStatus.PENDING_CHECKOUT,
            orders,
        }

        payment = await paymentModel.create(payment);

    } else {

        payment = pendingCheckout;
    }

    let orders = await orderModel.aggregate([{
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
            "item._id": 1,
            "item.name": 1,
            "item.description": 1,
            "item.images": 1,
            "item.pricePerOrder": 1,
            "item.costToSupplierPerOrder": 1,
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

    const orderId = req.params.orderId;
    const pickupPoint = req.body.pickupPoint;

    await orderModel.updateOne({
        _id: orderId
    }, {
        $set: {
            pickupPoint,
        }
    })

    return res.status(StatusCodes.OK).json({ message: "pickup point updated on the order" });

}

const updatePaymentMethod = async(req, res) => {

    const paymentId = req.params.paymentId;
    const paymentMethod = req.body.paymentMethod;

    await paymentModel.updateOne({
        _id: paymentId
    }, {
        $set: {
            paymentMethod
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
            status: orderStatus.PENDING
        }
    })

    return res.status(StatusCodes.OK).json({ message: "order placed successfully" });

}


module.exports = {
    createOrder,
    getAllOrders,
    getOrderById,
    getCustomerOrders,
    editOrder,
    deleteOrder,
    getCheckout,
    placeOrder,
    updatePickupAddressOnOrder,
    updatePaymentMethod
}