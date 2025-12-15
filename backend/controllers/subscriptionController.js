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
    let { status, adminNote } = req.body; // Dùng let để có thể sửa đổi status

    try {
        const request = await SubscriptionRequest.findByPk(id, { include: User });
        if (!request) return res.status(404).json({ message: 'Request not found' });

        if (request.status !== 'PENDING') {
            return res.status(400).json({ message: 'This request has already been processed.' });
        }

        // Frontend có thể gửi 'APPROVE' hoặc 'REJECT' (động từ), ta cần đổi thành tính từ
        if (status === 'APPROVE') status = 'APPROVED';
        if (status === 'REJECT') status = 'REJECTED';

        // Kiểm tra hợp lệ lần cuối
        if (!['APPROVED', 'REJECTED'].includes(status)) {
            return res.status(400).json({ message: `Invalid status value: ${status}. Must be APPROVED or REJECTED.` });
        }

        // 1. CẬP NHẬT TRẠNG THÁI YÊU CẦU TRONG DB
        request.status = status;
        request.adminNote = adminNote || null;
        await request.save(); // Bây giờ status đã chuẩn, save sẽ không lỗi nữa

        const user = request.User;

        // 2. CHUẨN BỊ NỘI DUNG GỬI (SOCKET & EMAIL)
        let finalMessage = adminNote;
        let emailSubject = '';
        let statusColor = '';

        if (status === 'APPROVED') {
            // LOGIC CỘNG 30 NGÀY KHI DUYỆT ĐƠN (CHÍNH XÁC GIỜ PHÚT)
            const now = new Date();
            const expiryDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

            user.subscriptionTier = request.plan;
            user.subscriptionExpiresAt = expiryDate;
            await user.save();

            if (!finalMessage) {
                finalMessage = `Congratulations! Your request to upgrade to ${request.plan} has been APPROVED. Your plan is active for 30 days.`;
            }
            emailSubject = '🎉 CrisisAlert - Subscription Approved';
            statusColor = '#10B981'; // Màu xanh lá

            // Gửi Socket
            if (req.io) {
                req.io.to(`user_${user.id}`).emit('subscription_updated', {
                    tier: request.plan,
                    message: finalMessage,
                    expiresAt: expiryDate
                });
            }

        } else if (status === 'REJECTED') {
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
                    
                    ${status === 'APPROVED' ? `
                    <p style="font-size: 14px; color: #333;">
                        <strong>New Expiration Date:</strong> ${user.subscriptionExpiresAt}
                    </p>` : ''}

                    <p style="font-size: 14px; color: #666;">
                        Thank you for choosing CrisisAlert.<br>
                    </p>
                </div>
            `;

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