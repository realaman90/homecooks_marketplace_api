const mongoose = require("mongoose");
const {notificationTypes} = require('../constants');

const NotificationSchema = mongoose.Schema({
    type: {
        type: String,
        enum: [
            notificationTypes.WELCOME_FR_USER, 
            notificationTypes.ORDER_CREATED_FR_USER, 
            notificationTypes.NEW_SUPPLIER_SIGNUP_FR_ADMIN,
            notificationTypes.NEW_USER_SIGNUP_FR_ADMIN,
            notificationTypes.NEW_USER_SIGNUP_FR_ADMIN,
            notificationTypes.NEW_DISH_CREATED_FR_ADMIN,
            notificationTypes.NEW_EVENT_CREATED_FR_ADMIN,
            notificationTypes.NEW_ORDER_CREATED_FR_ADMIN,
            notificationTypes.ORDER_CANCELLED_FR_USER,
        ],
    },
    viewId: {
        type: String,
    },
    toId: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: true
    },
    toEmail: {
        type: String,
    },
    toPhone: {
        type: String,
    },
    userNotificationSettings: {        
        email: { type: Boolean, default: true},
        phone: { type: Boolean, default: true },
    },
    message: {
        subject: String,
        emailMessage: String,
        smsMessage: String,
        appMessage: String
    },
    app_url: {
        type: String
    },
    isRead: {
        type: Boolean,
        default: false
    },
    refModel: {
        type: String
    },
    refId: {
        type: mongoose.Types.ObjectId,
    },
    templateId: String,
    templateData: Object,
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    strict: true
});

module.exports = mongoose.model('Notification', NotificationSchema)