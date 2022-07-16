const crypto = require('crypto');
const mongoose = require("mongoose");

const EventTemplateSchema = mongoose.Schema({
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

    // dates management
    eventFrequency: {
        type: String,
        enum: ["one_time", "recurring"]
    },
    recurringType: String, // weekly | monthly | null
    startDate: String,
    endDate: String,
    days: [String],
    eventDate: String,
    finalOrderCloseHours: Number, // 24, 48

    minOrders: Number,
    maxOrders: Number,
    pricePerOrder: {
        type: String,
        required: [true, "Please enter price"]
    },
    costToSupplierPerOrder: {
        type: String,
        // Utkarsh we need to discuss this with Abla
        // required: [true, "Please enter cost to supplier"]
    },
    cuisine: String,
    mealTags: String,
    category: {
        type: String,
        required: [true, 'Please provide dish category'],

    },
    bikerPickups: [{
        bikerPickupPoint: {
            type: mongoose.Types.ObjectId,
            ref: 'BikerPickupPoint',

        },
        timings: [String]
    }],
    clientPickups: [{
        type: mongoose.Types.ObjectId,
        ref: 'ClientPickupPoint',

    }]
}, {
    timestamps: true,
    strict: true
});

module.exports = mongoose.model('EventTemplate', EventTemplateSchema)