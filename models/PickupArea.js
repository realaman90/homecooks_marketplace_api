const mongoose = require("mongoose");
const crypto = require('crypto');

const PickupAreaSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter name']
    },
    text: {
        type: String,
    },
    viewId: {
        type: String,
        default: 'pickup_area_' + crypto.randomBytes(6).toString('hex'),
    },
    fullAddress: {
        type: String
    }
}, {
    timestamps: true,
    strict: true
});

module.exports = mongoose.model('PickupArea', PickupAreaSchema)
