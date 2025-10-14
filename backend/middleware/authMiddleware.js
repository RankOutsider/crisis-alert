// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

// Đảm bảo key này giống hệt với key trong authController.js
const SECRET = 'day_la_mot_cai_key_sieu_bi_mat_khong_ai_doan_duoc_123';

const protect = (req, res, next) => {
    // === LOG 1: In ra toàn bộ header để xem token có được gửi lên không ===
    console.log('--- NEW REQUEST ---');
    console.log('Authorization Header:', req.headers.authorization);

    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];
            console.log('Extracted Token:', token); // Log token đã được tách ra

            const decoded = jwt.verify(token, SECRET);
            console.log('✅ Token Verified Successfully! Decoded:', decoded); // Log khi thành công

            req.user = decoded;
            next();

        } catch (error) {
            // === LOG 2: In ra lỗi chi tiết nếu xác thực thất bại ===
            console.error('❌ Token Verification FAILED!');
            console.error('Error Name:', error.name);
            console.error('Error Message:', error.message);

            return res.status(401).json({ message: 'Token is invalid or expired' });
        }
    } else { // Thêm else để xử lý trường hợp không có header
        console.log('🚫 No Authorization Header or does not start with "Bearer"');
        return res.status(401).json({ message: 'Access denied, no Bearer token provided' });
    }
};

module.exports = { protect };