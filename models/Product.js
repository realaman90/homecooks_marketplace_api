const mongoose = require("mongoose");

const ProductSchema = mongoose.Schema({
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
        required: [true, 'Please provide product category'],
        enum: ['breakfast', 'lunch', 'dinner', 'snacks'],
    },
    suitableTimings: [String],
}, {
    timestamps: true,
    strict: true
});

module.exports = mongoose.model('Product', ProductSchema)