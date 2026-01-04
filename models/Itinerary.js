const mongoose = require('mongoose');

const ItinerarySchema = new mongoose.Schema({
    userEmail: {
        type: String,
        required: true
    },
    currentLocation: {
        type: String,
        required: true
    },
    destination: {
        type: String,
        required: true
    },
    startDate: String,
    endDate: String,
    travelers: Number,
    budget: {
        type: Number,
        required: true
    },
    days: {
        type: Number,
        required: true
    },
    interests: [String],
    dietary: String,
    result: {
        type: mongoose.Schema.Types.Mixed, // Store full AI JSON
        required: true
    },
    mapData: mongoose.Schema.Types.Mixed, // Optional map point data
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Itinerary', ItinerarySchema);
