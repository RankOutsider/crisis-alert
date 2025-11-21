// backend/routes/subscription.js
const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
    createSubscriptionRequest,
    getSubscriptionRequests, 
    handleSubscriptionRequest,
    deleteSubscriptionRequest
} = require('../controllers/subscriptionController');

// User routes
router.post('/request', protect, createSubscriptionRequest);

// Admin routes
router.get('/admin/list', protect, admin, getSubscriptionRequests);
router.put('/admin/:id/handle', protect, admin, handleSubscriptionRequest);
router.delete('/admin/:id', protect, admin, deleteSubscriptionRequest);

module.exports = router;