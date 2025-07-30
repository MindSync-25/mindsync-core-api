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
      
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`;
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
      console.log('📍 Weekly forecast request:', { lat, lon }); // Add logging
    
      if (!lat || !lon) {
        return res.status(400).json({ error: 'Latitude and longitude are required' });
      }

      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`
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
      }; success: false, error: 'City not found' });

      res.json({ success: true, weather: weatherData });
    } catch (error) {
      console.error('Error fetching weather:', error.message);  },
      if (error.response?.status === 404) {
      const { lat, lon } = req.query;
      if (!lat || !lon) {getWeatherByCoords(req, res) {
        return res.status(400).json({ success: false, error: 'Latitude and longitude are required' });    try {
      }req.query;

      const response = await axios.get(ss: false, error: 'Latitude and longitude are required' });
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`
      );

      const weatherData = {at=${lat}&lon=${lon}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`
        location: response.data.name,
        country: response.data.sys.country,
        temperature: Math.round(response.data.main.temp),
        feelsLike: Math.round(response.data.main.feels_like),
        humidity: response.data.main.humidity,
        description: response.data.weather[0].description,
        icon: `https://openweathermap.org/img/wn/${response.data.weather[0].icon}@2x.png`,feelsLike: Math.round(response.data.main.feels_like),
        windSpeed: response.data.wind.speed,        humidity: response.data.main.humidity,
        pressure: response.data.main.pressure,e.data.weather[0].description,
        visibility: response.data.visibility / 1000,//openweathermap.org/img/wn/${response.data.weather[0].icon}@2x.png`,
        sunrise: new Date(response.data.sys.sunrise * 1000).toISOString(),
        sunset: new Date(response.data.sys.sunset * 1000).toISOString()
      };   visibility: response.data.visibility / 1000,
    sunrise: new Date(response.data.sys.sunrise * 1000).toISOString(),
      res.json(weatherData);        sunset: new Date(response.data.sys.sunset * 1000).toISOString()
    } catch (error) {
      console.error('Error fetching weather by coords:', error.message);
      res.status(500).json({ error: 'Failed to fetch weather data' });.json(weatherData);
    }
  },r('Error fetching weather by coords:', error.message);

  // Get weather forecast by city
  async getWeatherForecastByCity(req, res) {  },
    try {
      const { city } = req.query;
      if (!city) {getWeatherForecastByCity(req, res) {
        return res.status(400).json({ success: false, error: 'City parameter is required' });    try {
      }

      const response = await axios.get({ success: false, error: 'City parameter is required' });
        `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric&cnt=5`
      );
t response = await axios.get(
      const forecast = response.data.list.map(item => ({        `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric&cnt=5`
        date: item.dt_txt,
        temperature: item.main.temp,
        description: item.weather[0].description,
        icon: item.weather[0].icon
      }));
 description: item.weather[0].description,
      res.json({ success: true, city: response.data.city.name, country: response.data.city.country, forecast });
    } catch (error) { }));
      console.error('Error fetching forecast:', error.message);
      if (error.response?.status === 404) {      res.json({ success: true, city: response.data.city.name, country: response.data.city.country, forecast });
        return res.status(404).json({ success: false, error: 'City not found' });
      }orecast:', error.message);
      res.status(500).json({ success: false, error: 'Failed to fetch weather forecast' });(error.response?.status === 404) {
    } success: false, error: 'City not found' });
  },
 });
  // Get hourly forecast by coordinates
  async getHourlyForecast(req, res) {  },
    try {
      const { lat, lon } = req.query;
      if (!lat || !lon) {getHourlyForecast(req, res) {
        return res.status(400).json({ error: 'Latitude and longitude are required' });    try {
      }

      const response = await axios.get(titude and longitude are required' });
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric&cnt=8`
      );
get(
      const hourlyData = response.data.list.map(item => ({org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric&cnt=8`
        time: new Date(item.dt * 1000).toISOString(),
        temperature: Math.round(item.main.temp),
        description: item.weather[0].description,sponse.data.list.map(item => ({
        icon: `https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`,e(item.dt * 1000).toISOString(),
        windSpeed: item.wind.speed,
        humidity: item.main.humidity
      }));   icon: `https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`,
    windSpeed: item.wind.speed,
      res.json(hourlyData);        humidity: item.main.humidity
    } catch (error) {
      console.error('Error fetching hourly forecast:', error.message);
      res.status(500).json({ error: 'Failed to fetch hourly forecast' });.json(hourlyData);
    }
  },
  res.status(500).json({ error: 'Failed to fetch hourly forecast' });
  // Get weekly forecast by coordinates
  async getWeeklyForecast(req, res) {
    try {
      const { lat, lon } = req.query;  // Get weekly forecast by coordinates
      console.log('📍 Weekly forecast request:', { lat, lon }); // Add logging
    
      if (!lat || !lon) {nst { lat, lon } = req.query;
        return res.status(400).json({ error: 'Latitude and longitude are required' });      console.log('📍 Weekly forecast request:', { lat, lon }); // Add logging
      }

      const response = await axios.get(r: 'Latitude and longitude are required' });
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`
      );
xios.get(
      // Group by day and get daily summarythermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`
      const dailyData = {};
      response.data.list.forEach(item => {
        const date = new Date(item.dt * 1000); daily summary
        const day = date.toISOString().split('T')[0];= {};
        if (!dailyData[day]) {.forEach(item => {
          dailyData[day] = {t date = new Date(item.dt * 1000);
            date: day,onst day = date.toISOString().split('T')[0];
            temps: [],
            descriptions: [],
            icons: [],
            humidity: []
          };   descriptions: [],
        }            icons: [],
        dailyData[day].temps.push(item.main.temp);
        dailyData[day].descriptions.push(item.weather[0].description);[]
        dailyData[day].icons.push(item.weather[0].icon);
        dailyData[day].humidity.push(item.main.humidity);
      });

      const weeklyForecast = Object.values(dailyData).map(day => ({
        date: day.date,.humidity.push(item.main.humidity);
        highTemp: Math.round(Math.max(...day.temps)),        dailyData[day].windSpeed.push(item.wind.speed);
        lowTemp: Math.round(Math.min(...day.temps)),
        description: day.descriptions[Math.floor(day.descriptions.length / 2)],
        icon: `https://openweathermap.org/img/wn/${day.icons[Math.floor(day.icons.length / 2)]}@2x.png`,
        humidity: Math.round(day.humidity.reduce((a, b) => a + b, 0) / day.humidity.length)
      })).slice(0, 5);   const dayDate = new Date(day.date);
     return {
      res.json(weeklyForecast);        date: day.date,
    } catch (error) {          day: dayDate.toLocaleDateString('en-US', { weekday: 'short' }),






};  }    }      res.status(500).json({ error: 'Failed to fetch weekly forecast' });      console.error('Error fetching weekly forecast:', error.message);          high: Math.round(Math.max(...day.temps)),
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
  }
};
