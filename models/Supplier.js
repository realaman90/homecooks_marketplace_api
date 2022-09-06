const mongoose = require("mongoose");
const crypto = require('crypto');

const SupplierSchema = mongoose.Schema({
    businessName: String,
    speciality: String,
    description: String,
    licenses: [String],
    address: {
        fullAddress: String,
        street: String,
        appartment_house: String,
        city: String,
        state: String,
        zipCode: Number,
        country: String,
        latitude: Number,
        longitude: Number
    },
    viewId: {
        type: String,

    },
    pickupAddress: {
        fullAddress: String,
        street: String,
        appartment_house: String,
        city: String,
        state: String,
        zipCode: Number,
        country: String,
        latitude: Number,
        longitude: Number
    },
    businessImages: [String],
    contactInfo: {
        businessPhone: Number,
        businessEmail: String,
    },
    paymentMethod: String,
    bankInfo: {
        accountHolderName: String,
        accountNumber: Number,
        routingNumber: Number,
        accountHolderAddress: String,
        venmo: String,
        zelle: String,
        cashApp: String
    },


}, { timestamps: true });
module.exports = mongoose.model('Supplier', SupplierSchema)