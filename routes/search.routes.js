const express = require('express');
const router = express.Router();
const Search = require('../models/Search');

// @route   POST /api/search
// @desc    Save user search questions
router.post('/', async (req, res) => {
    const { userEmail, question } = req.body;

    try {
        const newSearch = new Search({
            userEmail,
            question
        });

        const search = await newSearch.save();
        res.status(201).json(search);
    } catch (err) {
        console.error('SEARCH SAVE ERROR:', err.message);
        res.status(500).json({ success: false, message: 'Server Error while saving search' });
    }
});

module.exports = router;
