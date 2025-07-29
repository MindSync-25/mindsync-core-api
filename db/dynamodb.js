// db/dynamodb.js
// Check if we should use local file-based DynamoDB (no AWS account needed)
if (process.env.USE_LOCAL_DYNAMODB === 'true' || !process.env.AWS_ACCESS_KEY_ID) {
  console.log('🗄️ Using Local File-based DynamoDB - No AWS account required!');
  module.exports = require('./localDynamoDB');
  return;
}

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, ScanCommand, UpdateCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

// Check if we should use mock for local development
if (process.env.USE_MOCK_DYNAMODB === 'true') {
  console.log('🔧 Using Mock DynamoDB for local development');
  module.exports = require('./mockDynamodb');
  return;
}

// DynamoDB Configuration
const dynamoDBConfig = {
  region: process.env.AWS_REGION || 'us-east-1',
  endpoint: process.env.DYNAMODB_ENDPOINT || undefined, // For local development
  credentials: process.env.NODE_ENV === 'development' ? {
    accessKeyId: 'local',
    secretAccessKey: 'local'
  } : undefined
};

const client = new DynamoDBClient(dynamoDBConfig);
const docClient = DynamoDBDocumentClient.from(client);

class DynamoDBService {
  constructor() {
    this.docClient = docClient;
  }

  // News Articles Table Operations
  async createArticle(article) {
    const params = {
      TableName: 'NewsArticles',
      Item: {
        PK: `CATEGORY#${article.category}`,
        SK: `ARTICLE#${article.publishedAt}#${article.id}`,
        GSI1PK: `MOOD#${article.moodTags[0] || 'neutral'}`,
        GSI1SK: article.publishedAt,
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
        moodTags: article.moodTags,
        isHealthyContent: article.isHealthyContent,
        isActive: article.isActive,
        viewCount: article.viewCount || 0,
        TTL: Math.floor(Date.now() / 1000) + (10 * 24 * 60 * 60), // 10 days TTL
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };

    return await this.docClient.send(new PutCommand(params));
  }

  async getArticlesByCategory(category, limit = 20, lastEvaluatedKey = null) {
    const params = {
      TableName: 'NewsArticles',
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: {
        ':pk': `CATEGORY#${category}`,
        ':active': true
      },
      FilterExpression: 'isActive = :active',
      ScanIndexForward: false, // Sort by SK in descending order
      Limit: limit,
      ExclusiveStartKey: lastEvaluatedKey
    };

    return await this.docClient.send(new QueryCommand(params));
  }

  async getArticlesByMood(mood, limit = 20) {
    const params = {
      TableName: 'NewsArticles',
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :mood',
      ExpressionAttributeValues: {
        ':mood': `MOOD#${mood}`,
        ':active': true
      },
      FilterExpression: 'isActive = :active',
      ScanIndexForward: false,
      Limit: limit
    };

    return await this.docClient.send(new QueryCommand(params));
  }

  async getRecentArticles(limit = 20, categories = []) {
    let params;
    
    if (categories.length > 0) {
      // Query multiple categories
      const promises = categories.map(category => 
        this.getArticlesByCategory(category, Math.ceil(limit / categories.length))
      );
      
      const results = await Promise.all(promises);
      const allItems = results.flatMap(result => result.Items || []);
      
      // Sort by publishedAt and limit
      return {
        Items: allItems
          .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
          .slice(0, limit)
      };
    } else {
      // Scan all recent articles
      params = {
        TableName: 'NewsArticles',
        FilterExpression: 'isActive = :active',
        ExpressionAttributeValues: {
          ':active': true
        },
        Limit: limit
      };
      
      return await this.docClient.send(new ScanCommand(params));
    }
  }

  // User Preferences Operations
  async saveUserPreferences(userId, preferences) {
    const params = {
      TableName: 'UserPreferences',
      Item: {
        PK: `USER#${userId}`,
        SK: 'PREFERENCES#NEWS',
        userId,
        interests: preferences.interests,
        setupComplete: preferences.setupComplete,
        preferences: preferences.preferences || {},
        updatedAt: new Date().toISOString()
      }
    };

    return await this.docClient.send(new PutCommand(params));
  }

  async getUserPreferences(userId) {
    const params = {
      TableName: 'UserPreferences',
      Key: {
        PK: `USER#${userId}`,
        SK: 'PREFERENCES#NEWS'
      }
    };

    return await this.docClient.send(new GetCommand(params));
  }

  // User Activity Operations
  async trackUserActivity(userId, articleId, actionType, mood = null) {
    const timestamp = new Date().toISOString();
    const params = {
      TableName: 'UserActivity',
      Item: {
        PK: `USER#${userId}`,
        SK: `ACTIVITY#${timestamp}#${actionType}`,
        userId,
        articleId,
        actionType,
        moodAtTime: mood,
        timestamp,
        TTL: Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60) // 90 days TTL
      }
    };

    return await this.docClient.send(new PutCommand(params));
  }

  // Bookmarks Operations
  async addBookmark(userId, articleId) {
    const params = {
      TableName: 'UserBookmarks',
      Item: {
        PK: `USER#${userId}`,
        SK: `BOOKMARK#${articleId}`,
        userId,
        articleId,
        bookmarkDate: new Date().toISOString()
      }
    };

    return await this.docClient.send(new PutCommand(params));
  }

  async removeBookmark(userId, articleId) {
    const params = {
      TableName: 'UserBookmarks',
      Key: {
        PK: `USER#${userId}`,
        SK: `BOOKMARK#${articleId}`
      }
    };

    return await this.docClient.send(new DeleteCommand(params));
  }

  async getUserBookmarks(userId, limit = 20) {
    const params = {
      TableName: 'UserBookmarks',
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`
      },
      ScanIndexForward: false,
      Limit: limit
    };

    return await this.docClient.send(new QueryCommand(params));
  }

  async isBookmarked(userId, articleId) {
    const params = {
      TableName: 'UserBookmarks',
      Key: {
        PK: `USER#${userId}`,
        SK: `BOOKMARK#${articleId}`
      }
    };

    const result = await this.docClient.send(new GetCommand(params));
    return !!result.Item;
  }

  // News Categories Operations
  async getCategories() {
    const params = {
      TableName: 'NewsCategories',
      FilterExpression: 'isActive = :active',
      ExpressionAttributeValues: {
        ':active': true
      }
    };

    return await this.docClient.send(new ScanCommand(params));
  }

  async createCategory(category) {
    const params = {
      TableName: 'NewsCategories',
      Item: {
        PK: `CATEGORY#${category.name}`,
        SK: 'METADATA',
        ...category,
        createdAt: new Date().toISOString()
      }
    };

    return await this.docClient.send(new PutCommand(params));
  }
}

module.exports = new DynamoDBService();
