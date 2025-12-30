// backend/models/PostAlert.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Alert = require('./Alert');
const Post = require('./Post'); // Cần import Post để reference chính xác

const PostAlert = sequelize.define('PostAlert', {
    AlertId: {
        type: DataTypes.INTEGER,
        primaryKey: true, // QUAN TRỌNG: Khóa chính 1
        references: {
            model: Alert,
            key: 'id'
        }
    },
    PostId: {
        type: DataTypes.INTEGER,
        primaryKey: true, // QUAN TRỌNG: Khóa chính 2
        references: {
            model: Post,
            key: 'id'
        }
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false
    },
    updatedAt: {
        type: DataTypes.DATE,
        allowNull: false
    }
}, {
    tableName: 'postalerts',
    timestamps: true // Giữ nguyên vì bảng có createdAt/updatedAt
});

// --- HOOKS (Trigger) ---
PostAlert.afterCreate(async (postAlert, options) => {
    try {
        await Alert.increment('postCount', {
            by: 1,
            where: { id: postAlert.AlertId },
            transaction: options.transaction
        });
    } catch (error) {
        console.error("Hook Error (PostAlert Create):", error);
    }
});

PostAlert.afterDestroy(async (postAlert, options) => {
    try {
        await Alert.increment('postCount', {
            by: -1,
            where: { id: postAlert.AlertId },
            transaction: options.transaction
        });
    } catch (error) {
        console.error("Hook Error (PostAlert Destroy):", error);
    }
});

PostAlert.afterBulkCreate(async (postAlerts, options) => {
    try {
        const counts = {};
        postAlerts.forEach(pa => {
            counts[pa.AlertId] = (counts[pa.AlertId] || 0) + 1;
        });

        for (const [alertId, count] of Object.entries(counts)) {
            await Alert.increment('postCount', {
                by: count,
                where: { id: alertId },
                transaction: options.transaction
            });
        }
    } catch (error) {
        console.error("Hook Error (PostAlert BulkCreate):", error);
    }
});

module.exports = PostAlert;