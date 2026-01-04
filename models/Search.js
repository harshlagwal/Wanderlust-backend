const mongoose = require('mongoose');

const SearchSchema = new mongoose.Schema({
    userEmail: {
        type: String,
        required: true
    },
    question: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Search', SearchSchema);
