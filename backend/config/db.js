const { Sequelize } = require('sequelize');

// Khởi tạo Sequelize Instance
// Lấy tất cả thông tin kết nối (Name, User, Password, Host) từ biến môi trường
const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: 'mysql',

        // --- Cấu hình Connection Pool (Tăng ổn định và hiệu suất) ---
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        },

        // --- Cấu hình Logging (Chỉ bật khi phát triển) ---
        // Chỉ in ra các truy vấn SQL khi NODE_ENV là 'development'
        logging: process.env.NODE_ENV === 'development' ? console.log : false,

        // --- Cấu hình Độ ổn định (Tự thử lại khi lỗi tạm thời) ---
        retry: { max: 3 } // Tự động thử lại kết nối tối đa 3 lần nếu thất bại
    }
);

// Hàm kiểm tra và xác thực kết nối database
const connectDB = async () => {
    try {
        // Thử xác thực kết nối với database
        await sequelize.authenticate();
        console.log('Kết nối MySQL thành công.');
    } catch (error) {
        // Log lỗi và dừng ứng dụng nếu không thể kết nối
        console.error('Không thể kết nối tới MySQL:', error.message);
        process.exit(1);
    }
};

// Export sequelize instance và hàm kết nối để sử dụng trong server.js
module.exports = { sequelize, connectDB };