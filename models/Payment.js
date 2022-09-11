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
    serviceFee: {
        type: String,
        required: [true]
    },
    deliveryFee: {
        type: String,
        required: [true]
    },
    tax: {
        type: String,
        required: [true]
    },
    total: {
        type: String,
        required: [true]
    },
    costToSupplier: {
        type: String,
        required: [true]
    },
    eventPickupAddressMapping: [Object],
    orders: [mongoose.Types.ObjectId],
    paymentMethodType: String,
    paymentMethod: String,
    paymentIntent: String,
    viewId: String,
    isPaid: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: [paymentStatus.PENDING_CHECKOUT, paymentStatus.ORDER_PLACED, paymentStatus.COMPLETED],
        default: paymentStatus.PENDING_CHECKOUT
    },
    itemsHash: String,
}, {
    timestamps: true,
    strict: true
});

module.exports = mongoose.model('Payment', PaymentSchema)