const mongoose = require("mongoose");
const { orderStatus } = require('../constants');

const OrderSchema = mongoose.Schema({
    customer: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: true
    },
    payment: {
        type: mongoose.Types.ObjectId,
        ref: 'Payment',        
    },
    viewId: {
        type: String,
    },
    event: {        
        type: mongoose.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    item: {
        type: mongoose.Types.ObjectId,
        ref: 'DishItem',
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
    status: {
        type: String,
        enum: ['pending_checkout', orderStatus.PENDING, orderStatus.CONFIRMED, orderStatus.CANCELLED, orderStatus.DELIVERED],
        default: orderStatus.PENDING
    },
    supplier: {        
        type: mongoose.Types.ObjectId,
        ref: 'Supplier',
        required: true        
    },
    pickupPoint: {
        type: mongoose.Types.ObjectId,
        ref: 'ClientPickupPoint'
    },    
    pickupDate: Date,
    pickupTime: String,
    instruction: String,
    cancelReason: String,
    qrValue: String,
}, {
    timestamps: true,
    strict: true
});

module.exports = mongoose.model('Order', OrderSchema)