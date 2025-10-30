// backend/controllers/postController.js
const { Op } = require('sequelize');
const { Post, Alert, User, CaseStudy, sequelize } = require('../models/associations');
const { sendNotificationEmail } = require('../utils/emailService');

// @desc    Lấy tất cả posts của user (cho trang Mentions)
exports.getAllUserPosts = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 5;
        const offset = (page - 1) * limit;

        const { search, fields, sentiments, platforms, alertId } = req.query;

        // --- BƯỚC 1: Xây dựng bộ lọc cho POST (postWhereCondition) ---
        const postWhereCondition = {};

        // Lọc theo Sentiment (String/Enum)
        if (sentiments) {
            const sentimentArray = sentiments.split(',').filter(Boolean);
            if (sentimentArray.length > 0) {
                postWhereCondition.sentiment = { [Op.in]: sentimentArray };
            }
        }

        // Lọc theo Platform (String/Enum)
        if (platforms) {
            const platformArray = platforms.split(',').filter(Boolean);
            if (platformArray.length > 0) {
                postWhereCondition.platform = { [Op.in]: platformArray };
            }
        }

        // Lọc theo Search (AND/OR)
        if (search && fields) {
            const searchFields = fields.split(',').map(f => f.trim().toLowerCase());
            const validFields = ['title', 'content', 'source'];
            const activeFields = searchFields.filter(f => validFields.includes(f));

            if (activeFields.length > 0) {
                const orGroups = search.split('|').map(g => g.trim()).filter(Boolean);

                postWhereCondition[Op.or] = orGroups.map(group => {
                    const andTerms = group.split('&').map(t => t.trim().toLowerCase()).filter(Boolean);

                    // Xử lý lỗi: Nếu group rỗng (vd: "&"), trả về điều kiện luôn sai
                    if (andTerms.length === 0) return { id: null };

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

        // --- BƯỚC 2: Xây dựng bộ lọc cho ALERT (alertWhereCondition) ---
        const alertWhereCondition = { userId: userId };
        if (alertId) {
            const userOwnsAlert = await Alert.count({ where: { id: alertId, userId: userId } });
            if (userOwnsAlert === 0) {
                return res.status(403).json({ message: "Access denied to posts for this alert." });
            }
            alertWhereCondition.id = alertId;
        }

        // --- BƯỚC 3: THỰC HIỆN TRUY VẤN ---
        const findOptions = {
            where: postWhereCondition, // Áp dụng filter cho Post
            include: [{
                model: Alert,
                where: alertWhereCondition, // Yêu cầu Post phải link tới Alert của User
                attributes: [], // Không cần lấy data của Alert
                through: { attributes: [] } // Không cần data của bảng trung gian
            }],
            limit: limit,
            offset: offset,
            order: [['publishedAt', 'DESC']],
            distinct: true // Đảm bảo đếm (count) chính xác
        };

        const { count, rows } = await Post.findAndCountAll(findOptions);

        res.status(200).json({
            posts: rows,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });
    } catch (error) {
        console.error("Error fetching all user posts:", error);
        res.status(500).json({ message: 'Server error fetching posts' });
    }
};

// @desc    Lấy posts cho một Alert ID cụ thể (cho trang /alerts/[id])
exports.getPostsByAlert = async (req, res) => {
    try {
        const { alertId } = req.params;
        // [MỚI] Lấy tham số phân trang
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 5; // Mặc định 5 posts/trang
        const offset = (page - 1) * limit;

        const { search, fields, platforms, sentiments } = req.query;

        // --- Xây dựng bộ lọc cho Posts (postWhere) ---
        const postWhere = {};
        const andConditions = [];

        // Lọc Search (AND/OR)
        if (search && fields) {
            const searchFields = fields.split(',').map(f => f.trim().toLowerCase());
            const validFields = ['title', 'content', 'source'];
            const activeFields = searchFields.filter(f => validFields.includes(f));

            if (activeFields.length > 0) {
                const orGroups = search.split('|').map(g => g.trim()).filter(Boolean);
                const orConditions = orGroups.map(group => {
                    const andTerms = group.split('&').map(t => t.trim().toLowerCase()).filter(Boolean);
                    if (andTerms.length === 0) return { id: null };
                    return {
                        [Op.and]: andTerms.map(term => ({
                            [Op.or]: activeFields.map(field => ({
                                [field]: { [Op.like]: `%${term}%` }
                            }))
                        }))
                    };
                });
                if (orConditions.length > 0 && orConditions.some(c => c.id !== null)) {
                    andConditions.push({ [Op.or]: orConditions.filter(c => c.id !== null) });
                }
            }
        }
        // Lọc Platform
        if (platforms) {
            const platformArray = platforms.split(',').filter(Boolean);
            if (platformArray.length > 0) {
                andConditions.push({ platform: { [Op.in]: platformArray } });
            }
        }
        // Lọc Sentiment
        if (sentiments) {
            const sentimentArray = sentiments.split(',').filter(Boolean);
            if (sentimentArray.length > 0) {
                andConditions.push({ sentiment: { [Op.in]: sentimentArray } });
            }
        }
        if (andConditions.length > 0) {
            postWhere[Op.and] = andConditions;
        }

        // Dùng findAndCountAll trên Post, include Alert
        // Giống hệt logic của getAllUserPosts
        const { count, rows } = await Post.findAndCountAll({
            where: postWhere,
            include: [{
                model: Alert,
                where: {
                    id: alertId, // <-- Lọc theo alertId
                    userId: req.user.id // <-- Vẫn kiểm tra quyền sở hữu
                },
                attributes: [],
                through: { attributes: [] }
            }],
            order: [['publishedAt', 'DESC']],
            limit: limit,
            offset: offset,
            distinct: true
        });

        // Trả về dữ liệu đã phân trang
        res.status(200).json({
            posts: rows,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });
    } catch (error) {
        // Thêm kiểm tra lỗi 404 nếu không tìm thấy (ví dụ: Alert không tồn tại hoặc không thuộc user)
        if (error.name === 'SequelizeEagerLoadingError' || (error.message && error.message.includes('Cannot read properties'))) {
            // Lỗi này xảy ra khi include Alert thất bại (không tìm thấy alert)
            return res.status(404).json({ message: 'Alert not found or access denied' });
        }
        console.error(`Error fetching posts for alert ${req.params.alertId}:`, error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Lấy posts cho một CaseStudy ID cụ thể (cho trang /casestudies/[id])
exports.getPostsByCaseStudy = async (req, res) => {
    try {
        const { caseStudyId } = req.params;
        // Lấy tham số phân trang
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 5; // Mặc định 5 posts/trang
        const offset = (page - 1) * limit;


        const { search, fields, platforms, sentiments } = req.query;

        // Kiểm tra quyền sở hữu Case Study
        const caseStudy = await CaseStudy.findOne({
            where: { id: caseStudyId, userId: req.user.id },
            // Include các Post ID liên quan
            include: {
                model: Post,
                attributes: ['id'], // Chỉ cần ID
                through: { attributes: [] }
            }
        });

        if (!caseStudy) {
            return res.status(404).json({ message: 'Case study not found or access denied' });
        }

        // Lấy danh sách Post ID từ case study
        const postIds = caseStudy.Posts.map(p => p.id);
        if (postIds.length === 0) {
            // [CẬP NHẬT] Trả về tổng số count = 0
            return res.status(200).json({ posts: [], totalPages: 1, currentPage: 1 });
        }

        // --- Xây dựng bộ lọc cho Posts (postWhere) ---
        // Điều kiện cơ bản: ID phải nằm trong danh sách postIds
        const postWhere = { id: { [Op.in]: postIds } };
        const andConditions = []; // Mảng gộp các filter khác

        // Lọc Search (AND/OR)
        if (search && fields) {
            const searchFields = fields.split(',').map(f => f.trim().toLowerCase());
            // Sửa: Bỏ 'sentiment', 'platform' khỏi validFields vì chúng được lọc riêng
            const validFields = ['title', 'content', 'source'];
            const activeFields = searchFields.filter(f => validFields.includes(f));

            if (activeFields.length > 0) {
                const orGroups = search.split('|').map(g => g.trim()).filter(Boolean);
                const orConditions = orGroups.map(group => {
                    const andTerms = group.split('&').map(t => t.trim().toLowerCase()).filter(Boolean);
                    // Xử lý lỗi: Nếu group rỗng (vd: "&"), trả về điều kiện luôn sai
                    if (andTerms.length === 0) return { id: null };

                    return {
                        [Op.and]: andTerms.map(term => ({
                            [Op.or]: activeFields.map(field => ({
                                [field]: { [Op.like]: `%${term}%` }
                            }))
                        }))
                    };
                });

                if (orConditions.length > 0 && orConditions.some(c => c.id !== null)) {
                    andConditions.push({ [Op.or]: orConditions.filter(c => c.id !== null) });
                }
            }
        }

        // Lọc Platform
        if (platforms) {
            const platformArray = platforms.split(',').filter(Boolean);
            if (platformArray.length > 0) {
                andConditions.push({ platform: { [Op.in]: platformArray } });
            }
        }

        // Lọc Sentiment
        if (sentiments) {
            const sentimentArray = sentiments.split(',').filter(Boolean);
            if (sentimentArray.length > 0) {
                andConditions.push({ sentiment: { [Op.in]: sentimentArray } });
            }
        }

        // Gộp các điều kiện AND vào 'postWhere'
        if (andConditions.length > 0) {
            postWhere[Op.and] = andConditions;
        }

        // Tìm Posts VÀ đếm tổng số lượng (findAndCountAll)
        const { count, rows } = await Post.findAndCountAll({
            where: postWhere,
            order: [['publishedAt', 'DESC']],
            limit: limit,
            offset: offset,
        });

        // Trả về Posts + thông tin phân trang
        res.status(200).json({
            posts: rows,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });

    } catch (error) {
        console.error(`Error fetching posts for case study ${req.params.caseStudyId}:`, error);
        res.status(500).json({ message: 'Server error while fetching posts' });
    }
};

// @desc    Hàm nội bộ: Quét tìm các alert khớp khi một post mới được tạo
const findMatchesAndNotify = async (newPost) => {
    try {
        const postContent = `${newPost.title} ${newPost.content}`.toLowerCase();

        // Tìm tất cả alerts ĐANG ACTIVE, kèm thông tin User (để gửi email)
        const activeAlerts = await Alert.findAll({
            where: { status: 'ACTIVE' },
            include: [{ model: User, attributes: ['id', 'email', 'notificationsEnabled'] }]
        });

        // Lọc các alerts khớp (bằng Javascript)
        const matchingAlerts = activeAlerts.filter(alert => {
            const keywords = alert.keywords || [];
            const platforms = alert.platforms || [];
            if (keywords.length === 0 || platforms.length === 0) return false; // Bỏ qua nếu alert chưa setup

            const keywordMatch = keywords.some(keyword => postContent.includes(keyword.toLowerCase()));
            const platformMatch = platforms.includes(newPost.platform);

            return keywordMatch && platformMatch;
        });

        if (matchingAlerts.length > 0) {
            // Lấy ID của các alert khớp
            const matchingAlertIds = matchingAlerts.map(alert => alert.id);

            // Thêm liên kết vào bảng 'postalerts'
            // Trigger 'after_postalerts_insert' sẽ tự động TĂNG 'postCount'
            await newPost.addAlerts(matchingAlertIds);

            // Gửi email thông báo (chạy ngầm)
            for (const alert of matchingAlerts) {
                const user = alert.User;
                // Chỉ gửi nếu user tồn tại, có email, và BẬT thông báo
                if (user && user.email && user.notificationsEnabled) {
                    console.log(`✅ Match found! Sending email to ${user.email} for alert "${alert.title}"`);
                    // Không await: để request hoàn thành ngay, email gửi sau
                    sendNotificationEmail(user.email, alert.title, newPost).catch(err => {
                        console.error(`❌ Failed to send email to ${user.email}:`, err);
                    });
                }
            }
        }
    } catch (error) {
        console.error('❌ Error during notification process:', error);
    }
};

// @desc    Tạo post mới (thường dùng cho crawler/test)
exports.createPost = async (req, res) => {
    const { title, content, source, sourceUrl, sentiment, publishedAt, platform } = req.body;
    try {
        // Tạo post mới
        const newPost = await Post.create({
            title,
            content,
            source,
            sourceUrl,
            sentiment: sentiment || 'NEUTRAL',
            publishedAt: publishedAt || new Date(),
            platform: platform
        });

        // Hàm này sẽ tìm Alert khớp và trigger (CSDL) sẽ tự tăng postCount
        findMatchesAndNotify(newPost);

        // Trả về thành công ngay lập tức
        res.status(201).json({ message: 'Post created successfully. Matching & notification process started.', post: newPost });

    } catch (error) {
        console.error("Error creating post:", error);
        // Xử lý lỗi nếu 'sourceUrl' bị trùng (do unique constraint)
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ message: 'A post with this Source URL already exists' });
        }
        res.status(500).json({ message: 'Server error while creating post' });
    }
};