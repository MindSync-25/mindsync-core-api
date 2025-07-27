// models/UserBookmark.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db/sequelize');
const User = require('./User');
const NewsArticle = require('./NewsArticle');

const UserBookmark = sequelize.define('UserBookmark', {
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
  bookmarkDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'user_bookmarks',
  timestamps: false,
  indexes: [
    { unique: true, fields: ['userId', 'articleId'] },
    { fields: ['userId', 'bookmarkDate'] }
  ]
});

UserBookmark.belongsTo(User, { foreignKey: 'userId' });
UserBookmark.belongsTo(NewsArticle, { foreignKey: 'articleId' });

module.exports = UserBookmark;
