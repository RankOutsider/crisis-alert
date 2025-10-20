// backend/controllers/alertController.js
const { Op } = require('sequelize');
const { Alert, Post } = require('../models/associations');

// @desc    Lấy tất cả Alerts cho người dùng (CÓ PHÂN TRANG VÀ TÌM KIẾM)
exports.getAlerts = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 5;
        const offset = (page - 1) * limit;
        const { search, fields } = req.query;

        const whereCondition = { userId: userId };

        if (search && fields) {
            const searchTerms = search.toLowerCase().split('|').map(t => t.trim()).filter(Boolean);
            const searchFields = fields.split(',');
            if (searchTerms.length > 0 && searchFields.length > 0) {
                const orConditions = [];
                searchTerms.forEach(term => {
                    searchFields.forEach(field => {
                        if (['title', 'description', 'keywords', 'platforms'].includes(field)) {
                            orConditions.push({ [field]: { [Op.like]: `%${term}%` } });
                        }
                    });
                });
                if (orConditions.length > 0) { whereCondition[Op.or] = orConditions; }
            }
        }

        const { count, rows } = await Alert.findAndCountAll({
            where: whereCondition,
            order: [['createdAt', 'DESC']],
            limit: limit,
            offset: offset
        });

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

// @desc    Lấy chi tiết một Alert và các posts liên quan
exports.getAlertById = async (req, res) => {
    try {
        const { id: alertId } = req.params;
        const alert = await Alert.findOne({
            where: { id: alertId, userId: req.user.id },
            include: [{
                model: Post,
                through: { attributes: [] } // Bỏ qua bảng trung gian trong kết quả
            }],
            order: [[Post, 'publishedAt', 'DESC']] // Sắp xếp các post được include
        });
        if (!alert) { return res.status(404).json({ message: 'Alert not found' }); }
        res.status(200).json(alert);
    } catch (error) {
        console.error("Error fetching single alert:", error);
        res.status(500).json({ message: 'Server error' });
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
        if (!alert) { return res.status(404).json({ message: 'Alert not found' }); }
        if (alert.userId !== req.user.id) { return res.status(403).json({ message: 'Not authorized to update this alert' }); }
        const updateData = { title, description, severity, status, keywords, platforms };
        await Alert.update(updateData, { where: { id: alertId } });
        const updatedAlert = await Alert.findByPk(alertId);
        res.status(200).json({ message: 'Alert updated successfully', alert: updatedAlert });
    } catch (error) {
        console.error("Error updating alert:", error);
        res.status(500).json({ message: 'Server error while updating alert' });
    }
};

exports.deleteAlert = async (req, res) => {
    const alertId = req.params.id;
    try {
        const alert = await Alert.findByPk(alertId);
        if (!alert) { return res.status(404).json({ message: 'Alert not found' }); }
        if (alert.userId !== req.user.id) { return res.status(403).json({ message: 'Not authorized to delete this alert' }); }
        await Alert.destroy({ where: { id: alertId } });
        res.status(200).json({ message: 'Alert deleted successfully' });
    } catch (error) {
        console.error("Error deleting alert:", error);
        res.status(500).json({ message: 'Server error while deleting alert' });
    }
};

// @desc    Quét các post để tìm và liên kết với một alert (quét theo tháng)
exports.scanForMatches = async (req, res) => {
    try {
        const { id: alertId } = req.params;
        const alert = await Alert.findByPk(alertId);
        if (!alert) return res.status(404).json({ message: 'Alert not found' });
        if (alert.status !== 'ACTIVE') return res.status(400).json({ message: 'Cannot scan inactive alert.' });

        // Lấy ngày alert được tạo
        const alertCreationDate = new Date(alert.createdAt);
        // Tính toán ngày đầu tiên của tháng đó
        const startOfMonth = new Date(alertCreationDate.getFullYear(), alertCreationDate.getMonth(), 1);

        const keywordConditions = alert.keywords.map(keyword => ({
            [Op.or]: [
                { title: { [Op.like]: `%${keyword}%` } },
                { content: { [Op.like]: `%${keyword}%` } }
            ]
        }));
        if (keywordConditions.length === 0) return res.status(200).json({ message: 'Scan complete. No keywords.' });

        const matchingPosts = await Post.findAll({
            where: {
                [Op.and]: [
                    { [Op.or]: keywordConditions },
                    { platform: { [Op.in]: alert.platforms } },

                    // Dùng ngày đầu tháng làm điều kiện
                    { publishedAt: { [Op.gte]: startOfMonth } }
                ]
            }
        });

        if (matchingPosts.length === 0) {
            return res.status(200).json({ message: 'Scan complete. No new matches found for this month.' });
        }

        await alert.addPosts(matchingPosts);
        const count = await alert.countPosts();
        await alert.update({ postCount: count });

        res.status(200).json({ message: `Scan complete. Linked ${matchingPosts.length} posts from this month.` });
    } catch (error) {
        console.error(`Error during smart scan:`, error);
        res.status(500).json({ message: 'Server error during scan.' });
    }
};

// @desc    Quét tất cả các posts cho tất cả alerts đang active
exports.scanAllActiveAlerts = async (req, res) => {
    try {
        const activeAlerts = await Alert.findAll({ where: { userId: req.user.id, status: 'ACTIVE' } });
        if (activeAlerts.length === 0) return res.status(200).json({ message: 'No active alerts to scan.' });

        const allPosts = await Post.findAll();
        for (const alert of activeAlerts) {
            // ĐIỀU CHỈNH: Lọc cả keyword và platform
            const matchingPosts = allPosts.filter(post => {
                const postContent = `${post.title} ${post.content}`.toLowerCase();
                const keywordMatch = alert.keywords.some(keyword => postContent.includes(keyword.toLowerCase()));
                const platformMatch = alert.platforms.includes(post.platform); // Điều kiện mới
                return keywordMatch && platformMatch; // Phải khớp cả hai
            });

            if (matchingPosts.length > 0) {
                // `addPosts` sẽ tự động bỏ qua các liên kết đã tồn tại
                await alert.addPosts(matchingPosts);
            }
            // Cập nhật lại postCount cho từng alert
            const count = await alert.countPosts();
            await alert.update({ postCount: count });
        }
        res.status(200).json({ message: `Scan complete. Scanned ${activeAlerts.length} alerts.` });
    } catch (error) {
        console.error('Error scanning all active alerts:', error);
        res.status(500).json({ message: 'Server error during scan.' });
    }
};

// @desc    Lấy các số liệu thống kê cho dashboard
exports.getStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const totalAlerts = await Alert.count({ where: { userId: userId } });
        const activeAlerts = await Alert.count({ where: { userId: userId, status: 'ACTIVE' } });

        const userAlerts = await Alert.findAll({
            where: { userId: userId },
            include: [{ model: Post, attributes: ['id'], through: { attributes: [] } }]
        });

        const uniquePostIds = new Set();
        userAlerts.forEach(alert => {
            alert.Posts.forEach(post => uniquePostIds.add(post.id));
        });
        const totalMentionedPosts = uniquePostIds.size;

        res.status(200).json({ totalAlerts, activeAlerts, totalMentionedPosts });
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        res.status(500).json({ message: "Server error while fetching stats" });
    }
};