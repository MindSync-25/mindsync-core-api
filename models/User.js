
// models/User.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db/sequelize');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  googleId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true,
    field: 'google_id',
  },
  appleId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true,
    field: 'apple_id',
  },
  avatar: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  newsOnboardingComplete: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'news_onboarding_complete',
  },
  newsPermissionGranted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'news_permission_granted',
  },
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true,
});

module.exports = User;


