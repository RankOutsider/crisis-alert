// backend/routes/casestudies.js
const express = require('express');
const router = express.Router();
const {
    getAllCaseStudies,
    createCaseStudyFromAlert,
    getCaseStudyById,
    deleteCaseStudy,
    updateCaseStudyStatus,
    createBulkCaseStudies
} = require('../controllers/caseStudyController');
const { protect } = require('../middleware/authMiddleware');

// --- 1. Import công cụ Validation ---
const { body, query, param, validationResult } = require('express-validator');

// --- 2. Middleware Xử lý Lỗi Validation Chung ---
// (Giả sử đã định nghĩa ở file khác hoặc copy vào đây)
// const handleValidationErrors = (req, res, next) => { ... };
// Tạm thời định nghĩa lại ở đây cho rõ ràng:
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.error("Lỗi Validation:", errors.array());
        return res.status(400).json({
            message: "Dữ liệu không hợp lệ",
            errors: errors.array({ onlyFirstError: true }) // Chỉ hiển thị lỗi đầu tiên cho mỗi trường
        });
    }
    next(); // Không có lỗi, đi tiếp
};


// --- Áp dụng Middleware Xác thực cho tất cả route ---
router.use(protect);

// === Các route cho /api/casestudies ===

router.route('/')
    .get(
        [ // --- Validation cho GET /api/casestudies ---
            query('page', 'Trang phải là số nguyên dương')
                .optional() // Cho phép không có
                .isInt({ min: 1 }) // Là số nguyên >= 1
                .toInt(), // Chuyển đổi thành số nguyên
            query('limit', 'Giới hạn phải là số nguyên dương (mặc định 6)')
                .optional()
                .isInt({ min: 1 })
                .toInt(),
            query('search', 'Từ khóa tìm kiếm phải là chuỗi')
                .optional()
                .isString()
                .trim(), // Xóa khoảng trắng thừa
            query('fields', 'Trường tìm kiếm phải là "title", "summary" hoặc cả hai, cách nhau bởi dấu phẩy')
                .optional()
                .isString()
                .custom(value => /^(title|summary)(,(title|summary))?$/.test(value)) // Kiểm tra: title, summary, title,summary
        ],
        handleValidationErrors, // Xử lý lỗi query nếu có
        getAllCaseStudies
    )
    .post(
        [ // --- Validation cho POST /api/casestudies ---
            body('alertId', 'Alert ID là bắt buộc và phải là số nguyên dương')
                .isInt({ min: 1 })
                .toInt(),
            body('title', 'Tiêu đề phải là chuỗi (nếu có)')
                .optional() // Cho phép không gửi, controller sẽ lấy từ alert
                .isString()
                .trim()
                .notEmpty().withMessage('Tiêu đề không được rỗng nếu được cung cấp'), // Thông báo lỗi nếu gửi chuỗi rỗng
            body('description', 'Mô tả phải là chuỗi (nếu có)')
                .optional({ nullable: true, checkFalsy: true }) // Cho phép rỗng, null
                .isString()
                .trim()
        ],
        handleValidationErrors, // Xử lý lỗi body nếu có
        createCaseStudyFromAlert
    );

// === Route cho /api/casestudies/bulk-create ===
router.route('/bulk-create')
    .post(
        [ // --- Validation cho POST /bulk-create ---
            body('alertIds', 'alertIds phải là mảng chứa ít nhất một Alert ID (số nguyên dương)')
                .isArray({ min: 1 }) // Phải là mảng, ít nhất 1 phần tử
                .custom(ids => ids.every(id => Number.isInteger(id) && id > 0)) // Kiểm tra từng ID trong mảng
                .withMessage('Mỗi Alert ID trong mảng phải là số nguyên dương') // Thông báo lỗi tùy chỉnh
        ],
        handleValidationErrors,
        createBulkCaseStudies
        // Ghi chú: Middleware 'protect' đã được áp dụng ở đầu file bởi router.use(protect) nên không cần thêm ở đây.
    );

// === Middleware để kiểm tra ID cho các route bên dưới ===
const validateCaseStudyId = [
    param('id', 'Case Study ID phải là số nguyên dương').isInt({ min: 1 }).toInt(), // Kiểm tra 'id' trong req.params
    handleValidationErrors
];

// === Route cho /api/casestudies/:id/status ===
router.route('/:id/status')
    .put(
        validateCaseStudyId, // Kiểm tra ID trước
        [ // --- Validation cho PUT /:id/status ---
            body('status', 'Trạng thái phải là "Resolved" hoặc "Unresolved"')
                .isIn(['Resolved', 'Unresolved']) // Chỉ chấp nhận 1 trong 2 giá trị
        ],
        handleValidationErrors,
        updateCaseStudyStatus
    );

// === Các route cho /api/casestudies/:id ===
router.route('/:id')
    .get(
        validateCaseStudyId, // Kiểm tra ID
        getCaseStudyById
    )
    .delete(
        validateCaseStudyId, // Kiểm tra ID
        deleteCaseStudy
    );

module.exports = router;