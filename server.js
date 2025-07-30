require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Start news fetcher if needed
const newsFetcher = require('./jobs/newsFetcherDynamo');
newsFetcher.start();

// Middleware
app.use(cors());
app.use(express.json());

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'MindSync Core API is running!',
    version: '1.0.5',
    database: 'DynamoDB',
    endpoints: {
      news: '/api/news',
      categories: '/api/news/categories',
      tasks: '/api/tasks',
      weather: '/api/weather'
    },
    timestamp: new Date().toISOString()
  });
});

// News endpoints
app.get('/api/news', async (req, res) => {
  try {
    const { 
      category = 'all', 
      page = 1, 
      limit = 10 
    } = req.query;

    // Get fresh news from database
    const newsData = await require('./services/newsService').getNewsByCategory(
      category, 
      parseInt(page), 
      parseInt(limit)
    );

    res.json({
      success: true,
      category,
      page: parseInt(page),
      limit: parseInt(limit),
      total: newsData.total,
      articles: newsData.articles
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch news',
      message: error.message 
    });
  }
});

// News categories endpoint
app.get('/api/news/categories', async (req, res) => {
  try {
    const categories = await require('./services/newsService').getCategories();
    res.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch categories' 
    });
  }
});

// Task routes
app.use('/api/tasks', require('./routes/taskRoutes'));

// Weather routes
app.use('/api/weather', require('./routes/weatherRoutes'));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Route not found',
    path: req.originalUrl 
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, () => {
  console.log(`🚀 MindSync API running on port ${PORT}`);
  console.log(`📰 News fetcher: ${process.env.USE_LOCAL_DYNAMODB === 'true' ? 'Local JSON storage' : 'DynamoDB'}`);
});



