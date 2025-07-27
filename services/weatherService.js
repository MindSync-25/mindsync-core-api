// services/weatherService.js
const axios = require('axios');
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || 'your_api_key_here';

const BASE_URL = 'https://api.openweathermap.org/data/2.5';


function transformCurrentWeather(data) {
  return {
    temperature: data.main.temp,
    condition: data.weather[0].main,
    description: data.weather[0].description,
    humidity: data.main.humidity,
    windSpeed: data.wind.speed,
    feelsLike: data.main.feels_like,
    visibility: data.visibility,
    uvIndex: 0, // OpenWeatherMap free API does not provide UV index
    icon: data.weather[0].icon,
    location: `${data.name}, ${data.sys.country}`,
    timestamp: new Date(data.dt * 1000).toISOString(),
    aiInsights: [data.weather[0].main === 'Clear' ? 'Perfect weather for outdoor tasks' : 'Check weather before planning outdoor activities']
  };
}

function transformHourlyData(openWeatherData) {
  return openWeatherData.list.slice(0, 12).map(item => ({
    time: item.dt_txt,
    temperature: item.main.temp,
    condition: item.weather[0].main,
    icon: item.weather[0].icon,
    precipitationChance: Math.round((item.pop || 0) * 100)
  }));
}

function mostFrequent(arr) {
  return arr.sort((a, b) =>
    arr.filter(v => v === a).length - arr.filter(v => v === b).length
  ).pop();
}

function average(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function transformWeeklyData(openWeatherData) {
  const dailyData = {};
  openWeatherData.list.forEach(item => {
    const date = item.dt_txt.split(' ')[0];
    if (!dailyData[date]) {
      dailyData[date] = {
        temps: [],
        conditions: [],
        humidity: [],
        wind: [],
        precipitation: [],
        icons: []
      };
    }
    dailyData[date].temps.push(item.main.temp);
    dailyData[date].conditions.push(item.weather[0].main);
    dailyData[date].humidity.push(item.main.humidity);
    dailyData[date].wind.push(item.wind.speed);
    dailyData[date].precipitation.push((item.pop || 0) * 100);
    dailyData[date].icons.push(item.weather[0].icon);
  });
  return Object.keys(dailyData).slice(0, 5).map(date => ({
    date: date,
    day: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
    high: Math.round(Math.max(...dailyData[date].temps)),
    low: Math.round(Math.min(...dailyData[date].temps)),
    condition: mostFrequent(dailyData[date].conditions),
    icon: mostFrequent(dailyData[date].icons),
    precipitationChance: Math.round(Math.max(...dailyData[date].precipitation)),
    humidity: Math.round(average(dailyData[date].humidity)),
    windSpeed: Math.round(average(dailyData[date].wind))
  }));
}

module.exports = {
  async getCurrentWeather(lat, lon) {
    const url = `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`;
    const { data } = await axios.get(url);
    return transformCurrentWeather(data);
  },

  async getHourlyWeather(lat, lon) {
    const url = `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`;
    const { data } = await axios.get(url);
    return transformHourlyData(data);
  },

  async getWeeklyWeather(lat, lon) {
    // Use /forecast and group by day for 5-day forecast
    const url = `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`;
    const { data } = await axios.get(url);
    return transformWeeklyData(data);
  },

  async analyzeTasks(user_id, weather_data, user_tasks) {
    // Simple rule-based AI for MVP
    const weatherMain = weather_data.weather ? weather_data.weather[0].main : '';
    let suggestion = '';
    if (weatherMain === 'Rain') suggestion = 'It is rainy. Focus on indoor tasks.';
    else if (weatherMain === 'Clear') suggestion = 'It is sunny. Great time for outdoor activities!';
    else if (weather_data.main && weather_data.main.temp > 32) suggestion = 'It is hot. Try to complete tasks early in the morning.';
    else suggestion = 'No special weather-based suggestions.';
    return { suggestion, user_tasks };
  }
};
