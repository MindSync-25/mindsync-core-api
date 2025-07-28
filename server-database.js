const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'MindSync Core API - Database Articles!',
    status: 'SUCCESS',
    version: '1.0.3',
    timestamp: new Date().toISOString()
  });
});

// Test route
app.get('/test', (req, res) => {
  res.json({ 
    message: 'Backend working with REAL database articles!',
    timestamp: new Date().toISOString()
  });
});

// News base route
app.get('/api/news', (req, res) => {
  res.json({
    success: true,
    message: 'MindSync News API - Real Database!',
    version: '1.0.3',
    endpoints: {
      categories: '/api/news/categories',
      articles: '/api/news/articles'
    },
    timestamp: new Date().toISOString()
  });
});

// Real database articles endpoint
app.get('/api/news/articles', async (req, res) => {
  try {
    const NewsArticle = require('./models/NewsArticle');
    const NewsCategory = require('./models/NewsCategory');
    
    const { limit = 20, categories } = req.query;
    
    let whereClause = { isActive: true };
    
    // Filter by categories if provided
    if (categories) {
      const categoryNames = categories.split(',');
      const categoryObjs = await NewsCategory.findAll({
        where: { name: categoryNames },
        attributes: ['id']
      });
      whereClause.categoryId = categoryObjs.map(cat => cat.id);
    }
    
    // Get real articles from database
    const articles = await NewsArticle.findAll({
      where: whereClause,
      include: [{ 
        model: NewsCategory, 
        attributes: ['name', 'displayName'] 
      }],
      order: [['publishedAt', 'DESC']],
      limit: Math.min(parseInt(limit), 50)
    });

    const formattedArticles = articles.map(article => ({
      id: article.id,
      title: article.title,
      description: article.description,
      url: article.url,
      imageUrl: article.imageUrl,
      source: article.source,
      author: article.author,
      publishedAt: article.publishedAt,
      category: article.NewsCategory.name,
      readTime: `${article.readTime} min read`,
      sentiment: article.sentiment,
      moodTags: article.moodTags || [],
      isBookmarked: false
    }));

    res.json({
      success: true,
      articles: formattedArticles,
      pagination: {
        totalCount: formattedArticles.length,
        hasMore: false
      }
    });
    
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch articles from database',
      details: error.message
    });
  }
});

// Real database categories endpoint  
app.get('/api/news/categories', async (req, res) => {
  try {
    const NewsCategory = require('./models/NewsCategory');
    
    const categories = await NewsCategory.findAll({
      where: { isActive: true },
      order: [['sortOrder', 'ASC']],
      attributes: ['id', 'name', 'displayName', 'description', 'icon', 'color']
    });

    res.json({
      success: true,
      data: categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        displayName: cat.displayName,
        description: cat.description,
        icon: cat.icon,
        color: cat.color,
        isDefault: cat.sortOrder <= 3
      }))
    });
    
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories from database',
      details: error.message
    });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 REAL DATABASE SERVER RUNNING ON PORT ${PORT}`);
  console.log(`📰 Using articles from news fetcher database!`);
  
  // Initialize database connection
  setTimeout(async () => {
    try {
      const sequelize = require('./db/sequelize');
      await sequelize.authenticate();
      console.log('✅ Database connected - ready to serve real articles!');
      
      // Count articles in database
      const NewsArticle = require('./models/NewsArticle');
      const count = await NewsArticle.count({ where: { isActive: true } });
      console.log(`📊 Database contains ${count} active articles ready to serve!`);
      
    } catch (error) {
      console.log('⚠️ Database connection issue:', error.message);
    }
  }, 2000);
});
