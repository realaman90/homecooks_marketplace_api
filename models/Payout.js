const mongoose = require("mongoose");
const crypto = require('crypto');

const PayoutSchema = mongoose.Schema({    
    order: {
        type: mongoose.Types.ObjectId,
        ref: 'Order',
        required: true   
    },
    event: {        
        type: mongoose.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    item: {
        type: mongoose.Types.ObjectId,
        ref: 'DishItem',
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
    quantity: String,
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
