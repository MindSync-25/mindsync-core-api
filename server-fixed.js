const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'MindSync Core API - FIXED!',
    status: 'SUCCESS',
    version: '1.0.4',
    timestamp: new Date().toISOString()
  });
});

// Test route
app.get('/test', (req, res) => {
  res.json({ 
    message: 'Backend FIXED and working!',
    timestamp: new Date().toISOString()
  });
});

// News base route
app.get('/api/news', (req, res) => {
  res.json({
    success: true,
    message: 'MindSync News API - FIXED!',
    version: '1.0.4',
    endpoints: {
      categories: '/api/news/categories',
      articles: '/api/news/articles'
    },
    timestamp: new Date().toISOString()
  });
});

// ALL articles endpoint - NEWS FEED
app.get('/api/news/articles', async (req, res) => {
  try {
    console.log('📰 Fetching articles for news feed...');
    
    // Try to load models safely
    let NewsArticle, NewsCategory;
    try {
      NewsArticle = require('./models/NewsArticle');
      NewsCategory = require('./models/NewsCategory');
    } catch (modelError) {
      console.error('Model loading error:', modelError);
      return res.status(500).json({
        success: false,
        error: 'Database models not available',
        details: modelError.message
      });
    }

    const { limit = 50, categories } = req.query;
    
    let whereClause = { isActive: true };
    
    // Filter by categories if user selected specific ones
    if (categories) {
      const categoryNames = categories.split(',');
      console.log(`🔍 Filtering by categories: ${categoryNames.join(', ')}`);
      
      const categoryObjs = await NewsCategory.findAll({
        where: { name: categoryNames },
        attributes: ['id']
      });
      
      if (categoryObjs.length > 0) {
        whereClause.categoryId = categoryObjs.map(cat => cat.id);
      }
    } else {
      console.log('📰 Showing ALL categories (no filter)');
    }
    
    // Get articles from database
    const articles = await NewsArticle.findAll({
      where: whereClause,
      include: [{ 
        model: NewsCategory, 
        attributes: ['name', 'displayName'] 
      }],
      order: [['publishedAt', 'DESC']],
      limit: Math.min(parseInt(limit), 100)
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
      category: article.NewsCategory ? article.NewsCategory.name : 'general',
      readTime: `${article.readTime || 5} min read`,
      sentiment: article.sentiment || 'neutral',
      moodTags: article.moodTags || [],
      isBookmarked: false
    }));

    console.log(`✅ Returning ${formattedArticles.length} articles`);

    res.json({
      success: true,
      articles: formattedArticles,
      selectedCategories: categories ? categories.split(',') : 'all',
      pagination: {
        totalCount: formattedArticles.length,
        hasMore: formattedArticles.length >= parseInt(limit)
      },
      source: 'database'
    });
    
  } catch (error) {
    console.error('❌ Database error in articles endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch articles',
      details: error.message
    });
  }
});

// Category-specific articles endpoint
app.get('/api/news/articles/category/:category', async (req, res) => {
  try {
    console.log('📰 Fetching category articles...');
    
    // Try to load models safely
    let NewsArticle, NewsCategory;
    try {
      NewsArticle = require('./models/NewsArticle');
      NewsCategory = require('./models/NewsCategory');
    } catch (modelError) {
      console.error('Model loading error:', modelError);
      return res.status(500).json({
        success: false,
        error: 'Database models not available',
        details: modelError.message
      });
    }

    const { category } = req.params;
    const { limit = 20 } = req.query;
    
    console.log(`📰 Fetching articles for category: ${category}`);
    
    // Get category-specific articles
    const categoryObj = await NewsCategory.findOne({ where: { name: category } });
    if (!categoryObj) {
      console.log(`❌ Category not found: ${category}`);
      return res.status(404).json({ 
        success: false,
        error: 'Category not found',
        category: category,
        availableCategories: ['technology', 'gaming', 'business', 'science', 'health']
      });
    }
    
    const articles = await NewsArticle.findAll({
      where: { 
        isActive: true,
        categoryId: categoryObj.id 
      },
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
      category: article.NewsCategory ? article.NewsCategory.name : category,
      readTime: `${article.readTime || 5} min read`,
      sentiment: article.sentiment || 'neutral',
      moodTags: article.moodTags || [],
      isBookmarked: false
    }));

    console.log(`✅ Returning ${formattedArticles.length} articles for category: ${category}`);

    res.json({
      success: true,
      articles: formattedArticles,
      category: category,
      categoryDisplayName: categoryObj.displayName,
      pagination: {
        totalCount: formattedArticles.length,
        hasMore: false
      }
    });
    
  } catch (error) {
    console.error('❌ Database error in category endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch category articles',
      details: error.message,
      category: req.params.category
    });
  }
});

// Categories endpoint
app.get('/api/news/categories', async (req, res) => {
  try {
    console.log('📂 Fetching categories...');
    
    // Try to load models safely
    let NewsCategory;
    try {
      NewsCategory = require('./models/NewsCategory');
    } catch (modelError) {
      console.error('Model loading error:', modelError);
      return res.status(500).json({
        success: false,
        error: 'Database models not available',
        details: modelError.message
      });
    }
    
    const categories = await NewsCategory.findAll({
      where: { isActive: true },
      order: [['sortOrder', 'ASC']],
      attributes: ['id', 'name', 'displayName', 'description', 'icon', 'color', 'sortOrder']
    });

    console.log(`✅ Returning ${categories.length} categories`);

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
    console.error('❌ Database error in categories endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories',
      details: error.message
    });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 FIXED SERVER RUNNING ON PORT ${PORT}`);
  console.log(`📰 Using safe database connection!`);
  
  // Initialize database connection safely
  setTimeout(async () => {
    try {
      const sequelize = require('./db/sequelize');
      await sequelize.authenticate();
      console.log('✅ Database connected successfully!');
      
      // Count articles in database
      try {
        const NewsArticle = require('./models/NewsArticle');
        const count = await NewsArticle.count({ where: { isActive: true } });
        console.log(`📊 Database contains ${count} active articles!`);
      } catch (countError) {
        console.log('📊 Article count not available:', countError.message);
      }
      
    } catch (error) {
      console.log('⚠️ Database connection issue:', error.message);
      console.log('🔄 Server will still run but without database features');
    }
  }, 3000);
});
