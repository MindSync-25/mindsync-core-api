const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();

// CORS Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true,
}));

// Middleware
app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'MindSync Core API - Legendary Backend is LIVE!',
    status: 'LEGENDARY_DEPLOYED',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      news: '/api/news',
      weather: '/api/weather', 
      tasks: '/api/tasks',
      test: '/test'
    }
  });
});

// Test route
app.get('/test', (req, res) => {
  res.json({ 
    message: 'Backend is working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Load routes with error handling
try {
  const authRoutes = require('./routes/authRoutes');
  app.use('/api/auth', authRoutes);
  console.log('✅ Auth routes loaded');
} catch (error) {
  console.log('⚠️ Auth routes failed to load:', error.message);
}

try {
  const taskRoutes = require('./routes/taskRoutes');
  app.use('/api', taskRoutes);
  console.log('✅ Task routes loaded');
} catch (error) {
  console.log('⚠️ Task routes failed to load:', error.message);
}

try {
  const weatherRoutes = require('./routes/weatherRoutes');
  app.use('/api/weather', weatherRoutes);
  console.log('✅ Weather routes loaded');
} catch (error) {
  console.log('⚠️ Weather routes failed to load:', error.message);
}

try {
  const newsRoutes = require('./routes/newsRoutes');
  app.use('/api/news', newsRoutes);
  app.use('/api/user/news', newsRoutes);
  console.log('✅ News routes loaded');
} catch (error) {
  console.log('⚠️ News routes failed to load:', error.message);
}

// Start server immediately (database initialization will happen in background)
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running at http://${HOST}:${PORT}`);
  console.log(`🌐 API available at: http://${HOST}:${PORT}/api/news`);
  
  // Background database initialization
  initializeDatabase();
});

// Background database initialization
async function initializeDatabase() {
  try {
    console.log('🔄 Starting background database initialization...');
    
    const sequelize = require('./db/sequelize');
    await sequelize.authenticate();
    console.log('✅ Database connected');

    await sequelize.sync({ alter: true });
    console.log('✅ Models synced');

    // Try to initialize news service
    try {
      const seedNewsCategories = require('./seeders/newsCategoriesSeeder');
      await seedNewsCategories();
      console.log('✅ News categories seeded');

      const NewsFetcher = require('./jobs/newsFetcher');
      const newsFetcher = new NewsFetcher();
      newsFetcher.startScheduledFetching();
      await newsFetcher.fetchAllCategories();
      console.log('✅ News service initialized');
    } catch (newsError) {
      console.log('⚠️ News service initialization failed:', newsError.message);
    }
    
  } catch (err) {
    console.error('⚠️ Database initialization failed:', err.message);
    console.log('🔄 Server will continue running without database features');
  }
}
