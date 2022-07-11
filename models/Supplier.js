const mongoose = require("mongoose");

const SupplierSchema = mongoose.Schema({

    businessName: String,
    speciality: String,
    description: {
        type: String
    },
    licenses: [String],
    address: {
        street: String,
        appartment_house: String,
        city: String,
        state: String,
        zipCode: Number,
        country: String,
        latitude: Number,
        longitude: Number
    },
    pickupAddress: {
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
    bankInfo: {
        accountHolderName: String,
        accountNumber: Number,
        routingNumber: Number,
        venmo: String,
        zelle: String,
        cashApp: String
    },


}, { timestamps: true });
module.exports = mongoose.model('Supplier', SupplierSchema)