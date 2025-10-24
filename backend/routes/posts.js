// backend/routes/posts.js
const express = require('express');
const router = express.Router();
const {
    createPost,
    getPostsByAlert,
    updatePost,
    deletePost,
    getAllUserPosts,
    getPostsByCaseStudy
} = require('../controllers/postController');
const { protect } = require('../middleware/authMiddleware');

// --- 1. Import công cụ Validation ---
const { query, body, param, validationResult } = require('express-validator');

// --- 2. Middleware Xử lý Lỗi Validation ---
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
const VALID_PLATFORMS = ['Facebook', 'X', 'Instagram', 'News', 'Tiktok', 'Forum', 'Threads', 'Youtube', 'Blog']; // Danh sách nhất quán
const VALID_POST_SEARCH_FIELDS = ['title', 'content', 'source']; // Điều chỉnh nếu cần

// === GET /api/posts/all (Lấy tất cả post của user + filter) ===
router.route('/all')
    .get(
        protect, // Xác thực trước
        [ // --- Validation cho GET /all ---
            query('page', 'Trang phải là số nguyên dương')
                .optional().isInt({ min: 1 }).toInt(),
            query('limit', 'Giới hạn phải là số nguyên dương (1-50)')
                .optional().isInt({ min: 1, max: 200 }).toInt(),
            query('search', 'Từ khóa tìm kiếm phải là chuỗi')
                .optional().isString().trim(),
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
            query('alertId', 'Alert ID (nếu có) phải là số nguyên dương') // Thêm validation cho alertId
                .optional().isInt({ min: 1 }).toInt()
        ],
        handleValidationErrors,
        getAllUserPosts
    );

// === POST /api/posts (Tạo post) ===
router.route('/')
    .post(
        // 'protect' ở đây là tùy chọn nếu scanner không cần xác thực
        [ // --- Validation cho POST / ---
            body('title', 'Tiêu đề là bắt buộc').isString().trim().notEmpty(),
            body('content', 'Nội dung là bắt buộc').isString().trim().notEmpty(),
            body('source', 'Nguồn là bắt buộc').isString().trim().notEmpty(),
            body('sourceUrl', 'URL nguồn là bắt buộc và phải là URL hợp lệ').isURL(),
            body('platform', `Platform là bắt buộc và phải hợp lệ`).isIn(VALID_PLATFORMS),
            body('sentiment', 'Sentiment phải hợp lệ (nếu có)')
                .optional({ nullable: true, checkFalsy: true }).isIn(VALID_SENTIMENTS),
            body('publishedAt', 'Ngày đăng phải là định dạng ngày tháng hợp lệ (nếu có)')
                .optional({ nullable: true, checkFalsy: true }).isISO8601().toDate() // Kiểm tra và chuyển thành đối tượng Date
        ],
        handleValidationErrors,
        createPost
    );

// --- Middleware kiểm tra tham số ID ---
const validateAlertIdParam = [
    param('alertId', 'Alert ID trong URL phải là số nguyên dương').isInt({ min: 1 }).toInt(),
    handleValidationErrors
];
const validateCaseStudyIdParam = [
    param('caseStudyId', 'Case Study ID trong URL phải là số nguyên dương').isInt({ min: 1 }).toInt(),
    handleValidationErrors
];
const validatePostIdParam = [
    param('id', 'Post ID trong URL phải là số nguyên dương').isInt({ min: 1 }).toInt(),
    handleValidationErrors
];

// === GET /api/posts/by-alert/:alertId ===
router.route('/by-alert/:alertId')
    .get(
        protect,
        validateAlertIdParam, // Kiểm tra tham số URL
        [ // --- Validation cho query params của GET /by-alert --- (Tương tự GET /all)
            query('search', 'Từ khóa tìm kiếm phải là chuỗi')
                .optional().isString().trim(),
            query('fields', `Trường tìm kiếm phải là chuỗi hợp lệ`)
                .optional().isString()
                .custom(value => value.split(',').every(f => VALID_POST_SEARCH_FIELDS.includes(f)))
                .withMessage(`Chỉ chấp nhận các trường: ${VALID_POST_SEARCH_FIELDS.join(', ')}`),
            query('sentiments', `Sentiment phải là chuỗi hợp lệ`)
                .optional().isString()
                .custom(value => value.split(',').every(s => VALID_SENTIMENTS.includes(s)))
                .withMessage(`Chỉ chấp nhận các giá trị: ${VALID_SENTIMENTS.join(', ')}`),
            query('platforms', `Platform phải là chuỗi hợp lệ`)
                .optional().isString()
                .custom(value => value.split(',').every(p => VALID_PLATFORMS.includes(p)))
                .withMessage(`Chỉ chấp nhận các giá trị: ${VALID_PLATFORMS.join(', ')}`)
        ],
        handleValidationErrors,
        getPostsByAlert
    );

// === GET /api/posts/by-case-study/:caseStudyId ===
router.route('/by-case-study/:caseStudyId')
    .get(
        protect,
        validateCaseStudyIdParam, // Kiểm tra tham số URL
        [ // --- Validation cho query params của GET /by-case-study --- (Tương tự GET /all)
            query('search', 'Từ khóa tìm kiếm phải là chuỗi')
                .optional().isString().trim(),
            query('fields', `Trường tìm kiếm phải là chuỗi hợp lệ`)
                .optional().isString()
                .custom(value => value.split(',').every(f => VALID_POST_SEARCH_FIELDS.includes(f)))
                .withMessage(`Chỉ chấp nhận các trường: ${VALID_POST_SEARCH_FIELDS.join(', ')}`),
            query('sentiments', `Sentiment phải là chuỗi hợp lệ`)
                .optional().isString()
                .custom(value => value.split(',').every(s => VALID_SENTIMENTS.includes(s)))
                .withMessage(`Chỉ chấp nhận các giá trị: ${VALID_SENTIMENTS.join(', ')}`),
            query('platforms', `Platform phải là chuỗi hợp lệ`)
                .optional().isString()
                .custom(value => value.split(',').every(p => VALID_PLATFORMS.includes(p)))
                .withMessage(`Chỉ chấp nhận các giá trị: ${VALID_PLATFORMS.join(', ')}`)
        ],
        handleValidationErrors,
        getPostsByCaseStudy
    );

// === PUT và DELETE /api/posts/:id ===
router.route('/:id')
    .put(
        protect,
        validatePostIdParam, // Kiểm tra tham số URL
        [ // --- Validation cho PUT /:id --- (Chỉ cho phép cập nhật một số trường)
            body('title', 'Tiêu đề phải là chuỗi không rỗng')
                .optional().isString().trim().notEmpty(),
            body('content', 'Nội dung phải là chuỗi không rỗng')
                .optional().isString().trim().notEmpty(),
            body('sentiment', 'Sentiment phải là giá trị hợp lệ')
                .optional().isIn(VALID_SENTIMENTS)
            // Thêm các trường khác được phép cập nhật nếu có
        ],
        handleValidationErrors,
        updatePost
    )
    .delete(
        protect,
        validatePostIdParam, // Kiểm tra tham số URL
        deletePost // DELETE không cần kiểm tra body
    );

module.exports = router;