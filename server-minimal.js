const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'MindSync Core API - LIVE and DEPLOYED!',
    status: 'SUCCESS',
    version: '1.0.1',
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

// News articles route (working implementation)
app.get('/api/news/articles', (req, res) => {
  try {
    // Mock articles data for immediate testing
    const mockArticles = [
      {
        id: 1,
        title: "Revolutionary AI Breakthrough in Healthcare",
        description: "Scientists develop new AI system that can predict diseases with 99% accuracy",
        url: "https://example.com/ai-healthcare",
        imageUrl: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800",
        source: "TechNews",
        author: "Dr. Sarah Johnson",
        publishedAt: new Date().toISOString(),
        category: "technology",
        readTime: "5 min read",
        sentiment: "positive",
        moodTags: ["innovation", "hope", "progress"],
        isBookmarked: false
      },
      {
        id: 2,
        title: "Global Climate Summit Reaches Historic Agreement",
        description: "World leaders unite on ambitious climate action plan for the next decade",
        url: "https://example.com/climate-summit",
        imageUrl: "https://images.unsplash.com/photo-1569163139394-de44e3ab7249?w=800",
        source: "World News",
        author: "Environmental Reporter",
        publishedAt: new Date(Date.now() - 3600000).toISOString(),
        category: "environment",
        readTime: "8 min read",
        sentiment: "positive", 
        moodTags: ["hope", "unity", "progress"],
        isBookmarked: false
      },
      {
        id: 3,
        title: "Major Sports Victory Inspires Millions",
        description: "Underdog team wins championship in stunning comeback story",
        url: "https://example.com/sports-victory",
        imageUrl: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800",
        source: "Sports Network",
        author: "Sports Reporter",
        publishedAt: new Date(Date.now() - 7200000).toISOString(),
        category: "sports",
        readTime: "4 min read",
        sentiment: "positive",
        moodTags: ["excitement", "inspiration", "victory"],
        isBookmarked: false
      }
    ];

    res.json({
      success: true,
      articles: mockArticles,
      pagination: {
        limit: 20,
        offset: 0,
        totalCount: mockArticles.length,
        hasMore: false,
        nextOffset: mockArticles.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch articles',
      details: error.message
    });
  }
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
    // Try database connection only
    const sequelize = require('./db/sequelize');
    await sequelize.authenticate();
    console.log('✅ Database connected');
    
    // Note: Full routes disabled to prevent conflicts
    console.log('💡 Using minimal routes for stability');
    
  } catch (error) {
    console.log('⚠️ Background initialization failed:', error.message);
    console.log('🔄 Minimal API will continue working');
  }
}
