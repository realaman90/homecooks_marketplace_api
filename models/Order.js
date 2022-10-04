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
    itemPrice: {
        type: String,
        required: [true, "Please enter itemPrice"]
    },    
    serviceFee: {
        type: String,        
    },
    tax: {
        type: String
    },
    itemSubTotal: {
        type: String,
        required: [true, "Please enter itemSubTotal"]
    },
    subTotal: {
        type: String,
        required: [true, "Please enter totalItemCost"]
    },
    deliveryFee: {
        type: String,
        required: [true, "Please enter deliveryFee"]
    },
    total: {
        type: String,
        required: [true, "Please enter total"]
    },    
    itemCostToSupplier: {
        type: String,
        required: [true, "Please enter itemCostToSupplier"]
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
}, {
    timestamps: true,
    strict: true
});

module.exports = mongoose.model('Order', OrderSchema)