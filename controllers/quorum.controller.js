const { default: mongoose } = require("mongoose");
const { orderStatus } = require("../constants");
const dishItemModel = require("../models/DishItem");
const ordersModel = require("../models/Order");
const { MakePayment } = require("../utils/stripe");
const { StatusCodes } = require("http-status-codes");
const { createPayoutWithDishItem } = require('./payout.controller');
const { cancelOrderNotificationWithOrderId } = require('./notification.controller');

function randStr(length) {
  var result = "";
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

// force = true, when the request comes from admin dashboard
const CheckAndProcessQuorum = async (dishItemId, force) => {

  console.log("CheckAndProcessQuorum")
  console.log(dishItemId, force)


  // fetch the dish item
  const dishItem = await dishItemModel.findById(
    dishItemId,
    `minOrders closingDate closingTime status`
  );

  console.log("dishItem")
  console.log(dishItem)

  if (dishItem.status != "active") {
    return `Product is not active cannot process quorum!`;
  }

  // fetch order and attached payment details
  const orders = await ordersModel.aggregate([
    {
      $match: {
        $and: [
          { item: mongoose.Types.ObjectId(dishItemId) },
          { status: "active" },
        ],
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
      $project: {
        _id: 1,
        total: 1,
        status: 1,
        paymentMethod: "$payment.paymentMethod",
        stripeCustId: "$customer.stripeCustId"
      },
    },
  ]);

  console.log("orders")
  console.log(orders)

  // min orders
  // if (orders.length > dishItem.minOrders) {
  // since this is forced from api UI we dnt have to stop the quorum if orders not reaching minimum
  if (!force && (orders.length > dishItem.minOrders)) {

    console.log("Failed to reach quorum, closing the product");

    // update orders
    await ordersModel.updateMany(
      {
        item: dishItemId,
      },
      {
        $set: {
          status: orderStatus.CANCELLED,
          updatedAt: new Date(),
        },
      }
    );

    // update dish item
    await dishItemModel.updateOne(
      {
        _id: dishItemId,
      },
      {
        $set: {
          status: orderStatus.CANCELLED,
          updatedAt: new Date(),
        },
      }
    );

    ordersModel.forEach(o=>{
      cancelOrderNotificationWithOrderId(o._id);
    })
    
    return "minimum orders not received, hence orders are cancelled!";
  }
  // if we are here, quorum is reached lets process payments

  console.log("processing orders!")

  for (let i = 0; i < orders.length; i++) {
    let order = orders[i];

    if (order.isPaid) {
      continue;
    }

    // make the payment with saved payment method

    let paymentSuccess = false;
    if (order.stripeCustId && order.paymentMethod){
        paymentSuccess = await MakePayment(order.paymentMethod, order.stripeCustId, order.total);
    }
    
    if (paymentSuccess) {
      // update order
      let resp = await ordersModel.updateOne(
        {
          _id: order._id,
        },
        {
          $set: {
            status: orderStatus.CONFIRMED,
            updatedAt: new Date(),
          },
        }
      );
      console.log(resp)
    }
  }

  // update dish item
  let resp = await dishItemModel.updateOne(
    {
      _id: dishItemId,
    },
    {
      $set: {
        status: orderStatus.CONFIRMED,
        updatedAt: new Date(),
      },
    }
  );

  console.log(resp)

  // create payouts
  try{
  await createPayoutWithDishItem(dishItemId)
  }catch(err){
    console.log(err)
  }

  // setup deliver QR

  return "quorum is reached, orders are confirmed!";
};

// CheckAndProcessQuorum("633d82fbf5547cc009dff91c", true)

const CheckAndProcessQuorumApi = async (req, res) => {
  const { dishItem } = req.params;
  const message = await CheckAndProcessQuorum(dishItem, true);
  return res.status(StatusCodes.OK).json({ message });
};

// CheckAndProcessQuorum("633ab5804b490852bf948b8c")
module.exports = {
  CheckAndProcessQuorum,
  CheckAndProcessQuorumApi,
};
