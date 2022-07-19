const mongoose = require("mongoose");
const { paymentStatus } = require('../constants');

const PaymentSchema = mongoose.Schema({
    customer: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: true
    },    
    supplier: {
        type: mongoose.Types.ObjectId,
        ref: 'Supplier',
        required: true
    },
    cost: {
        type: String,
        required: [true]
    },
    serviceFee:{
        type: String,
        required: [true]
    },
    tax:{
        type: String,
        required: [true]
    },
    subTotal:{
        type: String,
        required: [true]
    },
    costToSupplier: {
        type: String,
        required: [true]
    },
    eventPickupAddressMapping: [Object],
    orders: [mongoose.Types.ObjectId],    
    paymentMethod: String,
    paymentIntent: String,
    isPaid: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: [paymentStatus.PENDING_CHECKOUT, paymentStatus.ORDER_PLACED],
        default: paymentStatus.PENDING_CHECKOUT
    },
    itemsHash: String,
}, {
    timestamps: true,
    strict: true
});

module.exports = mongoose.model('Payment', PaymentSchema)