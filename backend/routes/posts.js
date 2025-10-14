const express = require('express');
const router = express.Router();
const {
    createPost,
    getPostsByAlert,
    updatePost,
    deletePost,
    getAllUserPosts // 1. Import hàm mới
} = require('../controllers/postController');
const { protect } = require('../middleware/authMiddleware');

// === ROUTE MỚI ĐỂ LẤY TẤT CẢ POSTS CỦA USER ===
// GET /api/posts/all
router.route('/all').get(protect, getAllUserPosts); // 2. Thêm route này

// Route này sẽ được dùng bởi hệ thống Crawler/Scanner để TẠO post mới
// POST /api/posts
router.route('/').post(protect, createPost);

// Route này sẽ được dùng bởi trang chi tiết Alert để LẤY danh sách post theo từng alert
// GET /api/posts/by-alert/:alertId
router.route('/by-alert/:alertId').get(protect, getPostsByAlert);

// Các route này để quản lý một post cụ thể (sửa, xóa)
router.route('/:id')
    .put(protect, updatePost)
    .delete(protect, deletePost);

module.exports = router;