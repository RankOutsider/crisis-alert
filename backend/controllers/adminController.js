// backend/controllers/adminController.js
const { Op } = require('sequelize');

const { User, Post, Alert, CaseStudy, ReactivationRequest } = require('../models/associations');

const sequelize = User.sequelize;

const { sendReactivationResultEmail } = require('../utils/emailService');

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
            attributes: [
                'id', 'username', 'email',
                'role', 'subscriptionTier',
                'subscriptionExpiresAt', 'createdAt',
                'is_active', 'is_active_admin'
            ],
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

// @desc    Toggle is_active_admin status of a user (Khóa/Mở khóa Admin)
// @route   PUT /api/admin/users/:id/admin-lock
const toggleUserAdminStatus = async (req, res) => {
    const { id } = req.params;
    const { is_active_admin: newAdminStatus } = req.body;

    if (typeof newAdminStatus !== 'boolean') {
        return res.status(400).json({ message: 'Missing or invalid is_active_admin status.' });
    }

    try {
        const user = await User.findByPk(id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Admin không được tự khóa tài khoản Admin của mình
        if (!newAdminStatus === false && req.user && req.user.id == user.id) {
            return res.status(400).json({ message: 'You cannot disable your own admin lock status.' });
        }

        // 1. Cập nhật is_active_admin
        user.is_active_admin = newAdminStatus;

        // 2. Logic cập nhật is_active theo Admin Status
        if (!newAdminStatus) {
            user.is_active = false;
        }

        await user.save();

        const message = newAdminStatus
            ? 'Admin lock removed. User can now activate their account.'
            : 'User has been locked by Admin (is_active_admin set to false and account deactivated).';

        // Gửi thông báo socket
        if (req.io) {
            req.io.to(`user_${user.id}`).emit('admin_lock_toggled', { message, is_active_admin: newAdminStatus, is_active: user.is_active });
        }

        res.status(200).json({
            message,
            user: { id: user.id, username: user.username, is_active: user.is_active, is_active_admin: user.is_active_admin }
        });

    } catch (error) {
        console.error("Error toggling admin status:", error);
        res.status(500).json({ message: 'Server Error while toggling admin status' });
    }
};

// @desc    Cập nhật thông tin user (Role, Plan, Active/Inactive, Expiration)
// @route   PUT /api/admin/users/:id
const updateUserByAdmin = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (typeof req.body.is_active_admin !== 'undefined') {
            return res.status(400).json({ message: 'Use the dedicated /admin-lock endpoint to change is_active_admin status.' });
        }

        // 1. CẬP NHẬT ROLE
        if (req.body.role) {
            user.role = req.body.role;
        }

        // 2. CẬP NHẬT GÓI DỊCH VỤ
        if (req.body.subscriptionTier) {
            user.subscriptionTier = req.body.subscriptionTier;
        }

        // 3. XỬ LÝ NGÀY HẾT HẠN (Logic thông minh hơn)
        if (req.body.subscriptionExpiresAt !== undefined) {
            const inputDate = req.body.subscriptionExpiresAt;

            if (user.subscriptionTier === 'Free') {
                user.subscriptionExpiresAt = null;
            }
            else if (inputDate) {
                // Nếu không phải Free và có nhập ngày -> Lưu ngày đó
                user.subscriptionExpiresAt = inputDate;
            }
            else {
                // Nếu không phải Free và KHÔNG nhập ngày -> Tự động +30 ngày (cho VIP/Pro)
                if (['VIP', 'Pro'].includes(user.subscriptionTier)) {
                    const now = new Date();
                    const expiryDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
                    user.subscriptionExpiresAt = expiryDate;
                } else {
                    // Fallback an toàn
                    user.subscriptionExpiresAt = null;
                }
            }
        }

        // 4. CẬP NHẬT TRẠNG THÁI ACTIVE/INACTIVE
        if (typeof req.body.is_active !== 'undefined') {
            if (req.user && req.user.id == user.id && req.body.is_active === false) {
                return res.status(400).json({ message: 'You cannot deactivate the current logged in account' });
            }
            // Nếu admin muốn kích hoạt lại tài khoản, nhưng is_active_admin đang là false
            if (req.body.is_active === true && user.is_active_admin === false) {
                return res.status(400).json({ message: 'Cannot set is_active to true while is_active_admin is false. Admin must lift the admin lock first.' });
            }
            user.is_active = req.body.is_active;
        }

        const updatedUser = await user.save();

        // Gửi thông báo Socket
        if (req.io) {
            console.log(`📡 Admin updated user_${user.id}. Sending socket signal...`);

            // Tạo thông báo tùy thuộc vào việc admin vừa sửa cái gì
            let message = 'The account information has been updated by an admin.';
            if (typeof req.body.is_active !== 'undefined') {
                message = req.body.is_active
                    ? 'Your account has been reactivated.'
                    : 'Your account has been deactivated. Please contact support for more information.';
            }

            req.io.to(`user_${user.id}`).emit('user_updated', {
                message: message,
                user: updatedUser // Gửi kèm user mới nhất để client tự cập nhật state
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

// @desc    Lấy danh sách yêu cầu kích hoạt lại đang chờ duyệt
// @route   GET /api/admin/reactivation-requests
const getReactivationRequests = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    try {
        const { count, rows } = await ReactivationRequest.findAndCountAll({
            where: {
                status: 'PENDING'
            },
            include: [
                {
                    model: User,
                    attributes: ['id', 'username', 'email', 'is_active', 'is_active_admin', 'createdAt']
                }
            ],
            limit: limit,
            offset: offset,
            order: [['createdAt', 'ASC']],
        });

        res.status(200).json({
            requests: rows,
            page,
            pages: Math.ceil(count / limit),
            totalRequests: count
        });

    } catch (error) {
        console.error("Error fetching reactivation requests:", error);
        res.status(500).json({ message: 'Server Error fetching requests' });
    }
};

// @desc    Phê duyệt yêu cầu kích hoạt lại tài khoản
// @route   PUT /api/admin/reactivation-requests/:requestId/approve
const approveReactivationRequest = async (req, res) => {
    const { requestId } = req.params;

    const { adminReason } = req.body;
    try {
        const request = await ReactivationRequest.findByPk(requestId, {
            include: [{ model: User }]
        });

        if (!request || request.status !== 'PENDING') {
            return res.status(404).json({ message: 'Reactivation request not found or already processed' });
        }

        const user = request.User;
        if (!user) {
            return res.status(404).json({ message: 'User associated with this request not found' });
        }

        // 1. Cập nhật trạng thái người dùng
        await sequelize.transaction(async (t) => {
            user.is_active = true;
            user.is_active_admin = true;

            await user.save({ transaction: t });

            // 2. Cập nhật trạng thái yêu cầu
            request.status = 'Approved';
            request.processedAt = new Date();

            request.adminReason = adminReason || 'Your account has been reactivated by admin.';

            await request.save({ transaction: t });
        });

        // 3. Gửi thông báo Socket
        const socketMessage = `Tài khoản của bạn (${user.email}) đã được kích hoạt lại thành công bởi Admin. Bạn có thể đăng nhập ngay bây giờ.`;

        if (req.io) {
            req.io.to(`user_${user.id}`).emit('account_reactivated', { message: socketMessage });
        }

        // 4. SỬ DỤNG EMAIL SERVICE

        try {
            await sendReactivationResultEmail(user.email, 'Approved', request.adminReason);
        } catch (emailError) {
            console.error(`🔴 Lỗi gửi email cho user ${user.email}:`, emailError);
        }

        res.status(200).json({ message: 'Request approved successfully. User reactivated.', user, request });
    } catch (error) {
        console.error("Error approving reactivation request:", error);
        res.status(500).json({ message: 'Server Error during approval' });
    }
};

// @desc    Từ chối yêu cầu kích hoạt lại tài khoản
// @route   PUT /api/admin/reactivation-requests/:requestId/reject
const rejectReactivationRequest = async (req, res) => {
    const { requestId } = req.params;

    let { adminReason } = req.body;

    if (!adminReason || !adminReason.trim()) {
        adminReason = 'Your request has been rejected by the administrator.';
    }

    try {
        const request = await ReactivationRequest.findByPk(requestId, {
            include: [{ model: User }]
        });

        if (!request || request.status !== 'PENDING') {
            return res.status(404).json({ message: 'Reactivation request not found or already processed' });
        }

        const user = request.User;

        if (!user) {
            return res.status(404).json({ message: 'User associated with this request not found' });
        }

        // 1. Cập nhật trạng thái yêu cầu
        request.status = 'Rejected';
        request.processedAt = new Date();
        request.adminReason = adminReason;
        await request.save();

        // 2. Gửi thông báo Socket 

        const socketMessage = `Yêu cầu kích hoạt lại tài khoản của bạn (${user.email}) đã bị từ chối. Lý do: ${adminReason}`;
        if (req.io) {
            req.io.to(`user_${user.id}`).emit('account_rejected', { message: socketMessage });
        }

        // 3. SỬ DỤNG EMAIL SERVICE
        try {
            await sendReactivationResultEmail(user.email, 'Rejected', adminReason);
        } catch (emailError) {
            console.error(`🔴 Lỗi gửi email cho user ${user.email}:`, emailError);
        }
        res.status(200).json({ message: 'Request rejected successfully.', request });
    } catch (error) {        console.error("Error rejecting reactivation request:", error);
        res.status(500).json({ message: 'Server Error during rejection' });
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
    toggleUserAdminStatus,
    getPosts, deletePost, deletePostsBulk,
    getAlerts, deleteAlert, deleteAlertsBulk,
    getCaseStudies, deleteCaseStudy, deleteCaseStudiesBulk,
    getReactivationRequests, approveReactivationRequest, rejectReactivationRequest
};