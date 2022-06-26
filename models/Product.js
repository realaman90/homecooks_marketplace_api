const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
        name: {
            type: String,
            trim: true,
            required: [true, 'Please provide product name'],
            maxlength: [100, 'Name can not be more than 100 characters'],
        },
        price: {
            type: Number,
            required: [true, 'Please provide product price'],
            default: 0,
        },
        description: {
            type: String,
            required: [true, 'Please provide product description'],
            maxlength: [1000, 'Description can not be more than 1000 characters'],
        },
        images: [String],
        category: {
            type: String,
            required: [true, 'Please provide product category'],
            enum: ['breakfast', 'lunch', 'dinner', 'snacks'],
        },

        featured: {
            type: Boolean,
            default: false,
        },

        averageRating: {
            type: Number,
            default: 0,
        },
        numOfReviews: {
            type: Number,
            default: 0,
        },
        user: {
            type: mongoose.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },

    {
        timestamps: true,

    }
);

ProductSchema.pre('remove', async function() {
    await this.model('Review').deleteMany({ product: this._id });
});

module.exports = mongoose.model('Product', ProductSchema);