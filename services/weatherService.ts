import AsyncStorage from '@react-native-async-storage/async-storage';

export interface WeatherData {
  current: {
    temp: number;
    feels_like: number;
    humidity: number;
    wind_speed: number;
    visibility: number;
    description: string;
    icon: string;
    uv_index: number;
    sunrise: string;
    sunset: string;
    aqi: number;
    aqi_status: string;
    aqi_color: string;
  };
  hourly: Array<{
    hour: string;
    temp: number;
    icon: string;
  }>;
  daily: Array<{
    day: string;
    temp: number;
    icon: string;
  }>;
  location: {
    city: string;
    country: string;
  };
  lastUpdated: string;
}

export interface LoadingState {
  isLoading: boolean;
  progress: number;
  message: string;
  error: string | null;
}

class WeatherService {
  private API_KEY = 'aaf171de3477f5293832e0442a5a6693';
  private BASE_URL = 'https://api.openweathermap.org/data/2.5';
  private CACHE_KEY = 'weather_cache';
  private CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

  // Convert OpenWeatherMap icon codes to Ionicons names
  private mapWeatherIcon(iconCode: string): string {
    const iconMap: Record<string, string> = {
      '01d': 'sunny',
      '01n': 'moon',
      '02d': 'partly-sunny',
      '02n': 'cloudy-night',
      '03d': 'cloud',
      '03n': 'cloud',
      '04d': 'cloud-outline',
      '04n': 'cloud-outline',
      '09d': 'rainy',
      '09n': 'rainy',
      '10d': 'rainy',
      '10n': 'rainy',
      '11d': 'thunderstorm',
      '11n': 'thunderstorm',
      '13d': 'snow',
      '13n': 'snow',
      '50d': 'water',
      '50n': 'water',
    };
    return iconMap[iconCode] || 'cloud';
  }

  // Get air quality status and color
  private getAirQualityInfo(aqi: number): { status: string; color: string } {
    if (aqi <= 50) return { status: 'Good', color: '#7ed957' };
    if (aqi <= 100) return { status: 'Moderate', color: '#f7c873' };
    if (aqi <= 150) return { status: 'Unhealthy for Sensitive Groups', color: '#ff9f43' };
    if (aqi <= 200) return { status: 'Unhealthy', color: '#ff6b6b' };
    if (aqi <= 300) return { status: 'Very Unhealthy', color: '#a55eea' };
    return { status: 'Hazardous', color: '#6c5ce7' };
  }

  // Format time from timestamp
  private formatTime(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  // Format date for daily forecast
  private formatDay(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      weekday: 'short',
    });
  }

  // Real API call implementation
  private async makeApiCall(endpoint: string): Promise<any> {
    const response = await fetch(`${this.BASE_URL}${endpoint}&appid=${this.API_KEY}&units=imperial`);
    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`);
    }
    return response.json();
  }

  // Fetch weather data with real API calls
  async fetchWeatherData(lat: number, lon: number, onProgress?: (progress: number, message: string) => void): Promise<WeatherData> {
    try {
      onProgress?.(0.1, 'Initializing weather request...');
      
      // Fetch current weather
      onProgress?.(0.3, 'Fetching current conditions...');
      const currentResponse = await this.makeApiCall(`/weather?lat=${lat}&lon=${lon}`);
      
      onProgress?.(0.5, 'Loading hourly forecast...');
      const forecastResponse = await this.makeApiCall(`/forecast?lat=${lat}&lon=${lon}`);
      
      onProgress?.(0.7, 'Getting air quality data...');
      const aqiResponse = await this.makeApiCall(`/air_pollution?lat=${lat}&lon=${lon}`);
      
      onProgress?.(0.9, 'Processing weather data...');

      // Process current weather
      const current = currentResponse;
      const aqi = aqiResponse.list[0].main.aqi;
      const aqiInfo = this.getAirQualityInfo(aqi);

      // Process hourly forecast (next 24 hours)
      const hourly = forecastResponse.list
        .slice(0, 8) // Next 8 3-hour intervals
        .map((item: any) => ({
          hour: this.formatTime(item.dt),
          temp: Math.round(item.main.temp),
          icon: this.mapWeatherIcon(item.weather[0].icon),
        }));

      // Process daily forecast (next 5 days)
      const daily = forecastResponse.list
        .filter((item: any, index: number) => index % 8 === 0) // Every 24 hours
        .slice(0, 5)
        .map((item: any) => ({
          day: this.formatDay(item.dt),
          temp: Math.round(item.main.temp),
          icon: this.mapWeatherIcon(item.weather[0].icon),
        }));

      const weatherData: WeatherData = {
        current: {
          temp: Math.round(current.main.temp),
          feels_like: Math.round(current.main.feels_like),
          humidity: current.main.humidity,
          wind_speed: Math.round(current.wind.speed),
          visibility: Math.round(current.visibility / 1609.34), // Convert meters to miles
          description: current.weather[0].description,
          icon: this.mapWeatherIcon(current.weather[0].icon),
          uv_index: 4.5, // OpenWeatherMap doesn't provide UV in free tier
          sunrise: this.formatTime(current.sys.sunrise),
          sunset: this.formatTime(current.sys.sunset),
          aqi: aqi,
          aqi_status: aqiInfo.status,
          aqi_color: aqiInfo.color,
        },
        hourly,
        daily,
        location: {
          city: current.name,
          country: current.sys.country,
        },
        lastUpdated: new Date().toLocaleTimeString(),
      };

      onProgress?.(1, 'Weather data loaded successfully!');
      
      // Cache the data
      await this.cacheWeatherData(weatherData);
      
      return weatherData;
    } catch (error) {
      console.error('Weather API error:', error);
      throw new Error(`Failed to fetch weather data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getCachedWeatherData(): Promise<WeatherData | null> {
    try {
      const cached = await AsyncStorage.getItem(this.CACHE_KEY);
      if (!cached) return null;

      const data = JSON.parse(cached);
      const cacheTime = new Date(data.timestamp).getTime();
      const now = new Date().getTime();

      // Check if cache is still valid
      if (now - cacheTime < this.CACHE_DURATION) {
        return data.weatherData;
      }

      return null;
    } catch (error) {
      console.error('Error reading cached weather data:', error);
      return null;
    }
  }

  private async cacheWeatherData(data: WeatherData): Promise<void> {
    try {
      const cacheData = {
        weatherData: data,
        timestamp: new Date().toISOString(),
      };
      await AsyncStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error caching weather data:', error);
    }
  }

  async clearCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.CACHE_KEY);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }
}

export const weatherService = new WeatherService(); 