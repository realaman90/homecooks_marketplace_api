const { default: mongoose } = require("mongoose");
const { orderStatus } = require("../constants");
const dishItemModel = require("../models/DishItem");
const ordersModel = require("../models/Order");
const { MakePayment } = require("../utils/stripe");
const { StatusCodes } = require("http-status-codes");

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

const CheckAndProcessQuorum = async (dishItemId) => {
  // fetch the dish item
  const dishItem = await dishItemModel.findById(
    dishItemId,
    `minOrders closingDate closingTime status`
  );

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
        cost: 1,
        status: 1,
        paymentMethod: "$payment.paymentMethod",
        stripeCustId: "$customer.stripeCustId"
      },
    },
  ]);

  // min orders
  if (orders.length > dishItem.minOrders) {
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

    return "minimum orders not received, hence orders are cancelled!";
  }
  // if we are here, quorum is reached lets process payments

  let deliverQRValue = randStr(5);

  for (let i = 0; i < orders.length; i++) {
    let order = orders[i];

    if (order.isPaid) {
      continue;
    }

    // make the payment with saved payment method

    let paymentSuccess = false;
    if (order.stripeCustId && order.paymentMethod){
        paymentSuccess = await MakePayment(order.paymentMethod, order.stripeCustId, order.cost);
    }
    
    if (paymentSuccess) {
      // update order
      await ordersModel.updateOne(
        {
          _id: order._id,
        },
        {
          $set: {
            qrValue: deliverQRValue,
            status: orderStatus.CONFIRMED,
            updatedAt: new Date(),
          },
        }
      );
    }
  }

  // update dish item
  await dishItemModel.updateOne(
    {
      _id: dishItemId,
    },
    {
      $set: {
        qrValue: deliverQRValue,
        status: orderStatus.CONFIRMED,
        updatedAt: new Date(),
      },
    }
  );

  // setup deliver QR

  return "quorum is reached, orders are confirmed!";
};

const CheckAndProcessQuorumApi = async (req, res) => {
  const { dishItem } = req.params;
  const message = await CheckAndProcessQuorum(dishItem);
  return res.status(StatusCodes.OK).json({ message });
};

// CheckAndProcessQuorum("632748f393f8f1dc58d4f4cb")
module.exports = {
  CheckAndProcessQuorumApi,
};
