const UserModel = require('../models/User');
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
    CreateUserWelcomeNotification
}