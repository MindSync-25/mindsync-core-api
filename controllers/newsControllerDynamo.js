// controllers/newsControllerDynamo.js
const dynamoService = require('../db/dynamodb');

class NewsController {
  // Get all news categories
  async getCategories(req, res) {
    try {
      const result = await dynamoService.getCategories();
      const categories = result.Items || [];
      
      // Sort by sortOrder
      categories.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      
      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch categories',
        error: error.message
      });
    }
  }

  // Get articles by category with caching
  async getArticlesByCategory(req, res) {
    try {
      const { category } = req.params;
      const { limit = 20, lastKey } = req.query;
      
      let lastEvaluatedKey = null;
      if (lastKey) {
        try {
          lastEvaluatedKey = JSON.parse(Buffer.from(lastKey, 'base64').toString());
        } catch (e) {
          console.warn('Invalid lastKey provided:', lastKey);
        }
      }

      console.log(`📰 Fetching ${limit} articles for category: ${category}`);
      
      const result = await dynamoService.getArticlesByCategory(category, parseInt(limit), lastEvaluatedKey);
      const articles = result.Items || [];
      
      // Convert DynamoDB response to expected format
      const formattedArticles = articles.map(article => ({
        id: article.id,
        title: article.title,
        description: article.description,
        url: article.url,
        imageUrl: article.imageUrl,
        source: article.source,
        author: article.author,
        publishedAt: article.publishedAt,
        category: article.category,
        readTime: article.readTime,
        sentiment: article.sentiment,
        moodTags: article.moodTags || [],
        isHealthyContent: article.isHealthyContent,
        viewCount: article.viewCount || 0
      }));

      // Encode next page key
      let nextPageKey = null;
      if (result.LastEvaluatedKey) {
        nextPageKey = Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64');
      }

      res.json({
        success: true,
        data: formattedArticles,
        pagination: {
          hasMore: !!result.LastEvaluatedKey,
          nextPageKey,
          count: formattedArticles.length
        }
      });

    } catch (error) {
      console.error('Error fetching articles by category:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch articles',
        error: error.message
      });
    }
  }

  // Get recent articles across categories
  async getRecentArticles(req, res) {
    try {
      const { limit = 20, categories } = req.query;
      
      let categoryList = [];
      if (categories) {
        categoryList = Array.isArray(categories) ? categories : categories.split(',');
      }

      console.log(`📰 Fetching ${limit} recent articles${categoryList.length ? ` for categories: ${categoryList.join(', ')}` : ''}`);
      
      const result = await dynamoService.getRecentArticles(parseInt(limit), categoryList);
      const articles = result.Items || [];
      
      // Format articles for response
      const formattedArticles = articles.map(article => ({
        id: article.id,
        title: article.title,
        description: article.description,
        url: article.url,
        imageUrl: article.imageUrl,
        source: article.source,
        author: article.author,
        publishedAt: article.publishedAt,
        category: article.category,
        readTime: article.readTime,
        sentiment: article.sentiment,
        moodTags: article.moodTags || [],
        isHealthyContent: article.isHealthyContent,
        viewCount: article.viewCount || 0
      }));

      res.json({
        success: true,
        data: formattedArticles,
        count: formattedArticles.length
      });

    } catch (error) {
      console.error('Error fetching recent articles:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch recent articles',
        error: error.message
      });
    }
  }

  // Get mood-based articles for AI recommendation
  async getMoodBasedArticles(req, res) {
    try {
      const { mood } = req.params;
      const { limit = 15 } = req.query;

      console.log(`🎭 Fetching ${limit} articles for mood: ${mood}`);
      
      const result = await dynamoService.getArticlesByMood(mood, parseInt(limit));
      const articles = result.Items || [];
      
      // Format articles for response
      const formattedArticles = articles.map(article => ({
        id: article.id,
        title: article.title,
        description: article.description,
        url: article.url,
        imageUrl: article.imageUrl,
        source: article.source,
        author: article.author,
        publishedAt: article.publishedAt,
        category: article.category,
        readTime: article.readTime,
        sentiment: article.sentiment,
        moodTags: article.moodTags || [],
        isHealthyContent: article.isHealthyContent,
        viewCount: article.viewCount || 0
      }));

      res.json({
        success: true,
        data: formattedArticles,
        mood: mood,
        count: formattedArticles.length
      });

    } catch (error) {
      console.error('Error fetching mood-based articles:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch mood-based articles',
        error: error.message
      });
    }
  }

  // Track article view and increment count
  async trackArticleView(req, res) {
    try {
      const { articleId } = req.params;
      const userId = req.user?.id;
      const { mood } = req.body;

      // Track user activity if user is authenticated
      if (userId) {
        await dynamoService.trackUserActivity(userId, articleId, 'view', mood);
      }

      // Note: In DynamoDB, we'd need to implement atomic counters for view count
      // For now, we'll track the activity and handle view counts in aggregation

      res.json({
        success: true,
        message: 'Article view tracked successfully'
      });

    } catch (error) {
      console.error('Error tracking article view:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to track article view',
        error: error.message
      });
    }
  }

  // Get personalized news feed (placeholder for AI recommendations)
  async getPersonalizedFeed(req, res) {
    try {
      const userId = req.user.id;
      const { limit = 20 } = req.query;

      // Get user preferences
      const preferencesResult = await dynamoService.getUserPreferences(userId);
      const userPreferences = preferencesResult.Item;

      if (!userPreferences || !userPreferences.interests) {
        // Fallback to recent articles if no preferences
        return this.getRecentArticles(req, res);
      }

      // Get articles based on user interests
      const interests = userPreferences.interests;
      const categoryList = interests.map(interest => interest.category);
      
      console.log(`👤 Fetching personalized feed for user ${userId} with interests: ${categoryList.join(', ')}`);
      
      const result = await dynamoService.getRecentArticles(parseInt(limit), categoryList);
      const articles = result.Items || [];
      
      // Format articles for response
      const formattedArticles = articles.map(article => ({
        id: article.id,
        title: article.title,
        description: article.description,
        url: article.url,
        imageUrl: article.imageUrl,
        source: article.source,
        author: article.author,
        publishedAt: article.publishedAt,
        category: article.category,
        readTime: article.readTime,
        sentiment: article.sentiment,
        moodTags: article.moodTags || [],
        isHealthyContent: article.isHealthyContent,
        viewCount: article.viewCount || 0
      }));

      res.json({
        success: true,
        data: formattedArticles,
        personalized: true,
        userInterests: categoryList,
        count: formattedArticles.length
      });

    } catch (error) {
      console.error('Error fetching personalized feed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch personalized feed',
        error: error.message
      });
    }
  }
}

module.exports = new NewsController();
