// routes/weatherRoutes.js
const express = require('express');
const router = express.Router();
const weatherController = require('../controllers/weatherController');

// GET /api/weather?city=London
router.get('/', weatherController.getWeather);

// GET /api/weather/current?lat=xxx&lon=xxx
router.get('/current', weatherController.getCurrentWeather);

// GET /api/weather/forecast?city=London
router.get('/forecast', weatherController.getWeatherForecast);

// GET /api/weather/hourly?lat=xxx&lon=xxx
router.get('/hourly', weatherController.getHourlyForecast);

// GET /api/weather/weekly?lat=xxx&lon=xxx
router.get('/weekly', weatherController.getWeeklyForecast);

// Keep the old ones for backward compatibility if needed
router.get('/coords', weatherController.getWeatherByCoords);
router.get('/hourly-forecast', weatherController.getHourlyForecast);
router.get('/weekly-forecast', weatherController.getWeeklyForecast);

module.exports = router;
