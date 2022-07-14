const mongoose = require("mongoose");

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
    viewId: String, // user friendly id
    images: {
        type: [String]
    },
    description: String,
    cuisine: String,
    category: {
        type: String,
        required: [true, 'Please provide dish category'],

    },
    quantity: Number,
    size: String,
    price: Number,
    suitableTimings: [String],
}, {
    timestamps: true,
    strict: true
});

module.exports = mongoose.model('Dish', DishSchema)