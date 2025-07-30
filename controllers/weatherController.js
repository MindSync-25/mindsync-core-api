// controllers/weatherController.js
const axios = require('axios');
const { Pool } = require('pg');
const weatherService = require('../services/weatherService');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const WEATHER_API_KEY = process.env.WEATHER_API_KEY || 'your-api-key';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Changed from DATABASE_URL
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

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
  },

  // Get weather data
  async getWeather(req, res) {
    try {
      const { city, user_id } = req.query;

      if (!city) {
        return res.status(400).json({ 
          success: false, 
          error: 'City parameter is required' 
        });
      }

      if (!process.env.OPENWEATHER_API_KEY) { // Changed from WEATHER_API_KEY
        return res.status(500).json({ 
          success: false, 
          error: 'Weather API key not configured' 
        });
      }

      // Check cache first (optional)
      if (user_id) {
        const cacheResult = await pool.query(
          `SELECT weather_data FROM weather_logs 
           WHERE user_id = $1 AND city = $2 
           AND created_at > NOW() - INTERVAL '30 minutes'
           ORDER BY created_at DESC LIMIT 1`,
          [user_id, city]
        );

        if (cacheResult.rows.length > 0) {
          console.log('📍 Returning cached weather data');
          return res.json({ 
            success: true, 
            weather: cacheResult.rows[0].weather_data,
            cached: true 
          });
        }
      }

      // Fetch fresh data
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`
      );

      const weatherData = {
        city: response.data.name,
        country: response.data.sys.country,
        temperature: response.data.main.temp,
        feels_like: response.data.main.feels_like,
        humidity: response.data.main.humidity,
        description: response.data.weather[0].description,
        icon: response.data.weather[0].icon,
        wind_speed: response.data.wind.speed,
        timestamp: new Date().toISOString()
      };

      // Cache the result if user_id provided
      if (user_id) {
        await pool.query(
          'INSERT INTO weather_logs (user_id, city, weather_data) VALUES ($1, $2, $3)',
          [user_id, city, weatherData]
        ).catch(err => console.error('Cache error:', err));
      }

      res.json({ 
        success: true, 
        weather: weatherData 
      });
    } catch (error) {
      console.error('Error fetching weather:', error.message);
      
      if (error.response?.status === 404) {
        return res.status(404).json({ 
          success: false, 
          error: 'City not found' 
        });
      }

      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch weather data',
        details: error.message 
      });
    }
  },

  // Get weather forecast
  async getWeatherForecast(req, res) {
    try {
      const { city } = req.query;

      if (!city) {
        return res.status(400).json({ 
          success: false, 
          error: 'City parameter is required' 
        });
      }

      if (!process.env.OPENWEATHER_API_KEY) { // Changed from WEATHER_API_KEY
        return res.status(500).json({ 
          success: false, 
          error: 'Weather API key not configured' 
        });
      }

      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric&cnt=5`
      );

      const forecast = response.data.list.map(item => ({
        date: item.dt_txt,
        temperature: item.main.temp,
        description: item.weather[0].description,
        icon: item.weather[0].icon
      }));

      res.json({ 
        success: true, 
        city: response.data.city.name,
        country: response.data.city.country,
        forecast 
      });
    } catch (error) {
      console.error('Error fetching forecast:', error.message);
      
      if (error.response?.status === 404) {
        return res.status(404).json({ 
          success: false, 
          error: 'City not found' 
        });
      }

      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch weather forecast',
        details: error.message 
      });
    }
  },

  // Get weather by city name
  async getWeatherByName(req, res) {
    try {
      const { city } = req.query;
      if (!city) {
        return res.status(400).json({ success: false, error: 'City parameter is required' });
      }

      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`
      );

      const weatherData = {
        city: response.data.name,
        country: response.data.sys.country,
        temperature: response.data.main.temp,
        feels_like: response.data.main.feels_like,
        humidity: response.data.main.humidity,
        description: response.data.weather[0].description,
        icon: response.data.weather[0].icon,
        wind_speed: response.data.wind.speed
      };

      res.json({ success: true, weather: weatherData });
    } catch (error) {
      console.error('Error fetching weather:', error.message);
      if (error.response?.status === 404) {
        return res.status(404).json({ success: false, error: 'City not found' });
      }
      res.status(500).json({ success: false, error: 'Failed to fetch weather data' });
    }
  },

  // Get weather by coordinates
  async getWeatherByCoords(req, res) {
    try {
      const { lat, lon } = req.query;
      if (!lat || !lon) {
        return res.status(400).json({ success: false, error: 'Latitude and longitude are required' });
      }

      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`
      );

      const weatherData = {
        location: response.data.name,
        country: response.data.sys.country,
        temperature: Math.round(response.data.main.temp),
        feelsLike: Math.round(response.data.main.feels_like),
        humidity: response.data.main.humidity,
        description: response.data.weather[0].description,
        icon: `https://openweathermap.org/img/wn/${response.data.weather[0].icon}@2x.png`,
        windSpeed: response.data.wind.speed,
        pressure: response.data.main.pressure,
        visibility: response.data.visibility / 1000,
        sunrise: new Date(response.data.sys.sunrise * 1000).toISOString(),
        sunset: new Date(response.data.sys.sunset * 1000).toISOString()
      };

      res.json(weatherData);
    } catch (error) {
      console.error('Error fetching weather by coords:', error.message);
      res.status(500).json({ error: 'Failed to fetch weather data' });
    }
  },

  // Get weather forecast by city
  async getWeatherForecastByCity(req, res) {
    try {
      const { city } = req.query;
      if (!city) {
        return res.status(400).json({ success: false, error: 'City parameter is required' });
      }

      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric&cnt=5`
      );

      const forecast = response.data.list.map(item => ({
        date: item.dt_txt,
        temperature: item.main.temp,
        description: item.weather[0].description,
        icon: item.weather[0].icon
      }));

      res.json({ success: true, city: response.data.city.name, country: response.data.city.country, forecast });
    } catch (error) {
      console.error('Error fetching forecast:', error.message);
      if (error.response?.status === 404) {
        return res.status(404).json({ success: false, error: 'City not found' });
      }
      res.status(500).json({ success: false, error: 'Failed to fetch weather forecast' });
    }
  },

  // Get hourly forecast by coordinates
  async getHourlyForecast(req, res) {
    try {
      const { lat, lon } = req.query;
      if (!lat || !lon) {
        return res.status(400).json({ error: 'Latitude and longitude are required' });
      }

      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric&cnt=8`
      );

      const hourlyData = response.data.list.map(item => ({
        time: new Date(item.dt * 1000).toISOString(),
        temperature: Math.round(item.main.temp),
        description: item.weather[0].description,
        icon: `https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`,
        windSpeed: item.wind.speed,
        humidity: item.main.humidity
      }));

      res.json(hourlyData);
    } catch (error) {
      console.error('Error fetching hourly forecast:', error.message);
      res.status(500).json({ error: 'Failed to fetch hourly forecast' });
    }
  },

  // Get weekly forecast by coordinates
  async getWeeklyForecast(req, res) {
    try {
      const { lat, lon } = req.query;
      if (!lat || !lon) {
        return res.status(400).json({ error: 'Latitude and longitude are required' });
      }

      // OpenWeatherMap free tier only provides 5-day forecast
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`
      );

      // Group by day and get daily summary
      const dailyData = {};
      response.data.list.forEach(item => {
        const date = new Date(item.dt * 1000).toDateString();
        if (!dailyData[date]) {
          dailyData[date] = {
            date: new Date(item.dt * 1000).toISOString(),
            dayOfWeek: new Date(item.dt * 1000).toLocaleDateString('en-US', { weekday: 'long' }),
            temperatures: [],
            descriptions: [],
            icons: [],
            humidity: []
          };
        }
        dailyData[date].temperatures.push(item.main.temp);
        dailyData[date].descriptions.push(item.weather[0].description);
        dailyData[date].icons.push(item.weather[0].icon);
        dailyData[date].humidity.push(item.main.humidity);
      });

      const weeklyForecast = Object.values(dailyData).map(day => ({
        date: day.date,
        dayOfWeek: day.dayOfWeek,
        highTemp: Math.round(Math.max(...day.temperatures)),
        lowTemp: Math.round(Math.min(...day.temperatures)),
        description: day.descriptions[Math.floor(day.descriptions.length / 2)],
        icon: `https://openweathermap.org/img/wn/${day.icons[Math.floor(day.icons.length / 2)]}@2x.png`,
        humidity: Math.round(day.humidity.reduce((a, b) => a + b) / day.humidity.length)
      })).slice(0, 5);

      res.json(weeklyForecast);
    } catch (error) {
      console.error('Error fetching weekly forecast:', error.message);
      res.status(500).json({ error: 'Failed to fetch weekly forecast' });
    }
  }
};
