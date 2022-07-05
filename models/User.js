const mongoose = require('mongoose');
const validator = require('validator');
const bycrypt = require('bcryptjs');
const { func, number } = require('joi');
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
    isPhoneVerified: { type: Boolean, default: false },
    isEmailVerified: { type: Boolean, default: false },

    sex: String,
    address: {
        street: String,
        appartment_house: String,
        city: String,
        state: String,
        zipCode: Number,
        country: String,
        latitude: Number,
        longitude: Number,

    },
    notificationSettings: {
        email: Boolean,
        phone: { type: Boolean, default: true },
    },
    role: {
        type: String,
        enum: ['admin', 'user', 'supplier'],
        default: 'user'
    },

    supplier: {
        type: mongoose.Types.ObjectId,
        ref: 'Supplier'
    }
}, { timestamps: true });
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