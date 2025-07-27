// jobs/newsFetcherDynamo.js
const cron = require('node-cron');
const newsServiceDynamo = require('../services/newsServiceDynamo');

class NewsFetcherDynamo {
  constructor() {
    this.isRunning = false;
    this.lastRunTime = null;
    this.nextRunTime = null;
  }

  async fetchNews() {
    if (this.isRunning) {
      console.log('⏳ News fetch already in progress, skipping...');
      return;
    }

    this.isRunning = true;
    this.lastRunTime = new Date();

    try {
      console.log('🔄 Starting scheduled news fetch for DynamoDB...');
      console.log(`📅 Started at: ${this.lastRunTime.toISOString()}`);
      
      const result = await newsServiceDynamo.fetchAndStoreNews();
      
      console.log('✅ Scheduled news fetch completed successfully!');
      console.log(`📊 Results: ${result.totalArticles} articles across ${result.categories} categories`);
      console.log(`⏰ Completed at: ${new Date().toISOString()}`);
      
    } catch (error) {
      console.error('❌ Error in scheduled news fetch:', error);
    } finally {
      this.isRunning = false;
    }
  }

  start() {
    console.log('🚀 Starting DynamoDB News Fetcher Service...');
    console.log('⏰ Schedule: Every 2 hours');
    console.log('🗂️ Storage: DynamoDB with TTL auto-cleanup');
    console.log('📡 Sources: NewsAPI + GNews API');
    
    // Schedule: Run every 2 hours
    // Format: minute hour day month day-of-week
    const schedule = '0 */2 * * *'; // Every 2 hours at minute 0
    
    cron.schedule(schedule, async () => {
      await this.fetchNews();
    }, {
      scheduled: true,
      timezone: 'America/New_York'
    });

    // Calculate next run time
    const now = new Date();
    const nextHour = Math.ceil(now.getHours() / 2) * 2;
    this.nextRunTime = new Date(now);
    this.nextRunTime.setHours(nextHour, 0, 0, 0);
    
    if (this.nextRunTime <= now) {
      this.nextRunTime.setTime(this.nextRunTime.getTime() + (2 * 60 * 60 * 1000));
    }

    console.log(`📅 Next scheduled run: ${this.nextRunTime.toISOString()}`);
    console.log('✅ DynamoDB News Fetcher Service started successfully!');

    // Run an initial fetch after a short delay
    setTimeout(async () => {
      console.log('🔄 Running initial news fetch...');
      await this.fetchNews();
    }, 5000); // 5 second delay
  }

  stop() {
    console.log('🛑 Stopping DynamoDB News Fetcher Service...');
    // Cron jobs are automatically stopped when the process exits
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      lastRunTime: this.lastRunTime,
      nextRunTime: this.nextRunTime,
      schedule: 'Every 2 hours',
      storage: 'DynamoDB',
      ttl: '30 days auto-cleanup'
    };
  }
}

module.exports = new NewsFetcherDynamo();
