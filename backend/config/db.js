// backend/config/db.js
const { Sequelize } = require('sequelize');

// Tạo một "instance" của Sequelize
// Đọc thông tin kết nối từ biến môi trường
const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: 'mysql'           // Quan trọng: Chỉ định dùng MySQL
    }
);

// Tạo một hàm để kiểm tra kết nối
const connectDB = async () => {
    try {
        // Thử xác thực kết nối với database
        await sequelize.authenticate();
        console.log('Kết nối MySQL thành công.');
    } catch (error) {
        console.error('Không thể kết nối tới MySQL:', error);
        process.exit(1); // Dừng ứng dụng nếu không kết nối được database
    }
};

// Export cả sequelize và hàm connectDB để các file khác có thể dùng
module.exports = { sequelize, connectDB };