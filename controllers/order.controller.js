const dishItemModel = require("../models/DishItem");
const User = require("../models/User");
const crypto = require("crypto");
const orderModel = require("../models/Order");
const kartModel = require("../models/Kart");
const paymentModel = require("../models/Payment");
const { multiply, sum, round, evaluate, i } = require("mathjs");
const { StatusCodes } = require("http-status-codes");
const CustomError = require("../errors");
const { default: mongoose, mongo } = require("mongoose");
const { orderStatus, paymentStatus } = require("../constants");
const payoutController = require("./payout.controller");
const kartController = require("../controllers/kart.controller");
const { cancelOrderNotificationWithOrderId, OrderCreatedNotificationForUser } = require("../controllers/notification.controller");;
const { format } = require("date-fns");
const {
  priceBreakdownItem,
  priceBreakdownCheckout,
  paymentCalcualtion,
  DELIVERY_FEE,
} = require("../utils/pricing");
const {calDateToPSTDate, PSTDateToCalDate} = require('../utils/datetime');


const {
  convertToUniqueMongoIdArray,
  checkIfMongoIdInArray,
  checkMongoIdsAreSame,
} = require("../utils/objectId");
const { PaymentIntentCreate } = require("../utils/stripe");
const QRCode = require("qrcode");

const tryToCompleteTransaction = async (paymentId) => {
  let payment = await paymentModel.aggregate([
    {
      $match: {
        _id: mongoose.Types.ObjectId(paymentId),
      },
    },
    {
      $lookup: {
        from: "orders",
        let: { orders: "$orders" },
        pipeline: [
          {
            $match: {
              $expr: { $in: ["$_id", "$$orders"] },
            },
          },
          {
            $project: {
              status: 1,
            },
          },
        ],
        as: "orders",
      },
    },
    {
      $project: {
        orders: 1,
      },
    },
  ]);

  payment = payment[0];

  let isTransactionCompleted = true;

  if (payment) {
    payment.orders.forEach((o) => {
      if (
        o.status != orderStatus.COMPLETED &&
        o.status != orderStatus.DELIVERED &&
        o.status != orderStatus.CANCELLED
      ) {
        isTransactionCompleted = false;
      }
    });
  }

  if (isTransactionCompleted) {
    await paymentModel.updateOne(
      {
        _id: paymentId,
      },
      {
        $set: {
          status: paymentStatus.COMPLETED,
          updatedAt: new Date(),
        },
      }
    );
  }

  console.log("tryToCompleteTransaction completed!");

  return;
};

// tryToCompleteTransaction("631b1ca5325d726fc9a47142")

// currently manual payments require just one creat order api
// this is will be udpate to have a checkout process one platform payments are enabled
const createOrder = async (req, res) => {
  const orderData = req.body;
  orderData.viewId = crypto.randomBytes(5).toString("hex");

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
};

const getAllOrders = async (req, res) => {
  /**
   * filters
   * 1. isPaid = "true" | "false"
   * 2. status
   * 3. skip
   * 4. limit
   * 5. search: customer name, payment view id, dish name
   */

  const skip = req.query.skip ? Number(req.query.skip) : 0;
  const limit = req.query.limit ? Number(req.query.limit) : 10;

  let andQuery = [];

  // manage filters
  if (req.query.status) {
    andQuery.push({
      status: req.query.status,
    });
  }

  andQuery.push({
    status: { $ne: orderStatus.PENDING_CHECKOUT },
  });

  if (req.query.isPaid) {
    andQuery.push({
      isPaid: req.query.isPaid == "true" ? true : false,
    });
  }

  andQuery.push({
    pickupPoint: { $exists: true },
  });
  andQuery.push({
    pickupPoint: { $ne: null },
  });
  andQuery.push({
    pickupPoint: { $ne: undefined },
  });

  const aggreagatePipelineQueries = [];
  if (andQuery.length > 0) {
    aggreagatePipelineQueries.push({
      $match: {
        $and: andQuery,
      },
    });
  }

  aggreagatePipelineQueries.push({ $sort: { createdAt: -1 } });
  aggreagatePipelineQueries.push({ $skip: skip });
  aggreagatePipelineQueries.push({ $limit: limit });
  aggreagatePipelineQueries.push({
    $lookup: {
      from: "users",
      localField: "customer",
      foreignField: "_id",
      as: "customer",
    },
  });
  aggreagatePipelineQueries.push({ $unwind: "$customer" });
  aggreagatePipelineQueries.push({
    $lookup: {
      from: "dishitems",
      localField: "item",
      foreignField: "_id",
      as: "item",
    },
  });
  aggreagatePipelineQueries.push({ $unwind: "$item" });
  aggreagatePipelineQueries.push({
    $lookup: {
      from: "payments",
      localField: "payment",
      foreignField: "_id",
      as: "payment",
    },
  });
  aggreagatePipelineQueries.push({ $unwind: "$payment" });
  aggreagatePipelineQueries.push({
    $lookup: {
      from: "suppliers",
      localField: "item.supplier",
      foreignField: "_id",
      as: "item.supplier",
    },
  });
  aggreagatePipelineQueries.push({ $unwind: "$item.supplier" });
  aggreagatePipelineQueries.push({
    $lookup: {
      from: "clientpickuppoints",
      localField: "pickupPoint",
      foreignField: "_id",
      as: "pickupPoint",
    },
  });
  aggreagatePipelineQueries.push({ $unwind: "$pickupPoint" });

  if (req.query.search) {
    aggreagatePipelineQueries.push({
      $match: {
        $or: [
          { "item.name": { $regex: req.query.search, $options: "i" } },
          { "customer.fullName": { $regex: req.query.search, $options: "i" } },
          { "payment.viewId": { $regex: req.query.search, $options: "i" } },
        ],
      },
    });
  }

  aggreagatePipelineQueries.push({
    $count: "count",
  });

  let ordersCount = await orderModel.aggregate(aggreagatePipelineQueries);
  ordersCount =
    ordersCount && ordersCount.length > 0 ? ordersCount[0].count : 0;

  // remove count stage and add project
  aggreagatePipelineQueries.pop();

  aggreagatePipelineQueries.push({
    $project: {
      _id: 1,
      paymentViewId: "$payment.viewId",
      viewId: 1,
      quantity: 1,
      cost: 1,
      isPaid: 1,
      status: 1,
      itemSubTotal:1,
      subTotal:1,
      createdAt: 1,
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
    },
  });

  let orders = await orderModel.aggregate(aggreagatePipelineQueries);

  return res.status(StatusCodes.OK).json({ orders, itemCount: ordersCount });
};

const getOrderById = async (req, res) => {
  const orderId = req.params.orderId;

  let orders = await orderModel.aggregate([
    {
      $match: {
        _id: mongoose.Types.ObjectId(orderId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "customer",
        foreignField: "_id",
        as: "customer",
      },
    },
    {
      $unwind: "$customer",
    },
    {
      $lookup: {
        from: "dishitems",
        localField: "item",
        foreignField: "_id",
        as: "item",
      },
    },
    {
      $unwind: "$item",
    },
    {
      $lookup: {
        from: "payments",
        localField: "payment",
        foreignField: "_id",
        as: "payment",
      },
    },
    { $unwind: "$payment" },
    {
      $lookup: {
        from: "suppliers",
        localField: "item.supplier",
        foreignField: "_id",
        as: "item.supplier",
      },
    },
    {
      $unwind: "$item.supplier",
    },
    {
      $lookup: {
        from: "clientpickuppoints",
        localField: "pickupPoint",
        foreignField: "_id",
        as: "pickupPoint",
      },
    },
    {
      $unwind: "$pickupPoint",
    },
    {
      $project: {
        _id: 1,
        quantity: 1,
        instruction: 1,
        viewId: 1,
        itemSubTotal:1,
        subTotal:1,
        createdAt: 1,
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
        cost: 1,
        isPaid: 1,
        status: 1,
        "pickupPoint.name": 1,
        "pickupPoint.text": 1,
        "pickupPoint.address": 1,
        paymentViewId: "$payment.viewId",
      },
    },
  ]);

  if (orders.length < 1) {
    throw new CustomError.BadRequestError("Invalid Order Id");
  }

  let order = orders[0];
  order.item.pricePerOrder = priceBreakdownItem(
    order.item.pricePerOrder
  ).subTotal;

  return res.status(StatusCodes.OK).json({ order });
};

const getCustomerOrders = async (req, res) => {
  const customerId = req.params.customerId;
  const skip = req.query.skip ? Number(req.query.skip) : 0;
  const limit = req.query.limit ? Number(req.query.limit) : 10;

  let andQuery = [];

  // manage filters
  if (req.query.status) {
    andQuery.push({
      status: req.query.status,
    });
  }

  if (req.query.isPaid) {
    andQuery.push({
      isPaid: req.query.isPaid == "true" ? true : false,
    });
  }

  andQuery.push({
    pickupPoint: { $ne: null },
  });
  andQuery.push({
    customer: mongoose.Types.ObjectId(customerId),
  });

  const aggreagatePipelineQueries = [];
  if (andQuery.length > 0) {
    aggreagatePipelineQueries.push({
      $match: {
        $and: andQuery,
      },
    });
  }
  aggreagatePipelineQueries.push({ $sort: { createdAt: -1 } });
  aggreagatePipelineQueries.push({ $skip: skip });
  aggreagatePipelineQueries.push({ $limit: limit });
  aggreagatePipelineQueries.push({
    $lookup: {
      from: "users",
      localField: "customer",
      foreignField: "_id",
      as: "customer",
    },
  });
  aggreagatePipelineQueries.push({ $unwind: "$customer" });
  aggreagatePipelineQueries.push({
    $lookup: {
      from: "dishitems",
      localField: "item",
      foreignField: "_id",
      as: "item",
    },
  });
  aggreagatePipelineQueries.push({ $unwind: "$item" });
  aggreagatePipelineQueries.push({
    $lookup: {
      from: "suppliers",
      localField: "item.supplier",
      foreignField: "_id",
      as: "item.supplier",
    },
  });
  aggreagatePipelineQueries.push({ $unwind: "$item.supplier" });
  aggreagatePipelineQueries.push({
    $lookup: {
      from: "clientpickuppoints",
      localField: "pickupPoint",
      foreignField: "_id",
      as: "pickupPoint",
    },
  });
  aggreagatePipelineQueries.push({ $unwind: "$pickupPoint" });
  aggreagatePipelineQueries.push({
    $project: {
      _id: 1,
      viewId: 1,
      quantity: 1,
      cost: 1,
      isPaid: 1,
      status: 1,
      createdAt: 1,
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
    },
  });

  let orders = await orderModel.aggregate(aggreagatePipelineQueries);
  if (andQuery.length === 0) {
    itemCount = await orderModel.find().countDocuments();
  } else {
    itemCount = await orderModel.find({ $and: andQuery }).countDocuments();
  }

  orders.forEach((order) => {
    order.item.forEach((i) => {
      let { subTotal } = priceBreakdownItem(i.pricePerOrder);
      i.pricePerOrder = subTotal;
    });
  });

  return res.status(StatusCodes.OK).json({ orders, itemCount });
};

const editOrder = async (req, res) => {
  const orderId = req.params.orderId;
  const updateOrderData = req.body;

  let updateResp = null;

  try {
    updateResp = await orderModel.updateOne(
      {
        _id: orderId,
      },
      {
        $set: updateOrderData,
      }
    );
  } catch (err) {
    throw new CustomError.BadRequestError(err.message);
  }

  if (!updateResp.modifiedCount) {
    throw new CustomError.BadRequestError("Failed to update data");
  }

  return res.status(StatusCodes.OK).json({ msg: `Order data updated!` });
};

const deleteOrder = async (req, res) => {
  const orderId = req.params.orderId;

  let deleteResp = null;

  try {
    deleteResp = await orderModel.deleteOne({
      $and: [
        { _id: orderId },
        { status: { $in: [orderStatus.PENDING, orderStatus.CANCELLED] } },
      ],
    });
  } catch (err) {
    throw new CustomError.BadRequestError(err.message);
  }

  if (!deleteResp.deletedCount) {
    throw new CustomError.BadRequestError("Failed remove the order");
  }

  return res.status(StatusCodes.OK).json({ msg: `Order removed!` });
};

// perform checkout calculations on kart data

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

const createOrdersFromKart = async (kartItems, prevOrders) => {
  const prevOrderMeta = {};
  if (prevOrders && prevOrders.length > 0) {
    prevOrders = await orderModel.find(
      {
        _id: { $in: prevOrders },
      },
      `item pickupPoint instruction`
    );
    prevOrders.forEach((po) => {
      prevOrderMeta[po.item] = {
        pickupPoint: po.pickupPoint,
        instruction: po.instruction,
        orderId: po._id,
      };
    });
  }

  let prevOrderIds = prevOrders.map((o) => o._id);

  // remove prev orders
  await orderModel.deleteMany({
    _id: { $in: prevOrderIds },
  });

  const orders = [];

  kartItems.forEach((ki) => {
    let pricing = priceBreakdownItem(ki.item.pricePerOrder);
    let cost = round(multiply(pricing.subTotal, ki.quantity), 1);
    let costToSupplier = round(
      multiply(ki.item.costToSupplierPerOrder, ki.quantity),
      1
    );

    orders.push({
      _id: prevOrderMeta[ki.item._id]
        ? prevOrderMeta[ki.item._id].orderId
        : mongoose.Types.ObjectId(),
      customer: ki.customer,
      viewId: "order_" + crypto.randomBytes(6).toString("hex"),
      item: ki.item._id,
      event: ki.event,
      supplier: ki.supplier,
      quantity: ki.quantity,
      pricing: pricing,
      cost: cost,
      costToSupplier: costToSupplier,
      isPaid: false,
      status: paymentStatus.PENDING_CHECKOUT,
      pickupPoint: prevOrderMeta[ki.item._id]
        ? prevOrderMeta[ki.item._id].pickupPoint
        : null,
      instruction: prevOrderMeta[ki.item._id]
        ? prevOrderMeta[ki.item._id].instruction
        : null,
    });
  });

  // insert all
  const ordersResp = await orderModel.create(orders);
  const orderIds = ordersResp.map((o) => o._id);
  return orderIds;
};

const attachPaymentIdToOrders = async (payment) => {
  const { orders } = await paymentModel.findById(payment, `orders`);
  for (let i = 0; i < orders.length; i++) {
    let orderId = orders[i];
    await orderModel.updateOne(
      {
        _id: orderId,
      },
      {
        $set: {
          payment,
        },
      }
    );
  }
  return;
};
// attachPaymentIdToOrders("632ee6fb929b5bb8a841ae68")

const getCheckout = async (req, res) => {
  const userId = req.user.userId;

  // const getCheckout = async (userId) => {

  // initial
  // get orders data from kart
  let kartItems = await kartModel.aggregate([
    {
      $match: {
        customer: mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "dishitems",
        localField: "item",
        foreignField: "_id",
        as: "item",
      },
    },
    {
      $unwind: "$item",
    },
    {
      $project: {
        _id: 1,
        customer: 1,
        quantity: 1,
        pickupPoint: 1,
        event: 1,
        supplier: 1,
        "item._id": 1,
        "item.supplier": 1,
        "item.pricePerOrder": 1,
        "item.costToSupplierPerOrder": 1,
      },
    },
  ]);

  if (kartItems.length == 0) {
    throw new Error(`No item in kart to checkout`);
  }

  // check for any pending checkouts
  let pendingCheckout = await paymentModel.aggregate([
    {
      $match: {
        $and: [
          { customer: mongoose.Types.ObjectId(userId) },
          { status: paymentStatus.PENDING_CHECKOUT },
        ],
      },
    },
  ]);

  pendingCheckout = pendingCheckout[0];

  let pickUpPointsArr = kartItems.map((ki) => ki.pickupPoint);
  pickUpPointsArr = convertToUniqueMongoIdArray(pickUpPointsArr);
  let uniquePickupPoints = pickUpPointsArr.length;

  const calcObj = priceBreakdownCheckout(kartItems, uniquePickupPoints);

  let orders = await createOrdersFromKart(
    kartItems,
    pendingCheckout ? pendingCheckout.orders : []
  );

  let payment = {
    viewId: crypto.randomBytes(3).toString("hex"),
    customer: userId,
    supplier: kartItems[0].item.supplier,
    cost: calcObj.cost,
    subTotal: calcObj.subTotal,
    serviceFee: calcObj.serviceFee,
    deliveryFee: calcObj.deliveryFee,
    tax: calcObj.tax,
    total: calcObj.total,
    deliveryFee: calcObj.deliveryFee,
    costToSupplier: calcObj.costToSupplier,
    status: paymentStatus.PENDING_CHECKOUT,
    orders,
  };

  if (kartItems.length == 0) {
    throw new Error(`There are no items in the cart to checkout`);
  }

  if (!pendingCheckout) {
    payment = await paymentModel.create(payment);
  } else {
    payment._id = pendingCheckout._id;

    // update payment object
    await paymentModel.updateOne(
      { _id: pendingCheckout._id },
      {
        $set: {
          supplier: payment.supplier,
          cost: payment.cost,
          subTotal: payment.subTotal,
          deliveryFee: payment.deliveryFee,
          serviceFee: payment.serviceFee,
          tax: payment.tax,
          total: payment.total,
          costToSupplier: payment.costToSupplier,
          orders,
        },
      }
    );
  }

  orders = await orderModel.aggregate([
    {
      $match: {
        _id: { $in: payment.orders },
      },
    },
    {
      $lookup: {
        from: "dishitems",
        localField: "item",
        foreignField: "_id",
        as: "item",
      },
    },
    {
      $unwind: "$item",
    },
    {
      $lookup: {
        from: "clientpickuppoints",
        localField: "item.clientPickups",
        foreignField: "_id",
        as: "item.clientPickups",
      },
    },
    {
      $project: {
        _id: 1,
        quantity: 1,
        pickupPoint: 1,
        instruction: 1,
        cost: 1,
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
        "item.clientPickups.suitableTimes": 1,
      },
    },
  ]);

  orders.forEach((o) => {
    const { subTotal } = priceBreakdownItem(o.item.pricePerOrder);
    o.item.pricePerOrder = subTotal;
  });

  // attach payment id with order
  await attachPaymentIdToOrders(payment._id);

  return res.status(StatusCodes.OK).json({ checkout: payment, orders });
};

// getCheckout("63289a1a3bb5ba24e2efc4a4")

/**
-----checkout version 2----

check for pending checkout

  if pending checkout doesn't exists
  - fetch kart items
  - convert kart items to orders with pricing info
  - construct payment object with total pricing
  - save orders and payment
  - return

  if pending checkout exists
  - fetch orders
  - fetch kart items
  - compare if same, just return
  - if not same, update the orders based on the kart items
  - update the pricing in payment model
  - return

** handle delivery fee (dnt forgettiii)

*/

const getCheckoutV2 = async (req, res) => {
  const { userId } = req.user;
  const kartResp = await kartController.userKart(userId);
  const { kart } = kartResp;
  const { kartItems, kartCount } = kart;

  if (!kartCount) {
    throw new Error(`No item in kart to checkout`);
  }

  const prevOrders = await orderModel.aggregate([
    {
      $match: {
        $and: [
          { customer: mongoose.Types.ObjectId(userId) },
          { status: "pending_checkout" },
        ],
      },
    },
    {
      $lookup: {
        from: "dishitems",
        localField: "item",
        foreignField: "_id",
        as: "item",
      },
    },
    {
      $unwind: "$item",
    },
    {
      $project: {
        _id: 1,
        item: `$item._id`,
        pickupPoint: 1,
        instruction: 1,
        eventDate: `$item.eventDate`,
      },
    },
  ]);

  const prevOrderMeta = {};
  if (prevOrders && prevOrders.length > 0) {
    prevOrders.forEach((po) => {
      let dateVal = format(new Date(po.eventDate), "dd/MM/yyyy");
      prevOrderMeta[po.item] = {
        pickupPoint: po.pickupPoint,
        pickupPointWDate: `${po.pickupPoint}|${dateVal}`,
        instruction: po.instruction,
        orderId: po._id,
      };
    });
  }

  const prevOrderIds = prevOrders.map((o) => o._id);

  // kartItems.forEach((ki) => {
  //   let dateVal = format(new Date(ki.item.eventDate), "dd/MM/yyyy");

  //   if (prevOrderMeta[ki.item._id]) {
  //     if (!prevOrderMeta[ki.item._id].pickupPoint) {
  //       if (ki.item.clientPickups.length == 1) {
  //         prevOrderMeta[ki.item._id].pickupPoint = ki.item.clientPickups[0];
  //         prevOrderMeta[
  //           ki.item._id
  //         ].pickupPointWDate = `${ki.item.clientPickups[0]}|${dateVal}`;
  //       }
  //     }
  //   } else {
  //     if (ki.item.clientPickups.length) {
  //       prevOrderMeta[ki.item._id] = {
  //         pickupPointWDate: `${ki.item.clientPickups[0]}|${dateVal}`,
  //         pickupPoint: ki.item.clientPickups[0],
  //         instruction: "",
  //         orderId: new mongoose.Types.ObjectId(),
  //       };
  //     }
  //   }
  // });

  // remove prev orders from db
  await orderModel.deleteMany({
    _id: { $in: prevOrderIds },
  });

  // delivery fee calc

  // number of unique pickup points  
  const pickUpPointMeta = {};
  for (const key in prevOrderMeta) {
    if (prevOrderMeta[key].pickupPointWDate) {
      const pickupPointWDate = prevOrderMeta[key].pickupPointWDate;
      if (pickUpPointMeta[pickupPointWDate]) {
        pickUpPointMeta[pickupPointWDate] += 1;
      } else {
        pickUpPointMeta[pickupPointWDate] = 1;
      }
    }
  }

  const existingPayment = await paymentModel.findOne({
    $and: [{ customer: userId }, { status: paymentStatus.PENDING_CHECKOUT }],
  });
  let paymentId = null;
  if (existingPayment) {
    paymentId = existingPayment._id;
  } else {
    paymentId = new mongoose.Types.ObjectId();
  }

  let orders = [];
  kartItems.forEach((ki) => {
    const itemPrice = ki.item.pricePerOrder;
    let itemCalc = priceBreakdownItem(itemPrice);
    const itemSubTotal = itemCalc.subTotal;
    itemCalc = priceBreakdownItem(multiply(itemPrice, ki.quantity));
    const subTotal = round(itemCalc.subTotal, 2);
    const serviceFee = round(itemCalc.serviceFee, 2);
    const tax = round(itemCalc.tax, 2);
    
    let deliveryFee = 0;

    let date = format(new Date(ki.item.eventDate), "dd/MM/yyyy");
    if (prevOrderMeta[ki.item._id] && prevOrderMeta[ki.item._id].pickupPoint) {
      const pickupPointId = prevOrderMeta[ki.item._id].pickupPoint;
      const count = pickUpPointMeta[`${pickupPointId}|${date}`];

      deliveryFee = round(DELIVERY_FEE / count, 2);
    }

    const total = round(sum(subTotal, deliveryFee), 2);
    const itemCostToSupplier = ki.item.costToSupplierPerOrder;
    const costToSupplier = round(
      multiply(ki.item.costToSupplierPerOrder, ki.quantity),
      2
    );

    //
    //
    //
    //
    //
    //

    // check if payment exists

    orders.push({
      _id: prevOrderMeta[ki.item._id]
        ? prevOrderMeta[ki.item._id].orderId
        : mongoose.Types.ObjectId(),
      payment: paymentId,
      customer: userId,
      viewId: "order_" + crypto.randomBytes(6).toString("hex"),
      item: ki.item._id,
      event: ki.item.event,
      supplier: ki.item.supplier,
      quantity: ki.quantity,
      itemPrice,
      itemSubTotal,
      subTotal,
      deliveryFee,
      total,
      itemCostToSupplier,
      costToSupplier,
      isPaid: false,
      status: paymentStatus.PENDING_CHECKOUT,
      serviceFee,
      tax,
      pickupDate: ki.item.eventDate,
      pickupPoint: prevOrderMeta[ki.item._id]
        ? prevOrderMeta[ki.item._id].pickupPoint
        : null,
      instruction: prevOrderMeta[ki.item._id]
        ? prevOrderMeta[ki.item._id].instruction
        : null,
    });
  });

  const calcObj = paymentCalcualtion(orders);

  // create payment object
  let payment = {
    viewId: crypto.randomBytes(3).toString("hex"),
    customer: userId,
    totalItemPrice: calcObj.totalItemPrice,
    serviceFee: calcObj.serviceFee,
    tax: calcObj.tax,
    subTotal: calcObj.subTotal,
    deliveryFee: calcObj.deliveryFee,
    total: calcObj.total,
    costToSupplier: calcObj.costToSupplier,
    status: paymentStatus.PENDING_CHECKOUT,
    orderCount: orders.length,
  };

  // create if not exists
  if (existingPayment) {
    // update payment object
    payment = await paymentModel.updateOne(
      {
        _id: existingPayment._id,
      },
      {
        $set: {
          totalItemPrice: payment.totalItemPrice,
          serviceFee: payment.serviceFee,
          tax: payment.tax,
          subTotal: payment.subTotal,
          deliveryFee: payment.deliveryFee,
          total: payment.total,
          costToSupplier: payment.costToSupplier,
          orderCount: orders.length,
        },
      }
    );

    payment = await paymentModel.findById(existingPayment._id);
  } else {
    payment._id = paymentId;
    payment = await paymentModel.create(payment);
  }

  // save orders
  await orderModel.create(orders);

  orders = await orderModel.aggregate([
    {
      $match: {
        customer: mongoose.Types.ObjectId(userId),
        status: paymentStatus.PENDING_CHECKOUT,
      },
    },
    {
      $lookup: {
        from: "dishitems",
        localField: "item",
        foreignField: "_id",
        as: "item",
      },
    },
    {
      $unwind: "$item",
    },
    {
      $lookup: {
        from: "clientpickuppoints",
        localField: "item.clientPickups",
        foreignField: "_id",
        as: "item.clientPickups",
      },
    },
    {
      $project: {
        _id: 1,
        quantity: 1,
        totalItemPrice: 1,
        serviceFee: 1,
        tax: 1,
        subTotal: 1,
        deliveryFee: 1,
        total: 1,
        costToSupplier: 1,
        orderCount: 1,
        pickupPoint: 1,
        instruction: 1,
        cost: 1,
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
        "item.clientPickups.suitableTimes": 1,
      },
    },
  ]);

  return res.status(StatusCodes.OK).json({ checkout: payment, orders });
};

// getCheckoutV2("6336ba18514f6da91439867c")
//
const updatePickupAddressOnOrder = async (req, res) => {
  const orders = req.body.orders;

  for (let i = 0; i < orders.length; i++) {
    let o = orders[i];

    let resp = await orderModel.updateOne(
      {
        _id: o.orderId,
      },
      {
        $set: {
          pickupPoint: o.pickupPoint,
          instruction: o.instruction,
        },
      }
    );

    await orderModel.findOne({ _id: o.orderId });
  }

  return res
    .status(StatusCodes.OK)
    .json({ message: "pickup point updated on the order" });
};

const updatePaymentMethod = async (req, res) => {
  const paymentId = req.params.paymentId;
  const paymentMethod = req.body.paymentMethod;

  await paymentModel.updateOne(
    {
      _id: paymentId,
    },
    {
      $set: {
        paymentMethodType: "card",
        paymentMethod,
        updatedAt: new Date(),
      },
    }
  );

  return res.status(StatusCodes.OK).json({ message: "payment method updated" });
};

const placeOrder = async (req, res) => {
  const paymentId = req.params.paymentId;

  // update payment status to order_placed
  await paymentModel.updateOne(
    {
      _id: paymentId,
    },
    {
      $set: {
        status: paymentStatus.ORDER_PLACED,
      },
    }
  );

  // update order status to pending
  await orderModel.updateMany(
    {
      payment: mongoose.Types.ObjectId(paymentId),
    },
    {
      $set: {
        status: orderStatus.ACTIVE,
      },
    }
  );

  //clear user kart
  await kartModel.deleteMany({ customer: req.user.userId });

  process.nextTick(() => {
  //OrderCreatedNotificationForAdmin(paymentId);
    OrderCreatedNotificationForUser(paymentId);
  });

  return res
    .status(StatusCodes.OK)
    .json({ message: "order placed successfully" });
};

const getPayments = async (req, res) => {
  const skip = req.query.skip ? Number(req.query.skip) : 0;
  const limit = req.query.limit ? Number(req.query.limit) : 10;

  let status = req.query.status;
  if (status) {
    if (status == "active") {
      status = paymentStatus.ORDER_PLACED;
    } else if (status == "past") {
      status = paymentStatus.COMPLETED;
    }
  } else {
    status = paymentStatus.ORDER_PLACED;
  }

  const payments = await paymentModel.aggregate([
    {
      $match: {
        status: status,
      },
    },
    {
      $skip: skip,
    },
    {
      $limit: limit,
    },
    {
      $sort: {
        _id:-1
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "customer",
        foreignField: "_id",
        as: "customer",
      },
    },
    {
      $unwind: "$customer",
    },
    {
      $lookup: {
        from: "suppliers",
        localField: "supplier",
        foreignField: "_id",
        as: "supplier",
      },
    },
    {
      $unwind: "$supplier",
    },
    {
      $lookup: {
        from: "orders",
        let: { orders: "$orders" },
        pipeline: [
          {
            $match: {
              $expr: { $in: ["$_id", "$$orders"] },
            },
          },
          {
            $lookup: {
              from: "dishitems",
              localField: "item",
              foreignField: "_id",
              as: "item",
            },
          },
          {
            $unwind: "$item",
          },
        ],
        as: "orders",
      },
    },
    {
      $project: {
        cost: 1,
        serviceFee: 1,
        deliveryFee: 1,
        viewId: 1,
        tax: 1,
        total: 1,
        costToSupplier: 1,
        eventPickupAddressMapping: 1,
        isPaid: 1,
        false: 1,
        status: 1,
        "customer.fullName": 1,
        "customer.profileImg": 1,
        "customer.email": 1,
        "customer.phone": 1,
        "supplier.businessName": 1,
        "supplier.businessImages": 1,
        "supplier.address": 1,
        "supplier.contactInfo": 1,
        orders: 1,
      },
    },
  ]);

  const paymentCount = await paymentModel
    .find({ status: paymentStatus.ORDER_PLACED })
    .countDocuments();

  return res.status(StatusCodes.OK).json({ payments, paymentCount });
};
// getPayments()

const getPaymentsFrCustomer = async (req, res) => {
  const skip = req.query.skip ? Number(req.query.skip) : 0;
  const limit = req.query.limit ? Number(req.query.limit) : 10;

  let status = req.query.status;
  if (status) {
    if (status == "active") {
      status = paymentStatus.ORDER_PLACED;
    } else if (status == "past") {
      status = paymentStatus.COMPLETED;
    }
  } else {
    status = paymentStatus.ORDER_PLACED;
  }

  const payments = await paymentModel.aggregate([
    {
      $match: {
        $and: [
          { status: status },
          { customer: mongoose.Types.ObjectId(req.user.userId) },
        ],
      },
    },
    {
      $skip: skip,
    },
    {
      $limit: limit,
    },
    {
      $sort: {
        "updatedAt":-1
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "customer",
        foreignField: "_id",
        as: "customer",
      },
    },
    {
      $unwind: "$customer",
    },
    {
      $lookup: {
        from: "orders",
        let: { paymentId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$payment", "$$paymentId"] },
            },
          },
          {
            $lookup: {
              from: "dishitems",
              localField: "item",
              foreignField: "_id",
              as: "item",
            },
          },
          {
            $unwind: "$item",
          },
          {
            $lookup: {
              from: "clientpickuppoints",
              localField: "pickupPoint",
              foreignField: "_id",
              as: "pickupPoint",
            },
          },
          {
            $unwind: "$pickupPoint",
          },
          {
            $lookup: {
              from: "suppliers",
              localField: "supplier",
              foreignField: "_id",
              as: "supplier",
            },
          },
          {
            $unwind: "$supplier",
          },
        ],
        as: "orders",
      },
    },
    {
      $project: {
        totalItemPrice: 1,
        subTotal: 1,
        serviceFee: 1,
        deliveryFee: 1,
        tax: 1,
        total: 1,
        costToSupplier: 1,
        viewId: 1,
        createdAt: 1,
        updatedAt: 1,
        eventPickupAddressMapping: 1,
        isPaid: 1,
        false: 1,
        status: 1,
        "customer.fullName": 1,
        "customer.profileImg": 1,
        "customer.email": 1,
        "customer.phone": 1,
        orders: 1,
      },
    },
  ]);

  const paymentCount = await paymentModel
    .find({
      $and: [
        { status: status },
        { customer: mongoose.Types.ObjectId(req.user.userId) },
      ],
    })
    .countDocuments();

  return res.status(StatusCodes.OK).json({ payments, paymentCount });
};
// get single payment details for customer
const getSinglePaymentFrCustomer = async (req, res) => {
  const { paymentId } = req.params;

  let payment = await paymentModel.aggregate([
    {
      $match: {
        _id: mongoose.Types.ObjectId(paymentId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "customer",
        foreignField: "_id",
        as: "customer",
      },
    },
    {
      $unwind: "$customer",
    },
    {
      $lookup: {
        from: "orders",
        let: { paymentId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$payment", "$$paymentId"] },
            },
          },
          {
            $lookup: {
              from: "dishitems",
              localField: "item",
              foreignField: "_id",
              as: "item",
            },
          },
          {
            $unwind: "$item",
          },
          {
            $lookup: {
              from: "clientpickuppoints",
              localField: "pickupPoint",
              foreignField: "_id",
              as: "pickupPoint",
            },
          },
          {
            $unwind: "$pickupPoint",
          },
          {
            $lookup: {
              from: "suppliers",
              localField: "supplier",
              foreignField: "_id",
              as: "supplier",
            },
          },
          {
            $unwind: "$supplier",
          },
        ],
        as: "orders",
      },
    },
    {
      $project: {
        totalItemPrice: 1,
        subTotal: 1,
        serviceFee: 1,
        deliveryFee: 1,
        tax: 1,
        total: 1,
        costToSupplier: 1,
        viewId: 1,
        createdAt: 1,
        updatedAt: 1,
        costToSupplier: 1,
        eventPickupAddressMapping: 1,
        isPaid: 1,
        false: 1,
        status: 1,
        "customer.fullName": 1,
        "customer.profileImg": 1,
        "customer.email": 1,
        "customer.phone": 1,
        orders: 1,
      },
    },
  ]);

  payment = payment[0];

  return res.status(StatusCodes.OK).json({ payment });
};

const updateOrder = async (req, res) => {
  const orderId = req.params.orderId;
  const status = req.body.status;

  // get orders data for recalculations
  let payment = await paymentModel.aggregate([
    {
      $match: {
        orders: { $elemMatch: { $eq: mongoose.Types.ObjectId(orderId) } },
      },
    },
    {
      $lookup: {
        from: "orders",
        let: { orders: "$orders" },
        pipeline: [
          {
            $match: {
              $expr: { $in: ["$_id", "$$orders"] },
            },
          },
          {
            $lookup: {
              from: "dishitems",
              localField: "item",
              foreignField: "_id",
              as: "item",
            },
          },
          {
            $unwind: "$item",
          },
          {
            $project: {
              _id: 1,
              status: 1,
              quantity: 1,
              "item.pricePerOrder": 1,
              "item.costToSupplierPerOrder": 1,
            },
          },
        ],
        as: "orders",
      },
    },
    {
      $project: {
        _id: 1,
        total: 1,
        orders: 1,
      },
    },
  ]);

  payment = payment[0];

  if (status == "cancelled") {
    let unCancelledOrders = payment.orders.filter((o) => {
      if (checkMongoIdsAreSame(o._id, orderId) || o.status == "cancelled") {
        return false;
      } else {
        return true;
      }
    });

    const update = priceBreakdownCheckout(unCancelledOrders);
    update.updatedAt = new Date();

    await paymentModel.updateOne(
      {
        _id: payment._id,
      },
      {
        $set: update,
      }
    );
  }

  await orderModel.updateOne(
    {
      _id: orderId,
    },
    {
      $set: {
        status,
        updatedAt: new Date(),
      },
    }
  );

  await tryToCompleteTransaction(payment._id);

  return res.status(StatusCodes.OK).json({ message: `order ${status}!` });
};

const CreatePaymentIntent = async (req, res) => {
  const { save_card } = req.query;
  const { stripeCustId } = await User.findById(req.user.userId, `stripeCustId`);
  const paymentId = req.params.paymentId;
  const payment = await paymentModel.findById(paymentId, `total`);

  let paymentIntent = null;
  if (save_card && save_card.toLowerCase() == "y") {
    paymentIntent = await PaymentIntentCreate(
      true,
      stripeCustId,
      payment.total
    );
  } else {
    paymentIntent = await PaymentIntentCreate(
      false,
      stripeCustId,
      payment.total
    );
  }

  await paymentModel.updateOne(
    {
      _id: paymentId,
    },
    {
      $set: {
        paymentIntent: paymentIntent.paymentIntentId,
      },
    }
  );

  return res.status(StatusCodes.OK).json({ paymentIntent });
};


const tryIfPaymentIsCompleted = async (paymentId) => {

  console.log("tryIfPaymentIsCompleted: ", paymentId)

  const pendingOrdersCount = await orderModel.find({
    $and: [
      {payment: paymentId},
      {status : "confirmed"}
    ]
  }).countDocuments()

  if (!pendingOrdersCount){

    // mark payment as completed
    await paymentModel.updateOne({
      _id: paymentId
    }, {
      $set: {
        status: "completed"
      }
    })

    console.log("payment completed: ", paymentId);
  }

}

// all deliveries done
const tryIfItemIsCompleted = async (itemId) => {

  console.log("tryIfItemIsCompleted: ", itemId)

  const pendingOrdersCount = await orderModel.find({
    $and: [
      {item: itemId},
      {status : "confirmed"}
    ]
  }).countDocuments()

  if (!pendingOrdersCount){

    // mark payment as completed
    await dishItemModel.updateOne({
      _id: itemId
    }, {
      $set: {
        status: "completed"
      }
    })

    console.log("dish item completed: ", itemId);
  }

}

const tryIfItemAndPaymentAreCompleted = async (query) => {

  const orders = await orderModel.find(query);
  
  const paymentIds = orders.map(o=> o.payment);
  const items = orders.map(o=> o.item);

  console.log("paymentIds => ", paymentIds)
  console.log("items => ", items)

  for (let i=0; i< paymentIds.length; i++){
    await tryIfPaymentIsCompleted(paymentIds[i])
  }

  for (let i=0; i< items.length; i++){
    await tryIfItemIsCompleted(items[i])
  }

  console.log("tryIfPaymentsAreCompleted ended!");
}


const markOrderDelivedThruQR = async (req, res) => {
  
  let {userId, pickupPoint, pickupDate} = req.params;
  pickupDate = calDateToPSTDate(pickupDate)

  const resp = await orderModel.updateMany({
    $and: [
      {customerId: userId},
      {pickupPoint},
      {pickupDate}
    ]
  }, {
    $set: {
      status: 'delivered',      
    }
  })

  // if all orders done mark payment/item as completed
  await tryIfItemAndPaymentAreCompleted({
    $and: [
      {customerId: userId},
      {pickupPoint},
      {pickupDate}
    ]
  })

  return res.status(StatusCodes.OK).json({ message: `${resp.modifiedCount} orders delivered!` });
};

const getQrFromOrder = async (order) =>{
  return new Promise((resolve, reject)=>{
    let qrValue = `${process.env.API_URL}/qr/${order.customer}/${order.pickupPoint}/${PSTDateToCalDate(order.pickupDate)}`

    QRCode.toDataURL(qrValue, function (err, url) {
      resolve(url)
    });
  })
}

const getOrderDeliveryQR = async (req, res) => {
  const { orderId } = req.params;
  
  const order = await orderModel.findById(orderId, `customer pickupPoint pickupDate`);

  if (!order){
    res.status(StatusCodes.OK).json({ message: `invalid order!` });
  }

  let qrValue = `${process.env.API_URL}/qr/${order.customer}/${order.pickupPoint}/${PSTDateToCalDate(order.pickupDate)}`

  QRCode.toDataURL(qrValue, function (err, url) {
    res.status(StatusCodes.OK).json({ url });
  });

  return;
};

const cancelCompleteOrders = async (paymentId) => {

  // cancel all orders
  await orderModel.updateMany({
    payment: paymentId
  }, {
    $set: {
      status: "cancelled",
      updatedAt: new Date()
    }
  })

  // cancel payment
  await paymentModel.updateOne({
    _id: paymentId
  }, {
    $set: {
      status: "cancelled",
      updatedAt: new Date()
    }
  })

  return
}

const cancelOrder = async (req, res) => {
  
  const orderId = req.params.orderId;

  // fetch payment
  let order = await orderModel.aggregate([
    {
      $match: {
        _id: mongoose.Types.ObjectId(orderId),
      },
    },
    {
      $lookup: {
        from: "payments",
        localField: "payment",
        foreignField: "_id",
        as: "payment",
      },
    },
    {
      $unwind: "$payment",
    },
    {
      $lookup: {
        from: "orders",
        let: { paymentId: "$payment._id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$payment", "$$paymentId"] },
            },
          },
          {
            $lookup: {
              from: "dishitems",
              localField: "item",
              foreignField: "_id",
              as: "item",
            },
          },
          {
            $unwind: "$item",
          },          
        ],
        as: "orders",
      },
    },
  ]);

  order = order[0];

  const orderToCancel = order;
  const currPaymentObj = order.payment;
  const allorders = order.orders;

  let ordersLeft = [];

  allorders.forEach((o) => {
    if (o.status == "cancelled" || checkMongoIdsAreSame(o._id, orderId)) {
    } else {
      ordersLeft.push(o);
    }
  });

  // if zero item remain, cancel all orders, cancel payment, make amounts to 0
  if (ordersLeft.length == 0) {
    await cancelCompleteOrders(currPaymentObj._id);
    res.status(StatusCodes.OK).json({ message: 'Order cancelled!' });
    return 
  }

  // refresh the calculations based on the remaining orders "ordersLeft"

  // calculate delivery fee
  const ordersMeta = {};
  ordersLeft.forEach((po) => {
    let dateVal = format(new Date(po.item.eventDate), "dd/MM/yyyy");
    ordersMeta[po.item._id] = {
      pickupPoint: po.pickupPoint,
      pickupPointWDate: `${po.pickupPoint}|${dateVal}`,      
      orderId: po._id,
    };
  });
  
  const pickUpPointMeta = {};
  for (const key in ordersMeta) {
    if (ordersMeta[key].pickupPointWDate) {
      const pickupPointWDate = ordersMeta[key].pickupPointWDate;
      if (pickUpPointMeta[pickupPointWDate]) {
        pickUpPointMeta[pickupPointWDate] += 1;
      } else {
        pickUpPointMeta[pickupPointWDate] = 1;
      }
    }
  }

  ordersLeft.forEach((o) => {
    let deliveryFee = 0;
    let date = format(new Date(o.item.eventDate), "dd/MM/yyyy");
    if (ordersMeta[o.item._id] && ordersMeta[o.item._id].pickupPoint) {
      const pickupPointId = ordersMeta[o.item._id].pickupPoint;
      const count = pickUpPointMeta[`${pickupPointId}|${date}`];
      deliveryFee = round(DELIVERY_FEE / count, 2);
    }
    const total = round(sum(o.subTotal, deliveryFee), 2);
    
    o.deliveryFee = deliveryFee;
    o.total = total
  })

  const calcObj = paymentCalcualtion(ordersLeft);

  // cancel order
  await orderModel.updateOne({
    _id: orderId
  }, {
    $set: {
      status: "cancelled",
      updatedAt: new Date()
    }
  })

  for (let i=0; i<ordersLeft.length; i++){
    let order = ordersLeft[i];
    await orderModel.updateOne({
      _id: order._id
    }, {
      $set: {
        deliveryFee: order.deliveryFee,
        total: order.total,
        updatedAt: new Date()
      }
    })
  }

  // updated orders
  
  // update payment model
  await paymentModel.updateOne(
    {
      _id: currPaymentObj._id,
    },
    {
      $set: {
        totalItemPrice: calcObj.totalItemPrice,
        serviceFee: calcObj.serviceFee,
        tax: calcObj.tax,
        subTotal: calcObj.subTotal,
        deliveryFee: calcObj.deliveryFee,
        total: calcObj.total,
        costToSupplier: calcObj.costToSupplier,
        orderCount: ordersLeft.length,
        updatedAt: new Date()    
      },
    }
  );

  res.status(StatusCodes.OK).json({ message: 'Order cancelled!' });

  process.nextTick(()=>{
    cancelOrderNotificationWithOrderId(orderId)
  })

  return   

};

// cancelOrder("6338304acaae7bd481dcd889");

// 63382ffacaae7bd481dcd873

module.exports = {
  updateOrder,
  getPaymentsFrCustomer,
  getSinglePaymentFrCustomer,
  createOrder,
  getAllOrders,
  getOrderById,
  getCustomerOrders,
  editOrder,
  deleteOrder,
  cancelOrder,
  getCheckout,
  getCheckoutV2,
  placeOrder,
  updatePickupAddressOnOrder,
  updatePaymentMethod,
  getPayments,
  CreatePaymentIntent,
  markOrderDelivedThruQR,
  getOrderDeliveryQR,
  getQrFromOrder,
};
