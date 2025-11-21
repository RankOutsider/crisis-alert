// backend/routes/posts.js
const express = require('express');
const router = express.Router();
const {
    createPost,
    getPostsByAlert,
    getAllUserPosts,
    getPostsByCaseStudy,
    getPostStatsOverTime,
    exportUserPosts,
    exportPdf,
    getPostStatsByDayInMonth
} = require('../controllers/postController');
const { protect } = require('../middleware/authMiddleware');

// --- Import công cụ Validation ---
const { query, body, param, validationResult } = require('express-validator');

// --- Middleware Xử lý Lỗi Validation ---
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

// --- Các giá trị hợp lệ (dùng trong validation) ---
const VALID_SENTIMENTS = ['POSITIVE', 'NEUTRAL', 'NEGATIVE'];
const VALID_PLATFORMS = ['Facebook', 'X', 'Instagram', 'News', 'Tiktok', 'Forum', 'Threads', 'Youtube', 'Blog'];
const VALID_POST_SEARCH_FIELDS = ['title', 'content', 'source'];

const VALID_EXPORT_COLUMNS = ['id', 'title', 'content', 'source', 'sourceUrl', 'platform', 'sentiment', 'publishedAt'];
const VALID_SORT_FIELDS = ['id', 'publishedAt'];

// --- HẰNG SỐ CHUNG CHO QUERY PARAMS ---
const postQueryValidation = [
    query('page', 'Trang phải là số nguyên dương').optional().isInt({ min: 1 }).toInt(),
    query('limit', 'Giới hạn phải là số nguyên dương (1-200)').optional().isInt({ min: 1, max: 200 }).toInt(),
    query('search', 'Từ khóa tìm kiếm phải là chuỗi').optional().isString().trim(),
    query('fields', `Trường tìm kiếm phải là chuỗi hợp lệ (vd: ${VALID_POST_SEARCH_FIELDS.join(',')})`)
        .optional().isString()
        .custom(value => value.split(',').every(f => VALID_POST_SEARCH_FIELDS.includes(f)))
        .withMessage(`Chỉ chấp nhận các trường: ${VALID_POST_SEARCH_FIELDS.join(', ')}`),
    query('sentiments', `Sentiment phải là chuỗi hợp lệ (vd: ${VALID_SENTIMENTS.join(',')})`)
        .optional().isString()
        .custom(value => value.split(',').every(s => VALID_SENTIMENTS.includes(s)))
        .withMessage(`Chỉ chấp nhận các giá trị: ${VALID_SENTIMENTS.join(', ')}`),
    query('platforms', `Platform phải là chuỗi hợp lệ (vd: ${VALID_PLATFORMS.join(',')})`)
        .optional().isString()
        .custom(value => value.split(',').every(p => VALID_PLATFORMS.includes(p)))
        .withMessage(`Chỉ chấp nhận các giá trị: ${VALID_PLATFORMS.join(', ')}`),
    query('alertId', 'Alert ID (nếu có) phải là số nguyên dương').optional().isInt({ min: 1 }).toInt()
];

// --- Middleware kiểm tra tham số ID ---
const validateAlertIdParam = [
    param('alertId', 'Alert ID trong URL phải là số nguyên dương').isInt({ min: 1 }).toInt(),
    handleValidationErrors
];
const validateCaseStudyIdParam = [
    param('caseStudyId', 'Case Study ID phải là chuỗi không rỗng').isString().notEmpty(),
    handleValidationErrors
];

// --- Validation cho Export Query ---
const exportQueryValidation = [
    query('startDate', 'Ngày bắt đầu là bắt buộc').isISO8601().toDate(),
    query('endDate', 'Ngày kết thúc là bắt buộc').isISO8601().toDate(),
    query('sortField', 'Trường sắp xếp không hợp lệ')
        .optional().isIn(VALID_SORT_FIELDS),
    query('sortOrder', 'Thứ tự sắp xếp phải là "asc" hoặc "desc"')
        .optional().isIn(['asc', 'desc']),
    query('columns', 'Các cột export không hợp lệ')
        .optional().isString()
        .custom(value => value.split(',').every(col => VALID_EXPORT_COLUMNS.includes(col)))
        .withMessage(`Chỉ chấp nhận các cột: ${VALID_EXPORT_COLUMNS.join(', ')}`)
];

router.route('/export-pdf')
    .get(
        protect,
        exportQueryValidation,
        handleValidationErrors,
        exportPdf
    );

// === GET /api/posts/stats-by-day ===
router.route('/stats-by-day')
    .get(
        protect,
        [
            query('month', 'Month (e.g., "Nov 2025") is required').isString().notEmpty()
        ],
        handleValidationErrors,
        getPostStatsByDayInMonth
    );

// === GET /api/posts/over-time ===
router.route('/over-time')
    .get(
        protect,
        [ // Validation cho route này
            query('range', 'Range là bắt buộc').isIn(['7days', '6months'])
        ],
        handleValidationErrors,
        getPostStatsOverTime // <-- CONTROLLER MỚI
    );

// === GET /api/posts/export ===
// (API cho nút export Excel)
router.route('/export')
    .get(
        protect,
        exportQueryValidation,
        handleValidationErrors,
        exportUserPosts
    );

// === GET /api/posts/all ===
router.route('/all')
    .get(
        protect,
        postQueryValidation,
        handleValidationErrors,
        getAllUserPosts
    );

// === POST /api/posts (Tạo post) ===
router.route('/')
    .post(
        [
            body('title', 'Tiêu đề là bắt buộc').isString().trim().notEmpty(),
            body('content', 'Nội dung là bắt buộc').isString().trim().notEmpty(),
            body('source', 'Nguồn là bắt buộc').isString().trim().notEmpty(),
            body('sourceUrl', 'URL nguồn là bắt buộc và phải là URL hợp lệ').isURL(),
            body('platform', `Platform là bắt buộc và phải hợp lệ`).isIn(VALID_PLATFORMS),
            body('sentiment', 'Sentiment phải hợp lệ (nếu có)')
                .optional({ nullable: true, checkFalsy: true }).isIn(VALID_SENTIMENTS),
            body('publishedAt', 'Ngày đăng phải là định dạng ngày tháng hợp lệ (nếu có)')
                .optional({ nullable: true, checkFalsy: true }).isISO8601().toDate()
        ],
        handleValidationErrors,
        createPost
    );

// === GET /api/posts/by-alert/:alertId ===
router.route('/by-alert/:alertId')
    .get(
        protect,
        validateAlertIdParam,
        postQueryValidation,
        handleValidationErrors,
        getPostsByAlert
    );

// === GET /api/posts/by-case-study/:caseStudyId ===
router.route('/by-case-study/:caseStudyId')
    .get(
        protect,
        validateCaseStudyIdParam,
        postQueryValidation,
        handleValidationErrors,
        getPostsByCaseStudy
    );

module.exports = router;