// backend/controllers/alertController.js
const { Op } = require('sequelize');
const Alert = require('../models/Alert');
const Post = require('../models/Post');
const User = require('../models/User');

// ... (các hàm getAlertById, createAlert... giữ nguyên) ...

// @desc    Lấy tất cả Alerts cho người dùng đã đăng nhập (CÓ PHÂN TRANG)
// @route   GET /api/alerts
// @access  Private
exports.getAlerts = async (req, res) => {
    try {
        const userId = req.user.id;

        // Lấy tham số page và limit từ query string, có giá trị mặc định
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const offset = (page - 1) * limit;

        // Sử dụng findAndCountAll để lấy cả dữ liệu và tổng số lượng
        const { count, rows } = await Alert.findAndCountAll({
            where: { userId: userId },
            order: [['createdAt', 'DESC']],
            limit: limit,
            offset: offset
        });

        // Trả về một object chứa cả dữ liệu và thông tin phân trang
        res.status(200).json({
            alerts: rows,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });

    } catch (error) {
        console.error("Error fetching alerts:", error);
        res.status(500).json({ message: 'Server error while fetching alerts' });
    }
};

// ... (các hàm còn lại giữ nguyên, tôi sẽ rút gọn ở đây)
exports.getAlertById = async (req, res) => {
    try {
        const alertId = req.params.id;
        const userId = req.user.id;
        const alert = await Alert.findOne({ where: { id: alertId, userId: userId } });
        if (!alert) {
            return res.status(404).json({ message: 'Alert not found or you do not have permission' });
        }
        res.status(200).json(alert);
    } catch (error) {
        console.error("Error fetching single alert:", error);
        res.status(500).json({ message: 'Server error while fetching alert' });
    }
};
exports.createAlert = async (req, res) => {
    const { title, description, severity, keywords, platforms } = req.body;
    const userId = req.user.id;
    if (!title || !keywords || keywords.length === 0 || !platforms || platforms.length === 0) {
        return res.status(400).json({ message: 'Please provide title, keywords, and platforms' });
    }
    try {
        const newAlert = await Alert.create({
            title, description, severity, keywords, platforms, userId,
            postCount: 0, status: 'ACTIVE'
        });
        res.status(201).json({ message: 'Alert created successfully', alert: newAlert });
    } catch (error) {
        console.error("Error creating alert:", error);
        res.status(500).json({ message: 'Server error while creating alert' });
    }
};
exports.updateAlert = async (req, res) => {
    const { title, description, severity, status, keywords, platforms } = req.body;
    const alertId = req.params.id;
    try {
        const alert = await Alert.findByPk(alertId);
        if (!alert) {
            return res.status(404).json({ message: 'Alert not found' });
        }
        if (alert.userId !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to update this alert' });
        }
        const updateData = { title, description, severity, status, keywords, platforms };
        await Alert.update(updateData, { where: { id: alertId } });
        const updatedAlert = await Alert.findByPk(alertId);
        res.status(200).json({ message: 'Alert updated successfully', alert: updatedAlert });
    } catch (error) {
        console.error("Error updating alert:", error);
        res.status(500).json({ message: 'Server error while updating alert' });
    }
};
exports.scanForMatches = async (req, res) => {
    try {
        const alertId = req.params.id;
        const userId = req.user.id;
        const alert = await Alert.findOne({ where: { id: alertId, userId: userId } });
        if (!alert) {
            return res.status(404).json({ message: 'Alert not found or you do not have permission.' });
        }
        if (alert.status !== 'ACTIVE') {
            return res.status(400).json({ message: 'Cannot scan for an inactive alert.' });
        }
        const unlinkedPosts = await Post.findAll({
            where: { [Op.or]: [{ alertId: null }, { alertId: { [Op.ne]: alert.id } }] }
        });
        let matchesFound = 0;
        for (const post of unlinkedPosts) {
            const postContent = `${post.title} ${post.content}`.toLowerCase();
            const hasMatch = alert.keywords.some(keyword => postContent.includes(keyword.toLowerCase()));
            if (hasMatch) {
                matchesFound++;
                await post.update({ alertId: alert.id });
                await alert.increment('postCount');
            }
        }
        console.log(`Scan complete for alert "${alert.title}". Found and linked ${matchesFound} existing posts.`);
        res.status(200).json({ message: `Scan complete. Found and linked ${matchesFound} existing posts.` });
    } catch (error) {
        console.error(`Error during manual scan for alert ${req.params.id}:`, error);
        res.status(500).json({ message: 'Server error during scan.' });
    }
};
exports.scanAllActiveAlerts = async (req, res) => {
    try {
        const userId = req.user.id;
        const activeAlerts = await Alert.findAll({ where: { userId, status: 'ACTIVE' } });
        if (activeAlerts.length === 0) {
            return res.status(200).json({ message: 'No active alerts to scan.' });
        }
        const unlinkedPosts = await Post.findAll({ where: { alertId: null } });
        let totalMatches = 0;
        for (const alert of activeAlerts) {
            let alertMatches = 0;
            for (const post of unlinkedPosts) {
                const postContent = `${post.title} ${post.content}`.toLowerCase();
                const hasMatch = alert.keywords.some(keyword => postContent.includes(keyword.toLowerCase()));
                if (hasMatch) {
                    alertMatches++;
                    await post.update({ alertId: alert.id });
                }
            }
            if (alertMatches > 0) {
                await alert.increment('postCount', { by: alertMatches });
                totalMatches += alertMatches;
            }
        }
        res.status(200).json({ message: `Scan complete. Found and linked ${totalMatches} new posts across your active alerts.` });
    } catch (error) {
        console.error('Error scanning all active alerts:', error);
        res.status(500).json({ message: 'Server error during scan.' });
    }
};
exports.deleteAlert = async (req, res) => {
    const alertId = req.params.id;
    try {
        const alert = await Alert.findByPk(alertId);
        if (!alert) {
            return res.status(404).json({ message: 'Alert not found' });
        }
        if (alert.userId !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to delete this alert' });
        }
        await Alert.destroy({ where: { id: alertId } });
        res.status(200).json({ message: 'Alert deleted successfully' });
    } catch (error) {
        console.error("Error deleting alert:", error);
        res.status(500).json({ message: 'Server error while deleting alert' });
    }
};