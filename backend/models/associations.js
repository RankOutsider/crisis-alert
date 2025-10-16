// backend/models/associations.js
const { sequelize } = require('../config/db');
const Alert = require('./Alert');
const Post = require('./Post');
const CaseStudy = require('./CaseStudy');
const User = require('./User');

// --- Quan hệ User - Alert (Một-Nhiều) ---
User.hasMany(Alert, { foreignKey: 'userId', onDelete: 'CASCADE' });
Alert.belongsTo(User, { foreignKey: 'userId' });

// --- Quan hệ Alert - CaseStudy (Một-Một) ---
Alert.hasOne(CaseStudy, { foreignKey: 'alertId', onDelete: 'SET NULL' });
CaseStudy.belongsTo(Alert, { foreignKey: 'alertId' });

// --- QUAN HỆ NHIỀU-NHIỀU GIỮA POST VÀ ALERT ---
Alert.belongsToMany(Post, { through: 'PostAlerts' });
Post.belongsToMany(Alert, { through: 'PostAlerts' });

// --- QUAN HỆ NHIỀU-NHIỀU GIỮA POST VÀ CASE STUDY ---
CaseStudy.belongsToMany(Post, { through: 'PostCaseStudies' });
Post.belongsToMany(CaseStudy, { through: 'PostCaseStudies' });

console.log("✅ Database associations have been set up.");

module.exports = { User, Alert, Post, CaseStudy };