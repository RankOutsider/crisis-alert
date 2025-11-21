// backend/controllers/adminController.js
const { Op } = require('sequelize');
// Import User model (Đảm bảo đường dẫn đúng với cấu trúc folder của bạn)
const { User, Post, Alert, CaseStudy } = require('../models/associations');

// @desc    Lấy danh sách tất cả users (Admin only)
// @route   GET /api/admin/users
const getUsers = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    try {
        // Điều kiện tìm kiếm: Theo username HOẶC email
        const searchCondition = search ? {
            [Op.or]: [
                { username: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } }
            ]
        } : {};

        const { count, rows } = await User.findAndCountAll({
            where: searchCondition,
            // CHỈ lấy những cột cần thiết, KHÔNG lấy password
            attributes: ['id', 'username', 'email', 'role', 'subscriptionTier', 'createdAt', 'is_active'],
            limit: limit,
            offset: offset,
            order: [['createdAt', 'DESC']], // User mới nhất lên đầu
        });

        res.status(200).json({
            users: rows,
            page,
            pages: Math.ceil(count / limit),
            totalUsers: count
        });
    } catch (error) {
        console.error("Error getting users:", error);
        res.status(500).json({ message: 'Server Error fetching users' });
    }
};

// @desc    Cập nhật thông tin user (Role, Plan, Active/Inactive)
// @route   PUT /api/admin/users/:id
const updateUserByAdmin = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // 1. CẬP NHẬT ROLE (Giữ nguyên logic cũ của bạn)
        // Kiểm tra nếu có gửi role lên thì mới update
        if (req.body.role) {
            user.role = req.body.role;
        }

        // 2. CẬP NHẬT GÓI DỊCH VỤ (Giữ nguyên logic cũ của bạn)
        // Kiểm tra nếu có gửi subscriptionTier lên thì mới update
        if (req.body.subscriptionTier) {
            user.subscriptionTier = req.body.subscriptionTier;
        }

        // 3. CẬP NHẬT TRẠNG THÁI ACTIVE/INACTIVE (Phần mới thêm)
        // Lưu ý: Phải dùng typeof để kiểm tra giá trị false (0)
        if (typeof req.body.isActive !== 'undefined') {
            // Kiểm tra bảo mật: Không cho phép tự khóa chính mình
            if (req.user && req.user.id == user.id && req.body.isActive === false) {
                return res.status(400).json({ message: 'You cannot deactivate the current logged in account' });
            }
            user.is_active = req.body.isActive;
        }

        const updatedUser = await user.save();

        // Gửi thông báo Socket (Cập nhật lại message cho phù hợp ngữ cảnh)
        if (req.io) {
            console.log(`📡 Admin updated user_${user.id}. Sending socket signal...`);

            // Tạo thông báo tùy thuộc vào việc admin vừa sửa cái gì
            let message = 'The account information has been updated by an admin.';
            if (typeof req.body.isActive !== 'undefined') {
                message = req.body.isActive
                    ? 'Your account has been reactivated.'
                    : 'Your account has been deactivated. Please contact support for more information.';
            }

            req.io.to(`user_${user.id}`).emit('user_updated', {
                message: message,
                user: updatedUser // Gửi kèm user mới nhất để client tự cập nhật state nếu cần
            });
        }

        res.json(updatedUser);

    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ message: 'Server Error updating user' });
    }
};

// @desc    Xóa nhiều User cùng lúc
// @route   DELETE /api/admin/users/bulk
const deleteUsersBulk = async (req, res) => {
    try {
        const { ids } = req.body; // Nhận mảng ids từ frontend
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'No IDs provided' });
        }

        // Xóa những user có id nằm trong danh sách
        await User.destroy({
            where: {
                id: { [Op.in]: ids }
            }
        });

        res.status(200).json({ message: `${ids.length} users deleted successfully` });
    } catch (error) {
        console.error("Error bulk deleting users:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Lấy danh sách tất cả bài viết (Admin)
// @route   GET /api/admin/posts
const getPosts = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    try {
        // Tìm kiếm theo Title hoặc Content hoặc Source
        const searchCondition = search ? {
            [Op.or]: [
                { title: { [Op.like]: `%${search}%` } },
                { content: { [Op.like]: `%${search}%` } },
                { source: { [Op.like]: `%${search}%` } }
            ]
        } : {};

        const { count, rows } = await Post.findAndCountAll({
            where: searchCondition,
            limit: limit,
            offset: offset,
            order: [['publishedAt', 'DESC']], // Bài mới nhất lên đầu
        });

        res.status(200).json({
            posts: rows,
            page,
            pages: Math.ceil(count / limit),
            totalPosts: count
        });
    } catch (error) {
        console.error("Error getting posts:", error);
        res.status(500).json({ message: 'Server Error fetching posts' });
    }
};

// @desc    Xóa bài viết (Admin)
// @route   DELETE /api/admin/posts/:id
const deletePost = async (req, res) => {
    try {
        const post = await Post.findByPk(req.params.id);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        await post.destroy();
        res.status(200).json({ message: 'Post removed' });
    } catch (error) {
        console.error("Error deleting post:", error);
        res.status(500).json({ message: 'Server Error deleting post' });
    }
};

// @desc    Xóa nhiều Post cùng lúc
// @route   DELETE /api/admin/posts/bulk
const deletePostsBulk = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'No IDs provided' });
        }

        await Post.destroy({
            where: {
                id: { [Op.in]: ids }
            }
        });

        res.status(200).json({ message: `${ids.length} posts deleted successfully` });
    } catch (error) {
        console.error("Error bulk deleting posts:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Lấy danh sách tất cả Alerts (Admin)
// @route   GET /api/admin/alerts
const getAlerts = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    try {
        // Tìm kiếm theo Title hoặc Email người tạo
        const searchCondition = search ? {
            [Op.or]: [
                { title: { [Op.like]: `%${search}%` } },
                { '$User.email$': { [Op.like]: `%${search}%` } } // Tìm theo email chủ sở hữu
            ]
        } : {};

        const { count, rows } = await Alert.findAndCountAll({
            where: searchCondition,
            include: [
                {
                    model: User,
                    attributes: ['id', 'email', 'username'] // Lấy thông tin người tạo
                }
            ],
            limit: limit,
            offset: offset,
            order: [['createdAt', 'DESC']],
        });

        res.status(200).json({
            alerts: rows,
            page,
            pages: Math.ceil(count / limit),
            totalAlerts: count
        });
    } catch (error) {
        console.error("Error getting alerts:", error);
        res.status(500).json({ message: 'Server Error fetching alerts' });
    }
};

// @desc    Xóa 1 Alert
// @route   DELETE /api/admin/alerts/:id
const deleteAlert = async (req, res) => {
    try {
        const alert = await Alert.findByPk(req.params.id);
        if (!alert) {
            return res.status(404).json({ message: 'Alert not found' });
        }
        await alert.destroy();
        res.status(200).json({ message: 'Alert removed' });
    } catch (error) {
        console.error("Error deleting alert:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Xóa nhiều Alerts
// @route   DELETE /api/admin/alerts/bulk
const deleteAlertsBulk = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'No IDs provided' });
        }

        await Alert.destroy({
            where: { id: { [Op.in]: ids } }
        });

        res.status(200).json({ message: `${ids.length} alerts deleted successfully` });
    } catch (error) {
        console.error("Error bulk deleting alerts:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Lấy danh sách tất cả Case Studies (Admin)
// @route   GET /api/admin/casestudies
const getCaseStudies = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    try {
        const whereCondition = {};
        if (search) {
            whereCondition[Op.or] = [
                { title: { [Op.like]: `%${search}%` } },
                { summary: { [Op.like]: `%${search}%` } }
            ];
        }

        const { count, rows } = await CaseStudy.findAndCountAll({
            where: whereCondition,
            include: [
                {
                    model: User,
                    attributes: ['id', 'email', 'username'],
                    required: false
                }
            ],
            limit: limit,
            offset: offset,
            order: [['createdAt', 'DESC']],
            subQuery: false, // Fix lỗi SQL
            distinct: true
        });

        res.status(200).json({
            caseStudies: rows,
            page,
            pages: Math.ceil(count / limit),
            totalCaseStudies: count
        });
    } catch (error) {
        console.error("❌ Error fetching case studies:", error.message);
        res.status(500).json({ message: 'Server Error: ' + error.message });
    }
};

// @desc    Xóa 1 Case Study
// @route   DELETE /api/admin/casestudies/:id
const deleteCaseStudy = async (req, res) => {
    try {
        const cs = await CaseStudy.findByPk(req.params.id);
        if (!cs) return res.status(404).json({ message: 'Case Study not found' });
        await cs.destroy();
        res.status(200).json({ message: 'Case Study removed' });
    } catch (error) {
        console.error("Error deleting case study:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Xóa nhiều Case Study
// @route   DELETE /api/admin/casestudies/bulk
const deleteCaseStudiesBulk = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids)) return res.status(400).json({ message: 'Invalid IDs' });
        await CaseStudy.destroy({ where: { id: { [Op.in]: ids } } });
        res.status(200).json({ message: 'Case Studies deleted' });
    } catch (error) {
        console.error("Error bulk deleting case studies:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getUsers, updateUserByAdmin, deleteUsersBulk,
    getPosts, deletePost, deletePostsBulk,
    getAlerts, deleteAlert, deleteAlertsBulk,
    getCaseStudies, deleteCaseStudy, deleteCaseStudiesBulk
};