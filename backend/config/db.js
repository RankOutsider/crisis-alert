const { Sequelize } = require('sequelize');
require('dotenv').config(); // Nạp các biến từ file .env

// 1. Tạo một "instance" của Sequelize
// Nó sẽ đọc các thông tin kết nối từ file .env mà bạn đã cấu hình
const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST, // Host: 'localhost'
        dialect: 'mysql'           // Quan trọng: Chỉ định chúng ta đang dùng MySQL
    }
);

// 2. Tạo một hàm để kiểm tra kết nối
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

// 3. Xuất (export) cả sequelize và hàm connectDB để các file khác có thể dùng
module.exports = { sequelize, connectDB };