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
    precipitation: number;
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

export interface CitySearchResult {
  name: string;
  country: string;
  state?: string;
  latitude: number;
  longitude: number;
}

// Validation interfaces
interface RawWeatherResponse {
  main?: {
    temp?: number;
    feels_like?: number;
    humidity?: number;
  };
  wind?: {
    speed?: number;
  };
  visibility?: number;
  weather?: Array<{
    description?: string;
    icon?: string;
  }>;
  sys?: {
    sunrise?: number;
    sunset?: number;
    country?: string;
  };
  name?: string;
  rain?: {
    '1h'?: number;
  };
  clouds?: {
    all?: number;
  };
}

interface RawForecastResponse {
  list?: Array<{
    dt?: number;
    main?: {
      temp?: number;
    };
    weather?: Array<{
      icon?: string;
    }>;
  }>;
}

interface RawAirQualityResponse {
  list?: Array<{
    main?: {
      aqi?: number;
    };
  }>;
}

class WeatherService {
  private API_KEY = 'aaf171de3477f5293832e0442a5a6693';
  private BASE_URL = 'https://api.openweathermap.org/data/2.5';
  private GEOCODING_URL = 'https://api.openweathermap.org/geo/1.0';
  private CACHE_KEY = 'weather_cache';
  private CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

  // Data validation methods
  private validateWeatherResponse(data: any): RawWeatherResponse {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid weather response format');
    }

    // Validate required fields with fallbacks
    const validated: RawWeatherResponse = {
      main: {
        temp: typeof data.main?.temp === 'number' ? data.main.temp : 0,
        feels_like: typeof data.main?.feels_like === 'number' ? data.main.feels_like : 0,
        humidity: typeof data.main?.humidity === 'number' ? data.main.humidity : 0,
      },
      wind: {
        speed: typeof data.wind?.speed === 'number' ? data.wind.speed : 0,
      },
      visibility: typeof data.visibility === 'number' ? data.visibility : 10000,
      weather: Array.isArray(data.weather) && data.weather.length > 0 ? [{
        description: typeof data.weather[0].description === 'string' ? data.weather[0].description : 'Unknown',
        icon: typeof data.weather[0].icon === 'string' ? data.weather[0].icon : '01d',
      }] : [{ description: 'Unknown', icon: '01d' }],
      sys: {
        sunrise: typeof data.sys?.sunrise === 'number' ? data.sys.sunrise : Date.now() / 1000,
        sunset: typeof data.sys?.sunset === 'number' ? data.sys.sunset : Date.now() / 1000,
        country: typeof data.sys?.country === 'string' ? data.sys.country : 'Unknown',
      },
      name: typeof data.name === 'string' ? data.name : 'Unknown City',
      rain: typeof data.rain === 'object' ? data.rain : {},
      clouds: typeof data.clouds === 'object' ? data.clouds : {},
    };

    return validated;
  }

  private validateForecastResponse(data: any): RawForecastResponse {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid forecast response format');
    }

    if (!Array.isArray(data.list)) {
      throw new Error('Forecast data is missing or invalid');
    }

    // Validate each forecast item
    const validatedList = data.list.map((item: any, index: number) => {
      if (!item || typeof item !== 'object') {
        console.warn(`Invalid forecast item at index ${index}, using defaults`);
        return {
          dt: Date.now() / 1000 + (index * 3600),
          main: { temp: 0 },
          weather: [{ icon: '01d' }],
        };
      }

      return {
        dt: typeof item.dt === 'number' ? item.dt : Date.now() / 1000 + (index * 3600),
        main: {
          temp: typeof item.main?.temp === 'number' ? item.main.temp : 0,
        },
        weather: Array.isArray(item.weather) && item.weather.length > 0 ? [{
          icon: typeof item.weather[0].icon === 'string' ? item.weather[0].icon : '01d',
        }] : [{ icon: '01d' }],
      };
    });

    return { list: validatedList };
  }

  private validateAirQualityResponse(data: any): RawAirQualityResponse {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid air quality response format');
    }

    if (!Array.isArray(data.list) || data.list.length === 0) {
      throw new Error('Air quality data is missing or invalid');
    }

    const validatedList = data.list.map((item: any, index: number) => {
      if (!item || typeof item !== 'object') {
        console.warn(`Invalid air quality item at index ${index}, using defaults`);
        return { main: { aqi: 1 } };
      }

      return {
        main: {
          aqi: typeof item.main?.aqi === 'number' ? item.main.aqi : 1,
        },
      };
    });

    return { list: validatedList };
  }

  private validateCitySearchResponse(data: any): CitySearchResult[] {
    if (!Array.isArray(data)) {
      return [];
    }

    return data
      .filter((city: any) => {
        return city && 
               typeof city.name === 'string' && 
               typeof city.country === 'string' &&
               typeof city.lat === 'number' &&
               typeof city.lon === 'number';
      })
      .map((city: any) => ({
        name: city.name,
        country: city.country,
        state: typeof city.state === 'string' ? city.state : undefined,
        latitude: city.lat,
        longitude: city.lon,
      }));
  }

  private validateCachedData(data: any): WeatherData | null {
    try {
      if (!data || typeof data !== 'object') return null;

      // Validate required fields
      const requiredFields = ['current', 'hourly', 'daily', 'location', 'lastUpdated'];
      for (const field of requiredFields) {
        if (!(field in data)) {
          console.warn(`Cached data missing required field: ${field}`);
          return null;
        }
      }

      // Validate current weather data
      const current = data.current;
      if (!current || typeof current !== 'object') return null;

      const currentRequired = ['temp', 'feels_like', 'humidity', 'wind_speed', 'description', 'icon', 'precipitation'];
      for (const field of currentRequired) {
        if (!(field in current)) {
          console.warn(`Cached current weather missing field: ${field}`);
          return null;
        }
      }

      // Validate arrays
      if (!Array.isArray(data.hourly) || !Array.isArray(data.daily)) {
        console.warn('Cached data has invalid hourly or daily arrays');
        return null;
      }

      return data as WeatherData;
    } catch (error) {
      console.error('Error validating cached data:', error);
      return null;
    }
  }

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

  // Real API call implementation with validation
  private async makeApiCall(endpoint: string): Promise<any> {
    try {
      const response = await fetch(`${this.BASE_URL}${endpoint}&appid=${this.API_KEY}&units=metric`);
      
      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data) {
        throw new Error('Empty response from API');
      }

      return data;
    } catch (error) {
      console.error('API call error:', error);
      throw new Error(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Fetch weather data with real API calls and validation
  async fetchWeatherData(lat: number, lon: number, onProgress?: (progress: number, message: string) => void): Promise<WeatherData> {
    try {
      // Validate coordinates
      if (typeof lat !== 'number' || typeof lon !== 'number' || 
          isNaN(lat) || isNaN(lon) || 
          lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        throw new Error('Invalid coordinates provided');
      }

      onProgress?.(0.1, 'Initializing weather request...');
      
      // Fetch current weather with validation
      onProgress?.(0.3, 'Fetching current conditions...');
      const currentRaw = await this.makeApiCall(`/weather?lat=${lat}&lon=${lon}`);
      const current = this.validateWeatherResponse(currentRaw);
      
      // Fetch forecast with validation
      onProgress?.(0.5, 'Loading hourly forecast...');
      const forecastRaw = await this.makeApiCall(`/forecast?lat=${lat}&lon=${lon}`);
      const forecast = this.validateForecastResponse(forecastRaw);
      
      // Fetch air quality with validation
      onProgress?.(0.7, 'Getting air quality data...');
      const aqiRaw = await this.makeApiCall(`/air_pollution?lat=${lat}&lon=${lon}`);
      const aqi = this.validateAirQualityResponse(aqiRaw);
      
      onProgress?.(0.9, 'Processing weather data...');

      // Process current weather
      const aqiValue = aqi.list[0].main.aqi;
      const aqiInfo = this.getAirQualityInfo(aqiValue);

      // Calculate precipitation probability from cloudiness
      const precipitation = current.clouds?.all || 0;

      // Process hourly forecast (next 24 hours) with validation
      const hourly = forecast.list
        .slice(0, 8) // Next 8 3-hour intervals
        .map((item: any) => ({
          hour: this.formatTime(item.dt),
          temp: Math.round(item.main.temp),
          icon: this.mapWeatherIcon(item.weather[0].icon),
        }));

      // Process daily forecast (next 5 days) with validation
      const daily = forecast.list
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
          visibility: Math.round(current.visibility / 1000),
          description: current.weather[0].description,
          icon: this.mapWeatherIcon(current.weather[0].icon),
          precipitation: precipitation,
          uv_index: 4.5,
          sunrise: this.formatTime(current.sys.sunrise),
          sunset: this.formatTime(current.sys.sunset),
          aqi: aqiValue,
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
      
      // Cache the validated data
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

      const parsed = JSON.parse(cached);
      if (!parsed || typeof parsed !== 'object') {
        console.warn('Invalid cached data format');
        return null;
      }

      const { weatherData, timestamp } = parsed;
      
      // Validate timestamp
      if (!timestamp || isNaN(new Date(timestamp).getTime())) {
        console.warn('Invalid cache timestamp');
        return null;
      }

      const cacheTime = new Date(timestamp).getTime();
      const now = new Date().getTime();

      // Check if cache is still valid
      if (now - cacheTime >= this.CACHE_DURATION) {
        console.log('Cache expired');
        return null;
      }

      // Validate the cached weather data
      const validatedData = this.validateCachedData(weatherData);
      if (!validatedData) {
        console.warn('Cached data validation failed');
        await this.clearCache(); // Clear invalid cache
        return null;
      }

      return validatedData;
    } catch (error) {
      console.error('Error reading cached weather data:', error);
      return null;
    }
  }

  private async cacheWeatherData(data: WeatherData): Promise<void> {
    try {
      // Validate data before caching
      if (!this.validateCachedData(data)) {
        console.warn('Attempted to cache invalid weather data');
        return;
      }

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

  async searchCities(query: string, limit: number = 10): Promise<CitySearchResult[]> {
    try {
      // Validate input parameters
      if (!query || typeof query !== 'string' || query.trim().length === 0) {
        return [];
      }

      if (typeof limit !== 'number' || limit <= 0 || limit > 50) {
        limit = 10; // Use default if invalid
      }

      const response = await fetch(
        `${this.GEOCODING_URL}/direct?q=${encodeURIComponent(query.trim())}&limit=${limit}&appid=${this.API_KEY}`
      );

      if (!response.ok) {
        throw new Error(`City search failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Validate and filter the response
      return this.validateCitySearchResponse(data);
    } catch (error) {
      console.error('Error searching cities:', error);
      throw new Error('Failed to search cities. Please try again.');
    }
  }
}

export const weatherService = new WeatherService(); 