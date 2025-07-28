// simple-test.js - Simple test server for Railway
const express = require('express');
const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ 
    message: 'MindSync Backend is LIVE on Railway!',
    timestamp: new Date().toISOString(),
    status: 'success'
  });
});

app.get('/test', (req, res) => {
  res.json({ 
    message: 'Railway test endpoint working!',
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 5000
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Simple test server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});
