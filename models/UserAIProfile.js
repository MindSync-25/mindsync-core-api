// models/UserAIProfile.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db/sequelize');
const User = require('./User');

const UserAIProfile = sequelize.define('UserAIProfile', {
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
  moodPreferences: DataTypes.JSON,
  contentPreferences: DataTypes.JSON,
  readingPatterns: DataTypes.JSON,
  aiRecommendationsEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  lastUpdated: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'user_ai_profiles',
  timestamps: false
});

UserAIProfile.belongsTo(User, { foreignKey: 'userId' });

module.exports = UserAIProfile;
