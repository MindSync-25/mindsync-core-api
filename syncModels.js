// syncModels.js
const sequelize = require('./db/sequelize');
const User = require('./models/User');
const Task = require('./models/Task');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');
    await sequelize.sync({ alter: true });
    console.log('All models were synchronized successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Unable to sync models:', error);
    process.exit(1);
  }
})();
