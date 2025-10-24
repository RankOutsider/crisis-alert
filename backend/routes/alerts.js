// backend/routes/alerts.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware'); // Giả sử middleware này xác thực JWT đúng
const controller = require('../controllers/alertController');

// --- 1. Import các công cụ Validation ---
const { body, query, param, validationResult } = require('express-validator');

// --- 2. Middleware Xử lý Lỗi Validation Chung ---
// (Đặt gần đầu file, sau các import)
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.error("Lỗi Validation:", errors.array()); // Log lỗi ra để debug
        return res.status(400).json({
            message: "Dữ liệu không hợp lệ",
            errors: errors.array({ onlyFirstError: true }) // Chỉ hiển thị lỗi đầu tiên cho mỗi trường
        });
    }
    next(); // Không có lỗi, đi tiếp
};

// --- Các lựa chọn platform hợp lệ (dùng trong validation) ---
const VALID_PLATFORMS = ['Facebook', 'Instagram', 'News', 'Forum', 'Threads', 'TikTok', 'X', 'Youtube', 'Blog'];

// --- Áp dụng Middleware Xác thực cho tất cả route trong file này ---
router.use(protect);

// === Các route cho /api/alerts ===

router.route('/')
    .get(
        [ // --- Validation cho GET /api/alerts ---
            query('page', 'Trang phải là số nguyên dương')
                .optional() // Cho phép không có
                .isInt({ min: 1 }) // Là số nguyên >= 1
                .toInt(), // Chuyển đổi thành số nguyên
            query('limit', 'Giới hạn phải từ 1 đến 1000')
                .optional()
                .isInt({ min: 1, max: 1000 })
                .toInt(),
            query('statuses', 'Trạng thái phải là chuỗi các giá trị viết hoa, cách nhau bởi dấu phẩy (vd: ACTIVE,INACTIVE)')
                .optional()
                .isString().withMessage('Statuses phải là chuỗi')
                .custom(value => /^[A-Z,]+$/i.test(value)) // Kiểm tra định dạng A,B,C (không phân biệt hoa thường ban đầu)
                .toUpperCase(), // Chuyển thành chữ hoa
            query('severities', 'Mức độ phải là chuỗi các giá trị hợp lệ, cách nhau bởi dấu phẩy (Low, Medium, High, Critical)')
                .optional()
                .isString().withMessage('Severities phải là chuỗi')
                .custom(value => /^(Low|Medium|High|Critical)(,(Low|Medium|High|Critical))*$/.test(value)), // Kiểm tra giá trị hợp lệ
            query('platforms', `Nền tảng phải là chuỗi các giá trị hợp lệ, cách nhau bởi dấu phẩy (vd: ${VALID_PLATFORMS.join(', ')})`)
                .optional()
                .isString().withMessage('Platforms phải là chuỗi')
                .custom(value => value.split(',').every(p => VALID_PLATFORMS.includes(p))), // Kiểm tra từng platform
            query('search', 'Từ khóa tìm kiếm phải là chuỗi')
                .optional()
                .isString()
                .trim(), // Xóa khoảng trắng thừa
            query('fields', 'Trường tìm kiếm phải là chuỗi các giá trị hợp lệ, cách nhau bởi dấu phẩy (title, description, keywords)')
                .optional()
                .isString().withMessage('Fields phải là chuỗi')
                .custom(value => /^(title|description|keywords)(,(title|description|keywords))*$/.test(value))
        ],
        handleValidationErrors, // Xử lý lỗi query nếu có
        controller.getAlerts
    )
    .post(
        [ // --- Validation cho POST /api/alerts ---
            body('title', 'Tiêu đề là bắt buộc và không được rỗng')
                .isString()
                .trim()
                .notEmpty(),
            body('description', 'Mô tả phải là chuỗi')
                .optional({ nullable: true, checkFalsy: true }) // Cho phép rỗng, null, hoặc không gửi
                .isString()
                .trim(),
            body('severity', 'Mức độ phải là một trong: Low, Medium, High, Critical')
                .isIn(['Low', 'Medium', 'High', 'Critical']),
            body('keywords', 'Keywords phải là mảng chứa ít nhất một từ khóa (chuỗi không rỗng)')
                .isArray({ min: 1 })
                .custom((keywords) => keywords.every(kw => typeof kw === 'string' && kw.trim().length > 0)) // Kiểm tra từng từ khóa
                .withMessage('Mỗi từ khóa phải là chuỗi không rỗng'), // Thông báo lỗi tùy chỉnh
            body('platforms', `Platforms phải là mảng chứa ít nhất một nền tảng hợp lệ (vd: ${VALID_PLATFORMS.join(', ')})`)
                .isArray({ min: 1 })
                .custom((platforms) => platforms.every(p => typeof p === 'string' && VALID_PLATFORMS.includes(p)))
                .withMessage('Chứa giá trị platform không hợp lệ')
        ],
        handleValidationErrors, // Xử lý lỗi body nếu có
        controller.createAlert
    );

// === Route cho /api/alerts/stats ===
router.route('/stats')
    .get(controller.getStats); // Không có đầu vào, không cần validation

// === Route cho /api/alerts/scan-all ===
router.route('/scan-all')
    .post(controller.scanAllActiveAlerts); // Không có đầu vào, không cần validation

// === Các route cho /api/alerts/:id ===

// Middleware để kiểm tra ID trong URL cho các route bên dưới
const validateAlertId = [
    param('id', 'Alert ID phải là số nguyên dương').isInt({ min: 1 }).toInt(),
    handleValidationErrors
];

router.route('/:id')
    .get(
        validateAlertId, // Kiểm tra ID trước
        controller.getAlertById
    )
    .put(
        validateAlertId, // Kiểm tra ID trước
        [ // --- Validation cho PUT /api/alerts/:id --- (Tương tự POST, nhưng các trường là optional)
            body('title', 'Tiêu đề phải là chuỗi không rỗng')
                .optional() // Cho phép không gửi trường này
                .isString()
                .trim()
                .notEmpty(),
            body('description', 'Mô tả phải là chuỗi')
                .optional({ nullable: true, checkFalsy: true })
                .isString()
                .trim(),
            body('severity', 'Mức độ phải là một trong: Low, Medium, High, Critical')
                .optional()
                .isIn(['Low', 'Medium', 'High', 'Critical']),
            body('status', 'Trạng thái phải là ACTIVE hoặc INACTIVE') // Thêm kiểm tra status
                .optional()
                .isIn(['ACTIVE', 'INACTIVE']),
            body('keywords', 'Keywords phải là mảng các chuỗi không rỗng')
                .optional()
                .isArray() // Cho phép gửi mảng rỗng khi cập nhật? Hoặc dùng { min: 1 } nếu muốn bắt buộc
                .custom((keywords) => keywords.every(kw => typeof kw === 'string' && kw.trim().length > 0))
                .withMessage('Mỗi từ khóa phải là chuỗi không rỗng'),
            body('platforms', `Platforms phải là mảng các nền tảng hợp lệ`)
                .optional()
                .isArray() // Cho phép gửi mảng rỗng khi cập nhật? Hoặc dùng { min: 1 } nếu muốn bắt buộc
                .custom((platforms) => platforms.every(p => typeof p === 'string' && VALID_PLATFORMS.includes(p)))
                .withMessage('Chứa giá trị platform không hợp lệ')
        ],
        handleValidationErrors, // Xử lý lỗi body nếu có
        controller.updateAlert
    )
    .delete(
        validateAlertId, // Kiểm tra ID trước
        controller.deleteAlert
    );

// === Route cho /api/alerts/:id/scan ===
router.route('/:id/scan')
    .post(
        validateAlertId, // Kiểm tra ID trước
        controller.scanForMatches
    );

module.exports = router;