// backend/utils/emailService.js
const nodemailer = require('nodemailer');

// 1. CẤU HÌNH MAILHOG (Local)

const mailhogTransporter = nodemailer.createTransport({
    host: process.env.MAILHOG_HOST || 'mailhog',
    port: process.env.MAILHOG_PORT || 1025,
    secure: false,
});

// 2. CẤU HÌNH GMAIL (Production / Render)

const gmailTransporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
    },
    pool: true,
    maxConnections: 1,
    rateLimit: 5,
    // logger: true, // Tắt bớt log cho đỡ rối console trừ khi cần debug
    // debug: true,
});

// A. CHỌN TRANSPORTER
const ACTIVE_TRANSPORTER = gmailTransporter; // Hoặc logic check process.env.NODE_ENV

// B. NGƯỜI GỬI
const ACTIVE_SENDER = process.env.GMAIL_USER;
// process.env.MAILHOG_USER || process.env.GMAIL_USER;

// C. CLIENT URL
const CLIENT_URL = process.env.CLIENT_URL;

console.log('====================================================');
console.log(`📧 EMAIL SERVICE INIT`);
console.log(`🔗 Client URL: ${CLIENT_URL}`);
console.log('====================================================');

// 🎨 TEMPLATE ENGINE (HTML DESIGN)

/**
 * Hàm tạo khung HTML chung cho tất cả email
 * @param {string} title - Tiêu đề chính của email
 * @param {string} content - Nội dung HTML bên trong
 * @param {string} [callToAction] - (Optional) Nút bấm { text, url, color }
 */
const getEmailTemplate = (title, content, callToAction = null) => {
    // Màu sắc chủ đạo
    const colorPrimary = '#0f172a'; // Xanh đen đậm (Header)
    const colorAccent = '#3b82f6';  // Xanh dương (Link/Button)
    const colorDanger = '#ef4444';  // Đỏ (Alert)
    const bgBody = '#f1f5f9';       // Xám rất nhạt (Nền)

    // Nút bấm (nếu có)
    let buttonHtml = '';
    if (callToAction) {
        const btnColor = callToAction.color === 'red' ? colorDanger : colorAccent;
        buttonHtml = `
            <div style="text-align: center; margin: 30px 0;">
                <a href="${callToAction.url}" style="background-color: ${btnColor}; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    ${callToAction.text}
                </a>
            </div>
        `;
    }

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: ${bgBody}; color: #334155; }
            .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }
            .header { background-color: ${colorPrimary}; padding: 30px; text-align: center; }
            .header h1 { color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px; text-transform: uppercase; }
            .content { padding: 40px 30px; line-height: 1.6; font-size: 16px; }
            .footer { background-color: #e2e8f0; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
            .alert-box { background-color: #fff3cd; border-left: 5px solid #fbbf24; padding: 15px; margin-bottom: 20px; color: #854d0e; font-size: 14px; }
            .highlight { font-weight: bold; color: ${colorPrimary}; }
        </style>
    </head>
    <body>
        <div class="container" style="max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); font-family: Arial, sans-serif;">
            
            <div class="header" style="background-color: ${colorPrimary}; padding: 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px;">CRISIS ALERT SYSTEM</h1>
            </div>

            <div class="content" style="padding: 40px 30px; line-height: 1.6; color: #334155;">
                <h2 style="color: ${colorPrimary}; margin-top: 0; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px;">${title}</h2>
                
                ${content}

                ${buttonHtml}

                <div style="margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
                    <p style="font-size: 13px; color: #94a3b8; font-style: italic;">
                        * This is an automated message. Please do not reply directly to this email.
                    </p>
                </div>
            </div>

            <div class="footer" style="background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
                <p>&copy; ${new Date().getFullYear()} Crisis Alert Team. All rights reserved.</p>
                <p>Need help? <a href="${CLIENT_URL}/contact" style="color: ${colorAccent};">Contact Support</a></p>
            </div>
        </div>
    </body>
    </html>
    `;
};

// --- CÁC HÀM GỬI EMAIL ---

// 1. Admin Notification
const sendReactivationRequestNotification = async (username, userEmail) => {
    const adminEmail = process.env.ADMIN_EMAIL || ACTIVE_SENDER;
    try {
        const html = getEmailTemplate(
            '🔔 Reactivation Request',
            `<p>User <strong style="font-size: 18px; color: #0f172a;">${username}</strong> has requested to reactivate their account.</p>
            <p><strong>Email:</strong> <a href="mailto:${userEmail}" style="color: #3b82f6;">${userEmail}</a></p>
            <p>Please review their profile and approve/reject the request in the Admin Dashboard.</p>`,
            { text: 'Go to Admin Dashboard', url: `${CLIENT_URL}/admin/reactivations`, color: 'blue' }
        );

        return await ACTIVE_TRANSPORTER.sendMail({
            from: ACTIVE_SENDER,
            to: adminEmail,
            subject: `🔔 [Admin] Unlock Request: ${username}`,
            html: html
        });
    } catch (e) {
        console.error("❌ Error sending admin notification:", e);
    }
};

// 2. Reactivation Result
const sendReactivationResultEmail = async (toEmail, status, adminReason) => {
    const isApproved = status === 'Approved';
    const color = isApproved ? 'green' : 'red';
    const icon = isApproved ? '🎉' : '🚫';

    try {
        const html = getEmailTemplate(
            `${icon} Account Status Update`,
            `<p>Your account reactivation request has been <strong style="color: ${isApproved ? '#16a34a' : '#dc2626'}; text-transform: uppercase;">${status}</strong>.</p>
             <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; border: 1px solid #e2e8f0; margin: 20px 0;">
                <strong>Admin Message:</strong><br/>
                <em style="color: #475569;">"${adminReason}"</em>
             </div>`,
            isApproved ? { text: 'Login Now', url: `${CLIENT_URL}/login`, color: 'blue' } : null
        );

        return await ACTIVE_TRANSPORTER.sendMail({
            from: ACTIVE_SENDER,
            to: toEmail,
            subject: `${icon} Account Reactivation ${status}`,
            html: html
        });
    } catch (e) { console.error(e); }
};

// 3. New Alert Notification (Nổi bật nhất)
const sendNotificationEmail = async (userEmail, alertTitle, post, ccRecipients = '') => {
    try {
        const html = getEmailTemplate(
            `🚨 New Alert: "${alertTitle}"`,
            `<p>We found a new mention matching your alert criteria.</p>
             <div style="background-color: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <h3 style="margin-top: 0; color: #1e293b;">${post.title}</h3>
                <p style="color: #475569; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
                    ${post.summary || 'Click the button below to read the full content...'}
                </p>
             </div>`,
            { text: 'View Full Source', url: post.sourceUrl, color: 'blue' }
        );

        return await ACTIVE_TRANSPORTER.sendMail({
            from: ACTIVE_SENDER,
            to: userEmail,
            cc: ccRecipients,
            subject: `🚨 Alert Match: "${alertTitle}"`,
            html: html
        });
    } catch (e) { console.error(e); }
};

// 4. OTP Verification
const sendVerificationEmail = async (toEmail, otp) => {
    try {
        const html = getEmailTemplate(
            'Verify Your Account',
            `<p>Thank you for registering with Crisis Alert. Please use the verification code below to complete your sign-up.</p>
             <div style="text-align: center; margin: 30px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #2563eb; background: #eff6ff; padding: 15px 30px; border-radius: 8px; border: 1px dashed #2563eb;">
                    ${otp}
                </span>
             </div>
             <p>This code will expire in 10 minutes.</p>`
        );

        return await ACTIVE_TRANSPORTER.sendMail({
            from: ACTIVE_SENDER,
            to: toEmail,
            subject: '🔐 Your Verification Code',
            html: html
        });
    } catch (e) { console.error(e); }
};

// 5. Password Reset
const sendPasswordResetEmail = async (toEmail, otp) => {
    try {
        const html = getEmailTemplate(
            'Reset Your Password',
            `<p>We received a request to reset your password. Use the code below to proceed.</p>
             <div style="text-align: center; margin: 30px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #dc2626; background: #fef2f2; padding: 15px 30px; border-radius: 8px; border: 1px dashed #dc2626;">
                    ${otp}
                </span>
             </div>
             <p>If you didn't request this, you can safely ignore this email.</p>`
        );

        return await ACTIVE_TRANSPORTER.sendMail({
            from: ACTIVE_SENDER,
            to: toEmail,
            subject: '🔑 Password Reset Request',
            html: html
        });
    } catch (e) { console.error(e); }
};

// 6. Generic Email
const sendEmail = async ({ email, subject, message }) => {
    try {
        const html = getEmailTemplate(subject, message);
        return await ACTIVE_TRANSPORTER.sendMail({
            from: ACTIVE_SENDER,
            to: email,
            subject: subject,
            html: html,
        });
    } catch (e) { console.error(e); }
};

// 7. Subscription Expired
const sendSubscriptionExpiredEmail = async (toEmail, username, oldPlan) => {
    console.log(`⏳ Sending Expired Email to ${toEmail}`);
    try {
        const html = getEmailTemplate(
            'Subscription Expired',
            `<div class="alert-box">
                <strong>Attention:</strong> Your service has been paused.
             </div>
             <p>Hello <b>${username}</b>,</p>
             <p>Your <b>${oldPlan}</b> plan has expired today. To continue receiving critical alerts and using advanced features, please renew your subscription.</p>`,
            { text: 'Renew Subscription Now', url: `${CLIENT_URL}/pricing`, color: 'red' }
        );

        return await ACTIVE_TRANSPORTER.sendMail({
            from: ACTIVE_SENDER,
            to: toEmail,
            subject: '📉 Action Required: Subscription Expired',
            html: html
        });
    } catch (error) {
        console.error('❌ Error sending expiration email:', error.message);
        return null;
    }
};

// 8. Subscription Upgrade Request Notification to Admins
const sendUpgradeRequestNotification = async (recipients, userRequesting, planName) => {
    // recipients là mảng các email admin active
    if (!recipients || recipients.length === 0) {
        console.warn("⚠️ No active admins found to send notification.");
        return;
    }

    // Chuyển mảng thành chuỗi cách nhau bởi dấu phẩy (NodeMailer hiểu định dạng này)
    const toAddress = recipients.join(', ');

    console.log(`📧 Sending Upgrade Notification to admins: ${toAddress}`);

    try {
        const html = getEmailTemplate(
            '💰 New Upgrade Request',
            `<p>A user has requested to upgrade their subscription plan.</p>
             <div style="background-color: #f0f9ff; padding: 15px; border-radius: 8px; border: 1px solid #bae6fd; margin: 20px 0;">
                <p><strong>User:</strong> ${userRequesting.username} (${userRequesting.email})</p>
                <p><strong>Requested Plan:</strong> <span style="color: #0284c7; font-weight: bold;">${planName}</span></p>
                <p><strong>Status:</strong> Pending Review</p>
             </div>
             <p>Please check the payment proof and approve/reject the request.</p>`,
            { text: 'Process Request', url: `${CLIENT_URL}/admin/subscriptions`, color: 'green' }
        );

        return await ACTIVE_TRANSPORTER.sendMail({
            from: ACTIVE_SENDER,
            to: toAddress, // Gửi một lúc cho tất cả Admin active
            subject: `💰 [Admin] Upgrade Request: ${userRequesting.username}`,
            html: html
        });
    } catch (e) {
        console.error("❌ Error sending upgrade notification:", e);
    }
};

module.exports = {
    sendNotificationEmail,
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendEmail,
    sendReactivationRequestNotification,
    sendReactivationResultEmail,
    sendSubscriptionExpiredEmail,
    sendUpgradeRequestNotification
};