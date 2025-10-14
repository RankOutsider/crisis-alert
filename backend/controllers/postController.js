// backend/controllers/postController.js
const { Op } = require('sequelize');
const Post = require('../models/Post');
const Alert = require('../models/Alert');
const User = require('../models/User');
const { sendNotificationEmail } = require('../utils/emailService');

// @desc    Lấy tất cả posts từ tất cả alerts của người dùng (CÓ PHÂN TRANG)
// @route   GET /api/posts/all
// @access  Private
exports.getAllUserPosts = async (req, res) => {
    try {
        const userId = req.user.id;

        // Lấy tham số page và limit từ query string
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10; // Mặc định 10 post mỗi trang
        const offset = (page - 1) * limit;

        // 1. Tìm tất cả các alert ID thuộc về người dùng này
        const userAlerts = await Alert.findAll({
            where: { userId: userId },
            attributes: ['id']
        });

        const alertIds = userAlerts.map(alert => alert.id);

        if (alertIds.length === 0) {
            return res.status(200).json({ posts: [], totalPages: 0, currentPage: 1 });
        }

        // 2. Tìm và đếm tất cả các post có alertId nằm trong danh sách
        const { count, rows } = await Post.findAndCountAll({
            where: {
                alertId: {
                    [Op.in]: alertIds
                }
            },
            order: [['publishedAt', 'DESC']],
            limit: limit,
            offset: offset,
            include: {
                model: Alert,
                attributes: ['id', 'title']
            }
        });

        // 3. Trả về dữ liệu đã phân trang
        res.status(200).json({
            posts: rows,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });

    } catch (error) {
        console.error("Error fetching all user posts:", error);
        res.status(500).json({ message: 'Server error while fetching posts' });
    }
};


// ... (toàn bộ các hàm createPost, findMatchesAndNotify, getPostsByAlert, updatePost, deletePost của bạn giữ nguyên)
// @desc    Tạo Post mới và gửi thông báo nếu cần
// @route   POST /api/posts
// @access  Private
exports.createPost = async (req, res) => {
    const { alertId, title, content, source, sourceUrl, sentiment, publishedAt, platform } = req.body;

    if (!title || !content || !source || !sourceUrl) {
        return res.status(400).json({ message: 'Please provide title, content, source, and sourceUrl' });
    }

    try {
        const newPost = await Post.create({
            alertId: alertId || null,
            title, content, source, sourceUrl,
            sentiment: sentiment || 'NEUTRAL',
            publishedAt: publishedAt || new Date(),
            platform: platform || null
        });

        findMatchesAndNotify(newPost);

        res.status(201).json({
            message: 'Post created successfully. Notification process started.',
            post: newPost
        });

    } catch (error) {
        console.error("Error creating post:", error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ message: 'A post with this URL already exists' });
        }
        res.status(500).json({ message: 'Server error while creating post' });
    }
};

const findMatchesAndNotify = async (newPost) => {
    try {
        const postContent = `${newPost.title} ${newPost.content}`.toLowerCase();

        const activeAlerts = await Alert.findAll({ where: { status: 'ACTIVE' } });

        console.log(`Scanning ${activeAlerts.length} active alerts for matches...`);

        for (const alert of activeAlerts) {
            const hasMatch = alert.keywords.some(keyword =>
                postContent.includes(keyword.toLowerCase())
            );

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

exports.getPostsByAlert = async (req, res) => {
    try {
        const { alertId } = req.params;
        const alertExists = await Alert.findByPk(alertId);
        if (!alertExists) {
            return res.status(404).json({ message: 'Alert not found' });
        }
        const posts = await Post.findAll({
            where: { alertId: alertId },
            order: [['publishedAt', 'DESC']]
        });
        res.status(200).json(posts);
    } catch (error) {
        console.error("Error fetching posts:", error);
        res.status(500).json({ message: 'Server error while fetching posts' });
    }
};

exports.updatePost = async (req, res) => {
    const { title, content, sentiment } = req.body;
    const postId = req.params.id;
    const userId = req.user.id;
    try {
        const post = await Post.findByPk(postId, { include: Alert });
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        if (post.Alert.userId !== userId) {
            return res.status(403).json({ message: 'Not authorized to update this post' });
        }
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
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        if (post.Alert.userId !== userId) {
            return res.status(403).json({ message: 'Not authorized to delete this post' });
        }
        if (post.Alert) {
            await post.Alert.decrement('postCount');
        }
        await Post.destroy({ where: { id: postId } });
        res.status(200).json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error("Error deleting post:", error);
        res.status(500).json({ message: 'Server error while deleting post' });
    }
};