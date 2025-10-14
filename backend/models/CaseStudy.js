const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');
const Alert = require('./Alert');

const CaseStudy = sequelize.define('CaseStudy', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    summary: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    postCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    dateRange: {
        type: DataTypes.STRING,
        allowNull: true
    },
    status: {
        type: DataTypes.STRING,
        // === THAY ĐỔI Ở ĐÂY ===
        defaultValue: 'Unresolved' // Trạng thái mới: Unresolved, Resolved
    }
}, {
    tableName: 'case_studies',
    timestamps: true
});

// Thiết lập mối quan hệ
CaseStudy.belongsTo(User, { foreignKey: 'userId', onDelete: 'CASCADE' });
User.hasMany(CaseStudy, { foreignKey: 'userId' });

CaseStudy.belongsTo(Alert, { foreignKey: 'alertId', onDelete: 'SET NULL' });
Alert.hasOne(CaseStudy, { foreignKey: 'alertId' });

module.exports = CaseStudy;