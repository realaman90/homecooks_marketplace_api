const payoutModel = require('../models/Payout');
const paymentModel = require('../models/Payment');
const supplierModel = require('../models/Supplier');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const { paymentStatus } = require('../constants');
const { default: mongoose } = require('mongoose');
const Supplier = require('../models/Supplier');

// currently manual payments require just one creat order api
// this is will be udpate to have a checkout process one platform payments are enabled
const createPayoutObjectFromPayment = async(paymentId) => {

    const payment = await paymentModel.findById(paymentId, `supplier customer status costToSupplier`);

    if (payment.status != paymentStatus.ORDER_PLACED){
        console.log("esc 1")
        return
    }

    // dnt create if already exists
    const alreadyExists = await payoutModel.findOne({payment: paymentId}).countDocuments();
    if (alreadyExists){
        console.log("esc 2")
        return
    }

    // add refund logic
    let payout = {
        payment: paymentId,
        supplier: payment.supplier,
        customer: payment.customer,
        paymentMethod: 'offline',
        amount: payment.costToSupplier,
        status: 'pending',
    }

    payout = await payoutModel.create(payout);

}

const refreshSupplierPayouts = async(supplierId) => {

    console.log("refreshSupplierPayouts started")

    const supplierPayments = await paymentModel.find({
        $and: [
            {supplier: supplierId},
            {status: paymentStatus.ORDER_PLACED},            
        ]
    }, `_id`);

    for (let i = 0; i< supplierPayments.length; i++){
        
        await createPayoutObjectFromPayment(supplierPayments[i]._id);
    }

}

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

    // const payouts = await payoutModel.find()
    // .skip(skip)
    // .limit(limit)
    // .sort({"_id":-1})

    const payouts = await payoutModel.aggregate([
        {
            '$skip': skip
        },{
            '$limit': limit
        }, {
            "$lookup": {
                "from": "suppliers",
                "localField": "supplier",
                "foreignField": "_id",
                "as": "supplier"
            },
        }, {
            "$unwind": '$supplier'
        },{
            "$lookup": {
                "from": "users",
                "localField": "customer",
                "foreignField": "_id",
                "as": "customer"
            },
        }, {
            "$unwind": '$customer'
        },{
            '$project': {
                "amount":1,
                "status":1,
                "createdAt":1,
                "customer.fullName":1,
                "customer.email":1,
                "supplier._id":1,
                "supplier.businessName":1,
                "supplier.viewId":1,
            }
        }
    ])

    return res.status(StatusCodes.OK).json({ payouts });
}

const getSupplierPayouts = async (req, res) => {

    const payouts = await payoutModel.find({
        $and: [
           { status: 'pending'},
           { supplier: req.params.supplierId}
        ]
    }, `amount`)
    // .populate('supplier', `businessName speciality description`)

    const supplier = await supplierModel.findById(req.params.supplierId, `businessName viewId speciality description`);

    let totalAmount = 0;

    payouts.forEach(p=>{
        if (p.amount){
            totalAmount = Number(totalAmount)+Number(p.amount)
        }
    })

    const totalTransaction= payouts.length;

    return res.status(StatusCodes.OK).json({
        supplier,
        totalAmount,
        totalTransaction,
    });
    
}


module.exports = {
    getListOfPayouts,
    getSupplierPayouts
}