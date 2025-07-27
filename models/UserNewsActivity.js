// models/UserNewsActivity.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db/sequelize');
const User = require('./User');
const NewsArticle = require('./NewsArticle');

const UserNewsActivity = sequelize.define('UserNewsActivity', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  articleId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'news_articles', key: 'id' }
  },
  actionType: {
    type: DataTypes.ENUM('view', 'bookmark', 'share', 'like', 'read_complete'),
    allowNull: false
  },
  moodAtTime: DataTypes.STRING(50),
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'user_news_activity',
  timestamps: false,
  indexes: [
    { fields: ['userId', 'actionType'] },
    { fields: ['articleId', 'actionType'] }
  ]
});

UserNewsActivity.belongsTo(User, { foreignKey: 'userId' });
UserNewsActivity.belongsTo(NewsArticle, { foreignKey: 'articleId' });

module.exports = UserNewsActivity;
