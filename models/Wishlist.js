const mongoose = require("mongoose");

const WishlistSchema = mongoose.Schema({
    customer: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: true
    },
    item: {
        type: mongoose.Types.ObjectId,
        ref: 'DishItem',
        required: true
    },
    updatedAt: Date
}, {
    timestamps: true,
    strict: true
});

module.exports = mongoose.model('WishList', WishlistSchema)