// controllers/newsController.js
const NewsCategory = require('../models/NewsCategory');
const NewsArticle = require('../models/NewsArticle');
const UserNewsPreference = require('../models/UserNewsPreference');
const UserBookmark = require('../models/UserBookmark');
const UserNewsActivity = require('../models/UserNewsActivity');

// Mood-category mapping logic
const MOOD_CATEGORY_MAPPING = {
  happy: ['lifestyle', 'entertainment', 'food', 'travel', 'sports'],
  excited: ['technology', 'gaming', 'entertainment', 'sports'],
  motivated: ['business', 'health', 'education', 'technology'],
  relaxed: ['lifestyle', 'food', 'travel', 'health', 'environment'],
  sad: ['health', 'lifestyle', 'education', 'environment'],
  stressed: ['health', 'lifestyle', 'environment', 'education']
};

const MAX_LIMIT = 50;

module.exports = {
  // GET /api/news/categories
  async getCategories(req, res) {
    try {
      const categories = await NewsCategory.findAll({
        where: { isActive: true },
        order: [['sortOrder', 'ASC']],
        attributes: ['id', 'name', 'displayName', 'description', 'icon', 'color']
      });

      res.json({
        categories: categories.map(cat => ({
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
      console.error('Error fetching categories:', error);
      res.status(500).json({ error: 'Failed to fetch categories', details: error.message });
    }
  },

  // GET /api/news/articles
  async getArticles(req, res) {
    try {
      const { mood, categories, limit = 20, offset = 0, source } = req.query;
      const userId = req.user?.id;
      
      const actualLimit = Math.min(parseInt(limit), MAX_LIMIT);
      const actualOffset = parseInt(offset) || 0;

      let whereClause = { 
        isActive: true,
        publishedAt: {
          [require('sequelize').Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      };
      let categoryFilter = [];

      // Handle mood-based filtering for authenticated users
      if (mood && userId) {
        const userPrefs = await UserNewsPreference.findAll({
          where: { userId, isSelected: true },
          include: [{ model: NewsCategory, attributes: ['name'] }]
        });
        
        const userCategories = userPrefs.map(pref => pref.NewsCategory.name);
        const moodCategories = MOOD_CATEGORY_MAPPING[mood] || [];
        categoryFilter = moodCategories.filter(cat => userCategories.includes(cat));
        
        // If no user preferences, use default mood categories
        if (categoryFilter.length === 0) {
          categoryFilter = moodCategories.slice(0, 3); // Default top 3 for mood
        }
      }

      // Handle explicit category filtering
      if (categories) {
        const requestedCategories = categories.split(',');
        categoryFilter = categoryFilter.length > 0 
          ? categoryFilter.filter(cat => requestedCategories.includes(cat))
          : requestedCategories;
      }

      // Apply category filter
      if (categoryFilter.length > 0) {
        const categoryObjs = await NewsCategory.findAll({
          where: { name: categoryFilter },
          attributes: ['id']
        });
        whereClause.categoryId = categoryObjs.map(cat => cat.id);
      }

      // Apply source filter
      if (source) {
        whereClause.source = source;
      }

      // Get articles from DATABASE (not live API calls)
      const articles = await NewsArticle.findAll({
        where: whereClause,
        include: [
          { model: NewsCategory, attributes: ['name', 'displayName'] },
          ...(userId ? [{
            model: UserBookmark,
            where: { userId },
            required: false,
            attributes: ['id']
          }] : [])
        ],
        order: [['publishedAt', 'DESC']],
        limit: actualLimit,
        offset: actualOffset
      });

      // Filter for mood-based content safety
      const filteredArticles = module.exports.filterContentForMood(articles, mood);

      const totalCount = await NewsArticle.count({ where: whereClause });

      res.json({
        articles: filteredArticles.map(article => ({
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
          moodTags: article.moodTags,
          isBookmarked: userId ? !!article.UserBookmarks?.length : false
        })),
        pagination: {
          limit: actualLimit,
          offset: actualOffset,
          totalCount,
          hasMore: (actualOffset + actualLimit) < totalCount,
          nextOffset: actualOffset + actualLimit
        }
      });
    } catch (error) {
      console.error('Error fetching articles:', error);
      res.status(500).json({ error: 'Failed to fetch articles', details: error.message });
    }
  },

  // GET /api/news/articles/mood/:mood
  async getArticlesByMood(req, res) {
    try {
      const { mood } = req.params;
      const { limit = 20, offset = 0 } = req.query;
      const userId = req.user.id;

      const userPrefs = await UserNewsPreference.findAll({
        where: { userId, isSelected: true },
        include: [{ model: NewsCategory, attributes: ['name'] }]
      });

      const userCategories = userPrefs.map(pref => pref.NewsCategory.name);
      const moodCategories = MOOD_CATEGORY_MAPPING[mood] || [];
      let targetCategories = moodCategories.filter(cat => userCategories.includes(cat));

      // If no user preferences match mood, use top mood categories
      if (targetCategories.length === 0) {
        targetCategories = moodCategories.slice(0, 3);
      }

      if (targetCategories.length === 0) {
        return res.json({ articles: [], pagination: { totalCount: 0, hasMore: false } });
      }

      const categoryObjs = await NewsCategory.findAll({
        where: { name: targetCategories },
        attributes: ['id']
      });

      // Get articles from DATABASE with fresh content (last 7 days)
      const articles = await NewsArticle.findAll({
        where: {
          isActive: true,
          categoryId: categoryObjs.map(cat => cat.id),
          publishedAt: {
            [require('sequelize').Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        },
        include: [
          { model: NewsCategory, attributes: ['name'] },
          { model: UserBookmark, where: { userId }, required: false, attributes: ['id'] }
        ],
        order: [['publishedAt', 'DESC']],
        limit: Math.min(parseInt(limit), MAX_LIMIT),
        offset: parseInt(offset) || 0
      });

      const filteredArticles = module.exports.filterContentForMood(articles, mood);

      res.json({
        articles: filteredArticles.map(article => ({
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
          moodTags: article.moodTags,
          isBookmarked: !!article.UserBookmarks?.length
        }))
      });
    } catch (error) {
      console.error('Error fetching mood-based articles:', error);
      res.status(500).json({ error: 'Failed to fetch mood-based articles', details: error.message });
    }
  },

  // POST /api/news/articles/:articleId/bookmark
  async bookmarkArticle(req, res) {
    try {
      const { articleId } = req.params;
      const { mood } = req.body;
      const userId = req.user.id;

      await UserBookmark.findOrCreate({
        where: { userId, articleId },
        defaults: { userId, articleId }
      });

      // Track activity
      await UserNewsActivity.create({
        userId,
        articleId,
        actionType: 'bookmark',
        moodAtTime: mood
      });

      res.json({ success: true, message: 'Article bookmarked successfully' });
    } catch (error) {
      console.error('Error bookmarking article:', error);
      res.status(500).json({ error: 'Failed to bookmark article', details: error.message });
    }
  },

  // DELETE /api/news/articles/:articleId/bookmark
  async removeBookmark(req, res) {
    try {
      const { articleId } = req.params;
      const userId = req.user.id;

      await UserBookmark.destroy({
        where: { userId, articleId }
      });

      res.json({ success: true, message: 'Bookmark removed successfully' });
    } catch (error) {
      console.error('Error removing bookmark:', error);
      res.status(500).json({ error: 'Failed to remove bookmark', details: error.message });
    }
  },

  // GET /api/news/bookmarks
  async getBookmarks(req, res) {
    try {
      const userId = req.user.id;
      const { limit = 20, offset = 0 } = req.query;

      const bookmarks = await UserBookmark.findAll({
        where: { userId },
        include: [{
          model: NewsArticle,
          include: [{ model: NewsCategory, attributes: ['name'] }]
        }],
        order: [['bookmarkDate', 'DESC']],
        limit: Math.min(parseInt(limit), MAX_LIMIT),
        offset: parseInt(offset) || 0
      });

      res.json({
        bookmarks: bookmarks.map(bookmark => ({
          id: bookmark.NewsArticle.id,
          title: bookmark.NewsArticle.title,
          description: bookmark.NewsArticle.description,
          url: bookmark.NewsArticle.url,
          imageUrl: bookmark.NewsArticle.imageUrl,
          source: bookmark.NewsArticle.source,
          author: bookmark.NewsArticle.author,
          publishedAt: bookmark.NewsArticle.publishedAt,
          category: bookmark.NewsArticle.NewsCategory.name,
          readTime: `${bookmark.NewsArticle.readTime} min read`,
          sentiment: bookmark.NewsArticle.sentiment,
          moodTags: bookmark.NewsArticle.moodTags,
          bookmarkDate: bookmark.bookmarkDate,
          isBookmarked: true
        }))
      });
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
      res.status(500).json({ error: 'Failed to fetch bookmarks', details: error.message });
    }
  },

  // POST /api/news/articles/:articleId/view
  async trackView(req, res) {
    try {
      const { articleId } = req.params;
      const { mood, readTime } = req.body;
      const userId = req.user.id;

      // Track activity
      await UserNewsActivity.create({
        userId,
        articleId,
        actionType: 'view',
        moodAtTime: mood
      });

      // Increment view count
      await NewsArticle.increment('viewCount', { where: { id: articleId } });

      res.json({ success: true, message: 'View tracked successfully' });
    } catch (error) {
      console.error('Error tracking view:', error);
      res.status(500).json({ error: 'Failed to track view', details: error.message });
    }
  },

  // POST /api/news/articles/:articleId/share
  async trackShare(req, res) {
    try {
      const { articleId } = req.params;
      const { platform, mood } = req.body;
      const userId = req.user.id;

      await UserNewsActivity.create({
        userId,
        articleId,
        actionType: 'share',
        moodAtTime: mood
      });

      res.json({ success: true, message: 'Share tracked successfully' });
    } catch (error) {
      console.error('Error tracking share:', error);
      res.status(500).json({ error: 'Failed to track share', details: error.message });
    }
  },

  // Content filtering logic
  filterContentForMood(articles, mood) {
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
};
