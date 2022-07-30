const mongoose = require("mongoose");
const { eventStatus } = require('../constants');

const EventSchema = mongoose.Schema({
    supplier: {
        type: mongoose.Types.ObjectId,
        ref: 'Supplier',
        required: true
    },
    viewId: {
        type: String,
    },
    dishItems: [{
        type: mongoose.Types.ObjectId,
        ref: 'DishItems',
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
    eventDate: Date,
    eventVisibilityDate: Date,
    closingDate: Date,
    status: {
        type: String,
        enum: [eventStatus.PENDING, eventStatus.ACTIVE, eventStatus.DELIVERED, eventStatus.CANCELLED, eventStatus.FULFILLED],
        default: eventStatus.PENDING
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