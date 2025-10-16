const express = require('express');
const router = express.Router();
const {
    createPost,
    getPostsByAlert,
    updatePost,
    deletePost,
    getAllUserPosts,
    getPostsByCaseStudy // THÊM 1: Import hàm mới từ controller
} = require('../controllers/postController');
const { protect } = require('../middleware/authMiddleware');

// === ROUTE MỚI ĐỂ LẤY TẤT CẢ POSTS CỦA USER ===
// GET /api/posts/all
router.route('/all').get(protect, getAllUserPosts);

// Route này sẽ được dùng bởi hệ thống Crawler/Scanner để TẠO post mới
// POST /api/posts
router.route('/').post(createPost); // `protect` middleware is optional here if scanners don't have auth

// Route này sẽ được dùng bởi trang chi tiết Alert để LẤY danh sách post theo từng alert
// GET /api/posts/by-alert/:alertId
router.route('/by-alert/:alertId').get(protect, getPostsByAlert);

// THÊM 2: Route mới để lấy posts theo case study
router.route('/by-case-study/:caseStudyId').get(protect, getPostsByCaseStudy);

// Các route này để quản lý một post cụ thể (sửa, xóa)
router.route('/:id')
    .put(protect, updatePost)
    .delete(protect, deletePost);

module.exports = router;