// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const {
    register,
    login,
    getMe,
    updateDetails,
    updatePassword,
    updateSettings,
    deleteAccount,
    verifyOtp,
    resendOtp,
    forgotPassword,
    resetPassword,
    createReactivationRequest
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// --- 1. Import công cụ Validation ---
const { body, validationResult } = require('express-validator');

// --- 2. Middleware Xử lý Lỗi Validation Chung ---
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.error("Validation Error:", errors.array());
        return res.status(400).json({
            message: "Invalid data",
            errors: errors.array({ onlyFirstError: true }) // Chỉ hiển thị lỗi đầu tiên cho mỗi trường
        });
    }
    next(); // Không có lỗi, đi tiếp
};

// === Route Đăng ký ===
router.post(
    '/register',
    [ // --- Validation cho Đăng ký ---
        body('username', 'Username is required and must be at least 3 characters long')
            .isString()
            .trim()
            .isLength({ min: 3 }),
        body('email', 'Invalid email address')
            .isEmail()
            .normalizeEmail(),
        body('phone', 'Invalid phone number (e.g., 09xxxxxxxx)')
            .notEmpty()
            .isString()
            .trim()
            .matches(/^0\d{9}$/),
        body('password', 'Password must be at least 6 characters long')
            .isString()
            .isLength({ min: 6 })
    ],
    handleValidationErrors,
    register
);

// === Route Đăng nhập ===
router.post(
    '/login',
    [ // --- Validation cho Đăng nhập ---
        body('username', 'Username is required')
            .isString()
            .notEmpty(),
        body('password', 'Password is required')
            .isString()
            .notEmpty()
    ],
    handleValidationErrors,
    login
);

// === Route Gửi Yêu cầu Kích hoạt Lại Tài khoản ===
router.post(
    '/reactivation-request',
    [ // --- Validation cho Yêu cầu Kích hoạt Lại ---
        body('email', 'Invalid email address')
            .isEmail()
            .normalizeEmail()
    ],
    handleValidationErrors,
    createReactivationRequest
);

// === Route Xác thực OTP ===
router.post(
    '/verify-otp',
    [ // --- Validation cho Xác thực OTP ---
        body('email', 'Invalid email address')
            .isEmail()
            .normalizeEmail(),
        body('otp', 'OTP must be a 6-digit code')
            .isString()
            .trim()
            .isLength({ min: 6, max: 6 })
            .isNumeric()
    ],
    handleValidationErrors,
    verifyOtp
);

// === Route Gửi lại OTP ===
router.post(
    '/resend-otp',
    [ // --- Validation cho Gửi lại OTP ---
        body('email', 'Invalid email address')
            .isEmail()
            .normalizeEmail()
    ],
    handleValidationErrors,
    resendOtp
);

// === Route Quên Mật Khẩu (Gửi OTP) ===
router.post(
    '/forgot-password',
    [ // --- Validation cho Quên Mật Khẩu ---
        body('email', 'Invalid email address')
            .isEmail()
            .normalizeEmail()
    ],
    handleValidationErrors,
    forgotPassword
);

// === Route Đặt Lại Mật Khẩu (Dùng OTP) ===
router.post(
    '/reset-password',
    [ // --- Validation cho Đặt Lại Mật Khẩu ---
        body('email', 'Invalid email address')
            .isEmail()
            .normalizeEmail(),
        body('otp', 'OTP must be a 6-digit code')
            .isString()
            .trim()
            .isLength({ min: 6, max: 6 })
            .isNumeric(),
        body('newPassword', 'New password must be at least 6 characters long')
            .isString()
            .isLength({ min: 6 })
    ],
    handleValidationErrors,
    resetPassword // Controller chúng ta đã tạo ở Bước 17
);

// === Các route cần xác thực (chạy qua middleware 'protect') ===

// --- Lấy thông tin cá nhân & Xóa tài khoản ---
router.route('/me')
    .get(protect, getMe)
    .delete(
        protect,
        [
            body('password', 'Password is required to delete account')
                .isString()
                .notEmpty()
        ],
        handleValidationErrors,
        deleteAccount
    );

// --- Cập nhật chi tiết cá nhân ---
router.put(
    '/updatedetails',
    protect,
    [ // --- Validation cho Cập nhật Chi tiết ---
        body('username', 'Username must be at least 3 characters long')
            .optional()
            .isString()
            .trim()
            .isLength({ min: 3 }),
        body('email', 'Invalid email address')
            .optional()
            .isEmail()
            .normalizeEmail(),
        body('phone', 'Invalid phone number (e.g., 09xxxxxxxx)')
            .optional()
            .isString()
            .trim()
            .matches(/^0\d{9}$/),
        body('full_name', 'Full name must be a string')
            .optional({ checkFalsy: true })
            .isString()
            .trim(),
        body('company', 'Company must be a string')
            .optional({ checkFalsy: true })
            .isString()
            .trim(),
        body('avatar_url', 'Avatar URL must be a string')
            .optional({ checkFalsy: true })
            .isString()
            .trim(),
        body('gender', 'Gender must be a string')
            .optional({ checkFalsy: true })
            .isString()
            .trim(),
        body('date_of_birth', 'Invalid date format (YYYY-MM-DD)')
            .optional({ checkFalsy: true })
            .isISO8601()
            .toDate(),
        body('address', 'Address must be a string')
            .optional({ checkFalsy: true })
            .isString()
            .trim()
    ],
    handleValidationErrors,
    updateDetails
);

// --- Cập nhật mật khẩu ---
router.put(
    '/updatepassword',
    protect,
    [ // --- Validation cho Cập nhật Mật khẩu ---
        body('currentPassword', 'Current password is required')
            .isString()
            .notEmpty(),
        body('newPassword', 'New password must be at least 6 characters long')
            .isString()
            .isLength({ min: 6 })
    ],
    handleValidationErrors,
    updatePassword
);

// --- Cập nhật Cài đặt ---
router.put(
    '/settings',
    protect,
    [ // --- Validation cho Cập nhật Cài đặt ---
        body('is_active', 'is_active must be a boolean value')
            .optional()
            .isBoolean()
            .toBoolean(),
        body('notificationsEnabled', 'notificationsEnabled must be a boolean value')
            .optional()
            .isBoolean()
            .toBoolean(),
        body('cc_emails', 'CC emails must be a non-empty string')
            .optional({ checkFalsy: true })
            .isString()
    ],
    handleValidationErrors,
    updateSettings
);

module.exports = router;