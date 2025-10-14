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

// === CÁC ROUTE CÔNG KHAI ===
router.post('/register', register);
router.post('/login', login);

// === CÁC ROUTE CẦN BẢO VỆ ===
// Thêm phương thức DELETE vào route /me
router.route('/me')
    .get(protect, getMe)
    .delete(protect, deleteAccount); // 2. Thêm dòng này

router.put('/updatedetails', protect, updateDetails);
router.put('/updatepassword', protect, updatePassword);
router.put('/settings', protect, updateSettings);

module.exports = router;