// controllers/weatherController.js
const weatherService = require('../services/weatherService');

module.exports = {
  async getCurrentWeather(req, res) {
    try {
      const { lat, lon } = req.query;
      const data = await weatherService.getCurrentWeather(lat, lon);
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch current weather', details: err.message });
    }
  },

  async getHourlyWeather(req, res) {
    try {
      const { lat, lon } = req.query;
      const data = await weatherService.getHourlyWeather(lat, lon);
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch hourly weather', details: err.message });
    }
  },

  async getWeeklyWeather(req, res) {
    try {
      const { lat, lon } = req.query;
      const data = await weatherService.getWeeklyWeather(lat, lon);
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch weekly weather', details: err.message });
    }
  },

  async analyzeTasks(req, res) {
    try {
      const { user_id, weather_data, user_tasks } = req.body;
      const insights = await weatherService.analyzeTasks(user_id, weather_data, user_tasks);
      res.json({ insights });
    } catch (err) {
      res.status(500).json({ error: 'Failed to analyze tasks', details: err.message });
    }
  }
};
