const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Validate Environment Variables
const requiredEnv = ['PORT', 'MONGO_URI', 'JWT_SECRET'];

requiredEnv.forEach(env => {
    if (!process.env[env]) {
        console.error(`FATAL ERROR: ${env} is not defined in .env`);
        process.exit(1);
    }
});

// Connect to database
connectDB();



// --- CORS & Connectivity ---
const app = express();

const corsOptions = {
    origin: function (origin, callback) {
        // allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);

        // allow any localhost/127.0.0.1/192.168.x.x origin
        const isLocal = origin.match(/^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+)(:\d+)?$/);
        if (isLocal) {
            return callback(null, true);
        }
        callback(null, false); // Block other origins but don't crash the server
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
// app.options('*', cors(corsOptions)); // Enable pre-flight for all routes - REMOVED: CORS middleware already handles this in Express 5, and this specific syntax can cause crashes.

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));

// Health Check
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'up', message: 'Wanderlust Backend Reachable', time: new Date() });
});

// Request logger with more detail and request separation
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`\n--- [${timestamp}] ${req.method} ${req.url} ---`);
    if (Object.keys(req.body).length > 0) {
        // Truncate result body if it's an itinerary to keep logs clean
        const logBody = { ...req.body };
        if (logBody.result && typeof logBody.result === 'string' && logBody.result.length > 200) {
            logBody.result = logBody.result.substring(0, 100) + '... [TRUNCATED]';
        }
        console.log('Body:', JSON.stringify(logBody, null, 2));
    }
    next();
});


const authMiddleware = require('./middleware/auth.middleware');

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/search', authMiddleware, require('./routes/search.routes'));
app.use('/api/itinerary', authMiddleware, require('./routes/itinerary.routes'));

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(`\n!!! [SERVER ERROR] ${new Date().toISOString()} !!!`);
    console.error('Message:', err.message);
    console.error('Stack:', err.stack);
    console.error('Request URL:', req.url);
    console.error('Request Method:', req.method);

    res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        error: err.message,
        path: req.url
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log('------------------------------------');
    console.log(`Wanderlust Backend Running`);
    console.log(`Port: ${PORT}`);
    console.log(`Time: ${new Date().toLocaleString()}`);
    console.log('------------------------------------');
});

// Global Process Error Handlers to prevent silent crashes
process.on('uncaughtException', (err) => {
    console.error('[FATAL] Uncaught Exception:', err);
    // Graceful shutdown could be added here
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('[FATAL] Unhandled Rejection at:', promise, 'reason:', reason);
});

