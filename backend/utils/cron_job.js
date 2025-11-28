const cron = require('node-cron');
const { Op } = require('sequelize');
const User = require('../models/User');
const Otp = require('../models/Otp');

// Import hàm gửi mail
const { sendSubscriptionExpiredEmail } = require('./emailService');

const initCronJobs = () => {
    console.log('⏰ [Cron Manager] System automation initialized.');

    // Cron 1: CHECK HẾT HẠN GÓI
    cron.schedule('* * * * *', async () => {
        console.log('🔄 [Cron Job] Running subscription check...');
        try {
            const now = new Date();

            // Tìm User hết hạn (expiresAt < now) VÀ chưa về Free
            const expiredUsers = await User.findAll({
                where: {
                    subscriptionExpiresAt: { [Op.lt]: now },
                    subscriptionTier: { [Op.ne]: 'Free' }
                }
            });

            if (expiredUsers.length > 0) {
                console.log(`📉 Found ${expiredUsers.length} users with expired subscriptions.`);

                for (const user of expiredUsers) {
                    const oldPlan = user.subscriptionTier;

                    // 1. Cập nhật DB
                    user.subscriptionTier = 'Free';
                    user.subscriptionExpiresAt = null;
                    await user.save();

                    // 2. Gửi email thông báo
                    await sendSubscriptionExpiredEmail(user.email, user.username, oldPlan);

                    console.log(`✅ Downgraded User: ${user.username} (${oldPlan} -> Free)`);
                }
            } else {
                console.log('✨ No expired subscriptions found today.');
            }

        } catch (error) {
            console.error('❌ [Cron Job] Error checking subscriptions:', error);
        }
    });

    // Cron 2: DỌN OTP RÁC
    cron.schedule('* * * * *', async () => {
        try {
            const now = new Date();

            // Xoá OTP đã hết hạn
            const deletedCount = await Otp.destroy({
                where: {
                    expires_at: { [Op.lt]: now }
                }
            });

            if (deletedCount > 0) console.log(`🗑️ [Cron Job] Cleaned ${deletedCount} expired OTPs.`);
        } catch (error) {
            console.error('❌ [Cron Job] Error cleaning OTPs:', error);
        }
    });
};

module.exports = { initCronJobs };