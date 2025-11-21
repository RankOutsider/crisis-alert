// backend/models/SubscriptionRequest.js
const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class SubscriptionRequest extends Model { }

SubscriptionRequest.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    // Gói người dùng muốn mua (VIP/Pro)
    plan: {
        type: DataTypes.STRING,
        allowNull: false
    },
    // Số tiền (để đối chiếu nếu cần)
    amount: {
        type: DataTypes.STRING,
        allowNull: true
    },
    // Trạng thái yêu cầu
    status: {
        type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED'),
        defaultValue: 'PENDING'
    },
    // Ghi chú của admin (nếu từ chối thì ghi lý do)
    adminNote: {
        type: DataTypes.TEXT,
        allowNull: true
    }
    // userId sẽ được tự động thêm bởi associations
}, {
    sequelize,
    modelName: 'SubscriptionRequest',
    tableName: 'subscription_requests',
    timestamps: true
});

module.exports = SubscriptionRequest;