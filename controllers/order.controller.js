const orderModel = require('../models/Order');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const { default: mongoose } = require('mongoose');
const { orderStatus } = require('../constants');

// currently manual payments require just one creat order api
// this is will be udpate to have a checkout process one platform payments are enabled
const createOrder = async (req, res)=> {

    const orderData = req.body;    

    // check if the group has not reached max orders ??

    // check if the group is still accepting orders ??

    orderData.status = orderStatus.PENDING;
    orderData.isPaid = false;

    // calculate totalCost
    orderData.cost = 1000;
    orderData.costToSupplier = 2000;

    let order = null;
    try {
        order = await orderModel.create(orderData);
    } catch(err){
        throw new CustomError.BadRequestError(err.message);
    }
    return res.status(StatusCodes.CREATED).json({ order });

}


const getAllOrders = async (req, res) => {

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
    if (req.query.status){
        andQuery.push({
            status: req.query.status
        })
    }     
    if (req.query.isPaid){
        andQuery.push({
            isPaid: req.query.isPaid == "true" ? true : false
        })
    }
    
    const aggreagatePipelineQueries = [];
    if (andQuery.length > 0){
        aggreagatePipelineQueries.push({
            "$match": {
                "$and": andQuery
            }
        })
    }
    aggreagatePipelineQueries.push({"$sort": {"createdAt":-1}})
    aggreagatePipelineQueries.push({"$skip": skip})
    aggreagatePipelineQueries.push({"$limit": limit})
    aggreagatePipelineQueries.push({
        "$lookup": {
        "from": "users",
        "localField": "customer",
        "foreignField": "_id",
        "as": "customer"
        }
    })
    aggreagatePipelineQueries.push({"$unwind": '$customer'})    
    aggreagatePipelineQueries.push({
        "$lookup": {
        "from": "groups",
        "localField": "group",
        "foreignField": "_id",
        "as": "group"
        }
    })
    aggreagatePipelineQueries.push({"$unwind": '$group'})
    aggreagatePipelineQueries.push({
        "$lookup": {
          "from": "products",
          "localField": "group.product",
          "foreignField": "_id",
          "as": "group.product"
        }
    })
    aggreagatePipelineQueries.push({"$unwind": '$group.product'})
    aggreagatePipelineQueries.push({
        "$lookup": {
        "from": "suppliers",
        "localField": "group.supplier",
        "foreignField": "_id",
        "as": "group.supplier"
        }
    })
    aggreagatePipelineQueries.push({"$unwind": '$group.supplier'})
    aggreagatePipelineQueries.push({
        "$lookup": {
        "from": "clientpickuppoints",
        "localField": "pickupPoint",
        "foreignField": "_id",
        "as": "pickupPoint"
        }
    })
    aggreagatePipelineQueries.push({"$unwind": '$pickupPoint'})
    aggreagatePipelineQueries.push({
        "$project":{
            "_id":1,
            "group.itemName":1,
            "group.itemDescription":1,
            "group.activeTill":1,
            "group.deliveryDate":1,
            "group.deliveryTime":1,
            "group.cuisine":1,
            "group.category":1,
            "group.supplier.businessName":1,
            "group.supplier.businessImages":1,
            "group.supplier.address":1,
            "group.supplier.contactInfo":1,            
            "group.product.name":1,
            "group.product.viewId":1,
            "group.product.images":1,
            "group.product.description":1,
            "group.product.cuisine":1,
            "group.product.category":1,  
            "customer.fullName":1,
            "customer.profileImg":1,
            "customer.email":1,
            "customer.phone":1,
            "totalCost":1,
            "isPaid":1,
            "status":1,
            "pickupPoint.name":1,
            "pickupPoint.text":1,
            "pickupPoint.address":1,
        }
    })

    let orders = await orderModel.aggregate(aggreagatePipelineQueries)
    
    return res.status(StatusCodes.OK).json({ orders });

}

const getOrderById = async (req, res) => {

    const orderId = req.params.orderId;

    let orders = await orderModel.aggregate([
        {
            "$match": {
                "_id": mongoose.Types.ObjectId(orderId)
            } 
        },{
            "$lookup": {
                "from": "users",
                "localField": "customer",
                "foreignField": "_id",
                "as": "customer"
           },
        },{
            "$unwind": '$customer'
        },{
            "$lookup": {
                "from": "groups",
                "localField": "group",
                "foreignField": "_id",
                "as": "group"
                }
        },{
            "$unwind": '$group'            
        },{
            "$lookup": {
                "from": "products",
                "localField": "group.product",
                "foreignField": "_id",
                "as": "group.product"
              }
        },{
            "$unwind": '$group.product'
        }, {
            "$lookup": {
                "from": "suppliers",
                "localField": "group.supplier",
                "foreignField": "_id",
                "as": "group.supplier"
                }
        }, {
            "$unwind": '$group.supplier'
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
            "$project":{
                "_id":1,
                "group.itemName":1,
                "group.itemDescription":1,
                "group.activeTill":1,
                "group.deliveryDate":1,
                "group.deliveryTime":1,
                "group.cuisine":1,
                "group.category":1,
                "group.supplier.businessName":1,
                "group.supplier.businessImages":1,
                "group.supplier.address":1,
                "group.supplier.contactInfo":1,            
                "group.product.name":1,
                "group.product.viewId":1,
                "group.product.images":1,
                "group.product.description":1,
                "group.product.cuisine":1,
                "group.product.category":1,  
                "customer.fullName":1,
                "customer.profileImg":1,
                "customer.email":1,
                "customer.phone":1,
                "totalCost":1,
                "isPaid":1,
                "status":1,
                "pickupPoint.name":1,
                "pickupPoint.text":1,
                "pickupPoint.address":1,
            }
        }
    ])

    if (orders.length < 1){
        throw new CustomError.BadRequestError('Invalid Order Id');
    }

    return res.status(StatusCodes.OK).json({ order: orders[0] });

}

const getCustomerOrders = async (req, res) =>{

}

const editOrder = async (req, res) =>{

    const orderId = req.params.orderId;
    const updateOrderData = req.body;

    let updateResp = null;

    try {
        updateResp = await orderModel.updateOne({
            _id: orderId
        }, {
            $set: updateOrderData
        });
    } catch(err) {
        throw new CustomError.BadRequestError(err.message);
    }

    if (!updateResp.modifiedCount){
        throw new CustomError.BadRequestError('Failed to update data');
    }

    return res.status(StatusCodes.OK).json({ msg: `Order data updated!` });

}

const deleteOrder = async (req, res) =>{

    const orderId = req.params.orderId;

    let deleteResp = null;

    try {
        deleteResp = await orderModel.deleteOne({
            $and : [
                {_id: orderId},
                {status: {$in: [orderStatus.PENDING, orderStatus.CANCELLED]}}
            ]
        });
    } catch(err) {
        throw new CustomError.BadRequestError(err.message);
    }

    if (!deleteResp.deletedCount){
        throw new CustomError.BadRequestError('Failed remove the order');
    }

    return res.status(StatusCodes.OK).json({ msg: `Order removed!` });

}

module.exports = {
    createOrder,
    getAllOrders,    
    getOrderById,
    getCustomerOrders,
    editOrder,
    deleteOrder
}


