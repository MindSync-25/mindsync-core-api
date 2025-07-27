// db/localDynamoDB.js - Local file-based DynamoDB alternative
const fs = require('fs').promises;
const path = require('path');

class LocalDynamoDB {
  constructor() {
    this.dataDir = path.join(__dirname, '..', 'localdb');
    this.tables = {
      NewsArticles: 'news_articles.json',
      UserPreferences: 'user_preferences.json',
      UserActivity: 'user_activity.json',
      UserBookmarks: 'user_bookmarks.json',
      NewsCategories: 'news_categories.json'
    };
    
    this.initializeDatabase();
    console.log('🗄️ Local DynamoDB initialized - No AWS credentials needed!');
  }

  async initializeDatabase() {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
      
      // Initialize empty files if they don't exist
      for (const [tableName, fileName] of Object.entries(this.tables)) {
        const filePath = path.join(this.dataDir, fileName);
        try {
          await fs.access(filePath);
        } catch {
          await fs.writeFile(filePath, JSON.stringify([]));
          console.log(`📄 Created local table: ${tableName}`);
        }
      }
    } catch (error) {
      console.error('Error initializing local database:', error);
    }
  }

  async readTable(tableName) {
    try {
      const filePath = path.join(this.dataDir, this.tables[tableName]);
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error reading table ${tableName}:`, error);
      return [];
    }
  }

  async writeTable(tableName, data) {
    try {
      const filePath = path.join(this.dataDir, this.tables[tableName]);
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error(`Error writing table ${tableName}:`, error);
    }
  }

  // News Articles Operations
  async createArticle(article) {
    try {
      const articles = await this.readTable('NewsArticles');
      
      // Add TTL (simulate DynamoDB TTL)
      const articleWithTTL = {
        ...article,
        TTL: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Remove existing article with same ID
      const filteredArticles = articles.filter(a => a.id !== article.id);
      filteredArticles.push(articleWithTTL);
      
      await this.writeTable('NewsArticles', filteredArticles);
      console.log(`📰 Saved article: ${article.title.substring(0, 50)}...`);
      
      return { success: true };
    } catch (error) {
      console.error('Error creating article:', error);
      throw error;
    }
  }

  async getArticlesByCategory(category, limit = 20, lastEvaluatedKey = null) {
    try {
      const articles = await this.readTable('NewsArticles');
      
      // Filter by category and active status
      const filtered = articles
        .filter(article => article.category === category && article.isActive)
        .filter(article => {
          // Simulate TTL cleanup
          const now = Math.floor(Date.now() / 1000);
          return !article.TTL || article.TTL > now;
        })
        .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
        .slice(0, limit);

      return {
        Items: filtered,
        LastEvaluatedKey: filtered.length >= limit ? { hasMore: true } : null
      };
    } catch (error) {
      console.error('Error getting articles by category:', error);
      return { Items: [] };
    }
  }

  async getArticlesByMood(mood, limit = 20) {
    try {
      const articles = await this.readTable('NewsArticles');
      
      const filtered = articles
        .filter(article => 
          article.isActive && 
          article.moodTags && 
          article.moodTags.includes(mood)
        )
        .filter(article => {
          const now = Math.floor(Date.now() / 1000);
          return !article.TTL || article.TTL > now;
        })
        .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
        .slice(0, limit);

      return { Items: filtered };
    } catch (error) {
      console.error('Error getting articles by mood:', error);
      return { Items: [] };
    }
  }

  async getRecentArticles(limit = 20, categories = []) {
    try {
      const articles = await this.readTable('NewsArticles');
      
      let filtered = articles.filter(article => article.isActive);
      
      if (categories.length > 0) {
        filtered = filtered.filter(article => categories.includes(article.category));
      }
      
      // TTL cleanup
      filtered = filtered.filter(article => {
        const now = Math.floor(Date.now() / 1000);
        return !article.TTL || article.TTL > now;
      });
      
      filtered = filtered
        .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
        .slice(0, limit);

      return { Items: filtered };
    } catch (error) {
      console.error('Error getting recent articles:', error);
      return { Items: [] };
    }
  }

  // User Preferences Operations
  async saveUserPreferences(userId, preferences) {
    try {
      const allPreferences = await this.readTable('UserPreferences');
      const filtered = allPreferences.filter(p => p.userId !== userId);
      
      filtered.push({
        userId,
        ...preferences,
        updatedAt: new Date().toISOString()
      });
      
      await this.writeTable('UserPreferences', filtered);
      console.log(`💾 Saved preferences for user ${userId}`);
      
      return { success: true };
    } catch (error) {
      console.error('Error saving user preferences:', error);
      throw error;
    }
  }

  async getUserPreferences(userId) {
    try {
      const allPreferences = await this.readTable('UserPreferences');
      const userPrefs = allPreferences.find(p => p.userId === userId);
      
      return { Item: userPrefs || null };
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return { Item: null };
    }
  }

  // User Activity Operations
  async trackUserActivity(userId, articleId, actionType, mood = null) {
    try {
      const activities = await this.readTable('UserActivity');
      
      const activity = {
        id: `${userId}_${Date.now()}_${actionType}`,
        userId,
        articleId,
        actionType,
        moodAtTime: mood,
        timestamp: new Date().toISOString(),
        TTL: Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60) // 90 days
      };
      
      activities.push(activity);
      await this.writeTable('UserActivity', activities);
      
      return { success: true };
    } catch (error) {
      console.error('Error tracking user activity:', error);
      throw error;
    }
  }

  // Bookmarks Operations
  async addBookmark(userId, articleId) {
    try {
      const bookmarks = await this.readTable('UserBookmarks');
      
      // Remove existing bookmark if any
      const filtered = bookmarks.filter(b => !(b.userId === userId && b.articleId === articleId));
      
      filtered.push({
        id: `${userId}_${articleId}`,
        userId,
        articleId,
        bookmarkDate: new Date().toISOString()
      });
      
      await this.writeTable('UserBookmarks', filtered);
      return { success: true };
    } catch (error) {
      console.error('Error adding bookmark:', error);
      throw error;
    }
  }

  async removeBookmark(userId, articleId) {
    try {
      const bookmarks = await this.readTable('UserBookmarks');
      const filtered = bookmarks.filter(b => !(b.userId === userId && b.articleId === articleId));
      
      await this.writeTable('UserBookmarks', filtered);
      return { success: true };
    } catch (error) {
      console.error('Error removing bookmark:', error);
      throw error;
    }
  }

  async getUserBookmarks(userId, limit = 20) {
    try {
      const bookmarks = await this.readTable('UserBookmarks');
      const userBookmarks = bookmarks
        .filter(b => b.userId === userId)
        .slice(0, limit);
      
      return { Items: userBookmarks };
    } catch (error) {
      console.error('Error getting user bookmarks:', error);
      return { Items: [] };
    }
  }

  async isBookmarked(userId, articleId) {
    try {
      const bookmarks = await this.readTable('UserBookmarks');
      return bookmarks.some(b => b.userId === userId && b.articleId === articleId);
    } catch (error) {
      console.error('Error checking bookmark:', error);
      return false;
    }
  }

  // Categories Operations
  async getCategories() {
    try {
      const categories = await this.readTable('NewsCategories');
      const activeCategories = categories
        .filter(cat => cat.isActive)
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      
      return { Items: activeCategories };
    } catch (error) {
      console.error('Error getting categories:', error);
      return { Items: [] };
    }
  }

  async createCategory(category) {
    try {
      const categories = await this.readTable('NewsCategories');
      
      // Remove existing category with same name
      const filtered = categories.filter(c => c.name !== category.name);
      filtered.push({
        ...category,
        createdAt: new Date().toISOString()
      });
      
      await this.writeTable('NewsCategories', filtered);
      console.log(`📂 Created category: ${category.displayName}`);
      
      return { success: true };
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }

  // Cleanup expired items (simulate TTL)
  async cleanupExpiredItems() {
    try {
      const now = Math.floor(Date.now() / 1000);
      
      // Cleanup articles
      const articles = await this.readTable('NewsArticles');
      const validArticles = articles.filter(a => !a.TTL || a.TTL > now);
      if (validArticles.length !== articles.length) {
        await this.writeTable('NewsArticles', validArticles);
        console.log(`🗑️ Cleaned up ${articles.length - validArticles.length} expired articles`);
      }
      
      // Cleanup activities
      const activities = await this.readTable('UserActivity');
      const validActivities = activities.filter(a => !a.TTL || a.TTL > now);
      if (validActivities.length !== activities.length) {
        await this.writeTable('UserActivity', validActivities);
        console.log(`🗑️ Cleaned up ${activities.length - validActivities.length} expired activities`);
      }
      
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}

module.exports = new LocalDynamoDB();
