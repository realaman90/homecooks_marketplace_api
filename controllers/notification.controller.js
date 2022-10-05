const UserModel = require("../models/User");
const OrderModel = require("../models/Order");
const SupplierModel = require("../models/Supplier");
const DishModel = require("../models/Dish");
const PaymentModel = require("../models/Payment");
const EventTemplateModel = require("../models/EventTemplate");
const NotificationModel = require("../models/Notification");
const { notificationTypes } = require("../constants");
const { StatusCodes } = require("http-status-codes");
const {
  sendEmail,
  sendMultipleEmails,
  sendEmailWithTemplate,
} = require("./email.controller");
const {
  sendSMS
} = require('./sms.controller');

const { default: mongoose } = require("mongoose");
const { parseISO, format } = require("date-fns");
const { PSTDateToCalDate } = require("../utils/datetime");
const { uploadBase64AsImageFile } = require("../utils/s3.utils");

const QRCode = require("qrcode");

const getQrFromOrder = async (order) => {
  return new Promise((resolve, reject) => {
    let qrValue = `${process.env.API_URL}/qr/${order.customer}/${
      order.pickupPoint
    }/${PSTDateToCalDate(order.pickupDate)}`;

    QRCode.toDataURL(qrValue, function (err, url) {
      resolve(url);
    });
  });
};

// notification creation function

var HARDCODED_ADMIN_VALUES = false;
var _adminDetails = [
  {
    _id: "631ad4166f442471ffcb1de5",
    fullName: "Utkarsh Tyagi",
    email: "vubyto@dropjar.com",
    phone: "0000000000",
    notificationSettings: {
      email: true,
    },
  },
];

// working
const CreateUserWelcomeNotification = async (userId) => {
  const userDetails = await UserModel.findById(
    userId,
    `fullName email phone notificationSettings`
  );
  if (!userDetails) {
    // log this to analyse the scenario
    return;
  }

  const subject = `Welcome to the noudada platform`;
  const emailMessage = `Hi ${userDetails.fullName}
        Welcome to the noudada platform

        Thanks,
        Noudada Teams
    `;
  const smsMessage = `Hi ${userDetails.fullName}
        Welcome to the noudada platform

        Thanks,
        Noudada Teams
    `;
  const appMessage = `Hi ${userDetails.fullName}
        Welcome to the noudada platform

        Thanks,
        Noudada Teams
`;
  const app_url = `${process.env.APP_URL}`;

  let notificationRecod = {
    type: notificationTypes.WELCOME_FR_USER,
    toId: userId,
    toEmail: userDetails.email,
    toPhone: userDetails.phone,
    userNotificationSettings: userDetails.notificationSettings,
    message: {
      subject,
      emailMessage,
      smsMessage,
      appMessage,
    },
    app_url,
    refModel: "Users",
    refId: userId,
  };

  await NotificationModel.create(notificationRecod);

  if (notificationRecod.userNotificationSettings.email) {
    // send email
    sendEmail(notificationRecod);
  }

  if (notificationRecod.userNotificationSettings.phone) {
    // send sms
  }

  return null;
};

// setTimeout(()=>{
//     CreateUserWelcomeNotification("62f989526253b49a1bc0696a")
// }, 4000)

// user Enquiry notification
const UserEnquiryNotificationForAdmin = async (email, description) => {
  
  let adminDetails = null;
  if (HARDCODED_ADMIN_VALUES) {
    adminDetails = _adminDetails;
  } else {
    // get admin details
    adminDetails = await UserModel.find(
      {
        role: "admin",
      },
      `fullName email phone notificationSettings`
    );
  }

  const subject = `User has submitted an enquiry.`;
  const emailMessage = `Hi Admin
        A user has submitted an enquiry.
        
        Email: ${email}
        Description: ${description}
        
        Thanks,        
    `;
  const smsMessage = emailMessage;
  const appMessage = emailMessage;

  const app_url = `${process.env.APP_URL}`;

  let notificationRecods = [];

  adminDetails.forEach((admin) => {
    notificationRecods.push({
      type: notificationTypes.USER_ENQUIRY,
      toId: admin._id,
      toEmail: admin.email,
      toPhone: admin.phone,
      userNotificationSettings: admin.notificationSettings,
      message: {
        subject,
        emailMessage,
        smsMessage,
        appMessage,
      },
      app_url,
      refModel: "Enquiry"      
    });
  });

  await NotificationModel.insertMany(notificationRecods);

  await sendMultipleEmails(notificationRecods);

  // if (notificationRecod.userNotificationSettings.phone){
  //     // send sms

  // }

  return null;
};

// UserEnquiryNotificationForAdmin("enquirymaster@gmail.com","Testing enquiry messages!")

///////////////////////////////// Notification towards admin ////////////////////////////////

// https://noudada.s3.amazonaws.com/8c1d9f6e-3575-4fb5-918c-9476833f765e

// admin notification for user signup
// working
const UserSignUpNotificationForAdmin = async (userId) => {
  const userDetails = await UserModel.findById(
    userId,
    `fullName email phone notificationSettings`
  );
  if (!userDetails) {
    // log this to analyse the scenario
    return;
  }

  let adminDetails = null;
  if (HARDCODED_ADMIN_VALUES) {
    adminDetails = _adminDetails;
  } else {
    // get admin details
    adminDetails = await UserModel.find(
      {
        type: "admin",
      },
      `fullName email phone notificationSettings`
    );
  }

  const subject = `New User Signup on the platform`;
  const emailMessage = `Hi Admin
        A new user has just signed up on the platform.

        Name: ${userDetails.fullName}
        Email: ${userDetails.email}
        Phone: ${userDetails.phone}
        
        Thanks,
        Noudada Teams
    `;
  const smsMessage = emailMessage;
  const appMessage = emailMessage;

  const app_url = `${process.env.APP_URL}`;

  let notificationRecods = [];

  adminDetails.forEach((admin) => {
    notificationRecods.push({
      type: notificationTypes.NEW_USER_SIGNUP_FR_ADMIN,
      toId: admin._id,
      toEmail: admin.email,
      toPhone: admin.phone,
      userNotificationSettings: admin.notificationSettings,
      message: {
        subject,
        emailMessage,
        smsMessage,
        appMessage,
      },
      app_url,
      refModel: "Users",
      refId: userId,
    });
  });

  await NotificationModel.insertMany(notificationRecods);

  await sendMultipleEmails(notificationRecods);

  // if (notificationRecod.userNotificationSettings.phone){
  //     // send sms

  // }

  return null;
};

// setTimeout(()=>{
// UserSignUpNotificationForAdmin("6320af8ffdd037cb6c9a1ab7")
// }, 4000)

// admin notification for supplier signup
const SupplierSignUpNotificationForAdmin = async (supplierId) => {
  const supplierDetails = await SupplierModel.findById(
    supplierId,
    `businessName speciality description address pickupAddress contactInfo`
  );
  if (!supplierDetails) {
    // log this to analyse the scenario
    return;
  }

  let adminDetails = null;
  if (HARDCODED_ADMIN_VALUES) {
    adminDetails = _adminDetails;
  } else {
    // get admin details
    adminDetails = await UserModel.find(
      {
        type: "admin",
      },
      `fullName email phone notificationSettings`
    );
  }

  const subject = `New Supplier Signup on the platform`;
  const emailMessage = `Hi Admin
        A new supplier has just signed up on the platform.

        Business Name: ${supplierDetails.businessName}
        Description: ${supplierDetails.description}
        Business Email: ${supplierDetails.contactInfo.businessEmail}
        Business Phone: ${supplierDetails.contactInfo.businessPhone}

        Thanks,
        Noudada Teams
    `;
  const smsMessage = emailMessage;
  const appMessage = emailMessage;

  const app_url = `${process.env.APP_URL}`;

  let notificationRecods = [];

  adminDetails.forEach((admin) => {
    notificationRecods.push({
      type: notificationTypes.NEW_SUPPLIER_SIGNUP_FR_ADMIN,
      toId: admin._id,
      toEmail: admin.email,
      toPhone: admin.phone,
      userNotificationSettings: admin.notificationSettings,
      message: {
        subject,
        emailMessage,
        smsMessage,
        appMessage,
      },
      app_url,
      refModel: "Supplier",
      refId: supplierId,
    });
  });

  // console.log(notificationRecod)

  await NotificationModel.insertMany(notificationRecods);

  // send email
  await sendMultipleEmails(notificationRecods);

  return null;
};

// setTimeout(()=>{
// SupplierSignUpNotificationForAdmin("631ae2456f442471ffcb23f4")
// }, 4000)

// admin notification for new dish created
const DishCreatedNotificationForAdmin = async (dishId) => {
  const dishDetails = await DishModel.findById(
    dishId,
    `name viewId description category minOrders maxOrders pricePerOrder quantity size`
  ).populate("supplier", `businessName`);
  if (!dishDetails) {
    // log this to analyse the scenario
    return;
  }

  // get admin details
  let adminDetails = null;
  if (HARDCODED_ADMIN_VALUES) {
    adminDetails = _adminDetails;
  } else {
    // get admin details
    adminDetails = await UserModel.find(
      {
        type: "admin",
      },
      `fullName email phone notificationSettings`
    );
  }

  const subject = `New Dish is created by ${dishDetails.supplier.businessName}`;
  const emailMessage = `Hi Admin
        A new dish is created by ${dishDetails.supplier.businessName}

        Name: ${dishDetails.name}
        ViewId: ${dishDetails.viewId}
        Description: ${dishDetails.description}
        Category: ${dishDetails.category}
        MinOrders: ${dishDetails.minOrders}
        MaxOrders: ${dishDetails.maxOrders}
        PricePerOrder: ${dishDetails.pricePerOrder}
        Quantity: ${dishDetails.quantity}
        Size: ${dishDetails.size}

        Thanks,
        Noudada Teams
    `;
  const smsMessage = emailMessage;
  const appMessage = emailMessage;

  const app_url = `${process.env.APP_URL}`;

  let notificationRecords = [];

  adminDetails.forEach((admin) => {
    notificationRecords.push({
      type: notificationTypes.NEW_DISH_CREATED_FR_ADMIN,
      toId: admin._id,
      toEmail: admin.email,
      toPhone: admin.phone,
      userNotificationSettings: admin.notificationSettings,
      message: {
        subject,
        emailMessage,
        smsMessage,
        appMessage,
      },
      app_url,
      refModel: "Dish",
      refId: dishId,
    });
  });

  await NotificationModel.insertMany(notificationRecords);

  // send email
  await sendMultipleEmails(notificationRecords);

  return null;
};

// setTimeout(()=>{
// DishCreatedNotificationForAdmin("631b7f1f55d9a34b8b39771e")
// }, 6000)

// admin notification for event created
const EventCreatedNotificationForAdmin = async (eventTemplateId) => {
  const eventTemplateDetails = await EventTemplateModel.findById(
    eventTemplateId,
    `name dishes viewId description category minOrders maxOrders pricePerOrder quantity size eventFrequency recurringType eventDate`
  )
    .populate("supplier", `businessName viewId`)
    .populate("dishes", `name viewId description`);
  if (!eventTemplateDetails) {
    // log this to analyse the scenario
    return;
  }

  // get admin details
  let adminDetails = null;
  if (HARDCODED_ADMIN_VALUES) {
    adminDetails = _adminDetails;
  } else {
    // get admin details
    adminDetails = await UserModel.find(
      {
        type: "admin",
      },
      `fullName email phone notificationSettings`
    );
  }

  const subject = `New event setup by ${eventTemplateDetails.supplier.businessName}`;
  const emailMessage = `Hi Admin
        A event is setup by ${eventTemplateDetails.supplier.businessName}

        Event Name: ${eventTemplateDetails.name}
        DishCount: ${eventTemplateDetails.dishes.length}
        Event Frequency: ${eventTemplateDetails.eventFrequency}
        Recurring Type: ${eventTemplateDetails.recurringType}
        Start Date: ${eventTemplateDetails.startDate}
        End Date: ${eventTemplateDetails.endDate} 
        Event Date: ${eventTemplateDetails.eventDate}

        Thanks,
        Noudada Teams
    `;
  const smsMessage = emailMessage;
  const appMessage = emailMessage;

  const app_url = `${process.env.APP_URL}`;

  let notificationRecods = [];

  adminDetails.forEach((admin) => {
    notificationRecods.push({
      type: notificationTypes.NEW_DISH_CREATED_FR_ADMIN,
      toId: admin._id,
      toEmail: admin.email,
      toPhone: admin.phone,
      userNotificationSettings: admin.notificationSettings,
      message: {
        subject,
        emailMessage,
        smsMessage,
        appMessage,
      },
      app_url,
      refModel: "EventTemplate",
      refId: eventTemplateId,
    });
  });

  await NotificationModel.insertMany(notificationRecods);

  // send email
  sendMultipleEmails(notificationRecods);

  return null;
};

// setTimeout(()=>{
// EventCreatedNotificationForAdmin("63206a814e8072e951b9302d")
//     }, 6000)

// working
// admin notification for order created
const OrderCreatedNotificationForAdmin = async (paymentId) => {
  const paymentDetails = await PaymentModel.findById(
    paymentId,
    `customer supplier cost costToSupplier orders`
  ).populate("customer", `fullName email phone`);

  if (!paymentDetails) {
    // log this to analyse the scenario
    return;
  }

  // get admin details
  let adminDetails = null;
  if (HARDCODED_ADMIN_VALUES) {
    adminDetails = _adminDetails;
  } else {
    // get admin details
    adminDetails = await UserModel.find(
      {
        type: "admin",
      },
      `fullName email phone notificationSettings`
    );
  }

  const subject = `New order created`;

  const emailMessage = `Hi Admin
        New order received:

        Total Cost: ${paymentDetails.cost}
        Total Cost To Supplier: ${paymentDetails.costToSupplier}
        Items Count: ${paymentDetails.orderCount} 

        Customer Details:
        Name: ${paymentDetails.customer.fullName}
        Email: ${paymentDetails.customer.email}
        Phone: ${paymentDetails.customer.phone}

        Thanks,
        Noudada Teams
    `;
  const smsMessage = emailMessage;
  const appMessage = emailMessage;

  const app_url = `${process.env.APP_URL}`;

  let notificationRecords = [];

  adminDetails.forEach((admin) => {
    notificationRecords.push({
      type: notificationTypes.NEW_ORDER_CREATED_FR_ADMIN,
      toId: adminDetails._id,
      toEmail: adminDetails.email,
      toPhone: adminDetails.phone,
      userNotificationSettings: adminDetails.notificationSettings,
      message: {
        subject,
        emailMessage,
        smsMessage,
        appMessage,
      },
      app_url,
      refModel: "Payment",
      refId: paymentId,
    });
  });

  await NotificationModel.insertMany(notificationRecords);

  // send email
  await sendMultipleEmails(notificationRecords);

  return null;
};

const OrderCreatedNotificationForUser = async (paymentId) => {
  let payments = await PaymentModel.aggregate([
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
        ],
        as: "orders",
      },
    },
    {
      $project: {
        _id: 1,
        viewId: 1,
        orderCount: 1,
        totalItemPrice: 1,
        subTotal: 1,
        serviceFee: 1,
        deliveryFee: 1,
        tax: 1,
        total: 1,
        costToSupplier: 1,
        createdAt: 1,

        "orders.itemPrice": 1,
        "orders.itemSubTotal": 1,
        "orders.subTotal": 1,
        "orders.deliveryFee": 1,
        "orders.total": 1,
        "orders.itemCostToSupplier": 1,
        "orders.costToSupplier": 1,

        "orders.quantity": 1,
        "orders.pickupTime": 1,
        "orders.item.name": 1,
        "orders.item.images": 1,
        "orders.item.pricePerOrder": 1,
        "orders.pickupPoint.name": 1,
        "orders.pickupPoint.address.fullAddress": 1,
        "orders.pickupPoint.suitableTimes": 1,

        "customer._id": 1,
        "customer.fullName": 1,
        "customer.profileImg": 1,
        "customer.email": 1,
        "customer.phone": 1,
        "customer.notificationSettings": 1,
      },
    },
  ]);

  payments = payments[0];

  let emailTempData = {};

  emailTempData.date = payments.createdAt;
  emailTempData.orderId = payments.viewId;
  emailTempData.subtotal = payments.subTotal;
  emailTempData.delivery = payments.deliveryFee;
  emailTempData.total = payments.total;
  emailTempData.date = format(new Date(payments.createdAt), "ccc,LL/dd");

  let items = [];

  payments.orders.forEach((o) => {
    let item = {
      name: o.item.name,
      subtotal: o.subTotal,
      price: o.itemSubTotal,
      quantity: o.quantity,
      "pickup-name": o.pickupPoint.name,
      "pickup-address": o.pickupPoint.address.fullAddress,
      startime: o.pickupPoint.suitableTimes[0],
      endtime: o.pickupPoint.suitableTimes[1],
    };
    if (o.item.images.length > 0 && o.item.images[0]) {
      item.image = `https:${o.item.images[0]}`;
    }
    items.push(item);
  });

  emailTempData.order = {
    items,
  };

  // return

  let subject = "order created";
  let emailMessage = "order created";
  let smsMessage = `Hey ${payments.customer.fullName},
Thanks for joining our group order. See your order details here link. https://www.noudada.com/user-profile?up=orders
Abla`;
  let appMessage = "order created";

  let notificationRecod = {
    type: notificationTypes.ORDER_CREATED_FR_USER,
    toId: payments.customer._id,
    toEmail: payments.customer.email,
    // toEmail: "dev@noudada.com",
    // toEmail: "utkarsh17ife@fastlanedevs.com",
    toPhone: payments.customer.phone,
    userNotificationSettings: payments.customer.notificationSettings,
    message: {
      subject,
      emailMessage,
      smsMessage,
      appMessage,
    },
    templateId: "d-2ccf281d33474cbe873312aa2d1ff8d3",
    templateData: emailTempData,
    app_url: "some.com",
    refModel: "Payments",
    refId: payments._id,
  };

  await NotificationModel.create(notificationRecod);

  if (notificationRecod.userNotificationSettings.email) {
    // send email
    sendEmailWithTemplate(notificationRecod);
  }

  if (notificationRecod.userNotificationSettings.phone) {
      sendSMS(notificationRecod)
  }

  return null;
};

// OrderCreatedNotificationForUser("633d86289892184cc11d90df")

// not required
const cancelOrderNotificationWithPaymentId = async (paymentId) => {};

// cancelOrderNotificationWithPaymentId("633ac05e4b490852bf949967");

const cancelOrderNotificationWithOrderId = async (orderId) => {
  // fetch order details
  let orders = await OrderModel.aggregate([
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
        itemSubTotal: 1,
        deliveryFee: 1,
        total: 1,
        subTotal: 1,
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
        "customer._id": 1,
        "customer.fullName": 1,
        "customer.profileImg": 1,
        "customer.email": 1,
        "customer.phone": 1,
        "customer.notificationSettings": 1,
        cost: 1,
        isPaid: 1,
        status: 1,
        "pickupPoint.name": 1,
        "pickupPoint.text": 1,
        "pickupPoint.address": 1,
        "pickupPoint.suitableTimes": 1,
        paymentViewId: "$payment.viewId",
      },
    },
  ]);

  if (orders.length < 1) {
    console.log("notification controller: order not found!");
    return;
  }

  const order = orders[0];

  let subject = "order cancelled";
  let emailMessage = "order cancelled";
  let smsMessage = `Hey ${order.customer.fullName}
Your food order (${order.paymentViewId}) has been canceled as we didn’t have enough orders to proceed further. We sincerely apologize. Join other group orders here https://www.noudada.com/user-profile?up=orders.
Thanks for understanding.
Abla`;
  let appMessage = "order cancelled";

  /**
    {
        "cust-name":"Aman",
        "date":"Tue,09/22",
        "startime": "12;00 pm",
        "endtime":"2:00 pm",
        "pickup-name":"Stanford University Entry Gate",
        "pickup-address":"235 hii st",
        "qr":"https://sv.qr-code-generator.com/wp-content/themes/qr/new_structure/markets/basic_market/generator/dist/generator/assets/images/websiteQRCode_noFrame.png",
        
        
       "order": {
        "items": [
          {
            "name": "Jollof",
            "image": "https://s3.amazonaws.com/appforest_uf/f1663431404316x211097862709117340/Meat-trends-market-prospers-in-face-of-pandemic.jpg",
            "subtotal":"22",
            "price":"20",
            "quantity":"1"
          },
          {
            "name": "Beef mat kaho",
            "image": "https://s3.amazonaws.com/appforest_uf/f1663431404316x211097862709117340/Meat-trends-market-prospers-in-face-of-pandemic.jpg",
            "subtotal":"22",
            "price":"20",
            "quantity":"1"
          }
        ]
      },
      "subtotal":"44",
      "delivery":"4.99",
      "total":"92.99"
    }
 */
  const templateData = {
    "cust-name": order.customer.fullName,
    date: format(new Date(order.item.eventDate), "ccc,LL/dd"),
    "pickup-name": order.pickupPoint.name,
    "pickup-address": order.pickupPoint.address.fullAddress,
    subtotal: order.subTotal,
    delivery: order.deliveryFee,
    total: order.total,
    startime: order.pickupPoint.suitableTimes[0],
    endtime: order.pickupPoint.suitableTimes[1],
  };

  // attach orders
  templateData.order = {};
  templateData.order.items = [];

  const item = {
    name: order.item.name,
    image: order.item.images[0],
    subtotal: order.subTotal,
    price: order.itemSubTotal,
    quantity: order.quantity,
  };

  if (order.item.images.length > 0 && order.item.images[0]) {
    item.image = `https:${order.item.images[0]}`;
  }

  templateData.order.items.push(item);

  // qr needs to be removed from this template
  templateData.qr = item.image;

  let notificationRecod = {
    type: notificationTypes.ORDER_CANCELLED_FR_USER,
    toId: order.customer._id,
    toEmail: order.customer.email,
    // toEmail: "utkarsh17ife@fastlanedevs.com",
    toPhone: order.customer.phone,
    userNotificationSettings: order.customer.notificationSettings,
    message: {
      subject,
      emailMessage,
      smsMessage,
      appMessage,
    },
    templateId: "d-889dfd95cdc846849d031b64dbc84546",
    templateData: templateData,
    app_url: null,
    refModel: "Orders",
    refId: order._id,
  };

  await NotificationModel.create(notificationRecod);

  if (notificationRecod.userNotificationSettings.email) {
    // send email
    sendEmailWithTemplate(notificationRecod);
  }

  if (notificationRecod.userNotificationSettings.phone) {
    sendSMS(notificationRecod)
  }

  return null;
};

// cancelOrderNotificationWithOrderId("633d86289892184cc11d90e0");

const TwentyFourHourPickupReminder = async (orderId) => {
  let orders = await OrderModel.aggregate([
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
        deliveryFee: 1,
        itemSubTotal: 1,
        pickupDate: 1,
        subTotal: 1,
        total: 1,
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
        "customer._id": 1,
        "customer.fullName": 1,
        "customer.profileImg": 1,
        "customer.email": 1,
        "customer.phone": 1,
        "customer.notificationSettings": 1,
        cost: 1,
        isPaid: 1,
        status: 1,
        "pickupPoint._id": 1,
        "pickupPoint.name": 1,
        "pickupPoint.text": 1,
        "pickupPoint.address": 1,
        "pickupPoint.suitableTimes": 1,
        paymentViewId: "$payment.viewId",
      },
    },
  ]);

  if (orders.length < 1) {
    console.log("order not found");
    return;
  }

  const order = orders[0];

  let subject = "pick up reminder!";
  let emailMessage = "pick up reminder!";
  let smsMessage = `${order.customer.fullName}
Your food will be available for pickup tomorrow between *pickup time ${order.pickupPoint.suitableTimes[0]} and ${order.pickupPoint.suitableTimes[1]} @ pickup spot ${order.pickupPoint.address.fullAddress}.
View your order here https://www.noudada.com/user-profile?up=orders.`


  let appMessage = "pick up reminder!";

  /**
    {
        "cust-name":"Aman",
        "date":"Tue,09/22",
        "startime": "12;00 pm",
        "endtime":"2:00 pm",
        "pickup-name":"Stanford University Entry Gate",
        "pickup-address":"235 hii st",
        "qr":"https://sv.qr-code-generator.com/wp-content/themes/qr/new_structure/markets/basic_market/generator/dist/generator/assets/images/websiteQRCode_noFrame.png",
        "order": {
            "items": [
            {
                "name": "Jollof",
                "image": "https://s3.amazonaws.com/appforest_uf/f1663431404316x211097862709117340/Meat-trends-market-prospers-in-face-of-pandemic.jpg",
                "subtotal":"22",
                "price":"20",
                "quantity":"1"
            },
            {
                "name": "Beef mat kaho",
                "image": "https://s3.amazonaws.com/appforest_uf/f1663431404316x211097862709117340/Meat-trends-market-prospers-in-face-of-pandemic.jpg",
                "subtotal":"22",
                "price":"20",
                "quantity":"1"
            }
            ]
        },
        "subtotal":"44",
        "delivery":"4.99",
        "total":"92.99"
    }
 */

  const templateData = {
    "cust-name": order.customer.fullName,
    date: format(new Date(order.item.eventDate), "ccc,LL/dd"),
    "pickup-name": order.pickupPoint.name,
    "pickup-address": order.pickupPoint.address.fullAddress,
    subtotal: order.subTotal,
    delivery: order.deliveryFee,
    total: order.total,
    startime: order.pickupPoint.suitableTimes[0],
    endtime: order.pickupPoint.suitableTimes[1],
  };

  // attach orders
  templateData.order = {};
  templateData.order.items = [];

  const item = {
    name: order.item.name,
    image: order.item.images[0],
    subtotal: order.subTotal,
    price: order.itemSubTotal,
    quantity: order.quantity,
  };

  if (order.item.images.length > 0 && order.item.images[0]) {
    item.image = `https:${order.item.images[0]}`;
  }

  templateData.order.items.push(item);

  templateData.qr = await getQrFromOrder({
    customer: order.customer._id,
    pickupPoint: order.pickupPoint._id,
    pickupDate: order.pickupDate,
  });

  templateData.qr = await uploadBase64AsImageFile(templateData.qr);

  let notificationRecord = {
    type: notificationTypes.TWENTY_FOUR_HOUR_DELIVERY_REMINDER_FR_USER,
    toId: order.customer._id,
    toEmail: order.customer.email,
    // toEmail: "utkarsh17ife@fastlanedevs.com",
    toPhone: order.customer.phone,
    userNotificationSettings: order.customer.notificationSettings,
    message: {
      subject,
      emailMessage,
      smsMessage,
      appMessage,
    },
    templateId: "d-2c1fdb57b503432d843f5764b415c8cf",
    templateData: templateData,
    app_url: null,
    refModel: "Orders",
    refId: order._id,
  };

  await NotificationModel.create(notificationRecord);

  if (notificationRecord.userNotificationSettings.email) {
    // send email
    sendEmailWithTemplate(notificationRecord);
  }

  if (notificationRecord.userNotificationSettings.phone) {
    sendSMS(notificationRecord)
  }

  return null;
};

// TwentyFourHourPickupReminder("633d86289892184cc11d90e0");

// notification http apis

const getUserNotifications = async (req, res) => {
  const userId = req.user.userId;
  const skip = req.query.skip ? Number(req.query.skip) : 0;
  const limit = req.query.limit ? Number(req.query.limit) : 10;

  const notificationsPromise = NotificationModel.find({
    $and: [{ toId: userId }, { isRead: false }],
  })
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  // total unread notifications
  const unreadCountPromise = NotificationModel.find({
    $and: [{ toId: userId }, { isDeleted: false }, { isRead: false }],
  }).countDocuments();

  const [notifications, unreadCount] = await Promise.all([
    notificationsPromise,
    unreadCountPromise,
  ]);

  return res.status(StatusCodes.OK).json({ notifications, unreadCount });
};

const markRead = async (req, res) => {
  const notificationId = req.params.notificationId;

  await NotificationModel.updateOne(
    {
      _id: notificationId,
    },
    {
      $set: {
        isRead: true,
        updatedAt: new Date(),
      },
    }
  );

  return res
    .status(StatusCodes.OK)
    .json({ message: "notification marked read" });
};
const readAll = async (req, res) => {
  const user = req.user.userId;
  await NotificationModel.updateMany(
    {
      $and: [{ toId: user }, { isRead: false }],
    },
    {
      $set: {
        isRead: true,
        updatedAt: new Date(),
      },
    }
  );
  return res
    .status(StatusCodes.OK)
    .json({ message: "notifications marked read" });
};

const deleteNotification = async (req, res) => {
  const notificationId = req.params.notificationId;

  await NotificationModel.updateOne(
    {
      _id: notificationId,
    },
    {
      $set: {
        isDeleted: true,
        updatedAt: new Date(),
      },
    }
  );

  return res.status(StatusCodes.OK).json({ message: "notification deleted" });
};

module.exports = {
  getUserNotifications,
  markRead,
  readAll,
  deleteNotification,

  // internal functions
  CreateUserWelcomeNotification,

  // admin notifications
  UserSignUpNotificationForAdmin,
  SupplierSignUpNotificationForAdmin,
  DishCreatedNotificationForAdmin,
  EventCreatedNotificationForAdmin,
  OrderCreatedNotificationForAdmin,

  // user notifications
  OrderCreatedNotificationForUser,
  cancelOrderNotificationWithOrderId,
  TwentyFourHourPickupReminder,

  UserEnquiryNotificationForAdmin
};
