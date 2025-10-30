// backend/models/Alert.js
const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class Alert extends Model { }

Alert.init({
    // Khóa chính, tự động tăng
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    // Tiêu đề của Alert
    title: {
        type: DataTypes.STRING,
        allowNull: false // Bắt buộc phải có
    },
    // Mô tả chi tiết hơn về Alert
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    // Mức độ nghiêm trọng của Alert
    severity: {
        type: DataTypes.STRING,
        defaultValue: 'Medium'
    },
    // Trạng thái của Alert
    status: {
        type: DataTypes.STRING,
        defaultValue: 'ACTIVE'
    },
    postCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    // Mảng các từ khóa (keywords) mà Alert này theo dõi
    keywords: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: []
    },
    // Mảng các nền tảng (platforms) mà Alert này theo dõi
    platforms: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: []
    }
}, {
    sequelize, // Chỉ định kết nối sequelize
    modelName: 'Alert', // Tên của model trong code
    tableName: 'alerts', // Tên của bảng trong CSDL
    timestamps: true, // Tự động thêm cột createdAt và updatedAt
    indexes: [
        // Thêm index cho khóa ngoại để tăng tốc độ truy vấn theo user
        { fields: ['userId'] },
        // Thêm index cho cột 'status'
        { fields: ['status'] }
    ]
});

module.exports = Alert;