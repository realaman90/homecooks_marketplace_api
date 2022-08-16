const mongoose = require("mongoose");

const enquiryScehma = mongoose.Schema({
    email: {
        type: String,        
        required: true
    },
    description: {
        type: String,        
        required: true
    }
}, {
    timestamps: true,
    strict: true
});

module.exports = mongoose.model('enquiry', enquiryScehma)
