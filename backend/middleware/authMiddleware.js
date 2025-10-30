// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

// Lấy key từ biến môi trường
const SECRET = process.env.JWT_SECRET;

const protect = (req, res, next) => {
    console.log('\n');
    console.log('\n');
    console.log('\n========================================');
    console.log(`--- NEW REQUEST [${new Date().toLocaleTimeString()}] ---`); // Tiêu đề + Thời gian

    console.log('Authorization Header:', req.headers.authorization);

    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];
            console.log('Extracted Token:', token);

            const decoded = jwt.verify(token, SECRET);
            console.log('✅ Token Verified Successfully! Decoded:', decoded);

            req.user = decoded;
            next();

        } catch (error) {
            console.error('❌ Token Verification FAILED!');
            console.error('Error Name:', error.name);
            console.error('Error Message:', error.message);

            return res.status(401).json({ message: 'Token is invalid or expired' });
        }
    } else {
        console.log('🚫 No Authorization Header or does not start with "Bearer"');
        return res.status(401).json({ message: 'Access denied, no Bearer token provided' });
    }
};

module.exports = { protect };