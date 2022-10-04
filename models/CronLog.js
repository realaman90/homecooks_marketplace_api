const mongoose = require("mongoose");
const crypto = require('crypto');

const CronLogSchema = mongoose.Schema({
    type: {
        type: String,
        enum: [`quorum_process`, `morning_pickup_reminder`, '24_hour_pickup_reminder'],
    },    
    id: mongoose.Types.ObjectId
}, {
    timestamps: true,
    strict: true
});

module.exports = mongoose.model('CronLog', CronLogSchema)

