const { Alert, Post, User, sequelize } = require('../models/associations');
const { Op } = require('sequelize');
const { sendNotificationEmail } = require('./emailService');
// Hàm sleep để delay nếu cần (giữ lại cho chắc)
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const runScanJob = async (io) => {
    const JOB_NAME = "ALERT_POST_SCANNER";
    console.log("");
    console.log("==========================================================");
    console.log(`[${new Date().toISOString()}] 🤖 [NODE-CRON] Starting periodically scanning job...`);

    try {
        // --- 1. LẤY TẤT CẢ ALERTS ACTIVE ---
        const activeAlerts = await Alert.findAll({
            where: { status: 'ACTIVE' },
            include: [{ model: User, attributes: ['id', 'email', 'notificationsEnabled', 'cc_emails'] }]
        });

        if (activeAlerts.length === 0) {
            console.log("➡️ [NODE-CRON] No ACTIVE Alerts. Job finished.");
            return;
        }

        // --- 2. LẤY CÁC LIÊN KẾT ĐÃ TỒN TẠI TỪ DATABASE (ĐỂ LỌC RAM) ---
        // Lưu ý: Tên bảng là 'postalerts' dựa trên ảnh bạn cung cấp
        const existingLinksRaw = await sequelize.query(
            "SELECT `AlertId`, `PostId` FROM `postalerts`",
            { type: sequelize.QueryTypes.SELECT, raw: true }
        );

        const dbLinks = new Set(
            existingLinksRaw.map(link => {
                // Xử lý cả trường hợp viết hoa/thường do khác biệt Driver
                const aId = link.AlertId || link.alertId;
                const pId = link.PostId || link.postId;
                return `${aId}-${pId}`;
            })
        );
        console.log(`🔎 [NODE-CRON] Found ${activeAlerts.length} ACTIVE Alerts. Loaded ${dbLinks.size} existing associations from DB.`);

        // --- 3. TÌM NGÀY BẮT ĐẦU QUÉT CHUNG ---
        const earliestStartDate = new Date(
            Math.min(...activeAlerts.map(a => new Date(a.createdAt)))
        );
        const startOfEarliestMonth = new Date(earliestStartDate.getFullYear(), earliestStartDate.getMonth(), 1);
        startOfEarliestMonth.setHours(0, 0, 0, 0);

        // --- 4. LẤY TẤT CẢ POSTS CẦN QUÉT ---
        const allPostsToScan = await Post.findAll({
            where: { publishedAt: { [Op.gte]: startOfEarliestMonth } },
            raw: true
        });

        if (allPostsToScan.length === 0) {
            console.log("➡️ [NODE-CRON] No new posts found to scan. Job finished.");
            return;
        }
        console.log(`🔎 [NODE-CRON] Found ${allPostsToScan.length} Posts to scan.`);

        // --- 5. SO KHỚP VÀ XỬ LÝ ---
        let totalNewLinksCreated = 0;

        for (const alert of activeAlerts) {
            const keywords = alert.keywords || [];
            const platforms = alert.platforms || [];
            if (keywords.length === 0 || platforms.length === 0) continue;

            const user = alert.User;
            const ccEmails = user.cc_emails;

            // Logic ngày tháng của Alert cụ thể
            const alertCreationDate = new Date(alert.createdAt);
            const startOfMonth = new Date(alertCreationDate.getFullYear(), alertCreationDate.getMonth(), 1);
            startOfMonth.setHours(0, 0, 0, 0);

            const newPostsToLink = []; // Chỉ chứa ID để Insert
            const newPostObjectsForEmail = []; // Chứa full object để gửi mail

            for (const post of allPostsToScan) {
                if (new Date(post.publishedAt) < startOfMonth) continue;

                // Check trùng trên RAM trước
                const linkKey = `${alert.id}-${post.id}`;
                if (dbLinks.has(linkKey)) continue;

                const postContent = `${post.title} ${post.content}`.toLowerCase();
                const keywordMatch = keywords.some(keyword => postContent.includes(keyword.toLowerCase()));
                const platformMatch = platforms.some(p => p.toLowerCase() === post.platform.toLowerCase());

                if (keywordMatch && platformMatch) {
                    newPostsToLink.push(post.id);
                    newPostObjectsForEmail.push(post);
                    dbLinks.add(linkKey); // Cập nhật luôn vào RAM để vòng sau không lặp
                }
            }

            // --- 6. INSERT IGNORE (PHẦN QUAN TRỌNG NHẤT) ---
            if (newPostsToLink.length > 0) {
                try {
                    // Chuẩn bị thời gian hiện tại cho SQL
                    const now = new Date().toISOString().slice(0, 19).replace('T', ' '); // Format: YYYY-MM-DD HH:mm:ss

                    // Tạo chuỗi Values cho câu lệnh SQL: (AlertId, PostId, createdAt, updatedAt)
                    const values = newPostsToLink.map(pId => `(${alert.id}, ${pId}, '${now}', '${now}')`).join(',');

                    // Câu lệnh BẤT TỬ: INSERT IGNORE INTO ...
                    // Nếu trùng AlertId + PostId -> Nó sẽ tự bỏ qua, không báo lỗi.
                    const query = `INSERT IGNORE INTO postalerts (AlertId, PostId, createdAt, updatedAt) VALUES ${values}`;

                    await sequelize.query(query);

                    // --- LOG XANH (Thành công) ---
                    totalNewLinksCreated += newPostsToLink.length;
                    console.log(`✅ [NODE-CRON] [Alert ID ${alert.id}] Processed ${newPostsToLink.length} posts (Duplicates ignored automatically).`);

                    // Gửi Socket IO
                    if (io && user) {
                        io.to(`user_${user.id}`).emit('new_match', {
                            alertId: alert.id,
                            alertTitle: alert.title,
                            newPostCount: newPostsToLink.length
                        });
                    }

                    // Gửi Email
                    if (user && user.email && user.notificationsEnabled) {
                        console.log(`... Preparing to send ${newPostsToLink.length} emails...`);
                        for (const post of newPostObjectsForEmail) {
                            try {
                                await sendNotificationEmail(user.email, alert.title, post, ccEmails);
                            } catch (emailError) {
                                console.error(`⚠️ Email error (Post ${post.id}): ${emailError.message}`);
                            }
                        }
                    }

                } catch (dbError) {
                    // Nếu vào đây thì chỉ có thể là lỗi kết nối DB hoặc sai tên bảng, cần in ra để fix
                    console.error(`❌ [NODE-CRON] CRITICAL ERROR for Alert ID ${alert.id}:`, dbError.message);
                }
            }
        }

        console.log(`✅ [${new Date().toISOString()}] END Scaning. Total NEW association created: ${totalNewLinksCreated}.`);

    } catch (error) {
        console.error(`❌ Error in Cronjob Scanning process (${JOB_NAME}):`, error.message, error.stack);
    }
};

module.exports = { runScanJob };