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
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
    },
    pool: true,
    maxConnections: 1,
    rateLimit: 5,
});

// A. CHỌN TRANSPORTER
const ACTIVE_TRANSPORTER = gmailTransporter;

// B. NGƯỜI GỬI
const ACTIVE_SENDER = process.env.GMAIL_USER;
// process.env.MAILHOG_USER || process.env.GMAIL_USER;

// C. CLIENT URL (QUAN TRỌNG NHẤT)
const CLIENT_URL = process.env.CLIENT_URL || 'https://crisis-alert-rankoutsiders-projects.vercel.app';

// ============================================================

console.log('====================================================');
console.log(`📧 EMAIL SERVICE INIT`);
console.log(`🔗 Client URL đang dùng: ${CLIENT_URL}`); // <-- Nhìn log này để biết nó nhận đúng chưa
console.log('====================================================');

// --- CÁC HÀM GỬI EMAIL ---

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

// 1. Admin Notification
const sendReactivationRequestNotification = async (username) => {
    const adminEmail = process.env.ADMIN_EMAIL || ACTIVE_SENDER;
    try {
        const mailOptions = {
            from: ACTIVE_SENDER,
            to: adminEmail,
            subject: `🔔 NEW ADMIN ACTION: Reactivation Request`,
            html: `${NO_REPLY_NOTICE_BLOCK} <p>User <b>${username}</b> has requested reactivation.</p>`
        };
        return await ACTIVE_TRANSPORTER.sendMail(mailOptions);
    } catch (e) { console.error(e); }
};

// 2. Reactivation Result
const sendReactivationResultEmail = async (toEmail, status, adminReason) => {
    const isApproved = status === 'Approved';
    try {
        const mailOptions = {
            from: ACTIVE_SENDER,
            to: toEmail,
            subject: isApproved ? '🎉 Account Reactivation Approved' : '🚫 Account Reactivation Rejected',
            html: `${NO_REPLY_NOTICE_BLOCK} <h1>${status}</h1> <p>${adminReason}</p>`
        };
        return await ACTIVE_TRANSPORTER.sendMail(mailOptions);
    } catch (e) { console.error(e); }
};

// 3. New Alert Notification
const sendNotificationEmail = async (userEmail, alertTitle, post, ccRecipients = '') => {
    try {
        const mailOptions = {
            from: ACTIVE_SENDER,
            to: userEmail,
            cc: ccRecipients,
            subject: `🚨 New Mention for Alert: "${alertTitle}"`,
            html: `
                ${NO_REPLY_NOTICE_BLOCK} 
                <h3>New Mention: ${alertTitle}</h3>
                <p>${post.title}</p>
                <a href="${post.sourceUrl}" style="background-color: #2563eb; color: white; padding: 10px;">View Post</a>
            `
        };
        return await ACTIVE_TRANSPORTER.sendMail(mailOptions);
    } catch (e) { console.error(e); }
};

// 4. OTP Verification
const sendVerificationEmail = async (toEmail, otp) => {
    try {
        const mailOptions = {
            from: ACTIVE_SENDER,
            to: toEmail,
            subject: 'Account Verification',
            html: `${NO_REPLY_NOTICE_BLOCK} <h1>OTP: ${otp}</h1>`
        };
        return await ACTIVE_TRANSPORTER.sendMail(mailOptions);
    } catch (e) { console.error(e); }
};

// 5. Password Reset
const sendPasswordResetEmail = async (toEmail, otp) => {
    try {
        const mailOptions = {
            from: ACTIVE_SENDER,
            to: toEmail,
            subject: 'Password Reset',
            html: `${NO_REPLY_NOTICE_BLOCK} <h1>OTP: ${otp}</h1>`
        };
        return await ACTIVE_TRANSPORTER.sendMail(mailOptions);
    } catch (e) { console.error(e); }
};

// 6. Generic Email
const sendEmail = async ({ email, subject, message }) => {
    try {
        return await ACTIVE_TRANSPORTER.sendMail({
            from: ACTIVE_SENDER,
            to: email,
            subject: subject,
            html: NO_REPLY_NOTICE_BLOCK + message,
        });
    } catch (e) { console.error(e); }
};

// 7. Subscription Expired (QUAN TRỌNG: Dùng CLIENT_URL)
const sendSubscriptionExpiredEmail = async (toEmail, username, oldPlan) => {
    console.log(`⏳ Sending Expired Email to ${toEmail} with link: ${CLIENT_URL}`);
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
                    <p>Your <b>${oldPlan}</b> plan has expired.</p>
                    
                    <div style="text-align: center; margin-top: 30px;">
                        <a href="${CLIENT_URL}/buy" 
                           style="background-color: #007bff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                           Renew Subscription Now
                        </a>
                    </div>
                </div>
            `,
        };
        return await ACTIVE_TRANSPORTER.sendMail(mailOptions);
    } catch (error) {
        console.error('❌ Error sending expiration email:', error.message);
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