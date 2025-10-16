const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

// Định nghĩa model User, nó sẽ tương ứng với bảng 'users' trong database
const User = sequelize.define('User', {
    // Các thuộc tính (cột) của model được định nghĩa ở đây
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false, // Bắt buộc phải có giá trị (NOT NULL)
        unique: true      // Giá trị không được trùng
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true // Sequelize sẽ tự động kiểm tra định dạng email
        }
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    notificationsEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: true // Mặc định là bật khi người dùng mới đăng ký
    }
}, {
    // Các tùy chọn khác cho model
    tableName: 'users', // Đặt tên cho bảng trong database
    timestamps: true    // Tự động thêm 2 cột: createdAt và updatedAt
});

module.exports = User;