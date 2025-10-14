const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware'); // Import Middleware bảo vệ
const alertController = require('../controllers/alertController'); // Import Controller thật

// Áp dụng middleware 'protect' cho tất cả các route trong file này
router.use(protect);

// Route cho việc tạo và lấy tất cả Alerts (GET và POST /api/alerts)
router.route('/')
    .get(alertController.getAlerts)
    .post(alertController.createAlert);

// === ROUTE MỚI CHO CHỨC NĂNG QUÉT TẤT CẢ ===
// POST /api/alerts/scan-all
router.route('/scan-all')
    .post(alertController.scanAllActiveAlerts); // <-- Dòng mới thêm vào

// Route cho việc thao tác với một Alert cụ thể theo ID (/api/alerts/:id)
router.route('/:id')
    .get(alertController.getAlertById)
    .put(alertController.updateAlert)
    .delete(alertController.deleteAlert);

// Route cho việc quét một alert cụ thể (vẫn giữ lại nếu cần)
router.route('/:id/scan')
    .post(alertController.scanForMatches);

module.exports = router;