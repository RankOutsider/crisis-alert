// backend/utils/adminHelpers.js
const User = require('../models/User'); // Đảm bảo đường dẫn đúng tới Model User của bạn

const getActiveAdminEmails = async () => {
    try {
        const admins = await User.findAll({
            where: {
                role: 'admin',    // Chỉ lấy Admin
                is_active: true   // QUAN TRỌNG: Chỉ lấy tài khoản đang hoạt động
            },
            attributes: ['email'] // Chỉ lấy cột email cho nhẹ
        });

        // Chuyển kết quả thành mảng đơn giản: ['admin1@gmail.com', 'admin2@yahoo.com']
        const emailList = admins.map(a => a.email);

        console.log(`🔎 Found ${emailList.length} active admins.`);
        return emailList;

    } catch (error) {
        console.error("❌ Failed to fetch admin emails:", error);
        return [];
    }
};

module.exports = { getActiveAdminEmails };