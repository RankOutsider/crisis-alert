// backend/controllers/alertController.js
const { Op } = require('sequelize');
const { Alert, Post, sequelize } = require('../models/associations');

// @desc    Lấy tất cả Alerts cho người dùng (CÓ PHÂN TRANG, TÌM KIẾM, LỌC)
exports.getAlerts = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 5;
        const offset = (page - 1) * limit;

        const { search, fields, statuses, severities, platforms } = req.query;

        // --- BƯỚC 1: XÂY DỰNG BỘ LỌC CSDL CƠ BẢN ---
        // (Chỉ lọc các trường string/enum đơn giản)
        const whereCondition = { userId };
        const andConditions = [];

        // 1. Lọc Status (Phần này đã đúng)
        if (statuses) {
            const statusArray = statuses.split(',').filter(Boolean).map(s => s.toUpperCase());
            if (statusArray.length > 0) {
                andConditions.push({ status: { [Op.in]: statusArray } });
            }
        }

        // 2. Lọc Severity (Phần này đã đúng)
        if (severities) {
            const severityArray = severities.split(',').filter(Boolean);
            if (severityArray.length > 0) {
                andConditions.push({ severity: { [Op.in]: severityArray } });
            }
        }

        if (andConditions.length > 0) {
            whereCondition[Op.and] = andConditions;
        }

        // --- BƯỚC 2: LẤY TẤT CẢ DỮ LIỆU KHỚP BỘ LỌC CƠ BẢN ---
        // (Không dùng limit/offset vội)
        const allMatchingAlerts = await Alert.findAll({
            where: whereCondition,
            order: [['createdAt', 'DESC']]
        });

        // --- BƯỚC 3: LỌC NÂNG CAO (MẢNG/JSON) BẰNG JAVASCRIPT ---
        let filteredAlerts = allMatchingAlerts;

        // 3a. Lọc Platforms (bằng Javascript)
        if (platforms) {
            const platformArray = platforms.split(',').filter(Boolean);
            if (platformArray.length > 0) {
                filteredAlerts = filteredAlerts.filter(alert => {
                    // Kiểm tra xem 'alert.platforms' (mảng trong DB)
                    // có chứa BẤT KỲ phần tử nào trong 'platformArray' không
                    if (!alert.platforms || alert.platforms.length === 0) return false;
                    return alert.platforms.some(p => platformArray.includes(p));
                });
            }
        }

        // 3b. Lọc Search (bằng Javascript)
        if (search && fields) {
            const searchFields = fields.split(',').map(f => f.trim().toLowerCase());
            const activeFields = searchFields.filter(f => ['title', 'description', 'keywords'].includes(f));

            if (activeFields.length > 0) {
                const orGroups = search.split('|').map(g => g.trim().toLowerCase()).filter(Boolean);

                if (orGroups.length > 0) {
                    filteredAlerts = filteredAlerts.filter(alert => {
                        // Phải khớp VỚI BẤT KỲ (some) nhóm OR nào
                        return orGroups.some(group => {
                            const andTerms = group.split('&').map(t => t.trim().toLowerCase()).filter(Boolean);
                            if (andTerms.length === 0) return true; // (Trường hợp chỉ có dấu |)

                            // Phải khớp VỚI TẤT CẢ (every) các từ AND
                            return andTerms.every(term => {
                                // Phải khớp VỚI BẤT KỲ (some) field nào đang active
                                return activeFields.some(field => {
                                    if (field === 'keywords') {
                                        // Lọc mảng 'keywords'
                                        if (!alert.keywords) return false;
                                        return alert.keywords.some(kw => kw.toLowerCase().includes(term));
                                    } else {
                                        // Lọc string 'title' hoặc 'description'
                                        return alert[field] && alert[field].toLowerCase().includes(term);
                                    }
                                });
                            });
                        });
                    });
                }
            }
        }

        // --- BƯỚC 4: PHÂN TRANG THỦ CÔNG ---
        const count = filteredAlerts.length;
        const paginatedAlerts = filteredAlerts.slice(offset, offset + limit);

        res.status(200).json({
            alerts: paginatedAlerts,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });

    } catch (error) {
        // Log lỗi này ra terminal để xem
        console.error("LỖI KHI FETCH ALERTS:", error);
        res.status(500).json({ message: 'Server error while fetching alerts' });
    }
};

// @desc    Lấy chi tiết một Alert và các posts liên quan (có filter nâng cao)
exports.getAlertById = async (req, res) => {
    try {
        const { id: alertId } = req.params;
        const { platforms, sentiments, search, fields } = req.query;

        // Điều kiện lọc post
        const postWhere = {};

        // 1. Lọc Platform
        if (platforms) {
            const platformArray = platforms.split(',').filter(Boolean);
            if (platformArray.length > 0) {
                postWhere.platform = { [Op.in]: platformArray };
            }
        }

        // 2. Lọc Sentiment
        if (sentiments) {
            const sentimentArray = sentiments.split(',').filter(Boolean);
            if (sentimentArray.length > 0) {
                postWhere.sentiment = { [Op.in]: sentimentArray };
            }
        }

        // 3. Lọc Search nâng cao (AND/OR)
        if (search && fields) {
            const searchFields = fields.split(',').map(f => f.trim().toLowerCase());
            const validFields = ['title', 'content', 'source'];
            const activeFields = searchFields.filter(f => validFields.includes(f));

            if (activeFields.length > 0) {
                const orGroups = search.split('|').map(g => g.trim()).filter(Boolean);

                postWhere[Op.or] = orGroups.map(group => {
                    const andTerms = group.split('&').map(t => t.trim().toLowerCase()).filter(Boolean);

                    return {
                        [Op.and]: andTerms.map(term => ({
                            [Op.or]: activeFields.map(field => ({
                                [field]: { [Op.like]: `%${term}%` }
                            }))
                        }))
                    };
                });
            }
        }

        const alert = await Alert.findOne({
            where: { id: alertId, userId: req.user.id },
            include: [{
                model: Post,
                where: Object.keys(postWhere).length > 0 ? postWhere : undefined,
                through: { attributes: [] },
                required: false
            }],
            order: [[Post, 'publishedAt', 'DESC']]
        });

        if (!alert) {
            return res.status(404).json({ message: 'Alert not found' });
        }

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