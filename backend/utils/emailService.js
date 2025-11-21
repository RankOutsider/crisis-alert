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
            from: `"Crisis Alert" <${process.env.GMAIL_USER}>`, // Dòng này cho gửi mail đơn lẻ qua Gmail và CC mail

            // from: `"Crisis Alert" <${process.env.EMAIL_USER || 'bot@crisis-alert.com'}>`, // Dòng này cho gửi mail hàng loạt cho MailHog

            to: userEmail,
            subject: `🚨 New Mention for Alert: "${alertTitle}"`,
            cc: ccRecipients,
            html: `
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

        // const info = await mailhogTransporter.sendMail(mailOptions); // Sử dụng MailHog cho lúc gửi mail nhiều và hàng loạt không bị flag spam

        const info = await gmailTransporter.sendMail(mailOptions); // Sử dụng Gmail cho mail test đơn lẻ và test CC mail

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
            from: `"Crisis Alert" <${process.env.GMAIL_USER}>`, // Gmail sender
            // from : `"Crisis Alert" <${process.env.EMAIL_USER || 'bot@crisis-alert.com'}>`, // Dòng này nếu dùng MailHog
            to: toEmail,
            subject: 'OTP For Verifying Crisis Alert Account',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <h1 style="color: #333;">Crisis Alert System Password Verification</h1>
                    <p style="font-size: 16px;">Your OTP to verify your account is:</p>
                    <h2 style="color: #007bff; font-size: 32px; letter-spacing: 5px; text-align: center; margin: 20px 0;">
                        ${otp}
                    </h2>
                    <p style="font-size: 16px;">This OTP will expire after 10 minutes.</p>
                    <p style="font-size: 14px; color: #777;">If you didn't send this request please ignore it and change your password because it looks like someone is trying to gain access to your account.</p>
                </div>
            `,
        };

        // const info = await mailhogTransporter.sendMail(mailOptions); // Nếu muốn dùng MailHog để test

        const info = await gmailTransporter.sendMail(mailOptions); // Gửi email bằng GMAIL transporter
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
            from: `"Crisis Alert" <${process.env.GMAIL_USER}>`, // Gmail sender
            // from : `"Crisis Alert" <${process.env.EMAIL_USER || 'bot@crisis-alert.com'}>`, // Dòng này nếu dùng MailHog
            to: toEmail,
            subject: 'Password Resetting Request For Crisis Alert Account',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
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

        // const info = await mailhogTransporter.sendMail(mailOptions); // Nếu muốn dùng MailHog để test

        const info = await gmailTransporter.sendMail(mailOptions); // Gửi email bằng GMAIL transporter
        console.log('✅ Password reset email (Gmail) sent:', info.messageId);
        return info;

    } catch (error) {
        console.error('❌ Error sending password reset email:', error);
        throw new Error('Could not send password reset email.');
    }
};

// ----- HÀM MỚI: Gửi email chung (dùng cho Subscription, System alert...) -----
/**
 * Hàm gửi email tùy chỉnh
 * @param {object} options - { email, subject, message }
 */
const sendEmail = async ({ email, subject, message }) => {
    try {
        const mailOptions = {
            from: `"Crisis Alert Support" <${process.env.GMAIL_USER}>`, // Gmail sender
            // from : `"Crisis Alert Support" <${process.env.EMAIL_USER || 'bot@crisis-alert.com'}>`, // MailHog sender
            to: email,
            subject: subject,
            html: message, // Nội dung HTML
        };

        // Uncomment dòng dưới nếu muốn dùng MailHog
        // const info = await mailhogTransporter.sendMail(mailOptions); 

        // Gửi email bằng GMAIL transporter (Hiện tại đang dùng cái này)
        const info = await gmailTransporter.sendMail(mailOptions);

        console.log(`✅ Generic Email sent to ${email}. ID: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error('❌ Error sending generic email:', error);
        // Không ném lỗi để tránh làm crash luồng chính nếu gửi mail thất bại
        return null;
    }
};

// ----- EXPORTS -----
module.exports = {
    sendNotificationEmail,
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendEmail, // 👈 Export thêm hàm này
};