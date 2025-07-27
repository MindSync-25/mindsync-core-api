// models/NewsArticle.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db/sequelize');
const NewsCategory = require('./NewsCategory');

const NewsArticle = sequelize.define('NewsArticle', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  description: DataTypes.TEXT,
  content: DataTypes.TEXT('long'),
  url: {
    type: DataTypes.STRING(1000),
    allowNull: false,
    unique: true
  },
  imageUrl: DataTypes.STRING(1000),
  source: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  author: DataTypes.STRING(200),
  publishedAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  categoryId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'news_categories', key: 'id' }
  },
  readTime: {
    type: DataTypes.INTEGER,
    defaultValue: 5
  },
  sentiment: {
    type: DataTypes.ENUM('positive', 'negative', 'neutral'),
    defaultValue: 'neutral'
  },
  moodTags: DataTypes.JSON,
  isHealthyContent: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  viewCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'news_articles',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  indexes: [
    { fields: ['publishedAt'] },
    { fields: ['categoryId'] },
    { fields: ['source'] }
  ]
});

NewsArticle.belongsTo(NewsCategory, { foreignKey: 'categoryId' });

module.exports = NewsArticle;
