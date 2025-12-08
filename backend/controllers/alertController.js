// backend/controllers/alertController.js
const { Op } = require('sequelize');
const { validationResult } = require('express-validator');
const { Alert, Post, User, sequelize } = require('../models/associations');
const { sendNotificationEmail } = require('../utils/emailService');

const { TIER_PLANS } = require('../config/subscriptionPlans');

const formatValidationErrors = (req) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return errors.array().map(err => ({
            path: err.path || err.param,
            msg: err.msg
        }));
    }
    return null;
};

// hàm sleep
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- HÀM QUÉT NỘI BỘ ---
/**
 * Chạy tác vụ quét, so khớp và liên kết.
 * @param {number} userId ID của người dùng thực hiện
 * @param {number|null} specificAlertId Nếu cung cấp, chỉ quét cho 1 Alert. Nếu null, quét tất cả.
 * @param {object|null} io Đối tượng Socket.IO
 */
async function _runScanTask(userId, specificAlertId = null, io = null) {
    const alertWhere = {
        userId: userId,
        status: 'ACTIVE'
    };
    if (specificAlertId) {
        alertWhere.id = specificAlertId;
    }

    // 1. LẤY ALERTS
    const activeAlerts = await Alert.findAll({
        where: alertWhere,
        include: [{ model: User, attributes: ['id', 'email', 'notificationsEnabled'] }]
    });

    if (activeAlerts.length === 0) {
        console.log("➡️ Không có alerts ACTIVE, kết thúc quét.");
        return { totalNewLinksCreated: 0, alertCount: 0 };
    }

    // 2. LẤY CÁC LIÊN KẾT ĐÃ TỒN TẠI TỪ DATABASE
    const existingLinksRaw = await sequelize.query(
        "SELECT `AlertId`, `PostId` FROM `postalerts`",
        { type: sequelize.QueryTypes.SELECT, raw: true }
    );
    // dbLinks
    const dbLinks = new Set(
        existingLinksRaw.map(link => `${link.AlertId}-${link.PostId}`)
    );
    console.log(`🔎 Đã tải ${dbLinks.size} liên kết đã tồn tại vào bộ nhớ.`);

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
        return { totalNewLinksCreated: 0, alertCount: activeAlerts.length };
    }

    // 5. SO KHỚP VÀ GỬI EMAIL (TRONG BỘ NHỚ)
    let totalNewLinksCreated = 0;

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
            // Chỉ kiểm tra dbLinks
            if (dbLinks.has(linkKey)) continue;

            const postContent = `${post.title} ${post.content}`.toLowerCase();
            const keywordMatch = keywords.some(keyword => postContent.includes(keyword.toLowerCase()));
            // Sửa lỗi case-sensitive
            const platformMatch = platforms.some(p => p.toLowerCase() === post.platform.toLowerCase());

            if (keywordMatch && platformMatch) {
                newPostsToLink.push(post.id);
                newPostObjectsForEmail.push(post);
                // Thêm vào dbLinks (in-memory)
                dbLinks.add(linkKey);
            }
        }

        // 6. TẠO LIÊN KẾT MỚI (HÀNG LOẠT) VÀ GỬI EMAIL
        if (newPostsToLink.length > 0) {
            try {
                await alert.addPosts(newPostsToLink);
                totalNewLinksCreated += newPostsToLink.length;
                console.log(`✅ [Alert ID ${alert.id}] Associated ${newPostsToLink.length} NEW Posts.`);

                // PHÁT TÍN HIỆU WEBSOCKET
                if (io && user) {
                    io.to(`user_${user.id}`).emit('new_match', {
                        alertId: alert.id,
                        alertTitle: alert.title,
                        newPostCount: newPostsToLink.length
                    });
                }
            } catch (dbError) {
                console.error(`❌ LỖI LƯU DB cho Alert ID ${alert.id}:`, dbError.message);
                continue; // Bỏ qua nếu lỗi DB
            }

            // Gửi email
            if (user && user.email && user.notificationsEnabled) {
                console.log(`... Preparing to send ${newPostsToLink.length} email to ${user.email}`);
                for (const post of newPostObjectsForEmail) {
                    // Thêm Try/Catch và Sleep
                    try {
                        await sendNotificationEmail(user.email, alert.title, post);
                        console.log(`... Sent email for Post ID ${post.id} to ${user.email}`);
                        await sleep(1000);
                    } catch (emailError) {
                        console.error(`❌ Error sending email (Post ID: ${post.id}):`, emailError.message);
                        await sleep(2000);
                    }
                }
            }
        }
    }

    return { totalNewLinksCreated, alertCount: activeAlerts.length };
}

// @desc    Lấy tất cả Alerts
exports.getAlerts = async (req, res) => {
    // ... (Giữ nguyên code getAlerts của bạn) ...
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

// @desc    Lấy chi tiết một Alert
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

// @desc    Tạo một Alert mới
exports.createAlert = async (req, res) => {
    const validationErrors = formatValidationErrors(req);
    if (validationErrors) {
        return res.status(400).json({ errors: validationErrors });
    }
    const { title, description, severity, keywords, platforms } = req.body;

    // 1. Lấy thông tin user và gói
    const userId = req.user.id;
    const userTier = req.user.subscriptionTier;

    try {
        const duplicate = await Alert.findOne({ where: { userId, title } });
        if (duplicate) {
            return res.status(400).json({ message: 'You already have an alert with this title. Please choose a different title.' });
        }

        // 2. Lấy thông tin gói từ file config
        const plan = TIER_PLANS[userTier];
        if (!plan) {
            return res.status(400).json({
                message: 'Cannot find your subscription, please contact the support teams.'
            });
        }

        // 3. Kiểm tra giới hạn keywords
        const keywordLimitPerAlert = plan.limits.keywords;
        if (!Array.isArray(keywords)) {
            return res.status(400).json({ message: 'Keywords must be an array.' });
        }
        if (keywords.length > keywordLimitPerAlert) {
            return res.status(400).json({
                errors: [{ path: 'keywords', msg: ` Your ${userTier} subscription only allow up to ${keywordLimitPerAlert} keywords for each alert.` }],
            });
        }

        // 4. Kiểm tra giới hạn tổng số alerts
        const alertLimit = plan.limits.alerts;
        const existingAlertCount = await Alert.count({ where: { userId: userId } });

        if (existingAlertCount >= alertLimit) {
            return res.status(403).json({
                message: `You have reach the limit of ${alertLimit} alerts for the ${userTier} subscription. Please upgrade to expand your limits.`
            });
        }

        // 5. Tạo alert
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

// @desc    Cập nhật thông tin một Alert
exports.updateAlert = async (req, res) => {
    const validationErrors = formatValidationErrors(req);
    if (validationErrors) {
        return res.status(400).json({ errors: validationErrors });
    }

    const { title, description, severity, status, keywords, platforms } = req.body;
    const alertId = req.params.id;
    const userId = req.user.id;

    const userTier = req.user.subscriptionTier;

    try {
        const alert = await Alert.findByPk(alertId);
        if (!alert) { return res.status(404).json({ message: 'Alert not found' }); }
        if (alert.userId !== userId) { return res.status(403).json({ message: 'Not authorized' }); }

        if (title && title !== alert.title) {
            const duplicate = await Alert.findOne({ where: { userId, title } });
            if (duplicate) {
                return res.status(400).json({ message: 'You already have an alert with this title. Please choose a different title.' });
            }
        }

        // === START SUBSCRIPTION CHECK ===
        if (keywords !== undefined) {
            const plan = TIER_PLANS[userTier];
            if (plan) {
                const keywordLimitPerAlert = plan.limits.keywords;
                if (!Array.isArray(keywords)) return res.status(400).json({ message: 'Keywords must be an array.' });
                if (keywords.length > keywordLimitPerAlert) {
                    return res.status(400).json({
                        errors: [{ path: 'keywords', msg: `Max ${keywordLimitPerAlert} keywords allowed.` }]
                    });
                }
            }
        }
        // === END SUBSCRIPTION CHECK ===

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
    // ... (Giữ nguyên code deleteAlert của bạn) ...
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

// @desc    Quét Posts thủ công cho Alert HIỆN TẠI
exports.scanForCurrentAlert = async (req, res) => {
    try {
        const { id: alertId } = req.params;
        // (THAY ĐỔI) Truyền req.io vào
        const stats = await _runScanTask(req.user.id, alertId, req.io);
        res.status(200).json({ message: `Scan complete. Linked ${stats.totalNewLinksCreated} new posts.` });
    } catch (error) {
        console.error(`Error during scan for alert ${req.params.id}:`, error);
        res.status(500).json({ message: 'Server error during scan.' });
    }
};

// @desc    Quét TẤT CẢ Posts cho TẤT CẢ Alerts (của user)
exports.scanAllActiveAlerts = async (req, res) => {
    try {
        // (THAY ĐỔI) Truyền req.io vào
        const stats = await _runScanTask(req.user.id, null, req.io);
        res.status(200).json({ message: `Scan complete. Found ${stats.totalNewLinksCreated} new posts across ${stats.alertCount} alerts.` });
    } catch (error) {
        console.error('Error scanning all active alerts:', error);
        res.status(500).json({ message: 'Server error during scan.' });
    }
};

// @desc    Lấy các số liệu thống kê cho dashboard
exports.getStats = async (req, res) => {
    // ... (Giữ nguyên code getStats của bạn) ...
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
        console.error("Error fetching dashboard stats:", error);
        res.status(500).json({ message: "Server error while fetching stats" });
    }
};

// @desc    Xóa nhiều Alerts cùng lúc
exports.bulkDeleteAlerts = async (req, res) => {
    // ... (Giữ nguyên code bulkDeleteAlerts của bạn) ...
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