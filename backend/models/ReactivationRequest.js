// backend/models/ReactivationRequest.js
const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('./../config/db');

class ReactivationRequest extends Model { }

ReactivationRequest.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    // ID của người dùng gửi yêu cầu
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users', // Tên bảng
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    // Tên người dùng tại thời điểm gửi yêu cầu
    username: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    // Trạng thái của yêu cầu
    status: {
        type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
        allowNull: false,
        defaultValue: 'Pending'
    },
    // Lý do Admin đưa ra khi Phê duyệt/Từ chối (Tùy chọn)
    adminReason: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    // Ngày yêu cầu được Admin xử lý
    processedAt: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    sequelize,
    modelName: 'ReactivationRequest',
    tableName: 'reactivation_requests',
    timestamps: true
});

module.exports = ReactivationRequest;