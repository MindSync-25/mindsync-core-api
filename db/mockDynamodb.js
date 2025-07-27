// db/mockDynamodb.js - Local development mock
class MockDynamoDBService {
  constructor() {
    this.articles = new Map();
    this.categories = new Map();
    this.userPreferences = new Map();
    this.userBookmarks = new Map();
    this.userActivity = new Map();
    
    console.log('🔧 Using Mock DynamoDB for local development');
    console.log('💡 No AWS credentials required');
  }

  // News Articles Operations
  async createArticle(article) {
    const key = `${article.category}#${article.id}`;
    this.articles.set(key, article);
    console.log(`📝 Mock: Created article ${article.id} in ${article.category}`);
    return { success: true };
  }

  async getArticlesByCategory(category, limit = 20, lastEvaluatedKey = null) {
    const articles = Array.from(this.articles.values())
      .filter(article => article.category === category && article.isActive)
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
      .slice(0, limit);

    return {
      Items: articles,
      LastEvaluatedKey: articles.length >= limit ? { hasMore: true } : null
    };
  }

  async getArticlesByMood(mood, limit = 20) {
    const articles = Array.from(this.articles.values())
      .filter(article => article.moodTags && article.moodTags.includes(mood) && article.isActive)
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
      .slice(0, limit);

    return { Items: articles };
  }

  async getRecentArticles(limit = 20, categories = []) {
    let articles = Array.from(this.articles.values())
      .filter(article => article.isActive);

    if (categories.length > 0) {
      articles = articles.filter(article => categories.includes(article.category));
    }

    articles = articles
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
      .slice(0, limit);

    return { Items: articles };
  }

  // User Preferences Operations
  async saveUserPreferences(userId, preferences) {
    this.userPreferences.set(userId, {
      userId,
      ...preferences,
      updatedAt: new Date().toISOString()
    });
    console.log(`💾 Mock: Saved preferences for user ${userId}`);
    return { success: true };
  }

  async getUserPreferences(userId) {
    const preferences = this.userPreferences.get(userId);
    return { Item: preferences || null };
  }

  // User Activity Operations
  async trackUserActivity(userId, articleId, actionType, mood = null) {
    const activityKey = `${userId}#${Date.now()}#${actionType}`;
    this.userActivity.set(activityKey, {
      userId,
      articleId,
      actionType,
      moodAtTime: mood,
      timestamp: new Date().toISOString()
    });
    console.log(`📊 Mock: Tracked ${actionType} for user ${userId}`);
    return { success: true };
  }

  // Bookmarks Operations
  async addBookmark(userId, articleId) {
    const bookmarkKey = `${userId}#${articleId}`;
    this.userBookmarks.set(bookmarkKey, {
      userId,
      articleId,
      bookmarkDate: new Date().toISOString()
    });
    console.log(`🔖 Mock: Added bookmark for user ${userId}`);
    return { success: true };
  }

  async removeBookmark(userId, articleId) {
    const bookmarkKey = `${userId}#${articleId}`;
    this.userBookmarks.delete(bookmarkKey);
    console.log(`🗑️ Mock: Removed bookmark for user ${userId}`);
    return { success: true };
  }

  async getUserBookmarks(userId, limit = 20) {
    const bookmarks = Array.from(this.userBookmarks.values())
      .filter(bookmark => bookmark.userId === userId)
      .slice(0, limit);

    return { Items: bookmarks };
  }

  async isBookmarked(userId, articleId) {
    const bookmarkKey = `${userId}#${articleId}`;
    return this.userBookmarks.has(bookmarkKey);
  }

  // Categories Operations
  async getCategories() {
    const categories = Array.from(this.categories.values())
      .filter(cat => cat.isActive)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

    return { Items: categories };
  }

  async createCategory(category) {
    this.categories.set(category.name, category);
    console.log(`📂 Mock: Created category ${category.displayName}`);
    return { success: true };
  }
}

module.exports = new MockDynamoDBService();
