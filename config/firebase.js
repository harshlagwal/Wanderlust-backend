const admin = require('firebase-admin');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

let serviceAccount;

try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        // Resolve path relative to the process CWD (project root)
        const serviceAccountPath = path.resolve(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT);
        serviceAccount = require(serviceAccountPath);
        console.log('Firebase Service Account loaded from:', serviceAccountPath);
    } else {
        console.warn('WARNING: FIREBASE_SERVICE_ACCOUNT not found in .env. Authentication will fail.');
    }
} catch (error) {
    console.error('Failed to load Firebase Service Account:', error.message);
}

if (serviceAccount) {
    if (admin.apps.length === 0) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log('Firebase Admin Initialized Successfully');
    }
}

module.exports = admin;
