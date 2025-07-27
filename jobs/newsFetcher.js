// jobs/newsFetcher.js
const cron = require('node-cron');
const NewsService = require('../services/newsService');
const NewsArticle = require('../models/NewsArticle');
const NewsCategory = require('../models/NewsCategory');

class NewsFetcher {
  constructor() {
    this.newsService = new NewsService();
  }

  // Run every 2 hours for better performance
  startScheduledFetching() {
    cron.schedule('0 */2 * * *', async () => {
      console.log('Starting scheduled news fetch every 2 hours...');
      await this.fetchAllCategories();
    });

    // Cleanup old articles daily at 2 AM
    cron.schedule('0 2 * * *', async () => {
      console.log('Starting cleanup of old articles...');
      await this.cleanupOldArticles();
    });
  }

  async fetchAllCategories() {
    try {
      const categories = await NewsCategory.findAll();
      const categoryMapping = this.newsService.getCategoryMapping();
      
      for (const category of categories) {
        const apiCategory = categoryMapping[category.name];
        if (apiCategory) {
          await this.fetchAndStoreArticles(category.name, apiCategory);
        }
      }
    } catch (error) {
      console.error('Error fetching news:', error);
    }
  }

  async fetchAndStoreArticles(categoryName, apiCategory) {
    try {
      // Fetch from both APIs
      const newsApiArticles = await this.newsService.fetchFromNewsAPI(apiCategory);
      const gNewsArticles = await this.newsService.fetchFromGNews(apiCategory);
      
      // Combine and deduplicate
      const allArticles = [...newsApiArticles, ...gNewsArticles];
      const uniqueArticles = this.newsService.deduplicateByUrl(allArticles);
      
      // Store in database
      for (const article of uniqueArticles) {
        await this.storeArticle(article, categoryName);
      }
      
      console.log(`Stored ${uniqueArticles.length} articles for ${categoryName}`);
    } catch (error) {
      console.error(`Error fetching ${categoryName}:`, error);
    }
  }

  async storeArticle(articleData, categoryName) {
    try {
      const category = await NewsCategory.findOne({ where: { name: categoryName } });
      
      // Check if article already exists
      const existing = await NewsArticle.findOne({ where: { url: articleData.url } });
      if (existing) return;

      // Analyze sentiment and mood tags
      const moodTags = this.newsService.analyzeMoodTags(articleData.title, articleData.description);
      const sentiment = this.newsService.analyzeSentiment(articleData.title, articleData.description);
      
      await NewsArticle.create({
        title: articleData.title,
        description: articleData.description,
        url: articleData.url,
        imageUrl: articleData.imageUrl,
        source: articleData.source,
        author: articleData.author,
        publishedAt: articleData.publishedAt,
        categoryId: category.id,
        readTime: this.newsService.calculateReadTime(articleData.description),
        sentiment: sentiment,
        moodTags: moodTags,
        isHealthyContent: this.newsService.isHealthyContent(articleData.title, articleData.description)
      });
    } catch (error) {
      console.error('Error storing article:', error);
    }
  }

  async cleanupOldArticles() {
    try {
      // Remove articles older than 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const deletedCount = await NewsArticle.destroy({
        where: {
          publishedAt: {
            [require('sequelize').Op.lt]: thirtyDaysAgo
          }
        }
      });
      
      console.log(`Cleaned up ${deletedCount} old articles`);
    } catch (error) {
      console.error('Error cleaning up old articles:', error);
    }
  }
}

module.exports = NewsFetcher;
