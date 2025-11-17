// backend/models/Otp.js

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class Otp extends Model { }

Otp.init({
    // Model 'Otp' sẽ map với bảng 'otps'
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    otp_code: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
    },
}, {
    sequelize,
    modelName: 'Otp',
    tableName: 'otps',
    timestamps: true,
    updatedAt: false,
    createdAt: 'created_at'
});

module.exports = Otp;