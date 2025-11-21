// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
// Import User model
const User = require('../models/User');

exports.protect = async (req, res, next) => {

    // Tự động bỏ qua TẤT CẢ các request OPTIONS
    if (req.method === 'OPTIONS') {
        return next(); // Cho phép request OPTIONS đi qua
    }

    let token;

    // Lấy token từ header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Tách token (Bỏ chữ 'Bearer')
            token = req.headers.authorization.split(' ')[1];

            // Giải mã token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Gán user thật vào req.user (tốt hơn)
            req.user = await User.findByPk(decoded.id, {
                attributes: { exclude: ['password'] }
            });

            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            next(); // Đi tiếp
        } catch (error) {
            console.error('Token validation error:', error.message);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    // Nếu không có token
    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

exports.admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as an admin' });
    }
};