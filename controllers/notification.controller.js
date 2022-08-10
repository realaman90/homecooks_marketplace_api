const UserModel = require('../models/User');
const SupplierModel = require('../models/Supplier');
const DishModel = require('../models/Dish');
const PaymentModel = require('../models/Payment');
const EventTemplateModel = require('../models/EventTemplate');
const NotificationModel = require('../models/Notification');
const {notificationTypes} = require('../constants');
const { StatusCodes } = require('http-status-codes');

// notification creation function

const CreateUserWelcomeNotification = async (userId) => {
    
    const userDetails = await UserModel.findById(userId, `fullName email phone notificationSettings`);
    if (!userDetails){
        // log this to analyse the scenario
        return
    }

    const subject = `Welcome to the noudada platform`;
    const emailMessage = `Hi ${userDetails.fullName}
        Welcome to the noudada platform

        Thanks,
        Noudada Teams
    ` 
    const smsMessage = `Hi ${userDetails.fullName}
        Welcome to the noudada platform

        Thanks,
        Noudada Teams
    ` 
    const appMessage = `Hi ${userDetails.fullName}
        Welcome to the noudada platform

        Thanks,
        Noudada Teams
` 
    const app_url = `${process.env.APP_URL}`

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
        refModel: 'Users',
        refId: userId
    }

    notificationRecod = await NotificationModel.create(notificationRecod);
    
    if (notificationRecod.userNotificationSettings.email){
        // send email

    }

    if (notificationRecod.userNotificationSettings.phone){
        // send sms
        
    }

    return null
}
// CreateUserWelcomeNotification("62e63bd836790e1946536498")

///////////////////////////////// Notification towards admin ////////////////////////////////

// admin notification for user signup
const UserSignUpNotificationForAdmin = async (userId) => {
    
    const userDetails = await UserModel.findById(userId, `fullName email phone notificationSettings`);
    if (!userDetails){
        // log this to analyse the scenario
        return
    }

    // get admin details
    const adminDetails = await UserModel.findOne({
        email:process.env.SUPER_ADMIN_EMAIL
    }, `fullName email phone notificationSettings`)

    const subject = `New User Signup on the platform`;
    const emailMessage = `Hi Admin
        A new user has just signed up on the platform.

        Name: ${userDetails.fullName}
        Email: ${userDetails.email}
        Phone: ${userDetails.phone}
        
        Thanks,
        Noudada Teams
    ` 
    const smsMessage = emailMessage
    const appMessage = emailMessage

    const app_url = `${process.env.APP_URL}`

    let notificationRecod = {
        type: notificationTypes.NEW_USER_SIGNUP_FR_ADMIN,
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
        refModel: 'Users',
        refId: userId
    }

    // console.log(notificationRecod)

    notificationRecod = await NotificationModel.create(notificationRecod);
    
    // send email

    return null
}

// setTimeout(()=>{
//     UserSignUpNotificationForAdmin("62f215ba3045d8c79228e2d1")
// }, 4000)



// admin notification for supplier signup
const SupplierSignUpNotificationForAdmin = async (supplierId) => {
    
    const supplierDetails = await SupplierModel.findById(supplierId, `businessName speciality description address pickupAddress contactInfo`);
    if (!supplierDetails){
        // log this to analyse the scenario
        return
    }

    // get admin details
    const adminDetails = await UserModel.findOne({
        email:process.env.SUPER_ADMIN_EMAIL
    }, `fullName email phone notificationSettings`)

    const subject = `New Supplier Signup on the platform`;
    const emailMessage = `Hi Admin
        A new supplier has just signed up on the platform.

        Business Name: ${supplierDetails.businessName}
        Description: ${supplierDetails.description}
        Business Email: ${supplierDetails.contactInfo.businessEmail}
        Business Phone: ${supplierDetails.contactInfo.businessPhone}

        Thanks,
        Noudada Teams
    ` 
    const smsMessage = emailMessage
    const appMessage = emailMessage

    const app_url = `${process.env.APP_URL}`

    let notificationRecod = {
        type: notificationTypes.NEW_SUPPLIER_SIGNUP_FR_ADMIN,
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
        refModel: 'Supplier',
        refId: supplierId
    }

    // console.log(notificationRecod)

    notificationRecod = await NotificationModel.create(notificationRecod);
    
    // send email

    return null
}

// setTimeout(()=>{
//     SupplierSignUpNotificationForAdmin("62eaa9e7d3c2785553d57b97")
// }, 4000)

// admin notification for new dish created
const DishCreatedNotificationForAdmin = async (dishId) => {
    
    const dishDetails = await DishModel
    .findById(dishId, `name viewId description category minOrders maxOrders pricePerOrder quantity size`)
    .populate('supplier', `businessName`)
    if (!dishDetails){
        // log this to analyse the scenario
        return
    }

    // get admin details
    const adminDetails = await UserModel.findOne({
        email:process.env.SUPER_ADMIN_EMAIL
    }, `fullName email phone notificationSettings`)

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
    ` 
    const smsMessage = emailMessage
    const appMessage = emailMessage

    const app_url = `${process.env.APP_URL}`

    let notificationRecod = {
        type: notificationTypes.NEW_DISH_CREATED_FR_ADMIN,
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
        refModel: 'Dish',
        refId: dishId
    }

    notificationRecod = await NotificationModel.create(notificationRecod);
    
    // send email

    return null
}

// setTimeout(()=>{
//     DishCreatedNotificationForAdmin("62f29fc044882771c2c16aaf")
// }, 6000)



// admin notification for event created
const EventCreatedNotificationForAdmin = async (eventTemplateId) => {

    const eventTemplateDetails = await EventTemplateModel
    .findById(eventTemplateId, `name viewId description category minOrders maxOrders pricePerOrder quantity size eventFrequency recurringType`)
    .populate('supplier', `businessName viewId`)
    .populate('dishes', `name viewId description`)
    if (!eventTemplateDetails){
        // log this to analyse the scenario
        return
    }

    // get admin details
    const adminDetails = await UserModel.findOne({
        email:process.env.SUPER_ADMIN_EMAIL
    }, `fullName email phone notificationSettings`)

    const subject = `New event setup by ${eventTemplateDetails.supplier.businessName}`;
    const emailMessage = `Hi Admin
        A event is setup by ${eventTemplateDetails.supplier.businessName}

        Event Name: ${eventTemplateDetails.name}
        DishCount: ${eventTemplateDetails.dishes.length}
        Event Frequency: ${eventTemplateDetails.eventFrequency}
        Recurring Type: ${eventTemplateDetails.recurringType}
        Start Date: ${eventTemplateDetails.startDate}
        End Date: ${eventTemplateDetails.endDate} 

        Thanks,
        Noudada Teams
    ` 
    const smsMessage = emailMessage
    const appMessage = emailMessage

    const app_url = `${process.env.APP_URL}`

    let notificationRecod = {
        type: notificationTypes.NEW_DISH_CREATED_FR_ADMIN,
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
        refModel: 'EventTemplate',
        refId: eventTemplateId
    }

    // console.log(notificationRecod)

    notificationRecod = await NotificationModel.create(notificationRecod);
    
    // send email

    return null
}

// setTimeout(()=>{
//     EventCreatedNotificationForAdmin("62f29e7a44882771c2c16a61")
//     }, 6000)
    
    

// admin notification for order created
const OrderCreatedNotificationForAdmin = async (paymentId) => {

    const paymentDetails = await PaymentModel
    .findById(paymentId, `customer supplier cost costToSupplier orders`)
    .populate('customer', `fullName email phone`)

    if (!paymentDetails){
        // log this to analyse the scenario
        return
    }

    // get admin details
    const adminDetails = await UserModel.findOne({
        email:process.env.SUPER_ADMIN_EMAIL
    }, `fullName email phone notificationSettings`)

    const subject = `New order created`;

    const emailMessage = `Hi Admin
        New order received:

        Total Cost: ${paymentDetails.cost}
        Total Cost To Supplier: ${paymentDetails.costToSupplier}
        Items Count: ${paymentDetails.orders.length} 

        Customer Details:
        Name: ${paymentDetails.customer.fullName}
        Email: ${paymentDetails.customer.email}
        Phone: ${paymentDetails.customer.phone}

        Thanks,
        Noudada Teams
    ` 
    const smsMessage = emailMessage
    const appMessage = emailMessage

    const app_url = `${process.env.APP_URL}`

    let notificationRecod = {
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
        refModel: 'Payment',
        refId: paymentId
    }

    notificationRecod = await NotificationModel.create(notificationRecod);
    
    // send email

    return null
}


// setTimeout(()=>{
//     OrderCreatedNotificationForAdmin("62ebd5cc3a0c0e4439b86bf5")
//     }, 6000)
    





// notification http apis

const getUserNotifications = async(req, res) => {

    const userId = req.user.userId;
    const skip = req.query.skip ? Number(req.query.skip) : 0;
    const limit = req.query.limit ? Number(req.query.limit) : 10;

    const notificationsPromise = NotificationModel.find({
        $and: [
            {toId: userId},
            {isDeleted: false}
        ]
    }).skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 })

    // total unread notifications
    const unreadCountPromise = NotificationModel.find({
        $and: [
            {toId: userId},
            {isDeleted: false},
            {isRead: false}
        ]
    }).countDocuments()

    const [notifications, unreadCount] = await Promise.all([notificationsPromise, unreadCountPromise]);

    return res.status(StatusCodes.OK).json({ notifications, unreadCount });
}

const markRead = async(req, res) => {
    const notificationId = req.params.notificationId;
    
    await NotificationModel.updateOne({
        _id: notificationId
    }, {
        $set: {
            isRead: true,
            updatedAt: new Date()            
        }
    })

    return res.status(StatusCodes.OK).json({ message: "notification marked read" });
}

const deleteNotification = async(req, res) => {
    const notificationId = req.params.notificationId;
    
    await NotificationModel.updateOne({
        _id: notificationId
    }, {
        $set: {
            isDeleted: true,
            updatedAt: new Date()            
        }
    })

    return res.status(StatusCodes.OK).json({ message: "notification deleted" });
}


module.exports = {
    getUserNotifications,
    markRead,
    deleteNotification,

    // internal functions
    CreateUserWelcomeNotification,


    // admin notifications
    UserSignUpNotificationForAdmin,
    SupplierSignUpNotificationForAdmin,
    DishCreatedNotificationForAdmin,
    EventCreatedNotificationForAdmin,
    OrderCreatedNotificationForAdmin
}