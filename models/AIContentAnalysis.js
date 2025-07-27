// models/AIContentAnalysis.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db/sequelize');
const NewsArticle = require('./NewsArticle');

const AIContentAnalysis = sequelize.define('AIContentAnalysis', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  articleId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'news_articles', key: 'id' }
  },
  aiMoodScore: DataTypes.JSON,
  aiSentimentScore: DataTypes.DECIMAL(3,2),
  aiCategoryConfidence: DataTypes.DECIMAL(3,2),
  aiKeywords: DataTypes.JSON,
  aiSummary: DataTypes.TEXT,
  analysisModelVersion: DataTypes.STRING(50),
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'ai_content_analysis',
  timestamps: false
});

AIContentAnalysis.belongsTo(NewsArticle, { foreignKey: 'articleId' });

module.exports = AIContentAnalysis;
