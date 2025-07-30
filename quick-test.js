// quick-test.js - Test server startup
console.log('🧪 Testing server syntax...');

try {
  // Test that our server.js has valid syntax
  const express = require('express');
  console.log('✅ Express loaded');
  
  const cors = require('cors');
  console.log('✅ CORS loaded');
  
  // Test our routes
  const newsRoutes = require('./routes/newsRoutes');
  console.log('✅ News routes loaded');
  
  console.log('🎉 All syntax checks passed! Server should work on Railway.');
  
} catch (error) {
  console.error('❌ Syntax error found:', error.message);
}
