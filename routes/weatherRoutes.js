// routes/weatherRoutes.js
const express = require('express');
const router = express.Router();
const weatherController = require('../controllers/weatherController');

// GET /api/weather?city=London
router.get('/', weatherController.getWeather);

// GET /api/weather/forecast?city=London
router.get('/forecast', weatherController.getWeatherForecast);

module.exports = router;
