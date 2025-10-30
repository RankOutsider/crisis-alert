// backend/models/User.js
const { DataTypes, Model } = require('sequelize'); // Sửa: Thêm Model để dùng class
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
    // Email duy nhất, dùng để liên lạc
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    // Số điện thoại (tùy chọn, nhưng đang để unique)
    phone: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    // Mật khẩu đã được băm (hashed)
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    // Cài đặt bật/tắt nhận thông báo qua email
    notificationsEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true
});

module.exports = User;