// backend/routes/alerts.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const controller = require('../controllers/alertController');

// --- 1. Import các công cụ Validation ---
const { body, query, param, validationResult } = require('express-validator');

// --- 2. Middleware Xử lý Lỗi Validation Chung ---
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.error("Lỗi Validation:", errors.array());
        return res.status(400).json({
            message: "Dữ liệu không hợp lệ",
            errors: errors.array({ onlyFirstError: true })
        });
    }
    next();
};

// --- Các lựa chọn platform hợp lệ ---
const VALID_PLATFORMS = ['Facebook', 'Instagram', 'News', 'Forum', 'Threads', 'TikTok', 'X', 'Youtube', 'Blog'];

// --- Áp dụng Middleware Xác thực cho tất cả route ---
router.use(protect);

// === Các route cho /api/alerts ===

router.route('/')
    .get(
        [ // --- Validation cho GET /api/alerts ---
            query('page', 'Trang phải là số nguyên dương').optional().isInt({ min: 1 }).toInt(),
            query('limit', 'Giới hạn phải từ 1 đến 1000').optional().isInt({ min: 1, max: 1000 }).toInt(),
            query('statuses', 'Trạng thái không hợp lệ').optional().isString().custom(value => /^[A-Z,]+$/i.test(value)).toUpperCase(),
            query('severities', 'Mức độ không hợp lệ').optional().isString().custom(value => /^(Low|Medium|High|Critical)(,(Low|Medium|High|Critical))*$/.test(value)),
            query('platforms', `Nền tảng không hợp lệ`).optional().isString().custom(value => value.split(',').every(p => VALID_PLATFORMS.includes(p))),
            query('search', 'Từ khóa tìm kiếm phải là chuỗi').optional().isString().trim(),
            query('fields', 'Trường tìm kiếm không hợp lệ').optional().isString().custom(value => /^(title|description|keywords)(,(title|description|keywords))*$/.test(value))
        ],
        handleValidationErrors,
        controller.getAlerts
    )
    .post(
        [ // --- Validation cho POST /api/alerts ---
            body('title', 'Tiêu đề là bắt buộc').isString().trim().notEmpty(),
            body('description', 'Mô tả phải là chuỗi').optional({ nullable: true, checkFalsy: true }).isString().trim(),
            body('severity', 'Mức độ phải là một trong: Low, Medium, High, Critical').isIn(['Low', 'Medium', 'High', 'Critical']),
            body('keywords', 'Keywords phải là mảng chứa ít nhất một từ khóa').isArray({ min: 1 }).custom((keywords) => keywords.every(kw => typeof kw === 'string' && kw.trim().length > 0)).withMessage('Mỗi từ khóa phải là chuỗi không rỗng'),
            body('platforms', `Platforms phải là mảng chứa ít nhất một nền tảng hợp lệ`).isArray({ min: 1 }).custom((platforms) => platforms.every(p => typeof p === 'string' && VALID_PLATFORMS.includes(p))).withMessage('Chứa giá trị platform không hợp lệ')
        ],
        handleValidationErrors,
        controller.createAlert
    );

// === Route cho /api/alerts/stats ===
router.route('/stats')
    .get(controller.getStats);

// === Route cho /api/alerts/scan-all ===
router.route('/scan-all')
    .post(
        [],
        handleValidationErrors,
        controller.scanAllActiveAlerts
    );

// === ROUTE BULK DELETE ===
router.route('/bulk-delete')
    .delete(
        [ // --- Validation cho DELETE /bulk-delete ---
            body('alertIds', 'alertIds phải là mảng chứa ít nhất một Alert ID (số nguyên dương)')
                .isArray({ min: 1 }) // Phải là mảng, ít nhất 1 phần tử
                .custom(ids => ids.every(id => Number.isInteger(id) && id > 0)) // Kiểm tra từng ID
                .withMessage('Mỗi Alert ID trong mảng phải là số nguyên dương')
        ],
        handleValidationErrors,
        controller.bulkDeleteAlerts
    );


// === Các route cho /api/alerts/:id ===
const validateAlertId = [
    param('id', 'Alert ID phải là số nguyên dương').isInt({ min: 1 }).toInt(),
    handleValidationErrors
];

router.route('/:id')
    .get(
        validateAlertId,
        controller.getAlertById
    )
    .put(
        validateAlertId,
        [ // --- Validation cho PUT /api/alerts/:id ---
            body('title', 'Tiêu đề phải là chuỗi không rỗng').optional().isString().trim().notEmpty(),
            body('description', 'Mô tả phải là chuỗi').optional({ nullable: true, checkFalsy: true }).isString().trim(),
            body('severity', 'Mức độ không hợp lệ').optional().isIn(['Low', 'Medium', 'High', 'Critical']),
            body('status', 'Trạng thái không hợp lệ').optional().isIn(['ACTIVE', 'INACTIVE']),
            body('keywords', 'Keywords phải là mảng các chuỗi không rỗng').optional().isArray().custom((keywords) => keywords.every(kw => typeof kw === 'string' && kw.trim().length > 0)).withMessage('Mỗi từ khóa phải là chuỗi không rỗng'),
            body('platforms', `Platforms phải là mảng các nền tảng hợp lệ`).optional().isArray().custom((platforms) => platforms.every(p => typeof p === 'string' && VALID_PLATFORMS.includes(p))).withMessage('Chứa giá trị platform không hợp lệ')
        ],
        handleValidationErrors,
        controller.updateAlert
    )
    .delete(
        validateAlertId,
        controller.deleteAlert
    );

// === Route cho /api/alerts/:id/scan ===
router.route('/:id/scan')
    .post(
        validateAlertId,
        [],
        handleValidationErrors,
        controller.scanForMatches
    );

module.exports = router;