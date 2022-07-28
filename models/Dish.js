const mongoose = require("mongoose");
const crypto = require('crypto');

const DishSchema = mongoose.Schema({
    supplier: {
        type: mongoose.Types.ObjectId,
        ref: 'Supplier',
        required: true
    },
    name: {
        type: String,
        required: [true, 'Please enter name']
    },
    viewId: {
        type: String,
        default: 'dish_' + crypto.randomBytes(6).toString('hex'),
    },
    images: {
        type: [String]
    },
    description: String,
    mealTags: [String],
    cuisine: String,
    category: {
        type: String,
        required: [true, 'Please provide dish category'],

    },

    // quantity related
    quantity: Number,
    size: String,
    
    // event related data
    minOrders: Number,
    maxOrders: Number,
    pricePerOrder: {
        type: String,
        required: [true, "Please enter price"]
    },
    costToSupplierPerOrder: {
        type: String,
        required: [true, "Please enter costToSupplierPerOrder"]
    },
    bikerPickupPoint: {
        type: mongoose.Types.ObjectId,
        ref: 'BikerPickupPoint',
        required: true
    },
    suitableTimings: [String],
}, {
    timestamps: true,
    strict: true
});

module.exports = mongoose.model('Dish', DishSchema)
