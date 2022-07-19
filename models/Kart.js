const mongoose = require("mongoose");

const KartSchema = mongoose.Schema({
    customer: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: true
    },    
    event: {
        type: mongoose.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    quantity: {
        type: Number,
        required: [true, 'Please Enter the quantity']
    }    
}, {
    timestamps: true,
    strict: true
});

module.exports = mongoose.model('Kart', KartSchema)
