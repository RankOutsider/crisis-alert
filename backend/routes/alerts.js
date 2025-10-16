// backend/routes/alerts.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
// THAY ĐỔI 1: Đổi tên import để tránh trùng lặp
const controller = require('../controllers/alertController');

router.use(protect);

router.route('/')
    .get(controller.getAlerts)
    .post(controller.createAlert);

// THAY ĐỔI 2: Thêm route mới cho stats dashboard
router.route('/stats')
    .get(controller.getStats);

router.route('/scan-all')
    .post(controller.scanAllActiveAlerts);

router.route('/:id')
    .get(controller.getAlertById)
    .put(controller.updateAlert)
    .delete(controller.deleteAlert);

router.route('/:id/scan')
    .post(controller.scanForMatches);

module.exports = router;