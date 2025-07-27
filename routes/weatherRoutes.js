// routes/weatherRoutes.js
const express = require('express');
const router = express.Router();
const weatherController = require('../controllers/weatherController');

router.get('/current', weatherController.getCurrentWeather);
router.get('/hourly', weatherController.getHourlyWeather);
router.get('/weekly', weatherController.getWeeklyWeather);
router.post('/analyze-tasks', weatherController.analyzeTasks);

module.exports = router;
