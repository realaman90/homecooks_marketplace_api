const mongoose = require('mongoose');
const validator = require('validator');
const bycrypt = require('bcryptjs');
const { func } = require('joi');
const bcrypt = require('bcryptjs/dist/bcrypt');

const UserSchema = mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Please provide Fullname'],
        minlength: 3,
        maxlength: 100,
    },
    profileImg: String,
    email: {
        type: String,
        required: [true, 'Please provide email'],
        validate: {
            validator: validator.isEmail,
            message: 'Please provide a valid email'
        },

    },
    password: {
        type: String,
        required: [true, 'Please provide password'],
        minlength: 6,

    },
    phone: {
        type: Number,
        minlength: 10,
        maxlength: 11

    },
    sex: String,
    location: {
        street: String,
        appartment_house: String,
        city: String,
        state: String,
        zipCode: Number,
        country: String

    },
    notificationSettings: {
        email: { type: Boolean, default: true },
        phone: Boolean,
    },
    role: {
        type: String,
        enum: ['admin', 'user', 'caterer'],
        default: 'user'
    },
    businessName: String,
    licences: {
        type: [String]
    },

    businessImages: {
        type: [String]
    },
});
UserSchema.pre('save', async function() {

    if (!this.isModified('password')) return;
    const salt = await bycrypt.genSalt(10);
    this.password = await bycrypt.hash(this.password, salt);
});

UserSchema.methods.comparePassword = async function(enteredPassword) {
    const isMatch = await bcrypt.compare(enteredPassword, this.password);
    return isMatch
}
module.exports = mongoose.model('User', UserSchema);