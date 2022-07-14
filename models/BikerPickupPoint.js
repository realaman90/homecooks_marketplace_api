const mongoose = require("mongoose");
const crypto = require('crypto');

const BikerPickupPointSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter name']
    },
    text: {
        type: String,
    },
    viewId: {
        type: String,
        default: 'pickup_' + crypto.randomBytes(6).toString('hex'),
    },
    supplier: {
        type: mongoose.Types.ObjectId,
        ref: 'Supplier',
        required: true
    },
    address: {
        street: String,
        appartment_house: String,
        city: String,
        state: String,
        zipCode: Number,
        country: String,
        latitude: Number,
        longitude: Number,
    },
    // ["1pm - 3pm", "9am - 11am"]
    suitableTimes: [String]
}, {
    timestamps: true,
    strict: true
});

module.exports = mongoose.model('BikerPickupPoint', BikerPickupPointSchema)