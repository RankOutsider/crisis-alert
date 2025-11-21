// backend/models/Post.js
const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class Post extends Model { }

Post.init({
    // Khóa chính, tự động tăng
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    // Tiêu đề của bài post
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    // Nội dung text của bài post
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    // Nguồn của bài post
    source: {
        type: DataTypes.STRING,
        allowNull: false
    },
    // URL duy nhất trỏ đến bài post gốc
    sourceUrl: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true // Đảm bảo không thu thập trùng lặp bài post
    },
    // Phân tích cảm xúc (Sắc thái) của post
    sentiment: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'NEUTRAL'
    },
    // Ngày/giờ bài post được đăng tải
    publishedAt: {
        type: DataTypes.DATE,
        allowNull: false
    },
    // Nền tảng nơi post được tìm thấy
    platform: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    sequelize,
    modelName: 'Post',
    tableName: 'posts',
    timestamps: true,
    indexes: [
        { fields: ['publishedAt'] }
    ]
});

module.exports = Post;