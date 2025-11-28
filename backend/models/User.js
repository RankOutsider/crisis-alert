// backend/models/User.js
const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class User extends Model { }

User.init({
    // Khóa chính, tự động tăng
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    // Tên đăng nhập duy nhất
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    // Tên đầy đủ của người dùng
    full_name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    // Email duy nhất, dùng để liên lạc
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    // Số điện thoại
    phone: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    // Tên công ty hoặc tổ chức
    company: {
        type: DataTypes.STRING,
        allowNull: true
    },
    // Mật khẩu đã được băm (hashed)
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    // URL ảnh đại diện người dùng
    avatar_url: {
        type: DataTypes.STRING,
        allowNull: true
    },
    // Giới tính của người dùng
    gender: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    // Ngày sinh của người dùng
    date_of_birth: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    // Địa chỉ người dùng
    address: {
        type: DataTypes.STRING,
        allowNull: true
    },
    // Danh sách email phụ để nhận thông báo (nếu có)
    cc_emails: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    // Cài đặt bật/tắt nhận thông báo qua email
    notificationsEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    // Trạng thái xác thực email
    is_verified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    // Lưu trữ cấp độ gói
    subscriptionTier: {
        type: DataTypes.ENUM('Free', 'VIP', 'Pro'),
        allowNull: false,
        defaultValue: 'Free'
    },
    // Thời hạn hết hạn gói (Null: vĩnh viễn hoặc gói Free)
    subscriptionExpiresAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    // Vai trò người dùng
    role: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'user'
    },
    // Trạng thái hoạt động của người dùng
    is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    // Trạng thái hoạt động của người dùng với quyền admin
    is_active_admin: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
}, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true
});

module.exports = User;