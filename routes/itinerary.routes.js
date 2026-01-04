const express = require('express');
const router = express.Router();
const Itinerary = require('../models/Itinerary');

// @route   POST /api/itinerary
// @desc    Save AI-generated travel plans
router.post('/', async (req, res) => {
    console.log('\n--- [SAVE TRIP REQUEST] ---');
    console.log('User from token:', req.user ? req.user.email : 'MISSING');

    // Log body but truncate result for readability
    const logBody = { ...req.body };
    if (logBody.result && typeof logBody.result === 'string' && logBody.result.length > 100) {
        logBody.result = logBody.result.substring(0, 100) + '...';
    }
    console.log('Request Body:', JSON.stringify(logBody, null, 2));

    const {
        currentLocation,
        destination,
        goingDestination, // Alias check
        startDate,
        endDate,
        travelers,
        budget,
        days,
        interests,
        dietary,
        result,
        mapData // Extra field from frontend
    } = req.body;

    const finalDestination = destination || goingDestination;
    const userEmail = req.user?.email || req.body.userEmail;

    // Validation
    const errors = [];
    if (!userEmail) errors.push('userEmail');
    if (!currentLocation) errors.push('currentLocation');
    if (!finalDestination) errors.push('destination');
    if (!result) errors.push('result');
    if (days === undefined || days === null || isNaN(Number(days))) errors.push('days (must be a number)');
    if (budget === undefined || budget === null || isNaN(Number(budget))) errors.push('budget (must be a number)');

    if (errors.length > 0) {
        console.error('SAVE TRIP FAILED: Missing or invalid fields:', errors.join(', '));
        return res.status(400).json({
            success: false,
            message: `Invalid request data. Missing or invalid fields: ${errors.join(', ')}`,
            missingFields: errors
        });
    }

    try {
        // Parse result if it's sent as a stringified JSON
        let parsedResult = result;
        if (typeof result === 'string') {
            try {
                parsedResult = JSON.parse(result);
            } catch (e) {
                console.warn('Result is not a valid JSON string, storing as is.');
            }
        }

        const newItinerary = new Itinerary({
            userEmail,
            currentLocation,
            destination: finalDestination,
            startDate,
            endDate,
            travelers: Number(travelers) || 1,
            budget: Number(budget),
            days: Number(days),
            interests: Array.isArray(interests) ? interests : [],
            dietary,
            result: parsedResult,
            mapData
        });

        const savedItinerary = await newItinerary.save();
        console.log(`[SUCCESS] Trip saved to DB: ${savedItinerary._id} for ${userEmail}`);

        res.status(201).json({
            success: true,
            message: 'Trip saved successfully',
            tripId: savedItinerary._id
        });
    } catch (err) {
        console.error('[DB ERROR] Save failed:', err);
        // Handle Mongoose validation errors specifically
        if (err.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Database validation failed',
                details: Object.values(err.errors).map(e => e.message)
            });
        }
        res.status(500).json({
            success: false,
            message: 'Server Error while saving itinerary',
            error: err.message
        });
    }
});

// @route   GET /api/itinerary/:email
// @desc    Fetch user itineraries
router.get('/:email', async (req, res) => {
    const email = req.params.email;
    console.log(`\n--- [GET HISTORY] Request for email: ${email} ---`);

    try {
        const itineraries = await Itinerary.find({ userEmail: email }).sort({ createdAt: -1 });
        console.log(`[GET HISTORY] ✓ Found ${itineraries?.length || 0} trips for ${email}`);

        // CRITICAL FIX: Check if itineraries is null or undefined
        if (!itineraries || !Array.isArray(itineraries)) {
            console.warn('[GET HISTORY] ⚠️ Database returned non-array result:', typeof itineraries);
            return res.json([]);
        }

        // CRITICAL FIX: Validate each trip can be serialized before sending
        // This prevents 500 errors from corrupted data
        const validTrips = [];
        const corruptedTrips = [];

        for (const trip of itineraries) {
            try {
                // Test if trip can be serialized to JSON
                JSON.stringify(trip);
                validTrips.push(trip);
            } catch (serializationError) {
                console.error(`[GET HISTORY] ⚠️ Skipping corrupted trip: ${trip._id}`);
                console.error(`[GET HISTORY] Error: ${serializationError.message}`);
                corruptedTrips.push(trip._id);
            }
        }

        if (corruptedTrips.length > 0) {
            console.warn(`[GET HISTORY] 🗑️ Filtered ${corruptedTrips.length} corrupted trips: ${corruptedTrips.join(', ')}`);
            console.warn(`[GET HISTORY] Tip: Delete corrupted trips manually from database`);
        }

        if (validTrips.length > 0) {
            console.log(`[GET HISTORY] 📋 Sample trip: ${validTrips[0].destination} (${new Date(validTrips[0].createdAt).toLocaleString()})`);
        }

        res.json(validTrips);
    } catch (err) {
        console.error('[GET HISTORY] ❌ Database error:', err.message);
        console.error('[GET HISTORY] Stack:', err.stack);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch trip history',
            error: err.message
        });
    }
});

module.exports = router;
