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
    deleteAccount
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
            .trim() // Xóa khoảng trắng thừa
            .isLength({ min: 3 }), // Độ dài tối thiểu 3 ký tự
        body('email', 'Invalid email address')
            .isEmail() // Kiểm tra định dạng email
            .normalizeEmail(), // Chuẩn hóa email (vd: gmail bỏ dấu chấm, viết thường)
        body('phone', 'Invalid phone number (e.g., 09xxxxxxxx)')
            .optional({ nullable: true, checkFalsy: true }) // Cho phép không bắt buộc (null, "", undefined)
            .isString()
            .trim()
            .matches(/^0\d{9}$/), // Regex kiểm tra SĐT Việt Nam 10 số bắt đầu bằng 0
        body('password', 'Password must be at least 6 characters long')
            .isString()
            .isLength({ min: 6 }) // Độ dài tối thiểu 6 ký tự
    ],
    handleValidationErrors, // Chạy middleware xử lý lỗi sau validation
    register // Chạy controller nếu không có lỗi
);

// === Route Đăng nhập ===
router.post(
    '/login',
    [ // --- Validation cho Đăng nhập ---
        body('username', 'Username is required')
            .isString()
            .notEmpty(), // Không được rỗng
        body('password', 'Password is required')
            .isString()
            .notEmpty()
    ],
    handleValidationErrors,
    login
);

// === Các route cần xác thực (chạy qua middleware 'protect') ===

// --- Lấy thông tin cá nhân & Xóa tài khoản ---
router.route('/me')
    .get(protect, getMe) // GET /me không nhận input nên không cần validation
    .delete(protect, deleteAccount); // DELETE /me không nhận input nên không cần validation

// --- Cập nhật chi tiết cá nhân ---
router.put(
    '/updatedetails',
    protect, // Xác thực người dùng trước
    [ // --- Validation cho Cập nhật Chi tiết ---
        // Cho phép cập nhật từng trường riêng lẻ, nên dùng optional()
        body('username', 'Username must be at least 3 characters long')
            .optional() // Cho phép không gửi trường này trong request body
            .isString()
            .trim()
            .isLength({ min: 3 }),
        body('email', 'Invalid email address')
            .optional()
            .isEmail()
            .normalizeEmail(),
        body('phone', 'Invalid phone number (e.g., 09xxxxxxxx)')
            .optional({ nullable: true, checkFalsy: true }) // Cho phép null, "", undefined
            .isString()
            .trim()
            .matches(/^0\d{9}$/)
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

// --- Cập nhật Cài đặt (ví dụ: bật/tắt thông báo) ---
router.put(
    '/settings',
    protect,
    [ // --- Validation cho Cập nhật Cài đặt ---
        body('notificationsEnabled', 'notificationsEnabled phải là giá trị boolean (true hoặc false)')
            .isBoolean() // Kiểm tra là boolean (true/false)
            .toBoolean() // Chuyển đổi các giá trị như chuỗi "true"/"false", số 1/0 thành boolean thật sự
    ],
    handleValidationErrors,
    updateSettings
);


module.exports = router;