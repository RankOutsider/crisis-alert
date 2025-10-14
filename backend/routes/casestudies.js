const express = require('express');
const router = express.Router();
const {
    getAllCaseStudies,
    createCaseStudyFromAlert,
    getCaseStudyById,
    deleteCaseStudy,
    updateCaseStudyStatus // 1. Import hàm mới
} = require('../controllers/caseStudyController');
const { protect } = require('../middleware/authMiddleware');

// Áp dụng middleware bảo vệ cho tất cả các route
router.use(protect);

// Route để lấy tất cả và tạo mới
router.route('/')
    .get(getAllCaseStudies)
    .post(createCaseStudyFromAlert);

// === ROUTE MỚI ĐỂ CẬP NHẬT TRẠNG THÁI ===
// PUT /api/casestudies/:id/status
router.route('/:id/status')
    .put(updateCaseStudyStatus); // 2. Thêm route này

// Route để lấy chi tiết và xóa
router.route('/:id')
    .get(getCaseStudyById)
    .delete(deleteCaseStudy);

module.exports = router;