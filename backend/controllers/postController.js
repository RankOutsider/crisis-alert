// backend/controllers/postController.js
const { Op } = require('sequelize');
const { Post, Alert, User, CaseStudy, sequelize } = require('../models/associations');
const { sendNotificationEmail } = require('../utils/emailService');

// @desc    Lấy tất cả posts thuộc về người dùng (có phân trang, tìm kiếm, LỌC)
exports.getAllUserPosts = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 5;
        const offset = (page - 1) * limit;

        // ===== THAY ĐỔI: Đọc query số nhiều (platforms, sentiments) =====
        const { search, fields, sentiments, platforms, alertId } = req.query;

        // --- XÂY DỰNG ĐIỀU KIỆN LỌC (whereCondition cho Post) ---
        const postWhereCondition = {};

        // 1. Lọc theo Sentiment (nếu có)
        if (sentiments) { // Đã đổi thành 'sentiments'
            const sentimentArray = sentiments.split(',').filter(Boolean); // Tách chuỗi thành mảng
            if (sentimentArray.length > 0) {
                // Dùng [Op.in] để khớp với bất kỳ sentiment nào trong mảng
                postWhereCondition.sentiment = { [Op.in]: sentimentArray };
            }
        }

        // 2. Lọc theo Platform (nếu có)
        if (platforms) { // Đã đổi thành 'platforms'
            const platformArray = platforms.split(',').filter(Boolean); // Tách chuỗi thành mảng
            if (platformArray.length > 0) {
                // Dùng [Op.in] để khớp với bất kỳ platform nào trong mảng
                postWhereCondition.platform = { [Op.in]: platformArray };
            }
        }
        // ===== KẾT THÚC THAY ĐỔI =====

        // 3. Xử lý tìm kiếm (search) với AND (&) và OR (|)
        if (search && fields) {
            const searchFields = fields.split(',').map(f => f.trim().toLowerCase());
            const validFields = ['title', 'content', 'source'];
            const activeFields = searchFields.filter(f => validFields.includes(f));

            if (activeFields.length > 0) {
                const orGroups = search.split('|').map(g => g.trim()).filter(Boolean);

                postWhereCondition[Op.or] = orGroups.map(group => {
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

        // --- XÂY DỰNG ĐIỀU KIỆN LỌC ALERT (cho phần include) ---
        const alertWhereCondition = { userId: userId };

        // 4. Lọc theo Alert cụ thể (nếu có) - Logic này giữ nguyên
        if (alertId) {
            const userOwnsAlert = await Alert.findOne({ where: { id: alertId, userId: userId } });
            if (!userOwnsAlert) {
                return res.status(403).json({ message: "You don't have permission to view posts for this alert." });
            }
            alertWhereCondition.id = alertId;
        } else {
            const userAlerts = await Alert.findAll({ where: { userId: userId }, attributes: ['id'], raw: true });
            const allUserAlertIds = userAlerts.map(alert => alert.id);
            if (allUserAlertIds.length === 0) {
                return res.status(200).json({ posts: [], totalPages: 0, currentPage: 1 });
            }
            alertWhereCondition.id = { [Op.in]: allUserAlertIds };
        }


        // --- THỰC HIỆN TRUY VẤN ---
        const findOptions = {
            where: postWhereCondition,
            include: [{
                model: Alert,
                where: alertWhereCondition,
                attributes: [],
                through: { attributes: [] }
            }],
            limit: limit,
            offset: offset,
            order: [['publishedAt', 'DESC']],
            distinct: true
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

// @desc    Lấy tất cả Posts liên quan đến một Alert cụ thể
exports.getPostsByAlert = async (req, res) => {
    try {
        const { alertId } = req.params;
        // ===== THAY ĐỔI: Đọc query số nhiều (platforms, sentiments) =====
        const { search, fields, platforms, sentiments } = req.query;

        const alert = await Alert.findOne({ where: { id: alertId, userId: req.user.id } });
        if (!alert) return res.status(404).json({ message: 'Alert not found or access denied' });

        // Sử dụng mảng andConditions để gộp tất cả điều kiện
        const andConditions = [];

        // 1. Điều kiện tìm kiếm (Search) với AND/OR
        if (search && fields) {
            const searchFields = fields.split(',').map(f => f.trim().toLowerCase());
            const validFields = ['title', 'content', 'source'];
            const activeFields = searchFields.filter(f => validFields.includes(f));

            if (activeFields.length > 0) {
                const orGroups = search.split('|').map(g => g.trim()).filter(Boolean);

                const orConditions = orGroups.map(group => {
                    const andTerms = group.split('&').map(t => t.trim().toLowerCase()).filter(Boolean);

                    return {
                        [Op.and]: andTerms.map(term => ({
                            [Op.or]: activeFields.map(field => ({
                                [field]: { [Op.like]: `%${term}%` }
                            }))
                        }))
                    };
                });

                if (orConditions.length > 0) {
                    andConditions.push({ [Op.or]: orConditions });
                }
            }
        }

        // 2. Điều kiện lọc Platform
        if (platforms) {
            const platformArray = platforms.split(',').filter(Boolean);
            if (platformArray.length > 0) {
                andConditions.push({ platform: { [Op.in]: platformArray } });
            }
        }

        // 3. Điều kiện lọc Sentiment
        if (sentiments) {
            const sentimentArray = sentiments.split(',').filter(Boolean);
            if (sentimentArray.length > 0) {
                andConditions.push({ sentiment: { [Op.in]: sentimentArray } });
            }
        }

        const findOptions = {
            order: [['publishedAt', 'DESC']],
            where: andConditions.length > 0 ? { [Op.and]: andConditions } : {}
        };
        // ===== KẾT THÚC THAY ĐỔI =====

        const posts = await alert.getPosts(findOptions);
        res.status(200).json({ posts, totalPages: 1, currentPage: 1 });
    } catch (error) {
        console.error(`Error fetching posts for alert ${req.params.alertId}:`, error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Lấy tất cả Posts liên quan đến một Case Study cụ thể
exports.getPostsByCaseStudy = async (req, res) => {
    try {
        const { caseStudyId } = req.params;
        const { search, fields, platforms, sentiments } = req.query;

        // KIỂM TRA QUYỀN TRUY CẬP CASE STUDY
        const caseStudy = await CaseStudy.findOne({ where: { id: caseStudyId, userId: req.user.id } });
        if (!caseStudy) {
            return res.status(404).json({ message: 'Case study not found or access denied' });
        }

        const caseStudyWithPosts = await CaseStudy.findByPk(caseStudyId, {
            include: {
                model: Post,
                attributes: ['id'],
                through: { attributes: [] }
            }
        });

        if (!caseStudyWithPosts || !caseStudyWithPosts.Posts) {
            return res.status(200).json({ posts: [] }); // Trả về mảng rỗng nếu không có post
        }

        const postIds = caseStudyWithPosts.Posts.map(p => p.id);
        if (postIds.length === 0) {
            return res.status(200).json({ posts: [] }); // Trả về mảng rỗng nếu không có post ID
        }

        const whereCondition = { id: { [Op.in]: postIds } };

        if (search && fields) {
            const searchFields = fields.split(',').map(f => f.trim().toLowerCase());
            const validSearchFields = ['title', 'content', 'source', 'sentiment', 'platform'];
            const activeFields = searchFields.filter(f => validSearchFields.includes(f));

            if (activeFields.length > 0) {
                const orGroups = search.split('|').map(g => g.trim()).filter(Boolean);

                whereCondition[Op.or] = orGroups.map(group => {
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

        if (platforms) {
            const platformArray = platforms.split(',').filter(Boolean);
            if (platformArray.length > 0) {
                whereCondition.platform = { [Op.in]: platformArray };
            }
        }

        if (sentiments) {
            const sentimentArray = sentiments.split(',').filter(Boolean);
            if (sentimentArray.length > 0) {
                whereCondition.sentiment = { [Op.in]: sentimentArray };
            }
        }

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

// @desc    Hàm nội bộ: Quét tìm các alert khớp khi một post mới được tạo
const findMatchesAndNotify = async (newPost) => {
    try {
        const postContent = `${newPost.title} ${newPost.content}`.toLowerCase();
        // Chỉ lấy các alert đang ACTIVE
        const activeAlerts = await Alert.findAll({
            where: { status: 'ACTIVE' },
            include: [{ model: User, attributes: ['id', 'email', 'notificationsEnabled'] }] // Lấy kèm thông tin user
        });

        const matchingAlerts = activeAlerts.filter(alert => {
            // Kiểm tra null/undefined cho keywords và platforms
            const keywords = alert.keywords || [];
            const platforms = alert.platforms || [];
            const keywordMatch = keywords.some(keyword => postContent.includes(keyword.toLowerCase()));
            const platformMatch = platforms.includes(newPost.platform);
            return keywordMatch && platformMatch;
        });

        if (matchingAlerts.length > 0) {
            // Lấy ID của các alert khớp
            const matchingAlertIds = matchingAlerts.map(alert => alert.id);
            // Dùng `addAlerts` với mảng ID
            await newPost.addAlerts(matchingAlertIds);

            // Cập nhật postCount và gửi email (chỉ cho các user có bật thông báo)
            for (const alert of matchingAlerts) {
                // Cập nhật postCount hiệu quả hơn
                await alert.increment('postCount');

                const user = alert.User; // Lấy user từ include
                if (user && user.email && user.notificationsEnabled) {
                    console.log(`✅ Match found! Sending email to ${user.email} for alert "${alert.title}"`);
                    // Không await để gửi email chạy ngầm
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

// @desc Tạo post mới (CÓ AUTO-LINKING)
exports.createPost = async (req, res) => {
    // Không cần alertId trong body nữa
    const { title, content, source, sourceUrl, sentiment, publishedAt, platform } = req.body;

    // Validate required fields
    if (!title || !content || !source || !sourceUrl || !platform) {
        return res.status(400).json({ message: 'Please provide title, content, source, sourceUrl, and platform' });
    }

    try {
        // Tạo post mới
        const newPost = await Post.create({
            title,
            content,
            source,
            sourceUrl, // Đảm bảo URL là duy nhất nếu cần (unique constraint trong model)
            sentiment: sentiment || 'NEUTRAL',
            publishedAt: publishedAt || new Date(),
            platform: platform
        });

        // Gọi hàm auto-linking (chạy ngầm, không cần await)
        findMatchesAndNotify(newPost);

        // Trả về thành công ngay lập tức
        res.status(201).json({ message: 'Post created successfully. Matching & notification process started.', post: newPost });

    } catch (error) {
        console.error("Error creating post:", error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ message: 'A post with this Source URL already exists' });
        }
        res.status(500).json({ message: 'Server error while creating post' });
    }
};

// @desc Cập nhật Post (Đã tối ưu)
exports.updatePost = async (req, res) => {
    const { title, content, sentiment } = req.body;
    const postId = req.params.id;
    const userId = req.user.id;
    try {
        // Kiểm tra xem post có tồn tại và thuộc về user không (thông qua alert)
        const post = await Post.findByPk(postId, {
            include: [{
                model: Alert,
                attributes: ['userId'], // Chỉ cần userId
                required: true // Đảm bảo post phải thuộc về một alert
            }]
        });

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Kiểm tra quyền sở hữu gián tiếp qua Alert
        const alertUserIds = post.Alerts.map(a => a.userId);
        if (!alertUserIds.includes(userId)) {
            return res.status(403).json({ message: 'Not authorized to update this post' });
        }


        // Cập nhật post
        const [affectedRows] = await Post.update({ title, content, sentiment }, {
            where: { id: postId }
        });

        if (affectedRows === 0) {
            // Trường hợp hiếm gặp: post bị xóa giữa lúc kiểm tra và cập nhật
            return res.status(404).json({ message: 'Post not found or already deleted' });
        }


        // Lấy lại post đã cập nhật để trả về (tùy chọn)
        const updatedPost = await Post.findByPk(postId);
        res.status(200).json({ message: 'Post updated successfully', post: updatedPost });

    } catch (error) {
        console.error("Error updating post:", error);
        res.status(500).json({ message: 'Server error while updating post' });
    }
};

// @desc Xóa Post (Đã tối ưu)
exports.deletePost = async (req, res) => {
    const postId = req.params.id;
    const userId = req.user.id;
    try {
        // Kiểm tra xem post có tồn tại và thuộc về user không (thông qua alert)
        const post = await Post.findByPk(postId, {
            include: [{
                model: Alert,
                attributes: ['id', 'userId'], // Cần ID để decrement
                required: true // Đảm bảo post phải thuộc về một alert
            }]
        });

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Kiểm tra quyền sở hữu gián tiếp qua Alert
        const userOwnedAlerts = post.Alerts.filter(a => a.userId === userId);
        if (userOwnedAlerts.length === 0) {
            return res.status(403).json({ message: 'Not authorized to delete this post' });
        }

        // Giảm postCount cho các alert liên quan (thuộc sở hữu của user)
        const ownedAlertIds = userOwnedAlerts.map(a => a.id);
        if (ownedAlertIds.length > 0) {
            await Alert.decrement('postCount', { where: { id: { [Op.in]: ownedAlertIds } } });
        }

        // Xóa post (sẽ tự động xóa liên kết trong postalerts nhờ onDelete: CASCADE)
        await Post.destroy({ where: { id: postId } });

        res.status(200).json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error("Error deleting post:", error);
        res.status(500).json({ message: 'Server error while deleting post' });
    }
};