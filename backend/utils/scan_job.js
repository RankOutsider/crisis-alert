// backend/utils/scan_job.js

const { Alert, Post, User, sequelize } = require('../models/associations');
const { Op } = require('sequelize');
const { sendNotificationEmail } = require('./emailService');
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const runScanJob = async (io) => {
    const JOB_NAME = "ALERT_POST_SCANNER";
    console.log("");
    console.log("");
    console.log("");
    console.log("==========================================================");
    console.log(`[${new Date().toISOString()}] 🤖 [NODE-CRON] Starting periodically scanning job...`);

    try {
        // --- LẤY TẤT CẢ ALERTS ACTIVE ---
        const activeAlerts = await Alert.findAll({
            where: { status: 'ACTIVE' },
            include: [{ model: User, attributes: ['id', 'email', 'notificationsEnabled', 'cc_emails'] }]
        });

        if (activeAlerts.length === 0) {
            console.log("➡️ [NODE-CRON] No ACTIVE Alerts. Job finished.");
            return;
        }

        // --- LẤY CÁC LIÊN KẾT ĐÃ TỒN TẠI TỪ DATABASE ---
        const existingLinksRaw = await sequelize.query(
            "SELECT `AlertId`, `PostId` FROM `postalerts`",
            { type: sequelize.QueryTypes.SELECT, raw: true }
        );
        const dbLinks = new Set(
            existingLinksRaw.map(link => `${link.AlertId}-${link.PostId}`)
        );
        console.log(`🔎 [NODE-CRON] Found ${activeAlerts.length} ACTIVE Alerts. Loaded ${dbLinks.size} existing associations from DB.`);

        // --- TÌM NGÀY BẮT ĐẦU QUÉT CHUNG ---
        const earliestStartDate = new Date(
            Math.min(...activeAlerts.map(a => new Date(a.createdAt)))
        );
        const startOfEarliestMonth = new Date(earliestStartDate.getFullYear(), earliestStartDate.getMonth(), 1);
        startOfEarliestMonth.setHours(0, 0, 0, 0);

        // --- LẤY TẤT CẢ POSTS CẦN QUÉT (CHỈ 1 LẦN) ---
        const allPostsToScan = await Post.findAll({
            where: { publishedAt: { [Op.gte]: startOfEarliestMonth } },
            raw: true
        });

        if (allPostsToScan.length === 0) {
            console.log("➡️ [NODE-CRON] No new posts found to scan. Job finished.");
            return;
        }
        console.log(`🔎 [NODE-CRON] Found ${allPostsToScan.length} Posts to scan.`);

        // --- SO KHỚP VÀ GỬI EMAIL (TRONG BỘ NHỚ) ---
        let totalNewLinksCreated = 0;

        for (const alert of activeAlerts) {
            const keywords = alert.keywords || [];
            const platforms = alert.platforms || [];
            if (keywords.length === 0 || platforms.length === 0) continue;

            const user = alert.User;
            const ccEmails = user.cc_emails;
            const alertCreationDate = new Date(alert.createdAt);
            const startOfMonth = new Date(alertCreationDate.getFullYear(), alertCreationDate.getMonth(), 1);
            startOfMonth.setHours(0, 0, 0, 0);

            const newPostsToLink = [];
            const newPostObjectsForEmail = [];

            for (const post of allPostsToScan) {
                if (new Date(post.publishedAt) < startOfMonth) continue;

                const linkKey = `${alert.id}-${post.id}`;
                if (dbLinks.has(linkKey)) continue;

                const postContent = `${post.title} ${post.content}`.toLowerCase();
                const keywordMatch = keywords.some(keyword => postContent.includes(keyword.toLowerCase()));
                const platformMatch = platforms.some(p => p.toLowerCase() === post.platform.toLowerCase());

                if (keywordMatch && platformMatch) {
                    newPostsToLink.push(post.id);
                    newPostObjectsForEmail.push(post);
                    dbLinks.add(linkKey);
                }
            }

            // TẠO LIÊN KẾT MỚI (HÀNG LOẠT) VÀ GỬI EMAIL
            if (newPostsToLink.length > 0) {
                try {
                    await alert.addPosts(newPostsToLink);
                    totalNewLinksCreated += newPostsToLink.length;
                    console.log(`✅ [NODE-CRON] [Alert ID ${alert.id}] Associated ${newPostsToLink.length} NEW Posts.`);

                    if (io && user) {
                        io.to(`user_${user.id}`).emit('new_match', {
                            alertId: alert.id,
                            alertTitle: alert.title,
                            newPostCount: newPostsToLink.length
                        });
                    }
                } catch (dbError) {
                    console.error(`❌ [NODE-CRON] LỖI LƯU DB cho Alert ID ${alert.id}:`, dbError.message);
                    continue;
                }

                // Gửi email
                if (user && user.email && user.notificationsEnabled) {
                    console.log(`... Preparing to send ${newPostsToLink.length} emails to ${user.email} (CC: ${ccEmails ? ccEmails.split(',').length : 0} others)`);
                    for (const post of newPostObjectsForEmail) {
                        try {
                            await sendNotificationEmail(user.email, alert.title, post, ccEmails);
                            console.log(`... Sent email for Post ID ${post.id} to ${user.email}`);
                            await sleep(1000); // Thêm delay cho gửi GMAIL
                        } catch (emailError) {
                            console.error(`❌ Error sending email (Post ID: ${post.id}):`, emailError.message);
                            await sleep(2000); // Thêm delay cho gửi GMAIL nếu lỗi
                        }
                    }
                }
            }
        }

        console.log(`✅ [${new Date().toISOString()}] END Scaning. Total NEW association created: ${totalNewLinksCreated}.`);

    } catch (error) {
        console.error(`❌ Error in Cronjob Scanning process (${JOB_NAME}):`, error.message, error.stack);
    }
};

module.exports = { runScanJob };