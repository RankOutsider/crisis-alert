// backend/controllers/postController.js
const { Op } = require('sequelize');
const { Post, Alert, CaseStudy, sequelize } = require('../models/associations');

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

// @desc    Hàm phụ để tạo dữ liệu đầy đủ cho biểu đồ (7 ngày hoặc 6 tháng)
const generatePaddedData = (dbResults, range) => {
    const resultsMap = new Map(dbResults.map(item => [item.name, item]));
    const finalData = [];
    const now = new Date();

    if (range === '7days') {
        // Lấy 7 ngày qua, bắt đầu từ hôm nay
        for (let i = 0; i <= 6; i++) {
            const d = new Date(now);
            d.setDate(d.getDate() - (6 - i)); // 6 ngày trước -> hôm nay

            // Định dạng 'Month Day' (e.g., 'Oct 30')
            const name = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

            const dbEntry = resultsMap.get(name);
            if (dbEntry) {
                finalData.push({
                    name: dbEntry.name,
                    positive: parseInt(dbEntry.positive, 10),
                    negative: parseInt(dbEntry.negative, 10)
                });
            } else {
                finalData.push({ name, positive: 0, negative: 0 });
            }
        }
    } else if (range === '6months') {
        // Lấy 6 tháng qua, bắt đầu từ tháng này
        for (let i = 0; i <= 5; i++) {
            const d = new Date(now);
            d.setMonth(d.getMonth() - (5 - i)); // 5 tháng trước -> tháng này

            // Định dạng 'Month Year' (e.g., 'Oct 2025')
            const name = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

            const dbEntry = resultsMap.get(name);
            if (dbEntry) {
                finalData.push({
                    name: dbEntry.name,
                    positive: parseInt(dbEntry.positive, 10),
                    negative: parseInt(dbEntry.negative, 10)
                });
            } else {
                finalData.push({ name, positive: 0, negative: 0 });
            }
        }
    }
    return finalData;
};

// @desc    Lấy dữ liệu thống kê (Positive/Negative) cho biểu đồ
exports.getPostStatsOverTime = async (req, res) => {
    const { range } = req.query;
    const userId = req.user.id;

    let startDate;
    let dateGroupFormat; // Định dạng cho MySQL/PostgreSQL

    const now = new Date();
    if (range === '7days') {
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 6); // 6 ngày trước + hôm nay = 7 ngày
        startDate.setHours(0, 0, 0, 0);

        // Cú pháp MySQL: 'Tháng Ngày' (e.g., 'Oct 30')
        dateGroupFormat = `DATE_FORMAT(Post.publishedAt, '%b %e')`;

    } else if (range === '6months') {
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 5); // 5 tháng trước + tháng này = 6 tháng
        startDate.setDate(1); // Bắt đầu từ ngày 1 của tháng đó
        startDate.setHours(0, 0, 0, 0);

        // Cú pháp MySQL: 'Tháng Năm' (e.g., 'Oct 2025')
        dateGroupFormat = `DATE_FORMAT(Post.publishedAt, '%b %Y')`;
    }

    try {
        const results = await Post.findAll({
            attributes: [
                // 1. Nhóm theo định dạng ngày/tháng
                [sequelize.literal(dateGroupFormat), 'name'],

                // 2. Đếm 'POSITIVE'
                [
                    sequelize.fn('SUM', sequelize.literal("CASE WHEN sentiment = 'POSITIVE' THEN 1 ELSE 0 END")),
                    'positive'
                ],

                // 3. Đếm 'NEGATIVE'
                [
                    sequelize.fn('SUM', sequelize.literal("CASE WHEN sentiment = 'NEGATIVE' THEN 1 ELSE 0 END")),
                    'negative'
                ]
            ],
            where: {
                publishedAt: { [Op.gte]: startDate }, // Lọc theo ngày bắt đầu
                sentiment: { [Op.in]: ['POSITIVE', 'NEGATIVE'] } // Chỉ lấy 2 loại
            },
            include: [{
                model: Alert,
                where: { userId: userId }, // Chỉ lấy posts thuộc alerts của user
                attributes: [], // Không cần lấy data của Alert
                through: { attributes: [] } // Không cần data bảng trung gian
            }],
            group: ['name'], // Nhóm theo chuỗi ngày/tháng đã format
            order: [[sequelize.literal('MIN(Post.publishedAt)'), 'ASC']], // Sắp xếp
            raw: true // Trả về JSON thô, không phải
        });

        // Điền dữ liệu vào những ngày/tháng bị thiếu (không có post)
        const paddedData = generatePaddedData(results, range);

        res.status(200).json({ data: paddedData });

    } catch (error) {
        console.error("Error fetching chart data:", error);
        res.status(500).json({ message: 'Server error fetching chart data' });
    }
};

// @desc    Export tất cả posts của user trong 1 khoảng thời gian
exports.exportUserPosts = async (req, res) => {
    const { startDate, endDate } = req.query;
    const userId = req.user.id;

    // Đảm bảo endDate bao gồm cả ngày
    const endOfDay = new Date(endDate);
    endOfDay.setHours(23, 59, 59, 999);

    try {
        const posts = await Post.findAll({
            // Các trường (attributes) bạn muốn thấy trong file Excel
            attributes: [
                'id',
                'title',
                'content',
                'source',
                'sourceUrl',
                'platform',
                'sentiment',
                'publishedAt'
            ],
            where: {
                publishedAt: {
                    [Op.between]: [new Date(startDate), endOfDay] // Lọc theo ngày
                },
                // Theo yêu cầu trên modal (chỉ Pos/Neg)
                sentiment: { [Op.in]: ['POSITIVE', 'NEGATIVE'] }
            },
            include: [{
                model: Alert,
                where: { userId: userId }, // Đảm bảo an toàn, chỉ lấy của user
                attributes: [],
                through: { attributes: [] }
            }],
            order: [['publishedAt', 'DESC']], // Sắp xếp
            raw: true // Trả về JSON thô, sạch
        });

        // Trả về mảng JSON. Frontend sẽ xử lý việc tạo file Excel.
        res.status(200).json(posts);

    } catch (error) {
        console.error("Error exporting posts:", error);
        res.status(500).json({ message: 'Server error exporting posts' });
    }
};