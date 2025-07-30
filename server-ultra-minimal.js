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
    version: '1.0.2',
    timestamp: new Date().toISOString()
  });
});

// Test route
app.get('/test', (req, res) => {
  res.json({ 
    message: 'Backend is working!',
    timestamp: new Date().toISOString()
  });
});

// News base route
app.get('/api/news', (req, res) => {
  res.json({
    success: true,
    message: 'MindSync News API - Ready!',
    version: '1.0.2',
    endpoints: {
      categories: '/api/news/categories',
      articles: '/api/news/articles'
    },
    timestamp: new Date().toISOString()
  });
});

// Working articles endpoint - NO COMPLEX LOGIC
app.get('/api/news/articles', (req, res) => {
  const articles = [
    {
      id: 1,
      title: "AI Revolution in Healthcare",
      description: "New breakthrough in medical AI technology",
      url: "https://example.com/ai-health",
      imageUrl: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800",
      source: "TechDaily",
      author: "Dr. Smith",
      publishedAt: new Date().toISOString(),
      category: "technology",
      readTime: "5 min read"
    },
    {
      id: 2,
      title: "Global Climate Progress",
      description: "Major environmental milestone achieved",
      url: "https://example.com/climate",
      imageUrl: "https://images.unsplash.com/photo-1569163139394-de44e3ab7249?w=800",
      source: "EcoNews",
      author: "Green Reporter",
      publishedAt: new Date().toISOString(),
      category: "environment",
      readTime: "4 min read"
    },
    {
      id: 3,
      title: "Sports Championship Victory",
      description: "Historic win inspires millions worldwide",
      url: "https://example.com/sports",
      imageUrl: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800",
      source: "SportsCentral",
      author: "Sports Writer",
      publishedAt: new Date().toISOString(),
      category: "sports", 
      readTime: "3 min read"
    }
  ];

  res.json({
    success: true,
    articles: articles,
    pagination: {
      totalCount: articles.length,
      hasMore: false
    }
  });
});

// Categories endpoint  
app.get('/api/news/categories', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 1, name: 'technology', displayName: 'Technology' },
      { id: 2, name: 'health', displayName: 'Health' },
      { id: 3, name: 'sports', displayName: 'Sports' },
      { id: 4, name: 'business', displayName: 'Business' },
      { id: 5, name: 'entertainment', displayName: 'Entertainment' },
      { id: 6, name: 'science', displayName: 'Science' },
      { id: 7, name: 'environment', displayName: 'Environment' }
    ]
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 ULTRA-MINIMAL SERVER RUNNING ON PORT ${PORT}`);
  console.log(`✅ Articles endpoint: /api/news/articles`);
});
