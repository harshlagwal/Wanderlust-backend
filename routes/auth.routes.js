const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// @route   POST /api/auth/signup
// @desc    Register a new user
// @access  Public
router.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;
    console.log(`[AUTH] Signup attempt: ${email}`);

    try {
        let user = await User.findOne({ email });

        if (user) {
            // Check if it's a legacy user (no password set)
            if (!user.password) {
                console.log(`[AUTH] Upgrading legacy user: ${email}`);
                user.password = password;
                user.name = name || user.name;
                user.provider = 'local';
                await user.save();
            } else {
                console.warn(`[AUTH] Signup failed: User already exists: ${email}`);
                return res.status(400).json({ success: false, message: 'User already exists' });
            }
        } else {
            console.log(`[AUTH] Creating new user: ${email}`);
            user = new User({
                name,
                email,
                password,
                provider: 'local'
            });
            await user.save();
        }

        const token = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        console.log(`[AUTH] Signup successful: ${email}`);
        res.status(201).json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (err) {
        console.error('[AUTH] SIGNUP ERROR:', err.message);
        res.status(500).json({ success: false, message: 'Server Error during signup', error: err.message });
    }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    console.log(`[AUTH] Login attempt: ${email}`);

    try {
        const user = await User.findOne({ email });
        if (!user) {
            console.warn(`[AUTH] Login failed: User not found: ${email}`);
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        // Handle legacy users in login as well
        if (!user.password) {
            console.warn(`[AUTH] Login failed: Legacy user needs to sign up to set password: ${email}`);
            return res.status(400).json({ success: false, message: 'Legacy account detected. Please use Signup to set a password.' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            console.warn(`[AUTH] Login failed: Password mismatch: ${email}`);
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        console.log(`[AUTH] Login successful: ${email}`);
        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (err) {
        console.error('[AUTH] LOGIN ERROR:', err.message);
        res.status(500).json({ success: false, message: 'Server Error during login', error: err.message });
    }
});

module.exports = router;
