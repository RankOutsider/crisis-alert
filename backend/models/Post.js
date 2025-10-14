const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');
const Alert = require('./Alert');

class Post extends Model { }

Post.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    source: {
        type: DataTypes.STRING,
        allowNull: false
    },
    sourceUrl: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    sentiment: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'NEUTRAL'
    },
    publishedAt: {
        type: DataTypes.DATE,
        allowNull: false
    },
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
        {
            fields: ['alertId']
        },
        {
            fields: ['publishedAt']
        }
    ]
});

Post.belongsTo(Alert, { foreignKey: 'alertId', onDelete: 'CASCADE' });
Alert.hasMany(Post, { foreignKey: 'alertId' });

module.exports = Post;