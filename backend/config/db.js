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
        port: process.env.DB_PORT || 4000,
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false // Chấp nhận chứng chỉ TiDB
            },
            connectTimeout: 60000 // 60 giây
        },

        // --- Cấu hình Connection Pool ---
        pool: {
            max: 20,
            min: 0,
            acquire: 60000,
            idle: 10000
        },

        // --- Cấu hình Logging (Chỉ bật khi phát triển) ---
        logging: process.env.NODE_ENV === 'development' ? console.log : false,

        // --- Cấu hình Độ ổn định (Tự thử lại khi lỗi tạm thời) ---
        retry: {
            match: [
                /SequelizeConnectionError/,
                /SequelizeConnectionRefusedError/,
                /SequelizeHostNotFoundError/,
                /SequelizeHostNotReachableError/,
                /SequelizeInvalidConnectionError/,
                /SequelizeConnectionTimedOutError/
            ],
            max: 3
        }
    }
);

// Hàm kiểm tra và xác thực kết nối database
const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Kết nối MySQL thành công.');
    } catch (error) {
        console.error('❌ Không thể kết nối tới MySQL:', error.message);
        process.exit(1);
    }
};

// Export sequelize instance và hàm kết nối để sử dụng trong server.js
module.exports = { sequelize, connectDB };