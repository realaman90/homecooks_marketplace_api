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
    name: {
        type: String,
        required: [true, 'Please Enter item name']
    },
    description: String,
    images: {
        type: [String]
    },

    // dates management
    eventFrequency: {
        type: String,
        enum: ["one_time", "recurring"]
    },
    startDate: String,
    endDate: String,
    days: [String],    
    supplierPickupTime: Number,
    finalOrderCloseHours: Number, // 12, 24, 48
    clientPickups: [{
        type: mongoose.Types.ObjectId,
        ref: 'ClientPickupPoint',
    }]
}, {
    timestamps: true,
    strict: true
});

module.exports = mongoose.model('EventTemplate', EventTemplateSchema)