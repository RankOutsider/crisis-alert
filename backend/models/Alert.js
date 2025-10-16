// backend/models/Alert.js
const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class Alert extends Model { }

Alert.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    severity: {
        type: DataTypes.STRING,
        defaultValue: 'Medium'
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'ACTIVE'
    },
    postCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    keywords: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: []
    },
    platforms: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: []
    }
}, {
    sequelize,
    modelName: 'Alert',
    tableName: 'alerts',
    timestamps: true,
    indexes: [
        { fields: ['userId'] },
        { fields: ['status'] }
    ]
});

module.exports = Alert;