const mongoose = require("mongoose");

const CuisineSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter name']
    },
    image: {
        type: String,
        required: [true, 'Please enter image']
    },
}, {
    timestamps: true,
    strict: true
});

module.exports = mongoose.model('Cuisine', CuisineSchema)
