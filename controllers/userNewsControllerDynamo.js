// controllers/userNewsControllerDynamo.js
const dynamoService = require('../db/dynamodb');

class UserNewsController {
  // Save user news preferences
  async savePreferences(req, res) {
    try {
      const userId = req.user.id;
      const { interests, setupComplete = true, preferences = {} } = req.body;

      if (!interests || !Array.isArray(interests)) {
        return res.status(400).json({
          success: false,
          message: 'Interests array is required'
        });
      }

      console.log(`💾 Saving news preferences for user ${userId}`);
      
      await dynamoService.saveUserPreferences(userId, {
        interests,
        setupComplete,
        preferences
      });

      res.json({
        success: true,
        message: 'News preferences saved successfully',
        data: {
          userId,
          interests,
          setupComplete,
          preferences
        }
      });

    } catch (error) {
      console.error('Error saving user preferences:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to save preferences',
        error: error.message
      });
    }
  }

  // Get user news preferences
  async getPreferences(req, res) {
    try {
      const userId = req.user.id;

      console.log(`📖 Fetching news preferences for user ${userId}`);
      
      const result = await dynamoService.getUserPreferences(userId);
      const preferences = result.Item;

      if (!preferences) {
        return res.json({
          success: true,
          data: {
            userId,
            interests: [],
            setupComplete: false,
            preferences: {}
          }
        });
      }

      res.json({
        success: true,
        data: {
          userId: preferences.userId,
          interests: preferences.interests || [],
          setupComplete: preferences.setupComplete || false,
          preferences: preferences.preferences || {}
        }
      });

    } catch (error) {
      console.error('Error fetching user preferences:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch preferences',
        error: error.message
      });
    }
  }

  // Add bookmark
  async addBookmark(req, res) {
    try {
      const userId = req.user.id;
      const { articleId } = req.body;

      if (!articleId) {
        return res.status(400).json({
          success: false,
          message: 'Article ID is required'
        });
      }

      console.log(`🔖 Adding bookmark for user ${userId}, article ${articleId}`);
      
      await dynamoService.addBookmark(userId, articleId);
      
      // Track the bookmark activity
      await dynamoService.trackUserActivity(userId, articleId, 'bookmark');

      res.json({
        success: true,
        message: 'Article bookmarked successfully',
        data: {
          userId,
          articleId,
          bookmarked: true
        }
      });

    } catch (error) {
      console.error('Error adding bookmark:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add bookmark',
        error: error.message
      });
    }
  }

  // Remove bookmark
  async removeBookmark(req, res) {
    try {
      const userId = req.user.id;
      const { articleId } = req.params;

      if (!articleId) {
        return res.status(400).json({
          success: false,
          message: 'Article ID is required'
        });
      }

      console.log(`🗑️ Removing bookmark for user ${userId}, article ${articleId}`);
      
      await dynamoService.removeBookmark(userId, articleId);

      res.json({
        success: true,
        message: 'Bookmark removed successfully',
        data: {
          userId,
          articleId,
          bookmarked: false
        }
      });

    } catch (error) {
      console.error('Error removing bookmark:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove bookmark',
        error: error.message
      });
    }
  }

  // Get user bookmarks
  async getBookmarks(req, res) {
    try {
      const userId = req.user.id;
      const { limit = 20 } = req.query;

      console.log(`📚 Fetching bookmarks for user ${userId}`);
      
      const result = await dynamoService.getUserBookmarks(userId, parseInt(limit));
      const bookmarks = result.Items || [];

      // Extract article IDs from bookmarks
      const articleIds = bookmarks.map(bookmark => 
        bookmark.SK.replace('BOOKMARK#', '')
      );

      res.json({
        success: true,
        data: {
          bookmarks: bookmarks.map(bookmark => ({
            articleId: bookmark.articleId,
            bookmarkDate: bookmark.bookmarkDate
          })),
          articleIds,
          count: bookmarks.length
        }
      });

    } catch (error) {
      console.error('Error fetching bookmarks:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch bookmarks',
        error: error.message
      });
    }
  }

  // Check if article is bookmarked
  async checkBookmark(req, res) {
    try {
      const userId = req.user.id;
      const { articleId } = req.params;

      if (!articleId) {
        return res.status(400).json({
          success: false,
          message: 'Article ID is required'
        });
      }

      const isBookmarked = await dynamoService.isBookmarked(userId, articleId);

      res.json({
        success: true,
        data: {
          userId,
          articleId,
          isBookmarked
        }
      });

    } catch (error) {
      console.error('Error checking bookmark:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check bookmark status',
        error: error.message
      });
    }
  }

  // Track user activity (share, click, etc.)
  async trackActivity(req, res) {
    try {
      const userId = req.user.id;
      const { articleId, actionType, mood } = req.body;

      if (!articleId || !actionType) {
        return res.status(400).json({
          success: false,
          message: 'Article ID and action type are required'
        });
      }

      console.log(`📊 Tracking ${actionType} activity for user ${userId}, article ${articleId}`);
      
      await dynamoService.trackUserActivity(userId, articleId, actionType, mood);

      res.json({
        success: true,
        message: 'Activity tracked successfully',
        data: {
          userId,
          articleId,
          actionType,
          mood
        }
      });

    } catch (error) {
      console.error('Error tracking activity:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to track activity',
        error: error.message
      });
    }
  }

  // Get user reading stats (placeholder for analytics)
  async getReadingStats(req, res) {
    try {
      const userId = req.user.id;

      // Note: In a real implementation, we'd query user activity
      // and aggregate reading statistics from DynamoDB
      
      res.json({
        success: true,
        data: {
          userId,
          stats: {
            articlesRead: 0,
            bookmarksCount: 0,
            favoriteCategories: [],
            readingStreak: 0,
            totalReadingTime: 0
          },
          message: 'Reading stats aggregation not yet implemented for DynamoDB'
        }
      });

    } catch (error) {
      console.error('Error fetching reading stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch reading stats',
        error: error.message
      });
    }
  }
}

module.exports = new UserNewsController();
