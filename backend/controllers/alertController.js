// backend/controllers/alertController.js
const { Op } = require('sequelize');
const { Alert, Post, User, sequelize } = require('../models/associations');

// @desc    Lấy tất cả Alerts của người dùng (hỗ trợ filter, search, pagination)
exports.getAlerts = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 5;
        const offset = (page - 1) * limit;

        const { search, fields, statuses, severities, platforms } = req.query;

        // --- BƯỚC 1: LỌC CSDL (các trường đơn giản) ---
        const whereCondition = { userId };
        const andConditions = [];

        // Lọc theo Status (String/Enum)
        if (statuses) {
            const statusArray = statuses.split(',').filter(Boolean).map(s => s.toUpperCase());
            if (statusArray.length > 0) {
                andConditions.push({ status: { [Op.in]: statusArray } });
            }
        }

        // Lọc theo Severity (String/Enum)
        if (severities) {
            const severityArray = severities.split(',').filter(Boolean);
            if (severityArray.length > 0) {
                andConditions.push({ severity: { [Op.in]: severityArray } });
            }
        }

        if (andConditions.length > 0) {
            whereCondition[Op.and] = andConditions;
        }

        // --- BƯỚC 2: LẤY DỮ LIỆU TỪ CSDL ---
        const allMatchingAlerts = await Alert.findAll({
            where: whereCondition,
            order: [['createdAt', 'DESC']]
        });

        // --- BƯỚC 3: LỌC NÂNG CAO BẰNG JAVASCRIPT (cho các trường Mảng/JSON) ---
        let filteredAlerts = allMatchingAlerts;

        // Lọc theo Platforms (Array/JSON)
        if (platforms) {
            const platformArray = platforms.split(',').filter(Boolean);
            if (platformArray.length > 0) {
                filteredAlerts = filteredAlerts.filter(alert => {
                    if (!alert.platforms || alert.platforms.length === 0) return false;
                    return alert.platforms.some(p => platformArray.includes(p));
                });
            }
        }

        // Lọc theo Search (Hỗ trợ AND/OR)
        if (search && fields) {
            const searchFields = fields.split(',').map(f => f.trim().toLowerCase());
            const activeFields = searchFields.filter(f => ['title', 'description', 'keywords'].includes(f));

            if (activeFields.length > 0) {
                const orGroups = search.split('|').map(g => g.trim().toLowerCase()).filter(Boolean);

                if (orGroups.length > 0) {
                    filteredAlerts = filteredAlerts.filter(alert => {
                        return orGroups.some(group => {
                            const andTerms = group.split('&').map(t => t.trim().toLowerCase()).filter(Boolean);
                            // SỬA LỖI: Nếu group rỗng (vd: "&"), trả về điều kiện luôn sai
                            if (andTerms.length === 0) return false;

                            return andTerms.every(term => {
                                return activeFields.some(field => {
                                    if (field === 'keywords') {
                                        if (!alert.keywords) return false;
                                        return alert.keywords.some(kw => kw.toLowerCase().includes(term));
                                    } else {
                                        return alert[field] && alert[field].toLowerCase().includes(term);
                                    }
                                });
                            });
                        });
                    });
                }
            }
        }

        // --- BƯỚC 4: PHÂN TRANG KẾT QUẢ ĐÃ LỌC ---
        const count = filteredAlerts.length;
        const paginatedAlerts = filteredAlerts.slice(offset, offset + limit);

        res.status(200).json({
            alerts: paginatedAlerts,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });

    } catch (error) {
        console.error("Error fetching alerts:", error);
        res.status(500).json({ message: 'Server error while fetching alerts' });
    }
};

// @desc    Lấy chi tiết một Alert (và các Posts liên quan đã lọc)
exports.getAlertById = async (req, res) => {
    try {
        const { id: alertId } = req.params;
        const { platforms, sentiments, search, fields } = req.query;

        const postWhere = {};

        if (platforms) {
            const platformArray = platforms.split(',').filter(Boolean);
            if (platformArray.length > 0) {
                postWhere.platform = { [Op.in]: platformArray };
            }
        }

        if (sentiments) {
            const sentimentArray = sentiments.split(',').filter(Boolean);
            if (sentimentArray.length > 0) {
                postWhere.sentiment = { [Op.in]: sentimentArray };
            }
        }

        if (search && fields) {
            const searchFields = fields.split(',').map(f => f.trim().toLowerCase());
            const validFields = ['title', 'content', 'source'];
            const activeFields = searchFields.filter(f => validFields.includes(f));

            if (activeFields.length > 0) {
                const orGroups = search.split('|').map(g => g.trim()).filter(Boolean);

                postWhere[Op.or] = orGroups.map(group => {
                    const andTerms = group.split('&').map(t => t.trim().toLowerCase()).filter(Boolean);
                    if (andTerms.length === 0) return { id: null }; // Sửa lỗi logic
                    return {
                        [Op.and]: andTerms.map(term => ({
                            [Op.or]: activeFields.map(field => ({
                                [field]: { [Op.like]: `%${term}%` }
                            }))
                        }))
                    };
                }).filter(c => c.id !== null); // Lọc bỏ các {id: null}
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

// @desc    Tạo một Alert mới
exports.createAlert = async (req, res) => {
    const { title, description, severity, keywords, platforms } = req.body;
    const userId = req.user.id;

    try {
        const newAlert = await Alert.create({
            title,
            description,
            severity,
            keywords,
            platforms,
            userId,
            postCount: 0,
            status: 'ACTIVE'
        });
        res.status(201).json({ message: 'Alert created successfully', alert: newAlert });
    } catch (error) {
        console.error("Error creating alert:", error);
        res.status(500).json({ message: 'Server error while creating alert' });
    }
};

// @desc    Cập nhật thông tin một Alert
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
        Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

        await alert.update(updateData);

        res.status(200).json({ message: 'Alert updated successfully', alert: alert });
    } catch (error) {
        console.error("Error updating alert:", error);
        res.status(500).json({ message: 'Server error while updating alert' });
    }
};

// @desc    Xóa một Alert
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

        await alert.destroy();

        res.status(200).json({ message: 'Alert deleted successfully' });
    } catch (error) {
        console.error("Error deleting alert:", error);
        res.status(500).json({ message: 'Server error while deleting alert' });
    }
};

// @desc    Quét Posts thủ công cho một Alert
exports.scanForMatches = async (req, res) => {
    try {
        const { id: alertId } = req.params;
        const alert = await Alert.findByPk(alertId);

        if (!alert)
            return res.status(404).json({ message: 'Alert not found' });
        if (alert.status !== 'ACTIVE')
            return res.status(400).json({ message: 'Cannot scan inactive alert.' });
        if (!alert.keywords || alert.keywords.length === 0)
            return res.status(200).json({ message: 'Scan complete. No keywords to scan for.' });

        const alertCreationDate = new Date(alert.createdAt);
        const startOfMonth = new Date(alertCreationDate.getFullYear(), alertCreationDate.getMonth(), 1);

        const keywordConditions = alert.keywords.map(keyword => ({
            [Op.or]: [
                { title: { [Op.like]: `%${keyword}%` } },
                { content: { [Op.like]: `%${keyword}%` } }
            ]
        }));

        const matchingPosts = await Post.findAll({
            where: {
                [Op.and]: [
                    { [Op.or]: keywordConditions },
                    { platform: { [Op.in]: alert.platforms || [] } },
                    { publishedAt: { [Op.gte]: startOfMonth } }
                ]
            }
        });

        if (matchingPosts.length === 0) {
            return res.status(200).json({ message: 'Scan complete. No new matches found for this month.' });
        }

        await alert.addPosts(matchingPosts);

        res.status(200).json({ message: `Scan complete. Linked ${matchingPosts.length} new posts from this month.` });
    } catch (error) {
        console.error(`Error during scan for alert ${req.params.id}:`, error);
        res.status(500).json({ message: 'Server error during scan.' });
    }
};

// @desc    Quét TẤT CẢ Posts cho TẤT CẢ Alerts
exports.scanAllActiveAlerts = async (req, res) => {
    try {
        const activeAlerts = await Alert.findAll({ where: { userId: req.user.id, status: 'ACTIVE' } });
        if (activeAlerts.length === 0)
            return res.status(200).json({ message: 'No active alerts to scan.' });

        const allPosts = await Post.findAll();

        await Promise.all(activeAlerts.map(async (alert) => {
            const keywords = alert.keywords || [];
            const platforms = alert.platforms || [];
            if (keywords.length === 0 || platforms.length === 0) return;

            const matchingPosts = allPosts.filter(post => {
                const postContent = `${post.title} ${post.content}`.toLowerCase();
                const keywordMatch = keywords.some(keyword => postContent.includes(keyword.toLowerCase()));
                const platformMatch = platforms.includes(post.platform);
                return keywordMatch && platformMatch;
            });

            if (matchingPosts.length > 0) {
                await alert.addPosts(matchingPosts);
            }
        }));

        res.status(200).json({ message: `Scan complete. Scanned ${activeAlerts.length} active alerts.` });
    } catch (error) {
        console.error('Error scanning all active alerts:', error);
        res.status(500).json({ message: 'Server error during scan.' });
    }
};

// @desc    Lấy các số liệu thống kê cho dashboard
exports.getStats = async (req, res) => {
    try {
        const userId = req.user.id;

        // --- Tính toán các stats cũ (Giữ nguyên) ---
        const totalAlerts = await Alert.count({ where: { userId: userId } });
        const activeAlerts = await Alert.count({ where: { userId: userId, status: 'ACTIVE' } });
        const [results] = await sequelize.query(
            `SELECT COUNT(DISTINCT PostId) AS totalMentionedPosts
             FROM postalerts
             WHERE AlertId IN (SELECT id FROM alerts WHERE userId = :userId)`,
            {
                replacements: { userId: userId },
                type: sequelize.QueryTypes.SELECT
            }
        );
        const totalMentionedPosts = results.totalMentionedPosts;


        // --- Tính toán chartData ---
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const postsByDay = await Post.findAll({
            attributes: [
                [sequelize.fn('DATE', sequelize.col('publishedAt')), 'date'],
                [sequelize.fn('COUNT', sequelize.col('Post.id')), 'count']
            ],
            include: [{
                model: Alert,
                where: { userId: userId },
                attributes: [],
                through: { attributes: [] } // Bảng trung gian không cần attributes
            }],
            where: {
                publishedAt: {
                    [Op.gte]: sevenDaysAgo
                }
            },
            group: [sequelize.fn('DATE', sequelize.col('publishedAt'))], // Group theo ngày
            order: [[sequelize.fn('DATE', sequelize.col('publishedAt')), 'ASC']], // Order theo ngày
            raw: true // Lấy kết quả thuần
        });


        // --- Định dạng chartData (Giữ nguyên) ---
        const chartData = [];
        const dateMap = new Map(postsByDay.map(item => [item.date, parseInt(item.count, 10)]));
        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const formattedDate = date.toISOString().split('T')[0]; // 'YYYY-MM-DD'
            const shortName = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); // 'Oct 29'
            chartData.push({
                name: shortName,
                posts: dateMap.get(formattedDate) || 0
            });
        }
        chartData.reverse(); // Đảo lại để ngày gần nhất ở cuối

        // --- Trả về kết quả ---
        res.status(200).json({
            totalAlerts,
            activeAlerts,
            totalMentionedPosts,
            chartData
        });
    } catch (error) {
        console.error("Error fetching dashboard stats:", error.message, error.stack);
        res.status(500).json({ message: "Server error while fetching stats" });
    }
};

// @desc    Xóa nhiều Alerts cùng lúc
exports.bulkDeleteAlerts = async (req, res) => {
    const { alertIds } = req.body;
    const userId = req.user.id;

    if (!alertIds || !Array.isArray(alertIds) || alertIds.length === 0) {
        return res.status(400).json({ message: "alertIds must be an array with at least one ID." });
    }

    try {
        const deletedCount = await Alert.destroy({
            where: {
                id: { [Op.in]: alertIds },
                userId: userId
            }
        });

        if (deletedCount === 0) {
            return res.status(404).json({ message: "No matching alerts found to delete." });
        }

        res.status(200).json({ message: `Successfully deleted ${deletedCount} alerts.` });

    } catch (error) {
        console.error("Error during bulk delete alerts:", error);
        res.status(500).json({ message: "Server error while deleting alerts" });
    }
};