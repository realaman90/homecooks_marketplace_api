const mongoose = require("mongoose");

const SupplierSchema = mongoose.Schema({

    businessName: String,
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
    businessImages: [String],
    contactInfo: {
        businessPhone: Number,
        businessEmail: String,
    },

}, { timestamps: true });
module.exports = mongoose.model('Supplier', SupplierSchema)