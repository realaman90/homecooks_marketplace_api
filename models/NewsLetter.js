const mongoose = require("mongoose");

const newsLetterScehma = mongoose.Schema({
    email: {
        type: String,        
        required: true
    }
}, {
    timestamps: true,
    strict: true
});

module.exports = mongoose.model('newsLetter', newsLetterScehma)
