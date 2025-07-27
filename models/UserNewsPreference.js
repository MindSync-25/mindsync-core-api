// models/UserNewsPreference.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db/sequelize');
const User = require('./User');
const NewsCategory = require('./NewsCategory');

const UserNewsPreference = sequelize.define('UserNewsPreference', {
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
  categoryId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'news_categories', key: 'id' }
  },
  isSelected: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  priorityLevel: {
    type: DataTypes.ENUM('high', 'medium', 'low'),
    defaultValue: 'medium'
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
  tableName: 'user_news_preferences',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  indexes: [
    { unique: true, fields: ['userId', 'categoryId'] }
  ]
});

UserNewsPreference.belongsTo(User, { foreignKey: 'userId' });
UserNewsPreference.belongsTo(NewsCategory, { foreignKey: 'categoryId' });

module.exports = UserNewsPreference;
