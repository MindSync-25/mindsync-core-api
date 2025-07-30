// routes/weatherRoutes.js
const express = require('express');
const router = express.Router();
const weatherController = require('../controllers/weatherController');

router.get('/current', weatherController.getCurrentWeather);
router.get('/hourly', weatherController.getHourlyWeather);
router.get('/weekly', weatherController.getWeeklyWeather);

module.exports = router;
