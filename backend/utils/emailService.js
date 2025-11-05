const nodemailer = require('nodemailer');

// 1. Cấu hình Transporter
const transporterConfig = {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // MailHog không dùng SSL
};

if (process.env.EMAIL_PORT !== '1025' && process.env.EMAIL_USER) {
    transporterConfig.auth = {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    };
}

const transporter = nodemailer.createTransport(transporterConfig);

/**
 * Hàm gửi email thông báo khi có bài đăng mới khớp với alert
 * @param {string} userEmail - Email của người nhận
 * @param {string} alertTitle - Tiêu đề của Alert được kích hoạt
 * @param {object} post - Đối tượng bài post mới được tìm thấy
 */
const sendNotificationEmail = async (userEmail, alertTitle, post) => {
    try {
        const mailOptions = {
            // Dùng mail mặc định nếu EMAIL_USER rỗng (MailHog)
            from: `"Crisis Alert" <${process.env.EMAIL_USER || 'bot@crisis-alert.com'}>`,
            to: userEmail, // Người nhận
            subject: `🚨 New Mention for Alert: "${alertTitle}"`, // Tiêu đề email
            // Nội dung email dạng HTML
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

        // Gửi email
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Notification email sent:', info.messageId);
        return info;

    } catch (error) {
        console.error('❌ Error sending notification email:', error);
        throw new Error('Could not send notification email.');
    }
};

module.exports = { sendNotificationEmail };