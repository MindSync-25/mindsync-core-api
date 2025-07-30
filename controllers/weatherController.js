// controllers/weatherController.js
const weatherService = require('../services/weatherService');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const WEATHER_API_KEY = process.env.WEATHER_API_KEY || 'your-api-key';

module.exports = {
  async getCurrentWeather(req, res) {
    try {
      const { lat, lon } = req.query;
      if (!lat || !lon) return res.status(400).json({ success: false, error: 'lat and lon are required' });
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`;
      const response = await fetch(url);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Weather API error');
      res.json({
        success: true,
        weather: {
          location: data.name,
          temperature: Math.round(data.main.temp),
          condition: data.weather[0].description,
          humidity: data.main.humidity,
          windSpeed: data.wind.speed,
          icon: data.weather[0].icon
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch weather', details: error.message });
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
