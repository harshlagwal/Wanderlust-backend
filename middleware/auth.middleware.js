const jwt = require('jsonwebtoken');

const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_fallback_secret');
        req.user = decoded; // Contains id and email
        next();
    } catch (error) {
        console.error('[AUTH] Token verification failed:', error.message);
        return res.status(401).json({ message: 'Unauthorized: Invalid or expired token' });
    }
};

module.exports = authMiddleware;

