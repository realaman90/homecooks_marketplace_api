const mongoose = require("mongoose");

const GroupSchema = mongoose.Schema({
    supplier: {
        type: mongoose.Types.ObjectId,
        ref: 'Supplier',
        required: true
    },
    itemName: {
        type: String,
        required: [true, 'Please Enter item name']
    },
    itemDescription: String,
    images: {
        type: [String]
    },
    status: {
        type: String,
        enum: [pending, active, cancelled, fulfilled, delivered],
        default: "pending"
    },
    minOrders: Number,
    maxOrders: Number,
    activeTill: {
        type: Date,
        required: true,
    },
    deliveryDate: Date,
    deliveryTime: Date,
    pricePerOrder: {
        type: Number,
        required: [true, "Please enter price"]
    },
    costToSupplierPerOrder: {
        type: Number,
        required: [true, "Please enter cost to supplier"]
    },
    pickupLocation: {
        street: String,
        appartment_house: String,
        city: String,
        state: String,
        zipCode: Number,
        country: String,

    },
    cuisine: [String],
    category: {
        type: String,
        required: [true, 'Please provide product category'],
        enum: ['breakfast', 'lunch', 'dinner', 'snacks'],
    },




}, {
    timestamps: true,

});

module.exports = mongoose.model('Group', GroupSchema)