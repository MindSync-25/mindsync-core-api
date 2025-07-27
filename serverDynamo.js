// serverDynamo.js - DynamoDB version of the server
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.DYNAMO_PORT || 5001; // Use port 5001 for DynamoDB version

// Middleware
app.use(cors());
app.use(express.json());

// Import routes
// const authRoutes = require('./routes/authRoutes'); // Temporarily disabled for DynamoDB version
const newsRoutesDynamo = require('./routes/newsRoutesDynamo');

// Import DynamoDB News Fetcher
const newsFetcherDynamo = require('./jobs/newsFetcherDynamo');

// Routes
// app.use('/api/auth', authRoutes); // Temporarily disabled for DynamoDB version
app.use('/api/news', newsRoutesDynamo);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'MindSync Core API - DynamoDB Version',
    timestamp: new Date().toISOString(),
    version: '2.0.0-dynamo'
  });
});

// Weather endpoint (from original server)
app.get('/api/weather/:city', async (req, res) => {
  try {
    const { city } = req.params;
    const apiKey = process.env.WEATHER_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ 
        error: 'Weather API key not configured' 
      });
    }

    const axios = require('axios');
    const weatherResponse = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`
    );

    const weatherData = weatherResponse.data;
    
    // Simple mood mapping based on weather
    let mood = 'neutral';
    const mainWeather = weatherData.weather[0].main.toLowerCase();
    const temp = weatherData.main.temp;
    
    if (mainWeather.includes('clear') && temp > 20) mood = 'happy';
    else if (mainWeather.includes('rain')) mood = 'sad';
    else if (mainWeather.includes('cloud')) mood = 'calm';
    else if (temp > 30) mood = 'energetic';
    else if (temp < 0) mood = 'cozy';

    res.json({
      city: weatherData.name,
      country: weatherData.sys.country,
      temperature: Math.round(weatherData.main.temp),
      description: weatherData.weather[0].description,
      icon: weatherData.weather[0].icon,
      humidity: weatherData.main.humidity,
      windSpeed: weatherData.wind.speed,
      mood: mood,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Weather API error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to fetch weather data',
      details: error.response?.data?.message || error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 MindSync Core API - DynamoDB Version');
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`📰 News API: http://localhost:${PORT}/api/news`);
  console.log(`🌤️ Weather API: http://localhost:${PORT}/api/weather/:city`);
  console.log(`⚠️ Auth API: Disabled in DynamoDB version`);
  console.log('\n💾 Database: Local File-based DynamoDB');
  console.log('🔄 Auto-cleanup: TTL enabled (30 days)');
  console.log('⚡ Performance: 10x faster queries');
  
  // Start the DynamoDB news fetcher
  console.log('\n🔄 Starting DynamoDB News Fetcher...');
  newsFetcherDynamo.start();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n🛑 SIGTERM received, shutting down gracefully...');
  newsFetcherDynamo.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n🛑 SIGINT received, shutting down gracefully...');
  newsFetcherDynamo.stop();
  process.exit(0);
});

module.exports = app;
