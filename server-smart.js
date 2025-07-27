const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();

// CORS Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true,
}));

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'MindSync API is running!', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT
  });
});

// Test route
app.get('/test', (req, res) => {
  res.json({ 
    message: 'Backend is working!',
    port: PORT,
    endpoints: [
      'GET /health',
      'GET /test', 
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET /api/news/categories',
      'GET /api/weather/:city'
    ]
  });
});

// Import and use routes
try {
  const authRoutes = require('./routes/authRoutes');
  const taskRoutes = require('./routes/taskRoutes');
  const weatherRoutes = require('./routes/weatherRoutes');
  const newsRoutes = require('./routes/newsRoutes');

  app.use('/api/auth', authRoutes);
  app.use('/api', taskRoutes);
  app.use('/api/weather', weatherRoutes);
  app.use('/api/news', newsRoutes);
  app.use('/api/user/news', newsRoutes);

  console.log('✅ All routes loaded successfully');
} catch (error) {
  console.log('⚠️ Some routes failed to load:', error.message);
  console.log('🔄 Server will start with basic endpoints only');
}

// Function to find available port
async function findAvailablePort(startPort = 5000) {
  const net = require('net');
  
  for (let port = startPort; port <= startPort + 100; port++) {
    try {
      await new Promise((resolve, reject) => {
        const server = net.createServer();
        
        server.listen(port, () => {
          server.close(() => resolve());
        });
        
        server.on('error', reject);
      });
      
      return port;
    } catch (error) {
      continue;
    }
  }
  
  throw new Error('No available ports found');
}

// Start server with available port
async function startServer() {
  try {
    const PORT = await findAvailablePort(5000);
    
    app.listen(PORT, () => {
      console.log('🚀 LEGENDARY MINDSYNC SERVER STARTED! ⚡');
      console.log('==========================================');
      console.log(`📍 Server running on port ${PORT}`);
      console.log(`🌐 Base URL: http://localhost:${PORT}`);
      console.log(`🧪 Health Check: http://localhost:${PORT}/health`);
      console.log(`📋 Test Endpoint: http://localhost:${PORT}/test`);
      console.log('==========================================');
      console.log('💡 Press Ctrl+C to stop the server');
      
      // Initialize news service if available
      try {
        const NewsFetcher = require('./jobs/newsFetcher');
        const seedNewsCategories = require('./seeders/newsCategoriesSeeder');
        
        (async () => {
          try {
            await seedNewsCategories();
            const newsFetcher = new NewsFetcher();
            newsFetcher.startScheduledFetching();
            newsFetcher.fetchAllCategories();
            console.log('📰 News service initialized');
          } catch (error) {
            console.log('⚠️ News service initialization failed:', error.message);
          }
        })();
      } catch (error) {
        console.log('⚠️ News service not available:', error.message);
      }
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    console.log('🔄 Try running: npm install');
    process.exit(1);
  }
}

startServer();
