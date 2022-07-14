const mongoose = require("mongoose");
const {eventStatus} = require('../constants');

const EventSchema = mongoose.Schema({
    supplier: {
        type: mongoose.Types.ObjectId,
        ref: 'Supplier',
        required: true
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
    pricePerOrder: {
        type: String,
        required: [true, "Please enter price"]
    },
    costToSupplierPerOrder: {
        type: String,
        required: [true, "Please enter cost to supplier"]
    },

    cuisine: String,
    category: {
        type: String,
        required: [true, 'Please provide dish category'],
        enum: ['breakfast', 'lunch', 'dinner', 'snacks'],
    },
    bikerPickups: [{
        bikerPickupPoint: {
            type: mongoose.Types.ObjectId,
            ref: 'BikerPickupPoint',
            required: true
        },
        timings: [String]
    }],
    clientPickups: [{
        clientPickupPoint: {
            type: mongoose.Types.ObjectId,
            ref: 'ClientPickupPoint',
            required: true
        },
        timings: [String]
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
