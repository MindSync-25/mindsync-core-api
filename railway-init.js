// railway-init.js - Initialize database for Railway deployment
const sequelize = require('./db/sequelize');

// Import all models to ensure they're registered
require('./models/User');
require('./models/Task');
require('./models/NewsCategory');
require('./models/NewsArticle');
require('./models/UserNewsPreference');
require('./models/UserNewsActivity');
require('./models/UserBookmark');
require('./models/AIContentAnalysis');
require('./models/UserAIProfile');

(async () => {
  try {
    console.log('🔄 Connecting to Railway PostgreSQL database...');
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully!');
    
    console.log('🔄 Creating database tables...');
    await sequelize.sync({ force: false, alter: true });
    console.log('✅ All database tables created successfully!');
    
    console.log('🎉 Railway database initialization complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
})();
