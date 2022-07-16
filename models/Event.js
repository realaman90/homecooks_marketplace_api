const mongoose = require("mongoose");
const { eventStatus } = require('../constants');
const crypto = require('crypto');

const EventSchema = mongoose.Schema({
    supplier: {
        type: mongoose.Types.ObjectId,
        ref: 'Supplier',
        required: true
    },
    viewId: {
        type: String,
    },
    dishes: [{
        type: mongoose.Types.ObjectId,
        ref: 'Dish',
        required: true
    }],
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
        enum: [eventStatus.PENDING, eventStatus.ACTIVE, eventStatus.DELIVERED, eventStatus.CANCELLED, eventStatus.FULFILLED],
        default: eventStatus.PENDING
    },
    minOrders: Number,
    maxOrders: Number,
    eventDate: Date,
    eventVisibilityDate: Date,
    closingDate: Date,
    pricePerOrder: {
        type: String,
        required: [true, "Please enter price"]
    },
    costToSupplierPerOrder: {
        type: String,
        required: [true, "Please enter cost to supplier"]
    },

    cuisine: String,
    mealTags: [String],
    category: {
        type: String,
        required: [true, 'Please provide dish category'],
    },
    bikerPickup: {
        street: String,
        appartment_house: String,
        city: String,
        state: String,
        zipCode: Number,
        country: String,
        latitude: Number,
        longitude: Number
    },
    clientPickups: [{
        type: mongoose.Types.ObjectId,
        ref: 'ClientPickupPoint',
        required: true
    }],
    eventTemplate: {
        type: mongoose.Types.ObjectId,
        ref: 'EventTemplate',
        required: true
    }
}, {
    timestamps: true,
    strict: true
});

module.exports = mongoose.model('Event', EventSchema)