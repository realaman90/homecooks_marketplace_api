const mongoose = require("mongoose");

const ClientPickupPointSchema = mongoose.Schema({    
    name: {
        type: String,
        required: [true, 'Please enter name']
    },    
    text: {
        type: String,        
    },
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
    // ["1pm - 3pm", "9am - 11am"]
    suitableTimes: [String]
}, {
    timestamps: true,
    strict: true
});

module.exports = mongoose.model('ClientPickupPoint', ClientPickupPointSchema)