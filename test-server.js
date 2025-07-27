// test-server.js
try {
  console.log('Starting test...');
  const express = require('express');
  console.log('Express loaded');
  
  const newsRoutes = require('./routes/newsRoutes');
  console.log('News routes loaded');
  
  const NewsCategory = require('./models/NewsCategory');
  console.log('Models loaded');
  
  console.log('All components loaded successfully!');
} catch (error) {
  console.error('Error:', error);
}
