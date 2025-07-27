const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// Simple health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'MindSync API is running!', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Basic test endpoint
app.get('/test', (req, res) => {
  res.json({ 
    message: 'Backend is working!',
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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 LEGENDARY SERVER RUNNING ON PORT ${PORT}! ⚡`);
  console.log(`📍 Health Check: http://localhost:${PORT}/health`);
  console.log(`🧪 Test Endpoint: http://localhost:${PORT}/test`);
  console.log(`💪 READY FOR INTEGRATION TESTING!`);
});

module.exports = app;
