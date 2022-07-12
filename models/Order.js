const mongoose = require("mongoose");
const {orderStatus} = require('../constants');

const OrderSchema = mongoose.Schema({
    customer: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: true
    },    
    event: {
        type: mongoose.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    quantity: {
        type: Number,
        required: [true, 'Please Enter the quantity']
    },
    cost: {
        type: String,
        required: [true]
    },    
    costToSupplier: {
        type: String,
        required: [true]
    },    
    isPaid: {
        type: Boolean,
        default: false
    },
    status:  {
        type: String,
        enum: [orderStatus.PENDING, orderStatus.CONFIRMED, orderStatus.CANCELLED, orderStatus.DELIVERED],
        default: orderStatus.PENDING
    },
    pickupPoint: {
        type: mongoose.Types.ObjectId,
        ref: 'ClientPickupPoint'
    },
    pickupDate: Date,
    pickupTime: String,
}, {
    timestamps: true,
    strict: true
});

module.exports = mongoose.model('Order', OrderSchema)