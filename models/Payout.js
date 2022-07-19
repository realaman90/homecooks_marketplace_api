const mongoose = require("mongoose");
const crypto = require('crypto');

const PayoutSchema = mongoose.Schema({    
    payment: {
        type: mongoose.Types.ObjectId,
        ref: 'Payment',
        required: true   
    },
    supplier: {
        type: mongoose.Types.ObjectId,
        ref: 'Supplier',
        required: true
    },
    customer: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: true
    },
    paymentMethod: String,
    amount: String,
    status: {
        type: String,
        enum: ['pending', 'completed', 'cancelled'],
        default: 'pending'
    }
}, {
    timestamps: true,
    strict: true
});

module.exports = mongoose.model('Payout', PayoutSchema);
