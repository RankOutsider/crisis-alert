// backend/utils/emailService.js
const nodemailer = require('nodemailer');

// --- A. MAILHOG (Cho Local Dev) ---
const mailhogTransporter = nodemailer.createTransport({
    host: process.env.MAILHOG_HOST || 'mailhog',
    port: process.env.MAILHOG_PORT || 1025,
    secure: false,
});

// --- B. GMAIL (Cho Production - Backup) ---
const gmailTransporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    pool: true,
    maxConnections: 3,
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
    },
});

// --- C. BREVO (CHÍNH THỨC CHO PRODUCTION) ---
const brevoTransporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com', // Host chuẩn của Brevo
    port: 465,
    secure: true,
    auth: {
        user: process.env.BREVO_USER, // Email bạn dùng đăng nhập Brevo
        pass: process.env.BREVO_PASS, // Key SMTP bạn vừa tạo
    },
});

console.log("--- DEBUG EMAIL CONFIG ---");
console.log("Brevo User:", process.env.BREVO_USER ? "Đã nhận" : "MISSING!!");
console.log("Brevo Pass:", process.env.BREVO_PASS ? "Đã nhận" : "MISSING!!");

// 👉 CHỌN TRANSPORTER ĐANG DÙNG (Thay đổi biến này)
const ACTIVE_TRANSPORTER = brevoTransporter;
// Các lựa chọn: mailhogTransporter | gmailTransporter | brevoTransporter

// 👉 CHỌN EMAIL GỬI ĐI (SENDER ADDRESS)
// Lưu ý: Nếu dùng Resend gói Free chưa có domain, BẮT BUỘC dùng 'onboarding@resend.dev'
const ACTIVE_SENDER = 'andyhuynh1110@gmail.com';
// Nếu dùng Gmail: process.env.GMAIL_USER
// Nếu dùng Mailhog: process.env.MAILHOG_USER
// Nếu dùng Brevo: process.env.BREVO_USER

console.log(`📧 Email Service Active Sender: ${ACTIVE_SENDER}`);

const NO_REPLY_NOTICE_BLOCK = `
    <div style="background-color: #fff3cd; padding: 12px; border-radius: 5px; margin-bottom: 20px; border: 1px solid #ffeeba;">
        <p style="font-size: 13px; color: #856404; text-align: center; margin: 0;">
            <strong style="color: #d9534f;">IMPORTANT:</strong>
            This email is sent automatically.
            <strong style="color: #d9534f;">Do not reply</strong>
            to this mail.
        </p>
    </div>
`;

// Hàm gửi email thông báo đến Admin về yêu cầu kích hoạt lại tài khoản
const sendReactivationRequestNotification = async (username) => {
    try {
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@crisis-alert.com';

        const mailOptions = {
            from: ACTIVE_SENDER, // Sử dụng biến chung
            to: adminEmail,
            subject: `🔔 NEW ADMIN ACTION REQUIRED: Reactivation Request`,
            html: `
                ${NO_REPLY_NOTICE_BLOCK}
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <h2 style="color: #007bff;">Account Reactivation Request</h2>
                    <p>User <b>${username}</b> has submitted a request to reactivate their account.</p>
                </div>
            `,
        };

        // Sử dụng Transporter chung
        const info = await ACTIVE_TRANSPORTER.sendMail(mailOptions);
        console.log(`✅ Admin notification sent. ID: ${info.messageId}`);
        return info;

    } catch (error) {
        console.error('❌ Error sending admin notification:', error);
        return null;
    }
};

// Hàm gửi email kết quả xử lý yêu cầu kích hoạt lại cho người dùng
const sendReactivationResultEmail = async (toEmail, status, adminReason) => {
    const isApproved = status === 'Approved';
    const subject = isApproved ? '🎉 Account Reactivation Approved' : '🚫 Account Reactivation Rejected';
    const statusColor = isApproved ? '#28a745' : '#dc3545';

    try {
        const mailOptions = {
            from: ACTIVE_SENDER,
            to: toEmail,
            subject: subject,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    ${NO_REPLY_NOTICE_BLOCK}
                    <div style="text-align: center;">
                        <h1 style="color: ${statusColor}; font-size: 32px; margin-bottom: 10px;">${status}</h1>
                        <p style="color: #666; font-size: 16px;">Your account reactivation request has been processed.</p>
                    </div>
                    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; border-left: 5px solid ${statusColor}; margin-top: 20px;">
                        <p style="margin: 0; font-weight: bold; color: #333;">Admin Message:</p>
                        <p style="margin: 5px 0 0 0;">${adminReason || 'No specific reason provided.'}</p>
                    </div>
                </div>
            `,
        };

        const info = await ACTIVE_TRANSPORTER.sendMail(mailOptions);
        console.log(`✅ Reactivation result sent to ${toEmail}. ID: ${info.messageId}`);
        return info;

    } catch (error) {
        console.error('❌ Error sending result email:', error);
        return null;
    }
};

// Hàm gửi email thông báo khi có bài đăng mới khớp với alert
const sendNotificationEmail = async (userEmail, alertTitle, post, ccRecipients = '') => {
    try {
        const mailOptions = {
            from: ACTIVE_SENDER,
            to: userEmail,
            cc: ccRecipients,
            subject: `🚨 New Mention for Alert: "${alertTitle}"`,
            html: `
                ${NO_REPLY_NOTICE_BLOCK} 
                <h1>New Mention Detected!</h1>
                <p>A new post matching your alert "<b>${alertTitle}</b>" has been found.</p>
                <hr>
                <h3>Post Details:</h3>
                <p><b>Title:</b> ${post.title}</p>
                <p><b>Source:</b> ${post.source}</p>
                <p><b>Platform:</b> ${post.platform}</p>
                <blockquote>${post.content.substring(0, 200)}...</blockquote>
                <br>
                <a href="${post.sourceUrl}" style="background-color: #2563eb; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">View Full Post</a>
            `,
        };

        const info = await ACTIVE_TRANSPORTER.sendMail(mailOptions);
        console.log(`✅ Notification sent to ${userEmail}. ID: ${info.messageId}`);
        return info;

    } catch (error) {
        console.error('❌ Error sending notification email:', error);
        return null;
    }
};

// Hàm gửi email xác thực OTP
const sendVerificationEmail = async (toEmail, otp) => {
    try {
        const mailOptions = {
            from: ACTIVE_SENDER,
            to: toEmail,
            subject: 'OTP For Verifying Crisis Alert Account',
            html: ` 
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    ${NO_REPLY_NOTICE_BLOCK} 
                    <h1 style="color: #333;">Account Verification</h1>
                    <h2 style="color: #007bff; font-size: 32px; letter-spacing: 5px; text-align: center; margin: 20px 0;">${otp}</h2>
                    <p>This OTP will expire after 10 minutes.</p>
                    <p style="font-size: 14px; color: #777;">If you didn't send this request please ignore it because it looks like someone is trying to use your Email Address for registering out service.</p>
                </div>
            `,
        };

        const info = await ACTIVE_TRANSPORTER.sendMail(mailOptions);
        console.log('✅ Verification email sent:', info.messageId);
        return info;

    } catch (error) {
        console.error('❌ Error sending verification email:', error);
        // Không throw lỗi để tránh crash
    }
};

// Hàm gửi OTP reset mật khẩu
const sendPasswordResetEmail = async (toEmail, otp) => {
    try {
        const mailOptions = {
            from: ACTIVE_SENDER,
            to: toEmail,
            subject: 'Password Resetting Request',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    ${NO_REPLY_NOTICE_BLOCK} 
                    <h1 style="color: #333;">Password Reset OTP</h1>
                    <h2 style="color: #dc3545; font-size: 32px; letter-spacing: 5px; text-align: center; margin: 20px 0;">${otp}</h2>
                    <p>This OTP will expire after 10 minutes.</p>
                    <p style="font-size: 14px; color: #777;">If you didn't send this request please ignore it and change your password because it looks like someone is trying to gain access to your account.</p>
                </div>
            `,
        };

        const info = await ACTIVE_TRANSPORTER.sendMail(mailOptions);
        console.log('✅ Password reset email sent:', info.messageId);
        return info;

    } catch (error) {
        console.error('❌ Error sending password reset email:', error);
    }
};

// Hàm gửi email tùy chỉnh
const sendEmail = async ({ email, subject, message }) => {
    try {
        const mailOptions = {
            from: ACTIVE_SENDER,
            to: email,
            subject: subject,
            html: NO_REPLY_NOTICE_BLOCK + message,
        };

        const info = await ACTIVE_TRANSPORTER.sendMail(mailOptions);
        console.log(`✅ Generic Email sent to ${email}. ID: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error('❌ Error sending generic email:', error);
        return null;
    }
};

// Hàm gửi email thông báo hết hạn gói dịch vụ
const sendSubscriptionExpiredEmail = async (toEmail, username, oldPlan) => {
    try {
        const mailOptions = {
            from: ACTIVE_SENDER,
            to: toEmail,
            subject: '📉 Your Subscription has Expired',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    ${NO_REPLY_NOTICE_BLOCK}
                    <h2 style="color: #dc3545; text-align: center;">Subscription Expired</h2>
                    <p>Hello <b>${username}</b>,</p>
                    <p>This is a notification that your <b>${oldPlan}</b> subscription plan has expired.</p>
                    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; border-left: 4px solid #dc3545; margin: 20px 0;">
                        <p style="margin: 0;">Your account has been automatically reverted to the <b>Free Plan</b>.</p>
                    </div>
                    <div style="text-align: center; margin-top: 30px;">
                        <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/buy" 
                           style="background-color: #007bff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                           Renew Subscription Now
                        </a>
                    </div>
                </div>
            `,
        };

        const info = await ACTIVE_TRANSPORTER.sendMail(mailOptions);
        console.log(`✅ Expiration email sent to ${toEmail}. ID: ${info.messageId}`);
        return info;

    } catch (error) {
        console.error('❌ Error sending expiration email:', error);
        return null;
    }
};

module.exports = {
    sendNotificationEmail,
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendEmail,
    sendReactivationRequestNotification,
    sendReactivationResultEmail,
    sendSubscriptionExpiredEmail
};