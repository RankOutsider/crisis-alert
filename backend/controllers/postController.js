// backend/controllers/postController.js
const { Op } = require('sequelize');
const { Post, Alert, User, CaseStudy, sequelize } = require('../models/associations');
const { sendNotificationEmail } = require('../utils/emailService');

// @desc    Lấy tất cả posts của user (cho trang Mentions)
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
        // Lấy tham số phân trang
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
        const { count, rows } = await Post.findAndCountAll({
            where: postWhere,
            include: [{
                model: Alert,
                where: {
                    id: alertId, // Lọc theo alertId
                    userId: req.user.id // Vẫn kiểm tra quyền sở hữu
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
        if (error.name === 'SequelizeEagerLoadingError' || (error.message && error.message.includes('Cannot read properties'))) {
            return res.status(404).json({ message: 'Alert not found or access denied' });
        }
        console.error(`Error fetching posts for alert ${req.params.alertId}:`, error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Lấy posts cho một CaseStudy ID cụ thể (cho trang /casestudies/[id])
exports.getPostsByCaseStudy = async (req, res) => {
    try {
        const { caseStudyId } = req.params;
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 5;
        const offset = (page - 1) * limit;

        const { search, fields, platforms, sentiments } = req.query;

        const caseStudy = await CaseStudy.findOne({
            where: { id: caseStudyId, userId: req.user.id },
            include: { model: Post, attributes: ['id'], through: { attributes: [] } }
        });

        if (!caseStudy) {
            return res.status(404).json({ message: 'Case study not found or access denied' });
        }

        const postIds = caseStudy.Posts.map(p => p.id);
        if (postIds.length === 0) {
            return res.status(200).json({ posts: [], totalPages: 1, currentPage: 1 });
        }

        const postWhere = { id: { [Op.in]: postIds } };
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

        // Truy vấn findAndCountAll
        const { count, rows } = await Post.findAndCountAll({
            where: postWhere,
            order: [['publishedAt', 'DESC']],
            limit: limit,
            offset: offset,
        });

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

// @desc    Tạo post mới
exports.createPost = async (req, res) => {
    const { title, content, source, sourceUrl, sentiment, publishedAt, platform } = req.body;
    try {
        // Tạo post mới
        const newPost = await Post.create({
            title, content, source, sourceUrl,
            sentiment: sentiment || 'NEUTRAL',
            publishedAt: publishedAt || new Date(),
            platform: platform
        });

        // Trả về thành công ngay lập tức
        res.status(201).json({ message: 'Post created successfully. Will be processed by Cronjob soon.', post: newPost });

    } catch (error) {
        console.error("Error creating post:", error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ message: 'A post with this Source URL already exists' });
        }
        res.status(500).json({ message: 'Server error while creating post' });
    }
};