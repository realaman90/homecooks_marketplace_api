const mongoose = require("mongoose");
const crypto = require('crypto');
const { eventStatus } = require('../constants');

const DishItemSchema = mongoose.Schema({
    supplier: {
        type: mongoose.Types.ObjectId,
        ref: 'Supplier',
        required: true
    },
    dish: {
        type: mongoose.Types.ObjectId,
        ref: 'Dish',
        required: true
    },
    name: {
        type: String,
        required: [true, 'Please enter name']
    },
    viewId: {
        type: String,
        default: 'dish_item_' + crypto.randomBytes(6).toString('hex'),
    },
    images: {
        type: [String]
    },
    description: String,
    mealTags: [String],
    cuisine: String,
    category: {
        type: String,
        required: [true, 'Please provide dish category'],
    },
    // quantity related
    quantity: Number,
    size: String,
    
    // event date related data 
    eventDate: Date,    
    eventVisibilityDate: Date,
    closingDate: Date,
    supplierPickupTime: Number,

    // sale related data
    minOrders: Number,
    maxOrders: Number,
    pricePerOrder: {
        type: String,
        required: [true, "Please enter price"]
    },
    subTotal: {
        type: String,        
    },
    costToSupplierPerOrder: {
        type: String,
        required: [true, "Please enter costToSupplierPerOrder"]
    },
    bikerPickupPoint: {
        type: mongoose.Types.ObjectId,
        ref: 'BikerPickupPoint',
        required: true
    },
    clientPickups: [{
        type: mongoose.Types.ObjectId,
        ref: 'ClientPickupPoint',
    }],
    event: {
        type: mongoose.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    qrValue: String,
    status: {
        type: String,
        enum: [eventStatus.ACTIVE, eventStatus.CANCELLED, eventStatus.FULFILLED],
    },    
}, {
    timestamps: true,
    strict: true
});

module.exports = mongoose.model('DishItem', DishItemSchema)

