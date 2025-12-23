// backend/models/associations.js
const { sequelize } = require('../config/db');
const Alert = require('./Alert');
const Post = require('./Post');
const CaseStudy = require('./CaseStudy');
const User = require('./User');
const SubscriptionRequest = require('./SubscriptionRequest');
const ReactivationRequest = require('./ReactivationRequest');

// --- Quan hệ User - Alert (Một-Nhiều) ---
User.hasMany(Alert, { foreignKey: 'userId', onDelete: 'CASCADE' });
Alert.belongsTo(User, { foreignKey: 'userId' });

// --- Quan hệ User - CaseStudy (Một-Nhiều) ---
User.hasMany(CaseStudy, { foreignKey: 'userId', onDelete: 'CASCADE' });
CaseStudy.belongsTo(User, { foreignKey: 'userId' });

// --- Quan hệ Alert - CaseStudy (Một-Một) ---
Alert.hasOne(CaseStudy, { foreignKey: 'alertId', onDelete: 'SET NULL' });
CaseStudy.belongsTo(Alert, { foreignKey: 'alertId' });

// --- Quan hệ POST VÀ ALERT ---
Alert.belongsToMany(Post, { through: 'postalerts' });
Post.belongsToMany(Alert, { through: 'postalerts' });

// --- Quan hệ POST VÀ CASE STUDY ---
CaseStudy.belongsToMany(Post, { through: 'postcasestudies' });
Post.belongsToMany(CaseStudy, { through: 'postcasestudies' });

// --- Quan hệ USER - SUBSCRIPTION REQUEST ---
User.hasMany(SubscriptionRequest, { foreignKey: 'userId', onDelete: 'CASCADE' });
SubscriptionRequest.belongsTo(User, { foreignKey: 'userId' });

// --- Quan hệ USER - REACTIVATION REQUEST ---
User.hasMany(ReactivationRequest, { foreignKey: 'userId', onDelete: 'CASCADE' });
ReactivationRequest.belongsTo(User, { foreignKey: 'userId' });

// Quan hệ POST VÀ ALERT
Alert.belongsToMany(Post, { through: PostAlert, foreignKey: 'AlertId', otherKey: 'PostId' });
Post.belongsToMany(Alert, { through: PostAlert, foreignKey: 'PostId', otherKey: 'AlertId' });

// Quan hệ POST VÀ CASE STUDY
CaseStudy.belongsToMany(Post, { through: PostCaseStudy, foreignKey: 'CaseStudyId', otherKey: 'PostId' });
Post.belongsToMany(CaseStudy, { through: PostCaseStudy, foreignKey: 'PostId', otherKey: 'CaseStudyId' });

console.log("✅ Database associations have been set up.");

// Xuất các model đã được "kết nối" (associated)
module.exports = {
    User, Alert, Post, CaseStudy,
    SubscriptionRequest, ReactivationRequest,
    PostAlert, PostCaseStudy,
    sequelize
};