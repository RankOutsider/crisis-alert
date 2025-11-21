// backend/controllers/subscriptionController.js
const { User, SubscriptionRequest } = require('../models/associations');
const { sendEmail } = require('../utils/emailService');

// [USER] Gửi yêu cầu nâng cấp khi bấm nút "I have completed payment"
exports.createSubscriptionRequest = async (req, res) => {
    try {
        const { plan, amount } = req.body;
        const userId = req.user.id;

        // Kiểm tra xem có yêu cầu nào đang Pending không? (Tránh spam)
        const existingRequest = await SubscriptionRequest.findOne({
            where: { userId, status: 'PENDING' }
        });

        if (existingRequest) {
            return res.status(400).json({ message: 'You already have a pending request. Please wait for admin approval.' });
        }

        const newRequest = await SubscriptionRequest.create({
            userId,
            plan,
            amount,
            status: 'PENDING'
        });

        res.status(201).json({ message: 'Request submitted successfully', request: newRequest });
    } catch (error) {
        console.error("Error creating sub request:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// [ADMIN] Lấy danh sách yêu cầu
exports.getSubscriptionRequests = async (req, res) => {
    try {
        const requests = await SubscriptionRequest.findAll({
            include: [{ model: User, attributes: ['id', 'username', 'email', 'subscriptionTier'] }],
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(requests);
    } catch (error) {
        console.error("Error fetching requests:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// [ADMIN] Xử lý yêu cầu (Approve/Reject)
exports.handleSubscriptionRequest = async (req, res) => {
    const { id } = req.params;
    const { status, adminNote } = req.body; // Lấy thêm adminNote

    try {
        const request = await SubscriptionRequest.findByPk(id, { include: User });
        if (!request) return res.status(404).json({ message: 'Request not found' });

        if (request.status !== 'PENDING') {
            return res.status(400).json({ message: 'This request has already been processed.' });
        }

        // 1. CẬP NHẬT DB
        request.status = status;
        request.adminNote = adminNote || null; // Lưu ghi chú vào DB
        await request.save();

        const user = request.User;

        // 2. CHUẨN BỊ NỘI DUNG GỬI (SOCKET & EMAIL)
        let finalMessage = adminNote;
        let emailSubject = '';
        let statusColor = '';

        if (status === 'APPROVED') {
            // Logic Approve
            user.subscriptionTier = request.plan;
            await user.save();

            if (!finalMessage) {
                finalMessage = `Congratulations! Your request to upgrade to ${request.plan} has been APPROVED.`;
            }
            emailSubject = '🎉 CrisisAlert - Subscription Approved';
            statusColor = '#10B981'; // Màu xanh lá

            // Gửi Socket
            if (req.io) {
                req.io.to(`user_${user.id}`).emit('subscription_updated', {
                    tier: request.plan,
                    message: finalMessage
                });
            }

        } else if (status === 'REJECTED') {
            // Logic Reject
            if (!finalMessage) {
                finalMessage = `We are sorry, your request to upgrade to ${request.plan} was REJECTED. Please check your payment info.`;
            }
            emailSubject = '⚠️ CrisisAlert - Subscription Update';
            statusColor = '#EF4444'; // Màu đỏ

            // Gửi Socket
            if (req.io) {
                req.io.to(`user_${request.userId}`).emit('subscription_rejected', {
                    message: finalMessage
                });
            }
        } else {
            return res.status(400).json({ message: 'Invalid status' });
        }

        // 3. GỬI EMAIL THÔNG BÁO
        if (user.email) {
            const emailContent = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Hello ${user.username || 'User'},</h2>
                    <p style="font-size: 16px;">
                        Your subscription request status has been updated to: 
                        <strong style="color: ${statusColor};">${status}</strong>
                    </p>
                    
                    <div style="background-color: #f3f4f6; padding: 15px; border-left: 5px solid ${statusColor}; margin: 20px 0; border-radius: 4px;">
                        <strong style="display: block; margin-bottom: 5px; color: #555;">Message from Admin:</strong>
                        <span style="font-style: italic; color: #333;">"${finalMessage}"</span>
                    </div>
                    
                    <p style="font-size: 14px; color: #666;">
                        Thank you for choosing CrisisAlert.<br>
                        <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}" style="color: #2563eb; text-decoration: none;">Go to Dashboard</a>
                    </p>
                </div>
            `;

            // Gửi mail (không await để phản hồi nhanh cho Admin)
            sendEmail({
                email: user.email,
                subject: emailSubject,
                message: emailContent
            }).catch(err => console.error("Failed to send subscription email:", err));
        }

        res.json({ message: `Request ${status.toLowerCase()} successfully!` });

    } catch (error) {
        console.error("Error handling request:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// [ADMIN] Xoá yêu cầu (xoá những request đã Approved/Rejected)
exports.deleteSubscriptionRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const request = await SubscriptionRequest.findByPk(id);

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        // Logic an toàn: Không cho xóa đơn đang chờ (PENDING) để tránh lỡ tay
        if (request.status === 'PENDING') {
            return res.status(400).json({
                message: 'Cannot delete a PENDING request. Please process (Approve/Reject) it first.'
            });
        }

        await request.destroy();

        res.status(200).json({ message: 'Subscription request deleted successfully' });
    } catch (error) {
        console.error("Error deleting request:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};