// backend/controllers/postController.js
const { Op } = require('sequelize');
const { Post, Alert, User, CaseStudy } = require('../models/associations');
const { sendNotificationEmail } = require('../utils/emailService');

// @desc    Lấy tất cả posts thuộc về người dùng (có phân trang, tìm kiếm)
exports.getAllUserPosts = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const offset = (page - 1) * limit;
        const { search, fields } = req.query;

        // B1: Lấy ID của tất cả các alert thuộc về user
        const userAlerts = await Alert.findAll({ where: { userId: userId }, attributes: ['id'] });
        const alertIds = userAlerts.map(alert => alert.id);
        if (alertIds.length === 0) {
            return res.status(200).json({ posts: [], totalPages: 0, currentPage: 1 });
        }

        // B2: Dùng include để lấy các post liên quan đến các alert đó
        const findOptions = {
            include: [{
                model: Alert,
                where: { id: { [Op.in]: alertIds } },
                attributes: [],
                through: { attributes: [] }
            }],
            limit: limit,
            offset: offset,
            order: [['publishedAt', 'DESC']],
            distinct: true // Rất quan trọng: Đảm bảo mỗi post chỉ xuất hiện 1 lần
        };

        // B3: Thêm điều kiện tìm kiếm (nếu có) vào `where` của Post
        if (search && fields) {
            const searchTerms = search.toLowerCase().split('|').map(t => t.trim()).filter(Boolean);
            const searchFields = fields.split(',');
            if (searchTerms.length > 0 && searchFields.length > 0) {
                const orConditions = [];
                searchTerms.forEach(term => {
                    searchFields.forEach(field => {
                        if (['title', 'content', 'source', 'sentiment', 'platform'].includes(field)) {
                            orConditions.push({ [field]: { [Op.like]: `%${term}%` } });
                        }
                    });
                });
                if (orConditions.length > 0) { findOptions.where = { [Op.or]: orConditions }; }
            }
        }

        const { count, rows } = await Post.findAndCountAll(findOptions);

        res.status(200).json({
            posts: rows,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });
    } catch (error) {
        console.error("Error fetching all user posts:", error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Lấy tất cả Posts liên quan đến một Alert cụ thể
exports.getPostsByAlert = async (req, res) => {
    try {
        const { alertId } = req.params;
        const { search, fields } = req.query;
        const alert = await Alert.findByPk(alertId);
        if (!alert) return res.status(404).json({ message: 'Alert not found' });

        const findOptions = { order: [['publishedAt', 'DESC']], where: {} };
        if (search && fields) {
            const searchTerm = search.toLowerCase().trim();
            const searchFields = fields.split(',');
            const orConditions = searchFields
                .filter(f => ['title', 'content', 'source', 'sentiment'].includes(f))
                .map(field => ({ [field]: { [Op.like]: `%${searchTerm}%` } }));
            if (orConditions.length > 0) { findOptions.where = { [Op.or]: orConditions }; }
        }

        const posts = await alert.getPosts(findOptions);
        res.status(200).json({ posts, totalPages: 1, currentPage: 1 });
    } catch (error) {
        console.error(`Error fetching posts for alert ${req.params.alertId}:`, error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Lấy tất cả Posts liên quan đến một Case Study cụ thể
exports.getPostsByCaseStudy = async (req, res) => {
    try {
        const { caseStudyId } = req.params;
        const { search, fields } = req.query;

        // Lấy case study và các post liên quan qua bảng trung gian
        const caseStudyWithPosts = await CaseStudy.findByPk(caseStudyId, {
            include: {
                model: Post,
                attributes: ['id'], // Chỉ cần lấy ID
                through: { attributes: [] } // Bỏ qua thuộc tính bảng trung gian
            }
        });

        if (!caseStudyWithPosts) {
            return res.status(404).json({ message: 'Case study not found' });
        }

        const postIds = caseStudyWithPosts.Posts.map(p => p.id);

        // Xây dựng điều kiện tìm kiếm cơ bản
        const whereCondition = { id: { [Op.in]: postIds } };

        // Thêm logic tìm kiếm nếu có
        if (search && fields) {
            const searchTerm = search.toLowerCase().trim();
            const searchFields = fields.split(',');
            if (searchTerm && searchFields.length > 0) {
                const orConditions = searchFields.map(field => ({
                    [field]: { [Op.like]: `%${searchTerm}%` }
                }));
                whereCondition[Op.or] = orConditions;
            }
        }

        // Tìm tất cả các post khớp với điều kiện
        const posts = await Post.findAll({
            where: whereCondition,
            order: [['publishedAt', 'DESC']]
        });

        res.status(200).json({ posts: posts });

    } catch (error) {
        console.error(`Error fetching posts for case study ${req.params.caseStudyId}:`, error);
        res.status(500).json({ message: 'Server error while fetching posts' });
    }
};

const findMatchesAndNotify = async (newPost) => {
    try {
        const postContent = `${newPost.title} ${newPost.content}`.toLowerCase();
        const activeAlerts = await Alert.findAll({ where: { status: 'ACTIVE' } });
        console.log(`Scanning ${activeAlerts.length} active alerts for matches...`);
        for (const alert of activeAlerts) {
            const hasMatch = alert.keywords.some(keyword => postContent.includes(keyword.toLowerCase()));
            if (hasMatch) {
                const user = await User.findByPk(alert.userId);
                if (user && user.email && user.notificationsEnabled) {
                    console.log(`✅ Match found! Sending email to ${user.email} for alert "${alert.title}" (Notifications ON)`);
                    await sendNotificationEmail(user.email, alert.title, newPost);
                } else {
                    console.log(`ℹ️ Match found for user ${user.username}, but notifications are OFF. Skipping email.`);
                }
                await newPost.setAlert(alert);
                await alert.increment('postCount');
            }
        }
    } catch (error) {
        console.error('❌ Error during notification process:', error);
    }
};

exports.updatePost = async (req, res) => {
    const { title, content, sentiment } = req.body;
    const postId = req.params.id;
    const userId = req.user.id;
    try {
        const post = await Post.findByPk(postId, { include: Alert });
        if (!post) { return res.status(404).json({ message: 'Post not found' }); }
        if (post.Alert.userId !== userId) { return res.status(403).json({ message: 'Not authorized to update this post' }); }
        await Post.update({ title, content, sentiment }, { where: { id: postId } });
        const updatedPost = await Post.findByPk(postId);
        res.status(200).json({ message: 'Post updated successfully', post: updatedPost });
    } catch (error) {
        console.error("Error updating post:", error);
        res.status(500).json({ message: 'Server error while updating post' });
    }
};

exports.deletePost = async (req, res) => {
    const postId = req.params.id;
    const userId = req.user.id;
    try {
        const post = await Post.findByPk(postId, { include: Alert });
        if (!post) { return res.status(404).json({ message: 'Post not found' }); }
        if (post.Alert.userId !== userId) { return res.status(403).json({ message: 'Not authorized to delete this post' }); }
        if (post.Alert) { await post.Alert.decrement('postCount'); }
        await Post.destroy({ where: { id: postId } });
        res.status(200).json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error("Error deleting post:", error);
        res.status(500).json({ message: 'Server error while deleting post' });
    }
};

exports.createPost = async (req, res) => {
    const { alertId, title, content, source, sourceUrl, sentiment, publishedAt, platform } = req.body;
    if (!title || !content || !source || !sourceUrl) { return res.status(400).json({ message: 'Please provide title, content, source, and sourceUrl' }); }
    try {
        const newPost = await Post.create({ alertId: alertId || null, title, content, source, sourceUrl, sentiment: sentiment || 'NEUTRAL', publishedAt: publishedAt || new Date(), platform: platform || null });
        findMatchesAndNotify(newPost);
        res.status(201).json({ message: 'Post created successfully. Notification process started.', post: newPost });
    } catch (error) {
        console.error("Error creating post:", error);
        if (error.name === 'SequelizeUniqueConstraintError') { return res.status(400).json({ message: 'A post with this URL already exists' }); }
        res.status(500).json({ message: 'Server error while creating post' });
    }
};