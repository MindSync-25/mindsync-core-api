// test-routes-local.js - Test our route structure locally
const express = require('express');
const cors = require('cors');
const newsRoutes = require('./routes/newsRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Add our news routes
app.use('/api/news', newsRoutes);

// Root test
app.get('/', (req, res) => {
  res.json({ 
    message: 'Local test server working!',
    availableRoutes: [
      'GET /',
      'GET /api/news',
      'GET /api/news/categories', 
      'GET /api/news/articles'
    ]
  });
});

// Test our specific route
app.get('/test-news', (req, res) => {
  res.json({
    message: 'Direct news test endpoint',
    timestamp: new Date().toISOString()
  });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🧪 Local test server running on http://localhost:${PORT}`);
  console.log(`🧪 Test /api/news route: http://localhost:${PORT}/api/news`);
});
