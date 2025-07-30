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

// Real database articles endpoint - NEWS FEED (ALL ARTICLES)
app.get('/api/news/articles', async (req, res) => {
  try {
    const NewsArticle = require('./models/NewsArticle');
    const NewsCategory = require('./models/NewsCategory');
    
    const { limit = 50 } = req.query; // Increased default limit for news feed
    
    // NEWS FEED: Get ALL articles, no category filtering
    console.log(`📰 Fetching news feed - showing ALL articles (limit: ${limit})`);
    
    // Get ALL real articles from database
    const articles = await NewsArticle.findAll({
      where: { isActive: true }, // No category filter - show ALL news
      include: [{ 
        model: NewsCategory, 
        attributes: ['name', 'displayName'] 
      }],
      order: [['publishedAt', 'DESC']], // Latest first
      limit: Math.min(parseInt(limit), 100) // Allow more articles for feed
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

    console.log(`✅ Returning ${formattedArticles.length} articles from ALL categories`);

    res.json({
      success: true,
      articles: formattedArticles,
      pagination: {
        totalCount: formattedArticles.length,
        hasMore: formattedArticles.length >= parseInt(limit)
      },
      source: 'database_all_categories'
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

// Category-specific articles endpoint (for when users want specific categories)
app.get('/api/news/articles/category/:category', async (req, res) => {
  try {
    const NewsArticle = require('./models/NewsArticle');
    const NewsCategory = require('./models/NewsCategory');
    
    const { category } = req.params;
    const { limit = 20, mood } = req.query;
    
    console.log(`📰 Fetching articles for specific category: ${category}, mood: ${mood}`);
    
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

    let formattedArticles = articles.map(article => ({
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
      isBookmarked: false,
      isHealthyContent: true // Default to true for existing articles
    }));

    // Apply mood filtering if mood is specified
    if (mood) {
      formattedArticles = filterContentForMood(formattedArticles, mood);
      console.log(`🎭 Applied mood filter '${mood}': ${formattedArticles.length} articles remaining`);
    }

    console.log(`✅ Returning ${formattedArticles.length} articles for category: ${category}`);

    res.json({
      success: true,
      articles: formattedArticles,
      category: category,
      categoryDisplayName: categoryObj.displayName,
      moodFilter: mood || null,
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

// Helper function for mood filtering (in case it's called somewhere)
function filterContentForMood(articles, mood) {
  if (!mood) return articles;

  return articles.filter(article => {
    // For vulnerable moods, be more strict
    if (['sad', 'stressed'].includes(mood)) {
      return article.sentiment !== 'negative' && 
             article.isHealthyContent === true &&
             !article.title.toLowerCase().includes('crisis');
    }
    
    // For positive moods, include motivational content
    if (['excited', 'motivated'].includes(mood)) {
      return article.sentiment !== 'negative';
    }
    
    return article.isHealthyContent === true;
  });
}

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
