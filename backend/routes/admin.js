// backend/routes/admin.js
const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
// Import thêm getPosts, deletePost
const {
    getUsers, updateUserByAdmin, deleteUsersBulk,
    getPosts, deletePost, deletePostsBulk,
    getAlerts, deleteAlert, deleteAlertsBulk,
    getCaseStudies, deleteCaseStudy, deleteCaseStudiesBulk
} = require('../controllers/adminController');

router.use(protect);
router.use(admin);

// --- User Routes ---
router.route('/users').get(getUsers);
router.route('/users/bulk').delete(deleteUsersBulk);
router.route('/users/:id').put(updateUserByAdmin);

// --- Post Routes ---
router.route('/posts').get(getPosts);
router.route('/posts/bulk').delete(deletePostsBulk);
router.route('/posts/:id').delete(deletePost);

// --- Alert Routes ---
router.route('/alerts').get(getAlerts);
router.route('/alerts/bulk').delete(deleteAlertsBulk);
router.route('/alerts/:id').delete(deleteAlert);

// --- Case Study Routes ---
router.route('/casestudies').get(getCaseStudies);
router.route('/casestudies/bulk').delete(deleteCaseStudiesBulk);
router.route('/casestudies/:id').delete(deleteCaseStudy);

module.exports = router;