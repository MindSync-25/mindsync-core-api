// services/newsServiceDynamo.js
const axios = require('axios');
const dynamoService = require('../db/dynamodb');

class NewsService {
  constructor() {
    this.newsApiKey = process.env.NEWS_API_KEY;
    this.gnewsApiKey = process.env.GNEWS_API_KEY;
    this.defaultImage = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80';
    
    this.categoryImages = {
      business: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
      entertainment: 'https://images.unsplash.com/photo-1489599651771-5f2d7e5b2c71?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
      general: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
      health: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
      science: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
      sports: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
      technology: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
      politics: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a08b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
      world: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
      finance: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
      lifestyle: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
      education: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
      environment: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
      travel: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'
    };
  }

  generateArticleId(article, source) {
    // Create consistent ID from title and published date
    const title = article.title || '';
    const publishedAt = article.publishedAt || article.published_at || new Date().toISOString();
    const sourcePrefix = source === 'newsapi' ? 'na' : 'gn';
    
    return `${sourcePrefix}_${Buffer.from(title + publishedAt).toString('base64').slice(0, 16)}`;
  }

  async validateImageUrl(url) {
    if (!url) return false;
    
    try {
      const response = await axios.head(url, { timeout: 3000 });
      const contentType = response.headers['content-type'];
      return contentType && contentType.startsWith('image/');
    } catch (error) {
      return false;
    }
  }

  analyzeSentiment(title, description) {
    const text = `${title} ${description}`.toLowerCase();
    
    const positiveWords = ['success', 'win', 'achievement', 'breakthrough', 'innovation', 'growth', 'positive', 'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'celebrate'];
    const negativeWords = ['crisis', 'disaster', 'failure', 'death', 'war', 'conflict', 'problem', 'issue', 'concern', 'worry', 'danger', 'risk', 'threat', 'terrible', 'awful', 'horrible'];
    
    let positiveScore = 0;
    let negativeScore = 0;
    
    positiveWords.forEach(word => {
      if (text.includes(word)) positiveScore++;
    });
    
    negativeWords.forEach(word => {
      if (text.includes(word)) negativeScore++;
    });
    
    if (positiveScore > negativeScore) return 'positive';
    if (negativeScore > positiveScore) return 'negative';
    return 'neutral';
  }

  generateMoodTags(title, description, category, sentiment) {
    const text = `${title} ${description}`.toLowerCase();
    const moodTags = [];
    
    // Base mood from sentiment
    moodTags.push(sentiment);
    
    // Category-based moods
    if (category === 'entertainment') moodTags.push('happy', 'relaxed');
    if (category === 'sports') moodTags.push('energetic', 'competitive');
    if (category === 'health') moodTags.push('caring', 'informed');
    if (category === 'science') moodTags.push('curious', 'intelligent');
    if (category === 'technology') moodTags.push('innovative', 'progressive');
    
    // Content-based moods
    if (text.includes('inspire') || text.includes('motivation')) moodTags.push('inspired');
    if (text.includes('calm') || text.includes('peace')) moodTags.push('calm');
    if (text.includes('exciting') || text.includes('adventure')) moodTags.push('excited');
    if (text.includes('learn') || text.includes('education')) moodTags.push('learning');
    
    return [...new Set(moodTags)]; // Remove duplicates
  }

  checkHealthyContent(title, description) {
    const text = `${title} ${description}`.toLowerCase();
    
    const unhealthyKeywords = [
      'violence', 'murder', 'killing', 'death', 'suicide', 'terrorism', 'war crimes',
      'graphic', 'disturbing', 'trauma', 'abuse', 'assault', 'harassment',
      'drug abuse', 'addiction', 'overdose', 'hate crime', 'discrimination'
    ];
    
    return !unhealthyKeywords.some(keyword => text.includes(keyword));
  }

  async fetchFromNewsAPI(category, pageSize = 20) {
    if (!this.newsApiKey) {
      console.log('⚠️ NewsAPI key not configured, skipping...');
      return [];
    }

    try {
      console.log(`📡 Fetching from NewsAPI - Category: ${category}`);
      
      const url = 'https://newsapi.org/v2/top-headlines';
      const params = {
        category: category === 'politics' ? 'general' : category,
        country: 'us',
        pageSize,
        apiKey: this.newsApiKey
      };

      const response = await axios.get(url, { params, timeout: 10000 });
      
      if (response.data.status !== 'ok') {
        throw new Error(`NewsAPI error: ${response.data.message}`);
      }

      return response.data.articles || [];
    } catch (error) {
      console.error(`❌ NewsAPI fetch error for ${category}:`, error.message);
      return [];
    }
  }

  async fetchFromGNews(category, pageSize = 20) {
    if (!this.gnewsApiKey) {
      console.log('⚠️ GNews API key not configured, skipping...');
      return [];
    }

    try {
      console.log(`📡 Fetching from GNews - Category: ${category}`);
      
      const url = 'https://gnews.io/api/v4/top-headlines';
      const params = {
        category: category === 'politics' ? 'nation' : category,
        lang: 'en',
        country: 'us',
        max: pageSize,
        apikey: this.gnewsApiKey
      };

      const response = await axios.get(url, { params, timeout: 10000 });
      return response.data.articles || [];
    } catch (error) {
      console.error(`❌ GNews fetch error for ${category}:`, error.message);
      return [];
    }
  }

  async processAndSaveArticles(rawArticles, category, source) {
    const processedArticles = [];
    
    for (const article of rawArticles) {
      try {
        // Skip articles without essential data
        if (!article.title || !article.url) {
          continue;
        }

        // Generate consistent ID
        const articleId = this.generateArticleId(article, source);
        
        // Validate and set image
        let imageUrl = article.urlToImage || article.image || null;
        if (imageUrl) {
          const isValidImage = await this.validateImageUrl(imageUrl);
          if (!isValidImage) {
            imageUrl = this.categoryImages[category] || this.defaultImage;
          }
        } else {
          imageUrl = this.categoryImages[category] || this.defaultImage;
        }

        // Analyze content
        const title = article.title;
        const description = article.description || article.content || '';
        const sentiment = this.analyzeSentiment(title, description);
        const moodTags = this.generateMoodTags(title, description, category, sentiment);
        const isHealthyContent = this.checkHealthyContent(title, description);

        // Calculate read time (rough estimate)
        const wordCount = description.split(' ').length;
        const readTime = Math.max(1, Math.ceil(wordCount / 200)); // 200 words per minute

        const processedArticle = {
          id: articleId,
          title,
          description,
          url: article.url,
          imageUrl,
          source: article.source?.name || source,
          author: article.author || 'Unknown',
          publishedAt: article.publishedAt || article.published_at || new Date().toISOString(),
          category,
          readTime,
          sentiment,
          moodTags,
          isHealthyContent,
          isActive: true,
          viewCount: 0
        };

        // Save to DynamoDB
        await dynamoService.createArticle(processedArticle);
        processedArticles.push(processedArticle);

      } catch (error) {
        console.error('❌ Error processing article:', error.message);
        continue;
      }
    }

    return processedArticles;
  }

  async fetchAndStoreNews() {
    console.log('🚀 Starting DynamoDB news fetch and store process...');
    
    const categories = [
      'business', 'entertainment', 'general', 'health', 'science',
      'sports', 'technology', 'politics', 'world', 'finance',
      'lifestyle', 'education', 'environment', 'travel'
    ];
    
    let totalArticles = 0;
    
    for (const category of categories) {
      try {
        console.log(`\n📰 Processing category: ${category.toUpperCase()}`);
        
        // Fetch from both APIs
        const [newsApiArticles, gnewsArticles] = await Promise.all([
          this.fetchFromNewsAPI(category, 10),
          this.fetchFromGNews(category, 10)
        ]);
        
        // Process and save articles
        const [processedNewsApi, processedGNews] = await Promise.all([
          this.processAndSaveArticles(newsApiArticles, category, 'newsapi'),
          this.processAndSaveArticles(gnewsArticles, category, 'gnews')
        ]);
        
        const categoryTotal = processedNewsApi.length + processedGNews.length;
        totalArticles += categoryTotal;
        
        console.log(`✅ ${category}: ${categoryTotal} articles saved to DynamoDB`);
        
        // Small delay to respect API rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Error processing category ${category}:`, error.message);
        continue;
      }
    }
    
    console.log(`\n🎉 News fetch completed! Total articles saved: ${totalArticles}`);
    console.log('💾 All articles stored in DynamoDB with 10-day TTL auto-cleanup');
    
    return {
      success: true,
      totalArticles,
      categories: categories.length,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new NewsService();
