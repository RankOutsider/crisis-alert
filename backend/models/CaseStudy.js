// backend/models/CaseStudy.js
const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class CaseStudy extends Model { }

CaseStudy.init({
    // Khóa chính
    // LƯU Ý: ID này là INTEGER, không phải String/UUID.
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    // Tiêu đề của Case Study
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    // Tóm tắt/Mô tả chi tiết của Case Study
    summary: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    // Bộ đếm cache: Tổng số Posts được liên kết
    postCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    // Chuỗi hiển thị (vd: "Oct 20, 2025 - Oct 22, 2025")
    dateRange: {
        type: DataTypes.STRING,
        allowNull: true
    },
    // Trạng thái: Đã giải quyết hay chưa
    status: {
        type: DataTypes.STRING,
        defaultValue: 'Unresolved' // Có thể dùng ENUM('Unresolved', 'Resolved')
    }
    // 'userId' và 'alertId' (foreign keys) sẽ được 'associations.js' thêm vào
}, {
    sequelize,
    modelName: 'CaseStudy',
    tableName: 'case_studies',
    timestamps: true,
    indexes: [
        { fields: ['userId'] },
        { fields: ['alertId'] }
    ]
});

module.exports = CaseStudy;