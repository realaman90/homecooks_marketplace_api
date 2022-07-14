const mongoose = require("mongoose");
const crypto = require('crypto');

const SupplierSchema = mongoose.Schema({
    businessName: String,
    speciality: String,
    description: String,
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
    viewId: {
        type: String,
        default: 'caterer_' + crypto.randomBytes(6).toString('hex')
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