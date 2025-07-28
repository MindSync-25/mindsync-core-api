const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'MindSync Core API - LIVE!',
    status: 'SUCCESS',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET /',
      'GET /test', 
      'GET /api/news',
      'GET /api/news/categories'
    ]
  });
});

// Test route
app.get('/test', (req, res) => {
  res.json({ 
    message: 'Backend is working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production'
  });
});

// News base route
app.get('/api/news', (req, res) => {
  res.json({
    success: true,
    message: 'MindSync News API - Ready!',
    version: '1.0.0',
    endpoints: {
      categories: '/api/news/categories',
      articles: '/api/news/articles'
    },
    timestamp: new Date().toISOString()
  });
});

// News categories route (mock data for now)
app.get('/api/news/categories', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 1, name: 'technology', displayName: 'Technology' },
      { id: 2, name: 'health', displayName: 'Health' },
      { id: 3, name: 'sports', displayName: 'Sports' },
      { id: 4, name: 'business', displayName: 'Business' },
      { id: 5, name: 'entertainment', displayName: 'Entertainment' }
    ]
  });
});

// Start server
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`🚀 MINIMAL SERVER RUNNING ON ${HOST}:${PORT}`);
  console.log(`🌐 API: http://${HOST}:${PORT}/api/news`);
  
  // Initialize full features after startup
  setTimeout(() => {
    console.log('🔄 Starting background initialization...');
    initializeFullFeatures();
  }, 1000);
});

// Background initialization (won't block deployment)
async function initializeFullFeatures() {
  try {
    // Try to load full routes
    const newsRoutes = require('./routes/newsRoutes');
    app.use('/api/news-full', newsRoutes);
    console.log('✅ Full news routes loaded');
    
    // Try database connection
    const sequelize = require('./db/sequelize');
    await sequelize.authenticate();
    console.log('✅ Database connected');
    
  } catch (error) {
    console.log('⚠️ Background initialization failed:', error.message);
    console.log('🔄 Minimal API will continue working');
  }
}
