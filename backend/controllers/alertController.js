// backend/controllers/alertController.js
const { Op } = require('sequelize');
const { Alert, Post, User, sequelize } = require('../models/associations');
const { sendNotificationEmail } = require('../utils/emailService');

// --- HÀM QUÉT NỘI BỘ ---
/**
 * Chạy tác vụ quét, so khớp và liên kết.
 * Tối ưu hóa bằng cách load các liên kết đã có vào bộ nhớ.
 * @param {number} userId ID của người dùng thực hiện
 * @param {number|null} specificAlertId Nếu cung cấp, chỉ quét cho 1 Alert. Nếu null, quét tất cả.
 */
async function _runScanTask(userId, specificAlertId = null) {
    const alertWhere = {
        userId: userId,
        status: 'ACTIVE'
    };
    // Nếu chỉ quét 1 alert, thêm ID vào điều kiện
    if (specificAlertId) {
        alertWhere.id = specificAlertId;
    }

    // 1. LẤY ALERTS (Đã include User)
    const activeAlerts = await Alert.findAll({
        where: alertWhere,
        include: [{ model: User, attributes: ['id', 'email', 'notificationsEnabled'] }]
    });

    if (activeAlerts.length === 0) {
        console.log("➡️ Không có alerts ACTIVE, kết thúc quét.");
        return { totalNewLinks: 0, alertCount: 0 };
    }

    // 2. LẤY CÁC LIÊN KẾT ĐÃ TỒN TẠI (Tối ưu N+1 Query)
    const existingLinksRaw = await sequelize.query(
        "SELECT `AlertId`, `PostId` FROM `postalerts`",
        { type: sequelize.QueryTypes.SELECT, raw: true }
    );
    const existingLinks = new Set(
        existingLinksRaw.map(link => `${link.AlertId}-${link.PostId}`)
    );
    console.log(`🔎 Đã tải ${existingLinks.size} liên kết đã tồn tại vào bộ nhớ.`);

    // 3. TÌM NGÀY BẮT ĐẦU QUÉT CHUNG
    const earliestStartDate = new Date(
        Math.min(...activeAlerts.map(a => new Date(a.createdAt)))
    );
    const startOfEarliestMonth = new Date(earliestStartDate.getFullYear(), earliestStartDate.getMonth(), 1);
    startOfEarliestMonth.setHours(0, 0, 0, 0);

    // 4. LẤY TẤT CẢ POSTS CẦN QUÉT (CHỈ 1 LẦN)
    const allPostsToScan = await Post.findAll({
        where: { publishedAt: { [Op.gte]: startOfEarliestMonth } },
        raw: true
    });

    if (allPostsToScan.length === 0) {
        console.log("➡️ Không có posts mới, kết thúc quét.");
        return { totalNewLinks: 0, alertCount: activeAlerts.length };
    }

    // 5. SO KHỚP VÀ GỬI EMAIL (TRONG BỘ NHỚ)
    let totalNewLinks = 0;

    for (const alert of activeAlerts) {
        const keywords = alert.keywords || [];
        const platforms = alert.platforms || [];
        if (keywords.length === 0 || platforms.length === 0) continue;

        const user = alert.User;
        const alertCreationDate = new Date(alert.createdAt);
        const startOfMonth = new Date(alertCreationDate.getFullYear(), alertCreationDate.getMonth(), 1);
        startOfMonth.setHours(0, 0, 0, 0);

        const newPostsToLink = [];
        const newPostObjectsForEmail = [];

        for (const post of allPostsToScan) {
            if (new Date(post.publishedAt) < startOfMonth) continue;

            const linkKey = `${alert.id}-${post.id}`;
            if (existingLinks.has(linkKey)) continue; // Bỏ qua nếu đã liên kết

            const postContent = `${post.title} ${post.content}`.toLowerCase();
            const keywordMatch = keywords.some(keyword => postContent.includes(keyword.toLowerCase()));
            const platformMatch = platforms.some(p => p.toLowerCase() === post.platform.toLowerCase());

            if (keywordMatch && platformMatch) {
                newPostsToLink.push(post.id);
                newPostObjectsForEmail.push(post);
                existingLinks.add(linkKey); // Cập nhật Set
            }
        }

        // 6. TẠO LIÊN KẾT MỚI (HÀNG LOẠT) VÀ GỬI EMAIL
        if (newPostsToLink.length > 0) {
            await alert.addPosts(newPostsToLink);
            totalNewLinks += newPostsToLink.length;
            console.log(`✅ [Alert ID ${alert.id}] Đã tạo ${newPostsToLink.length} liên kết MỚI.`);

            if (user && user.email && user.notificationsEnabled) {
                console.log(`... Chuẩn bị gửi ${newPostsToLink.length} email tới ${user.email}`);
                for (const post of newPostObjectsForEmail) {
                    sendNotificationEmail(user.email, alert.title, post).catch(err => {
                        console.error(`❌ Lỗi gửi email (Post ID: ${post.id}):`, err);
                    });
                }
            }
        }
    }

    return { totalNewLinks, alertCount: activeAlerts.length };
}

// @desc    Lấy tất cả Alerts
exports.getAlerts = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 5;
        const offset = (page - 1) * limit;
        const { search, fields, statuses, severities, platforms } = req.query;

        const whereCondition = { userId };
        const andConditions = [];
        if (statuses) {
            const statusArray = statuses.split(',').filter(Boolean).map(s => s.toUpperCase());
            if (statusArray.length > 0) { andConditions.push({ status: { [Op.in]: statusArray } }); }
        }
        if (severities) {
            const severityArray = severities.split(',').filter(Boolean);
            if (severityArray.length > 0) { andConditions.push({ severity: { [Op.in]: severityArray } }); }
        }
        if (andConditions.length > 0) { whereCondition[Op.and] = andConditions; }

        const allMatchingAlerts = await Alert.findAll({ where: whereCondition, order: [['createdAt', 'DESC']] });

        let filteredAlerts = allMatchingAlerts;
        if (platforms) {
            const platformArray = platforms.split(',').filter(Boolean);
            if (platformArray.length > 0) { filteredAlerts = filteredAlerts.filter(alert => alert.platforms?.some(p => platformArray.includes(p))); }
        }
        if (search && fields) {
            const searchFields = fields.split(',').map(f => f.trim().toLowerCase());
            const activeFields = searchFields.filter(f => ['title', 'description', 'keywords'].includes(f));
            if (activeFields.length > 0) {
                const orGroups = search.split('|').map(g => g.trim().toLowerCase()).filter(Boolean);
                if (orGroups.length > 0) {
                    filteredAlerts = filteredAlerts.filter(alert => {
                        return orGroups.some(group => {
                            const andTerms = group.split('&').map(t => t.trim().toLowerCase()).filter(Boolean);
                            if (andTerms.length === 0) return false;
                            return andTerms.every(term => {
                                return activeFields.some(field => {
                                    if (field === 'keywords') { return alert.keywords?.some(kw => kw.toLowerCase().includes(term)); }
                                    else { return alert[field] && alert[field].toLowerCase().includes(term); }
                                });
                            });
                        });
                    });
                }
            }
        }

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

// @desc    Lấy chi tiết một Alert (KHÔNG KÈM POSTS)
exports.getAlertById = async (req, res) => {
    try {
        const { id: alertId } = req.params;
        const alert = await Alert.findOne({ where: { id: alertId, userId: req.user.id } });
        if (!alert) { return res.status(404).json({ message: 'Alert not found' }); }
        res.status(200).json(alert);
    } catch (error) {
        console.error("Error fetching single alert:", error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Tạo một Alert mới
exports.createAlert = async (req, res) => {
    const { title, description, severity, keywords, platforms } = req.body;
    const userId = req.user.id;
    try {
        const newAlert = await Alert.create({
            title, description, severity, keywords, platforms,
            userId, postCount: 0, status: 'ACTIVE'
        });
        res.status(201).json({ message: 'Alert created successfully', alert: newAlert });
    } catch (error) {
        console.error("Error creating alert:", error);
        res.status(500).json({ message: 'Server error while creating alert' });
    }
};

// @desc    Cập nhật thông tin một Alert
exports.updateAlert = async (req, res) => {
    const { title, description, severity, status, keywords, platforms } = req.body;
    const alertId = req.params.id;
    try {
        const alert = await Alert.findByPk(alertId);
        if (!alert) { return res.status(404).json({ message: 'Alert not found' }); }
        if (alert.userId !== req.user.id) { return res.status(403).json({ message: 'Not authorized' }); }
        const updateData = { title, description, severity, status, keywords, platforms };
        Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);
        await alert.update(updateData);
        res.status(200).json({ message: 'Alert updated successfully', alert: alert });
    } catch (error) {
        console.error("Error updating alert:", error);
        res.status(500).json({ message: 'Server error while updating alert' });
    }
};

// @desc    Xóa một Alert
exports.deleteAlert = async (req, res) => {
    const alertId = req.params.id;
    try {
        const alert = await Alert.findByPk(alertId);
        if (!alert) { return res.status(404).json({ message: 'Alert not found' }); }
        if (alert.userId !== req.user.id) { return res.status(403).json({ message: 'Not authorized' }); }
        await alert.destroy();
        res.status(200).json({ message: 'Alert deleted successfully' });
    } catch (error) {
        console.error("Error deleting alert:", error);
        res.status(500).json({ message: 'Server error while deleting alert' });
    }
};

// @desc    (ĐÃ ĐỔI TÊN) Quét Posts thủ công cho Alert HIỆN TẠI
exports.scanForCurrentAlert = async (req, res) => {
    try {
        const { id: alertId } = req.params;
        // Gọi hàm quét tối ưu cho 1 alert
        const stats = await _runScanTask(req.user.id, alertId);
        res.status(200).json({ message: `Scan complete. Linked ${stats.totalNewLinks} new posts.` });
    } catch (error) {
        console.error(`Error during scan for alert ${req.params.id}:`, error);
        res.status(500).json({ message: 'Server error during scan.' });
    }
};

// @desc    (ĐÃ CẬP NHẬT) Quét TẤT CẢ Posts cho TẤT CẢ Alerts (của user)
exports.scanAllActiveAlerts = async (req, res) => {
    try {
        // Gọi hàm quét tối ưu cho TẤT CẢ alerts (ID = null)
        const stats = await _runScanTask(req.user.id, null);
        res.status(200).json({ message: `Scan complete. Found ${stats.totalNewLinks} new posts across ${stats.alertCount} alerts.` });
    } catch (error) {
        console.error('Error scanning all active alerts:', error);
        res.status(500).json({ message: 'Server error during scan.' });
    }
};

// @desc    Lấy các số liệu thống kê cho dashboard
exports.getStats = async (req, res) => {
    try {
        const userId = req.user.id;
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
                through: { attributes: [] }
            }],
            where: {
                publishedAt: { [Op.gte]: sevenDaysAgo }
            },
            group: [sequelize.fn('DATE', sequelize.col('publishedAt'))],
            order: [[sequelize.fn('DATE', sequelize.col('publishedAt')), 'ASC']],
            raw: true
        });

        const chartData = [];
        const dateMap = new Map(postsByDay.map(item => [item.date, parseInt(item.count, 10)]));
        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const formattedDate = date.toISOString().split('T')[0];
            const shortName = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            chartData.push({
                name: shortName,
                posts: dateMap.get(formattedDate) || 0
            });
        }
        chartData.reverse();

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

// @desc    Xóa nhiều Alerts cùng lúc
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