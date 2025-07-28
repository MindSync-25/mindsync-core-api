const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors'); // Add this line
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const weatherRoutes = require('./routes/weatherRoutes');
const newsRoutes = require('./routes/newsRoutes');

dotenv.config();

const app = express();

// CORS Middleware (MUST go before routes)
app.use(cors({
  origin: '*', // or 'http://localhost:8081' if you want to restrict
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true,
}));

// Middleware
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'MindSync Core API - Legendary Backend is LIVE!',
    status: 'LEGENDARY_DEPLOYED',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      news: '/api/news',
      weather: '/api/weather', 
      tasks: '/api/tasks',
      test: '/test'
    }
  });
});

app.use('/api/auth', authRoutes);
app.use('/api', taskRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/user/news', newsRoutes);

// Test route to verify backend is running
app.get('/test', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

// Initialize news fetching
const NewsFetcher = require('./jobs/newsFetcher');
const seedNewsCategories = require('./seeders/newsCategoriesSeeder');

// Seed categories and start news fetching on startup
(async () => {
  try {
    await seedNewsCategories();
    const newsFetcher = new NewsFetcher();
    newsFetcher.startScheduledFetching();
// Initialize database and news service, then start server
const sequelize = require('./db/sequelize');
(async function initialize() {
  try {
    console.log('🔄 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connected');

    console.log('🔄 Syncing models...');
    await sequelize.sync({ alter: true });
    console.log('✅ Models synced');

    console.log('🔄 Initializing news service...');
    await newsFetcher.fetchAllCategories();
    console.log('✅ News service initialized');

    // Start Express server after initialization
    const PORT = process.env.PORT || 5000;
    const HOST = '0.0.0.0';
    app.listen(PORT, HOST, () => {
      console.log(`🚀 Server running at http://${HOST}:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Startup error:', err);
    process.exit(1);
  }
})();
  } catch (error) {
    console.error('Error initializing news service:', error);
  }
})();



