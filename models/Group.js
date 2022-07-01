const mongoose = require("mongoose");
const {groupStatus} = require('../constants');

const GroupSchema = mongoose.Schema({
    supplier: {
        type: mongoose.Types.ObjectId,
        ref: 'Supplier',
        required: true
    },
    product: {
        type: mongoose.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    itemName: {
        type: String,
        required: [true, 'Please Enter item name']
    },
    itemDescription: String,
    images: {
        type: [String]
    },
    status: {
        type: String,
        enum: [groupStatus.PENDING, groupStatus.ACTIVE, groupStatus.DELIVERED, groupStatus.CANCELLED, groupStatus.FULFILLED],
        default: groupStatus.PENDING
    },
    minOrders: Number,
    maxOrders: Number,
    activeTill: {
        type: Date,
        required: true,
    },
    deliveryDate: Date,
    deliveryTime: String,
    pricePerOrder: {
        type: String,
        required: [true, "Please enter price"]
    },
    costToSupplierPerOrder: {
        type: String,
        required: [true, "Please enter cost to supplier"]
    },
    pickupLocation: {
        street: String,
        apartment_house: String,
        city: String,
        state: String,
        zipCode: Number,
        country: String,
    },
    cuisine: String,
    category: {
        type: String,
        required: [true, 'Please provide product category'],
        enum: ['breakfast', 'lunch', 'dinner', 'snacks'],
    },
}, {
    timestamps: true,
    strict: true
});

module.exports = mongoose.model('Group', GroupSchema)
