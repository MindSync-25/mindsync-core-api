// services/newsService.js
const axios = require('axios');

class NewsService {
  constructor() {
    this.newsApiKey = process.env.NEWS_API_KEY || 'your_news_api_key_here';
    this.gNewsApiKey = process.env.GNEWS_API_KEY || 'your_gnews_api_key_here';
  }

  async fetchFromNewsAPI(category, country = 'us') {
    try {
      const response = await axios.get('https://newsapi.org/v2/top-headlines', {
        params: {
          apiKey: this.newsApiKey,
          category: category,
          country: country,
          pageSize: 50
        }
      });
      
      return response.data.articles.map(article => ({
        title: article.title,
        description: article.description,
        url: article.url,
        imageUrl: this.getValidImageUrl(article.urlToImage, category),
        source: article.source.name,
        author: article.author,
        publishedAt: article.publishedAt,
        category: category
      }));
    } catch (error) {
      console.error('NewsAPI fetch error:', error);
      return [];
    }
  }

  async fetchFromGNews(category, lang = 'en') {
    try {
      const response = await axios.get('https://gnews.io/api/v4/top-headlines', {
        params: {
          token: this.gNewsApiKey,
          category: category,
          lang: lang,
          max: 50
        }
      });
      
      return response.data.articles.map(article => ({
        title: article.title,
        description: article.description,
        url: article.url,
        imageUrl: this.getValidImageUrl(article.image, category),
        source: article.source.name,
        author: article.author,
        publishedAt: article.publishedAt,
        category: category
      }));
    } catch (error) {
      console.error('GNews fetch error:', error);
      return [];
    }
  }

  // Map our categories to news API categories
  getCategoryMapping() {
    return {
      'technology': 'technology',
      'health': 'health',
      'sports': 'sports',
      'entertainment': 'entertainment',
      'business': 'business',
      'science': 'science',
      'world': 'general',
      'politics': 'general',
      'gaming': 'technology',
      'lifestyle': 'general',
      'food': 'general',
      'travel': 'general',
      'education': 'general',
      'environment': 'science'
    };
  }

  // Simple sentiment analysis (enhance with AI later)
  analyzeSentiment(title, description) {
    const text = `${title} ${description}`.toLowerCase();
    const positiveWords = ['breakthrough', 'success', 'innovative', 'achievement', 'positive', 'growth', 'improvement'];
    const negativeWords = ['crisis', 'disaster', 'death', 'war', 'conflict', 'problem', 'decline'];
    
    const positiveCount = positiveWords.filter(word => text.includes(word)).length;
    const negativeCount = negativeWords.filter(word => text.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  // Simple mood tag analysis (enhance with AI later)
  analyzeMoodTags(title, description) {
    const text = `${title} ${description}`.toLowerCase();
    const moodTags = [];
    
    if (text.includes('breakthrough') || text.includes('innovation')) moodTags.push('excited');
    if (text.includes('health') || text.includes('fitness')) moodTags.push('motivated');
    if (text.includes('travel') || text.includes('vacation')) moodTags.push('relaxed');
    if (text.includes('success') || text.includes('achievement')) moodTags.push('happy');
    
    return moodTags.length > 0 ? moodTags : ['neutral'];
  }

  calculateReadTime(description) {
    const words = description ? description.split(' ').length : 100;
    return Math.ceil(words / 200); // Average reading speed
  }

  isHealthyContent(title, description) {
    const text = `${title} ${description}`.toLowerCase();
    const unhealthyKeywords = ['violence', 'death', 'murder', 'suicide', 'disaster', 'tragedy'];
    return !unhealthyKeywords.some(keyword => text.includes(keyword));
  }

  deduplicateByUrl(articles) {
    const seen = new Set();
    return articles.filter(article => {
      if (seen.has(article.url)) return false;
      seen.add(article.url);
      return true;
    });
  }

  // Image validation and fallback logic
  getValidImageUrl(imageUrl, category) {
    // Category-based fallback images
    const fallbackImages = {
      'technology': 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=500',
      'health': 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=500',
      'sports': 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=500',
      'entertainment': 'https://images.unsplash.com/photo-1489599006-98e9ec1c2bb9?w=500',
      'business': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500',
      'science': 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=500',
      'world': 'https://images.unsplash.com/photo-1508175911205-c7c81b0b6b2c?w=500',
      'lifestyle': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500',
      'food': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500',
      'travel': 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=500',
      'education': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500',
      'environment': 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=500',
      'politics': 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=500',
      'gaming': 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=500'
    };

    // Check if image URL is valid
    if (imageUrl && imageUrl.startsWith('http') && !imageUrl.includes('placeholder')) {
      return imageUrl;
    }

    // Return category-specific fallback
    return fallbackImages[category] || fallbackImages['world'];
  }
}

module.exports = NewsService;
