// db/sequelize.js
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize('mindsync', 'postgres', 'root', {
  host: 'localhost',
  port: 5433,
  dialect: 'postgres',
  logging: false,
});

module.exports = sequelize;
