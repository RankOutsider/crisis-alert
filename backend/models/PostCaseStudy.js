const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const CaseStudy = require('./CaseStudy');
const Post = require('./Post');

const PostCaseStudy = sequelize.define('PostCaseStudy', {
    CaseStudyId: {
        type: DataTypes.INTEGER,
        primaryKey: true, // QUAN TRỌNG: Khóa chính 1
        references: {
            model: CaseStudy,
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
    tableName: 'postcasestudies',
    timestamps: true
});

// --- HOOKS THAY THẾ TRIGGER ---

PostCaseStudy.afterCreate(async (item, options) => {
    try {
        await CaseStudy.increment('postCount', {
            by: 1,
            where: { id: item.CaseStudyId },
            transaction: options.transaction
        });
    } catch (error) {
        console.error("Hook Error (PostCaseStudy Create):", error);
    }
});

PostCaseStudy.afterDestroy(async (item, options) => {
    try {
        await CaseStudy.increment('postCount', {
            by: -1,
            where: { id: item.CaseStudyId },
            transaction: options.transaction
        });
    } catch (error) {
        console.error("Hook Error (PostCaseStudy Destroy):", error);
    }
});

PostCaseStudy.afterBulkCreate(async (items, options) => {
    try {
        const counts = {};
        items.forEach(item => {
            counts[item.CaseStudyId] = (counts[item.CaseStudyId] || 0) + 1;
        });

        for (const [csId, count] of Object.entries(counts)) {
            await CaseStudy.increment('postCount', {
                by: count,
                where: { id: csId },
                transaction: options.transaction
            });
        }
    } catch (error) {
        console.error("Hook Error (PostCaseStudy BulkCreate):", error);
    }
});

module.exports = PostCaseStudy;