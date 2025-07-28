// db/sequelize.js
const { Sequelize } = require('sequelize');
require('dotenv').config();

// Use Railway's DATABASE_URL if available, otherwise fallback to local config
const sequelize = process.env.DATABASE_URL 
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      logging: false,
      dialectOptions: {
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      }
    })
  : new Sequelize('mindsync', 'postgres', 'root', {
      host: 'localhost',
      port: 5433,
      dialect: 'postgres',
      logging: false,
    });

module.exports = sequelize;
