const payoutModel = require('../models/Payout');
const paymentModel = require('../models/Payment');
const supplierModel = require('../models/Supplier');
const orderModel = require('../models/Order');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const { paymentStatus, orderStatus } = require('../constants');
const { default: mongoose } = require('mongoose');

// currently manual payments require just one creat order api
// this is will be udpate to have a checkout process one platform payments are enabled
const createPayoutObjectFromOrder = async(orderId) => {

    console.log("createPayoutObjectFromOrder", orderId)

    const order = await orderModel.findById(orderId, `supplier customer status costToSupplier event item quantity`);

    // if (order.status != orderStatus.CONFIRMED){        
    //     return
    // }

    // dnt create if already exists
    const alreadyExists = await payoutModel.findOne({order: orderId}).countDocuments();
    if (alreadyExists){
        return
    }

    // add refund logic
    let payout = {
        order: orderId,
        supplier: order.supplier,
        customer: order.customer,
        item: order.item,
        event: order.event,
        paymentMethod: 'offline',
        amount: order.costToSupplier,
        quantity: order.quantity,
        status: 'pending',
    }

    payout = await payoutModel.create(payout);

}

const createPayoutsForPayment = async (paymentId) => {

    const orders = await orderModel.find({
        payment: paymentId
    }, `"id`);

    for (let i=0; i< orders.length; i++){
        createPayoutObjectFromOrder(orders[i]._id);
    }

}


const refreshSupplierPayouts = async(supplierId) => {

    console.log("refreshSupplierPayouts started")

    const supplierOrders = await orderModel.find({
        $and: [
            {supplier: supplierId},
            // {status: orderStatus.CONFIRMED},            
        ]
    }, `_id`);

    for (let i = 0; i< supplierOrders.length; i++){
        
        await createPayoutObjectFromOrder(supplierOrders[i]._id);
    }

}

// refreshSupplierPayouts("62eba5775b2c9e5359d652a4")

const refreshAllPayouts = async() => {

    console.log("refreshAllPayouts started")

    const suppliers = await paymentModel.distinct('supplier');

    for (let i = 0; i< suppliers.length; i++){

        await refreshSupplierPayouts(suppliers[i]._id);
    }
    
}

// refreshAllPayouts()

const getListOfPayouts = async (req, res)=>{

    const skip = req.query.skip ? Number(req.query.skip) : 0;
    const limit = req.query.limit ? Number(req.query.limit) : 10;

    const status = req.query.status || 'pending';
    
    // const payouts = await payoutModel.find()
    // .skip(skip)
    // .limit(limit)
    // .sort({"_id":-1})

    const payouts = await payoutModel.aggregate([
        {
            '$match':{
                "status": status
            }
        },{
            '$skip': skip
        },{
            '$limit': limit
        }, 
        // dish data
        {
            "$group": {
                "_id": {
                   "item": "$item",
                   "supplier":"$supplier",
                },
                "totalOrders": { $sum: { "$toDouble": "$quantity"} },
                "totalAmount": { $sum: { "$toDouble": "$amount"} }
            }
        },{
            "$lookup": {
                "from": "suppliers",
                "localField": "_id.supplier",
                "foreignField": "_id",
                "as": "_id.supplier"
            }
        },{ 
            "$unwind": '$_id.supplier' 
        },{
            "$lookup": {
                "from": "dishitems",
                "localField": "_id.item",
                "foreignField": "_id",
                "as": "_id.item"
            }
        },{ 
            "$unwind": '$_id.item' 
        },{
            '$project': {     
                "_id":0,
                "status": status,
                "supplier":"$_id.supplier.businessName",
                "item":"$_id.item.name",
                "eventDate":"$_id.item.eventDate",
                "productViewId": "$_id.item.viewId",
                "totalOrders":1,
                "totalAmount":1
            }
        }
    ])

    return res.status(StatusCodes.OK).json({ payouts });
}

const getSupplierPayouts = async (req, res) => {

    const skip = req.query.skip ? Number(req.query.skip) : 0;
    const limit = req.query.limit ? Number(req.query.limit) : 10;

    const status = req.query.status || 'pending';
    const supplierId = req.params.supplierId;

    const payouts = await payoutModel.aggregate([
        {
            '$match':{
                "status": status,
                "supplier": mongoose.Types.ObjectId(supplierId)
            }
        },{
            '$skip': skip
        },{
            '$limit': limit
        }, 
        // dish data
        {
            "$group": {
                "_id": {
                   "item": "$item",                   
                },
                "supplier":{$first: '$supplier'},
                "item":{$first: '$item'},
                "totalOrders": { $sum: { "$toDouble": "$quantity"} },
                "totalAmount": { $sum: { "$toDouble": "$amount"} }
            }
        },{
            "$lookup": {
                "from": "suppliers",
                "localField": "supplier",
                "foreignField": "_id",
                "as": "supplier"
            }
        },{ 
            "$unwind": '$supplier' 
        },{
            "$lookup": {
                "from": "dishitems",
                "localField": "item",
                "foreignField": "_id",
                "as": "item"
            }
        },{ 
            "$unwind": '$item' 
        },{
            '$project': {     
                "_id":0,
                "status": status,
                "supplier.businessName":1,
                "item.name":1,
                "item.eventDate":1,
                "item.viewId": 1,
                "totalOrders":1,
                "totalAmount":1
            }
        }
    ])

    return res.status(StatusCodes.OK).json({ payouts });
    
}

// mark payout completed
const updatePayoutStatus = async (req, res) => {

    const payoutId = req.params.payoutId;
    const status = req.body.status;

    await payoutModel.updateOne({
        _id: payoutId
    }, {
        $set: {
            status
        }
    })

    return res.status(StatusCodes.OK).json({ message: `payout status updated to ${status}` });
}



module.exports = {
    getListOfPayouts,
    getSupplierPayouts,
    createPayoutsForPayment,
    updatePayoutStatus
}
