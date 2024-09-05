const mongoose = require('mongoose');

const EmailScheme = mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    date: {
        type: Number,
        required: true
    } // unix timestamp
})

module.exports = mongoose.model('Email_Notification', EmailScheme);