// backend/utils/emailService.js
const nodemailer = require('nodemailer');

// ----- 1. CẤU HÌNH CHO MAILHOG (Gửi thông báo) -----
const mailhogTransporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'mailhog',
    port: process.env.EMAIL_PORT || 1025,
    secure: false,
});

// ----- 2. CẤU HÌNH CHO GMAIL (Gửi OTP) -----
const gmailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
    },
})

// Dòng nhắc nhở tiêu chuẩn, đặt trong một block riêng để dễ định vị
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

/**
 * @desc Gửi email thông báo đến Admin về yêu cầu kích hoạt lại tài khoản mới
 * @param {string} username - Username của người dùng
 */
const sendReactivationRequestNotification = async (username) => {
    try {
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@crisis-alert.com'; // Đảm bảo bạn có ADMIN_EMAIL trong .env

        const mailOptions = {
            // from: `"Crisis Alert Admin Bot" <${process.env.GMAIL_USER}>`, // Gmail sender

            from: `"Crisis Alert Admin Bot" <${process.env.EMAIL_USER || 'bot@crisis-alert.com'}>`, // MailHog sender

            to: adminEmail,
            subject: `🔔 NEW ADMIN ACTION REQUIRED: Reactivation Request`,
            html: `
                ${NO_REPLY_NOTICE_BLOCK}
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">

                    <h2 style="color: #007bff;">Account Reactivation Request</h2>

                    <p>A user requires administrative action:</p>

                    <hr style="border: none; border-top: 1px solid #eee;">

                    <p style="font-size: 16px;">User <b>${username}</b> has submitted a request to reactivate their account, which was previously disabled by an administrator.</p>

                    <p style="font-size: 16px;">Please log in to the Admin Dashboard to review and process this request.</p>

                    <p style="margin-top: 20px;">
                        <a href="${process.env.CLIENT_URL}/admin/reactivation" 
                           style="background-color: #dc3545; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                            Go to Admin Requests
                        </a>
                    </p>

                    <p style="font-size: 14px; color: #777; margin-top: 20px;">Thank you for your service.</p>
                </div>
            `,
        };
        // const info = await gmailTransporter.sendMail(mailOptions); // Gửi email bằng GMAIL transporter

        const info = await mailhogTransporter.sendMail(mailOptions); // Dùng MailHog để test

        console.log(`✅ Admin notification email sent for new reactivation request from ${username}. ID: ${info.messageId}`);
        return info;

    } catch (error) {
        console.error('❌ Error sending admin reactivation request notification:', error);
        // Không ném lỗi để tránh làm crash luồng chính
        return null;
    }
};

/**
 * @desc Gửi kết quả xử lý yêu cầu kích hoạt lại cho người dùng
 * @param {string} toEmail - Email người dùng
 * @param {string} status - Trạng thái ('Approved' hoặc 'Rejected')
 * @param {string} adminReason - Lý do Admin đưa ra (Optional)
 */
const sendReactivationResultEmail = async (toEmail, status, adminReason) => {
    const isApproved = status === 'Approved';
    const subject = isApproved ? '🎉 Account Reactivation Approved' : '🚫 Account Reactivation Rejected';
    const color = isApproved ? '#28a745' : '#dc3545';

    const defaultMessage = isApproved
        ? 'Your request has been successfully reviewed and your account is now active.'
        : 'Your request was reviewed, but your account reactivation was rejected.';

    try {
        const mailOptions = {
            // from: `"Crisis Alert Admin" <${process.env.GMAIL_USER}>`, // Gmail sender

            from: `"Crisis Alert Admin" <${process.env.EMAIL_USER || 'bot@crisis-alert.com'}>`, // MailHog sender

            to: toEmail,
            subject: subject,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">

                    ${NO_REPLY_NOTICE_BLOCK}

                    <h1 style="color: ${color}; text-align: center;">${isApproved ? 'Success!' : 'Status Update'}</h1>

                    <p style="font-size: 16px; text-align: center;">Your reactivation request status:</p>

                    <h2 style="color: ${color}; font-size: 24px; text-align: center; margin: 20px 0;">${status}</h2>

                    <p style="font-size: 16px;"><b>Admin Message:</b></p>

                    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; border-left: 3px solid ${color};">
                        <p style="margin: 0; color: #333;">${adminReason || defaultMessage}</p>
                    </div>

                    ${isApproved ?
                    '<p style="margin-top: 15px;">You can now log in to the Crisis Alert Dashboard.</p>' :
                    '<p style="margin-top: 15px;">Please contact support for further clarification.</p>'}
                    <p style="margin-top: 30px; font-size: 14px; color: #777;">- Crisis Alert Admin Team</p>
                </div>
            `,
        };
        // const info = await gmailTransporter.sendMail(mailOptions); // Gửi email bằng GMAIL transporter

        const info = await mailhogTransporter.sendMail(mailOptions); // Dùng MailHog để test

        console.log(`✅ Reactivation result email sent to ${toEmail} (${status}). ID: ${info.messageId}`);
        return info;

    } catch (error) {
        console.error('❌ Error sending reactivation result email:', error);
        return null;
    }
};

/**
 * Hàm gửi email thông báo khi có bài đăng mới khớp với alert
 * @param {string} userEmail - Email của người nhận chính
 * @param {string} alertTitle - Tiêu đề của Alert được kích hoạt
 * @param {object} post - Đối tượng bài post mới được tìm thấy
 * @param {string} ccRecipients - Chuỗi các email CC
 */
const sendNotificationEmail = async (userEmail, alertTitle, post, ccRecipients = '') => {
    try {
        const mailOptions = {
            // from: `"Crisis Alert" <${process.env.GMAIL_USER}>`, // Dòng này cho gửi mail đơn lẻ qua Gmail và CC mail

            from: `"Crisis Alert" <${process.env.EMAIL_USER || 'bot@crisis-alert.com'}>`, // Dòng này cho gửi mail hàng loạt cho MailHog

            to: userEmail,
            subject: `🚨 New Mention for Alert: "${alertTitle}"`,
            cc: ccRecipients,
            
            html: `
                ${NO_REPLY_NOTICE_BLOCK} 
                <h1>New Mention Detected!</h1>
                <p>A new post matching your alert "<b>${alertTitle}</b>" has been found.</p>
                <hr>
                <h3>Post Details:</h3>
                <p><b>Title:</b> ${post.title}</p>
                <p><b>Source:</b> ${post.source}</p>
                <p><b>Platform:</b> ${post.platform}</p>
                <p><b>Content Snippet:</b></p>
                <blockquote>${post.content.substring(0, 200)}...</blockquote>
                <br>
                <a href="${post.sourceUrl}" style="background-color: #2563eb; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">View Full Post</a>
                <br><br>
                <p><i>- The Crisis Alert Team</i></p>
            `,
        };
        // const info = await gmailTransporter.sendMail(mailOptions); // Sử dụng Gmail cho mail test đơn lẻ và test CC mail

        const info = await mailhogTransporter.sendMail(mailOptions); // Sử dụng MailHog cho lúc gửi mail nhiều và hàng loạt không bị flag spam

        console.log(`✅ Notification email (MailHog) sent to ${userEmail} and CC: ${ccRecipients || 'None'}. ID: ${info.messageId}`);
        return info;

    } catch (error) {
        console.error('❌ Error sending notification email:', error);
        throw new Error('Could not send notification email.');
    }
};

/**
 * Hàm gửi email xác thực OTP
 * @param {string} toEmail - Email của người nhận
 * @param {string} otp - Mã OTP (ví dụ: '123456')
 */
const sendVerificationEmail = async (toEmail, otp) => {
    try {
        const mailOptions = {
            // from: `"Crisis Alert" <${process.env.GMAIL_USER}>`, // Gmail sender

            from : `"Crisis Alert" <${process.env.EMAIL_USER || 'bot@crisis-alert.com'}>`, // Dòng này nếu dùng MailHog
            
            to: toEmail,
            subject: 'OTP For Verifying Crisis Alert Account',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    ${NO_REPLY_NOTICE_BLOCK} 
                    <h1 style="color: #333;">Crisis Alert Account Verification</h1>
                    <p style="font-size: 16px;">Your OTP to verify your account is:</p>
                    <h2 style="color: #007bff; font-size: 32px; letter-spacing: 5px; text-align: center; margin: 20px 0;">
                        ${otp}
                    </h2>
                    <p style="font-size: 16px;">This OTP will expire after 10 minutes.</p>
                    <p style="font-size: 14px; color: #777;">If you didn't send this request please ignore it and change your password because it looks like someone is trying to gain access to your account.</p>
                </div>
            `,
        };
        // const info = await gmailTransporter.sendMail(mailOptions); // Gửi email bằng GMAIL transporter

        const info = await mailhogTransporter.sendMail(mailOptions); // Nếu muốn dùng MailHog để test

        console.log('✅ Verification email (Gmail) sent:', info.messageId);
        return info;

    } catch (error) {
        console.error('❌ Error sending verification email:', error);
        throw new Error('Could not send verification email.');
    }
};

/**
 * Hàm gửi email chứa OTP để reset mật khẩu
 * @param {string} toEmail - Email của người nhận
 * @param {string} otp - Mã OTP (ví dụ: '123456')
 */
const sendPasswordResetEmail = async (toEmail, otp) => {
    try {
        const mailOptions = {
            // from: `"Crisis Alert" <${process.env.GMAIL_USER}>`, // Gmail sender

            from : `"Crisis Alert" <${process.env.EMAIL_USER || 'bot@crisis-alert.com'}>`, // Dòng này nếu dùng MailHog
            
            to: toEmail,
            subject: 'Password Resetting Request For Crisis Alert Account',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    ${NO_REPLY_NOTICE_BLOCK} 
                    <h1 style="color: #333;">Password Resetting Request</h1>
                    <p style="font-size: 16px;">We've receive a request for resetting your account password.</p>
                    <p style="font-size: 16px;">The OTP for resetting your account password is:</p>
                    <h2 style="color: #dc3545; font-size: 32px; letter-spacing: 5px; text-align: center; margin: 20px 0;">
                        ${otp}
                    </h2>
                    <p style="font-size: 16px;">This OTP will expire after 10 minutes.</p>
                    <p style="font-size: 14px; color: #777;">If you didn't send this request please ignore it and change your password because it looks like someone is trying to gain access to your account.</p>
                </div>
            `,
        };
        // const info = await gmailTransporter.sendMail(mailOptions); // Gửi email bằng GMAIL transporter

        const info = await mailhogTransporter.sendMail(mailOptions); // Nếu muốn dùng MailHog để test
        
        console.log('✅ Password reset email (Gmail) sent:', info.messageId);
        return info;

    } catch (error) {
        console.error('❌ Error sending password reset email:', error);
        throw new Error('Could not send password reset email.');
    }
};

/**
 * Hàm gửi email tùy chỉnh
 * @param {object} options - { email, subject, message }
 */
const sendEmail = async ({ email, subject, message }) => {
    try {
        const finalMessage = NO_REPLY_NOTICE_BLOCK + message;

        const mailOptions = {
            // from: `"Crisis Alert Support" <${process.env.GMAIL_USER}>`, // Gmail sender

            from : `"Crisis Alert Support" <${process.env.EMAIL_USER || 'bot@crisis-alert.com'}>`, // MailHog sender
            
            to: email,
            subject: subject,
            html: finalMessage,
        };
        // const info = await gmailTransporter.sendMail(mailOptions); // Gửi email bằng GMAIL transporter

        const info = await mailhogTransporter.sendMail(mailOptions); // Dùng MailHog để test

        console.log(`✅ Generic Email sent to ${email}. ID: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error('❌ Error sending generic email:', error);
        return null;
    }
};

/**
 * Hàm gửi email thông báo hết hạn gói dịch vụ
 * @param {string} toEmail - Email người nhận
 * @param {string} username - Tên người dùng
 * @param {string} oldPlan - Tên gói vừa hết hạn (VIP/Pro)
 */
const sendSubscriptionExpiredEmail = async (toEmail, username, oldPlan) => {
    try {
        const mailOptions = {
            // from: `"Crisis Alert System" <${process.env.GMAIL_USER}>`, // Gmail sender
            from: `"Crisis Alert System" <${process.env.EMAIL_USER || 'bot@crisis-alert.com'}>`, // MailHog sender

            to: toEmail,
            subject: '📉 Your Subscription has Expired',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    ${NO_REPLY_NOTICE_BLOCK}
                    
                    <h2 style="color: #dc3545; text-align: center;">Subscription Expired</h2>
                    
                    <p>Hello <b>${username}</b>,</p>
                    
                    <p style="font-size: 16px;">
                        This is a notification that your <b>${oldPlan}</b> subscription plan has expired as of today.
                    </p>
                    
                    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; border-left: 4px solid #dc3545; margin: 20px 0;">
                        <p style="margin: 0;">Your account has been automatically reverted to the <b>Free Plan</b>.</p>
                    </div>

                    <p>To continue enjoying premium features and remove limitations, please renew your subscription.</p>

                    <div style="text-align: center; margin-top: 30px;">
                        <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/buy" 
                           style="background-color: #007bff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                           Renew Subscription Now
                        </a>
                    </div>
                    
                    <p style="font-size: 14px; color: #777; margin-top: 30px; text-align: center;">
                        Thank you for using Crisis Alert.
                    </p>
                </div>
            `,
        };

        // const info = await gmailTransporter.sendMail(mailOptions); // Gửi email bằng GMAIL transporter

        const info = await mailhogTransporter.sendMail(mailOptions); // Dùng MailHog để test

        console.log(`✅ Expiration email sent to ${toEmail}. ID: ${info.messageId}`);
        return info;

    } catch (error) {
        console.error('❌ Error sending expiration email:', error);
        return null;
    }
};

// ----- EXPORTS -----
module.exports = {
    sendNotificationEmail,
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendEmail,
    sendReactivationRequestNotification,
    sendReactivationResultEmail,
    sendSubscriptionExpiredEmail
};