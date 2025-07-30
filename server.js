const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/weather', require('./routes/weatherRoutes'));

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'MindSync Core API - DynamoDB READY!',
    status: 'SUCCESS',
    version: '1.0.6',
    database: 'DynamoDB',
    timestamp: new Date().toISOString()
  });
});

// Test route
app.get('/test', (req, res) => {
  res.json({ 
    message: 'Backend working with DynamoDB!',
    timestamp: new Date().toISOString()
  });
});

// News base route - Info endpoint
app.get('/api/news/info', (req, res) => {
  res.json({
    success: true,
    message: 'MindSync News API - DynamoDB Ready!',
    version: '1.0.5',
    database: 'DynamoDB',
    endpoints: {
      news: '/api/news',
      categories: '/api/news/categories'
    },
    timestamp: new Date().toISOString()
  });
});

// Main news endpoint - GET /api/news
app.get('/api/news', async (req, res) => {
  try {
    console.log('📰 Fetching news articles from DynamoDB...');
    
    // Try to load DynamoDB service safely
    let dynamoService;
    try {
      dynamoService = require('./db/dynamodb');
    } catch (serviceError) {
      console.error('DynamoDB service loading error:', serviceError);
      return res.status(500).json({
        success: false,
        error: 'DynamoDB service not available',
        details: serviceError.message
      });
    }

    const { limit = 50, page = 1, categories } = req.query;
    const actualLimit = Math.min(parseInt(limit), 100);
    
    let articles = [];
    
    // Filter by categories if specified
    if (categories) {
      const categoryNames = categories.split(',').map(cat => cat.trim());
      console.log(`🔍 Filtering by categories: ${categoryNames.join(', ')}`);
      
      // Fetch articles for each category and combine
      for (const category of categoryNames) {
        try {
          const result = await dynamoService.getArticlesByCategory(category, actualLimit);
          if (result.Items) {
            articles = articles.concat(result.Items);
          }
        } catch (categoryError) {
          console.warn(`Failed to fetch category ${category}:`, categoryError.message);
        }
      }
      
      // Remove duplicates and sort by publishedAt
      const uniqueArticles = articles.reduce((acc, current) => {
        const exists = acc.find(item => item.id === current.id);
        if (!exists) {
          acc.push(current);
        }
        return acc;
      }, []);
      
      articles = uniqueArticles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
      
    } else {
      console.log('📰 Showing ALL categories (no filter)');
      
      try {
        // Get recent articles across all categories
        const result = await dynamoService.getRecentArticles(actualLimit);
        articles = result.Items || [];
      } catch (allArticlesError) {
        console.error('Failed to fetch all articles:', allArticlesError);
        articles = [];
      }
    }
    
    // Apply pagination
    const startIndex = (parseInt(page) - 1) * actualLimit;
    const endIndex = startIndex + actualLimit;
    const paginatedArticles = articles.slice(startIndex, endIndex);
    
    // Format articles to match your schema
    const formattedArticles = paginatedArticles.map(article => ({
      id: article.id,
      title: article.title,
      description: article.description,
      content: article.content || article.description, // Fallback if no content
      url: article.url,
      imageUrl: article.imageUrl,
      source: article.source,
      category: article.category,
      publishedAt: article.publishedAt,
      createdAt: article.createdAt || article.publishedAt,
      readTime: article.readTime || '5 min read'
    }));

    console.log(`✅ Returning ${formattedArticles.length} articles (page ${page})`);

    res.json({
      articles: formattedArticles,
      total: articles.length,
      page: parseInt(page),
      hasMore: endIndex < articles.length,
      selectedCategories: categories ? categories.split(',').map(cat => cat.trim()) : null
    });
    
  } catch (error) {
    console.error('❌ DynamoDB error in news endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch articles',
      details: error.message
    });
  }
});

// Categories endpoint
app.get('/api/news/categories', async (req, res) => {
  try {
    console.log('📂 Fetching categories from DynamoDB...');
    
    // Try to load DynamoDB service safely
    let dynamoService;
    try {
      dynamoService = require('./db/dynamodb');
    } catch (serviceError) {
      console.error('DynamoDB service loading error:', serviceError);
      return res.status(500).json({
        success: false,
        error: 'DynamoDB service not available',
        details: serviceError.message
      });
    }
    
    const result = await dynamoService.getCategories();
    const categories = result.Items || [];
    
    // Sort by sortOrder
    categories.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

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
    console.error('❌ DynamoDB error in categories endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories',
      details: error.message
    });
  }
});

// Category-specific articles endpoint (legacy support)
app.get('/api/news/articles/category/:category', async (req, res) => {
  try {
    console.log('📰 Fetching category articles from DynamoDB...');
    
    let dynamoService;
    try {
      dynamoService = require('./db/dynamodb');
    } catch (serviceError) {
      console.error('DynamoDB service loading error:', serviceError);
      return res.status(500).json({
        success: false,
        error: 'DynamoDB service not available',
        details: serviceError.message
      });
    }

    const { category } = req.params;
    const { limit = 20 } = req.query;
    
    console.log(`📰 Fetching articles for category: ${category}`);
    
    const result = await dynamoService.getArticlesByCategory(category, parseInt(limit));
    const articles = result.Items || [];

    const formattedArticles = articles.map(article => ({
      id: article.id,
      title: article.title,
      description: article.description,
      content: article.content || article.description,
      url: article.url,
      imageUrl: article.imageUrl,
      source: article.source,
      category: article.category,
      publishedAt: article.publishedAt,
      createdAt: article.createdAt || article.publishedAt,
      readTime: article.readTime || '5 min read'
    }));

    console.log(`✅ Returning ${formattedArticles.length} articles for category: ${category}`);

    res.json({
      success: true,
      articles: formattedArticles,
      category: category,
      pagination: {
        totalCount: formattedArticles.length,
        hasMore: !!result.LastEvaluatedKey
      }
    });
    
  } catch (error) {
    console.error('❌ DynamoDB error in category endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch category articles',
      details: error.message,
      category: req.params.category
    });
  }
});

// Manual news fetch endpoint (for testing/admin)
app.post('/api/news/fetch', async (req, res) => {
  try {
    console.log('🔄 Manual DynamoDB news fetch triggered...');
    
    const newsFetcher = require('./jobs/newsFetcherDynamo');
    
    // Run fetch in background
    newsFetcher.fetchNews().then(() => {
      console.log('📰 Manual DynamoDB news fetch completed!');
    }).catch(error => {
      console.error('❌ Manual DynamoDB news fetch failed:', error);
    });
    
    res.json({
      success: true,
      message: 'DynamoDB news fetch started in background',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error triggering DynamoDB news fetch:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger news fetch',
      details: error.message
    });
  }
});

// DynamoDB setup endpoint
app.post('/api/setup/dynamo', async (req, res) => {
  try {
    console.log('⚙️ Setting up DynamoDB tables...');
    
    // Create tables
    const { createAllTables } = require('./scripts/createDynamoTables');
    await createAllTables();
    
    // Seed categories
    const { seedCategories } = require('./seeders/seedDynamoCategories');
    await seedCategories();
    
    res.json({
      success: true,
      message: 'DynamoDB tables created and seeded successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error setting up DynamoDB:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to setup DynamoDB',
      details: error.message
    });
  }
});

// Add mock news data endpoint (for testing when APIs are rate limited)
app.post('/api/news/seed-mock', async (req, res) => {
  try {
    console.log('🧪 Adding mock news articles for testing...');
    
    const dynamoService = require('./db/dynamodb');
    const mockNewsData = require('./data/mockNews');
    
    let totalAdded = 0;
    
    for (const [categoryName, articles] of Object.entries(mockNewsData)) {
      console.log(`📰 Adding ${articles.length} mock articles for ${categoryName}...`);
      
      for (const article of articles) {
        try {
          await dynamoService.createArticle({
            ...article,
            category: categoryName,
            id: `mock-${categoryName}-${Date.now()}-${Math.random()}`,
            isActive: true,
            readTime: Math.floor(Math.random() * 5) + 3, // 3-8 minutes
            moodTags: ['positive'], // Add required moodTags field
            sentiment: 'positive'
          });
          totalAdded++;
        } catch (saveError) {
          console.error(`❌ Error saving mock article:`, saveError.message);
        }
      }
    }
    
    console.log(`✅ Added ${totalAdded} mock articles successfully!`);
    
    res.json({
      success: true,
      message: `Successfully added ${totalAdded} mock articles for testing`,
      categories: Object.keys(mockNewsData),
      totalArticles: totalAdded,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error adding mock news:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add mock news',
      details: error.message
    });
  }
});

// ===============================================
// AUTHENTICATION ENDPOINTS
// ===============================================

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log(`🔐 Login attempt for: ${email}`);
    
    // For now, return a mock successful login
    // TODO: Implement real authentication with DynamoDB
    if (email && password) {
      res.json({
        success: true,
        message: 'Login successful',
        user: {
          id: 'mock-user-id',
          email: email,
          name: email.split('@')[0],
          preferences: {
            categories: ['technology', 'science', 'business']
          }
        },
        token: 'mock-jwt-token-12345',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Email and password required'
      });
    }
    
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed',
      details: error.message
    });
  }
});

// Signup endpoint
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    console.log(`📝 Signup attempt for: ${email}`);
    
    // For now, return a mock successful signup
    // TODO: Implement real user creation with DynamoDB
    if (email && password) {
      res.json({
        success: true,
        message: 'Account created successfully',
        user: {
          id: 'mock-user-id-' + Date.now(),
          email: email,
          name: name || email.split('@')[0],
          preferences: {
            categories: ['general']
          }
        },
        token: 'mock-jwt-token-signup-' + Date.now(),
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Email and password required'
      });
    }
    
  } catch (error) {
    console.error('❌ Signup error:', error);
    res.status(500).json({
      success: false,
      error: 'Signup failed',
      details: error.message
    });
  }
});

// Verify token endpoint
app.get('/api/auth/verify', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // For now, accept any token as valid
      // TODO: Implement real JWT verification
      res.json({
        success: true,
        valid: true,
        user: {
          id: 'mock-user-id',
          email: 'user@example.com',
          name: 'Mock User'
        }
      });
    } else {
      res.status(401).json({
        success: false,
        valid: false,
        error: 'No valid token provided'
      });
    }
    
  } catch (error) {
    console.error('❌ Token verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Token verification failed',
      details: error.message
    });
  }
});

// User preferences endpoint
app.get('/api/user/preferences', (req, res) => {
  try {
    // Mock user preferences
    res.json({
      success: true,
      preferences: {
        categories: ['technology', 'science', 'business', 'health'],
        moodTracking: true,
        notifications: true,
        theme: 'light'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch preferences',
      details: error.message
    });
  }
});

// ===============================================
// SERVER STARTUP
// ===============================================

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 DYNAMODB SERVER RUNNING ON PORT ${PORT}`);
  console.log(`📊 Using DynamoDB for article storage!`);
  
  // Initialize DynamoDB connection and news fetching
  setTimeout(async () => {
    try {
      // Test DynamoDB connection
      const dynamoService = require('./db/dynamodb');
      const testResult = await dynamoService.getCategories();
      console.log(`✅ DynamoDB connected - ${testResult.Items?.length || 0} categories available`);
      
      // Start news fetching service
      try {
        const newsFetcher = require('./jobs/newsFetcherDynamo');
        newsFetcher.start();
        console.log('📰 DynamoDB news fetching service started - updates every 2 hours');
      } catch (fetcherError) {
        console.log('⚠️ News fetcher not available:', fetcherError.message);
      }
      
    } catch (error) {
      console.log('⚠️ DynamoDB connection issue:', error.message);
      console.log('🔄 Server will still run but without DynamoDB features');
      console.log('� Try: POST /api/setup/dynamo to initialize tables');
    }
  }, 3000);
});



