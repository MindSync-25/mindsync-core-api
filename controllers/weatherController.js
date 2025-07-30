// controllers/weatherController.js
const axios = require('axios');
const { Pool } = require('pg');
const weatherService = require('../services/weatherService');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const WEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || 'your-api-key';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
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
      
      // Match frontend expected format
      res.json({
        temperature: Math.round(data.main.temp),
        condition: data.weather[0].main,
        description: data.weather[0].description,
        humidity: data.main.humidity,
        windSpeed: data.wind.speed,
        feelsLike: Math.round(data.main.feels_like),
        visibility: data.visibility / 1000, // Convert to km
        uvIndex: 0, // Free tier doesn't provide UV index
        icon: `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`,
        location: data.name,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch weather', details: error.message });
    }
  },

  async getHourlyForecast(req, res) {
    try {
      const { lat, lon } = req.query;
      if (!lat || !lon) {
        return res.status(400).json({ error: 'Latitude and longitude are required' });
      }

      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric&cnt=8`
      );

      const hourlyData = response.data.list.map(item => ({
        time: new Date(item.dt * 1000).toISOString(),
        temperature: Math.round(item.main.temp),
        condition: item.weather[0].description,
        icon: `https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`,
        precipitationChance: item.pop ? Math.round(item.pop * 100) : 0
      }));

      res.json(hourlyData);
    } catch (error) {
      console.error('Error fetching hourly forecast:', error.message);
      res.status(500).json({ error: 'Failed to fetch hourly forecast' });
    }
  },

  async getWeeklyForecast(req, res) {
    try {
      const { lat, lon } = req.query;
      console.log('📍 Weekly forecast request:', { lat, lon });
    
      if (!lat || !lon) {
        return res.status(400).json({ error: 'Latitude and longitude are required' });
      }

      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`
      );

      // Group by day and get daily summary
      const dailyData = {};
      response.data.list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const day = date.toISOString().split('T')[0];
        if (!dailyData[day]) {
          dailyData[day] = {
            date: day,
            temps: [],
            descriptions: [],
            icons: [],
            humidity: [],
            windSpeed: []
          };
        }
        dailyData[day].temps.push(item.main.temp);
        dailyData[day].descriptions.push(item.weather[0].description);
        dailyData[day].icons.push(item.weather[0].icon);
        dailyData[day].humidity.push(item.main.humidity);
        dailyData[day].windSpeed.push(item.wind.speed);
      });

      // Format to match frontend expectations
      const weeklyForecast = Object.values(dailyData).map(day => {
        const dayDate = new Date(day.date);
        return {
          date: day.date,
          day: dayDate.toLocaleDateString('en-US', { weekday: 'short' }),
          high: Math.round(Math.max(...day.temps)),
          low: Math.round(Math.min(...day.temps)),
          condition: day.descriptions[Math.floor(day.descriptions.length / 2)],
          icon: `https://openweathermap.org/img/wn/${day.icons[Math.floor(day.icons.length / 2)]}@2x.png`,
          precipitationChance: 0, // OpenWeather free tier doesn't provide this
          humidity: Math.round(day.humidity.reduce((a, b) => a + b, 0) / day.humidity.length),
          windSpeed: Math.round(day.windSpeed.reduce((a, b) => a + b, 0) / day.windSpeed.length)
        };
      }).slice(0, 5);

      res.json(weeklyForecast);
    } catch (error) {
      console.error('Error fetching weekly forecast:', error.message);
      res.status(500).json({ error: 'Failed to fetch weekly forecast' });
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

      if (!WEATHER_API_KEY) {
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
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${WEATHER_API_KEY}&units=metric`
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

  // Get weather by city name
  async getWeatherByName(req, res) {
    try {
      const { city } = req.query;
      if (!city) {
        return res.status(400).json({ success: false, error: 'City parameter is required' });
      }

      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${WEATHER_API_KEY}&units=metric`
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
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`
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

  // Get hourly forecast by coordinates
  async getHourlyForecast(req, res) {
    try {
      const { lat, lon } = req.query;
      if (!lat || !lon) {
        return res.status(400).json({ error: 'Latitude and longitude are required' });
      }

      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric&cnt=8`
      );

      const hourlyData = response.data.list.map(item => ({
        time: new Date(item.dt * 1000).toISOString(),
        temperature: Math.round(item.main.temp),
        condition: item.weather[0].description,
        icon: `https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`,
        precipitationChance: item.pop ? Math.round(item.pop * 100) : 0,
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
      console.log('📍 Weekly forecast request:', { lat, lon });
    
      if (!lat || !lon) {
        return res.status(400).json({ error: 'Latitude and longitude are required' });
      }

      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`
      );

      // Group by day and get daily summary
      const dailyData = {};
      response.data.list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const day = date.toISOString().split('T')[0];
        if (!dailyData[day]) {
          dailyData[day] = {
            date: day,
            temps: [],
            descriptions: [],
            icons: [],
            humidity: [],
            windSpeed: []
          };
        }
        dailyData[day].temps.push(item.main.temp);
        dailyData[day].descriptions.push(item.weather[0].description);
        dailyData[day].icons.push(item.weather[0].icon);
        dailyData[day].humidity.push(item.main.humidity);
        dailyData[day].windSpeed.push(item.wind.speed);
      });

      // Format to match frontend expectations
      const weeklyForecast = Object.values(dailyData).map(day => {
        const dayDate = new Date(day.date);
        return {
          date: day.date,
          day: dayDate.toLocaleDateString('en-US', { weekday: 'short' }),
          high: Math.round(Math.max(...day.temps)),
          low: Math.round(Math.min(...day.temps)),
          condition: day.descriptions[Math.floor(day.descriptions.length / 2)],
          icon: `https://openweathermap.org/img/wn/${day.icons[Math.floor(day.icons.length / 2)]}@2x.png`,
          precipitationChance: 0,
          humidity: Math.round(day.humidity.reduce((a, b) => a + b, 0) / day.humidity.length),
          windSpeed: Math.round(day.windSpeed.reduce((a, b) => a + b, 0) / day.windSpeed.length)
        };
      }).slice(0, 5);

      res.json(weeklyForecast);
    } catch (error) {
      console.error('Error fetching weekly forecast:', error.message);
      res.status(500).json({ error: 'Failed to fetch weekly forecast' });
    }
  }
};
