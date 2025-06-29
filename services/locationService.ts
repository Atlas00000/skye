import * as Location from 'expo-location';

export interface LocationData {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
}

export interface LocationError {
  code: string;
  message: string;
}

// Validation interfaces
interface RawGeocodingResponse {
  name?: string;
  local_names?: {
    en?: string;
  };
  country?: string;
}

class LocationService {
  private API_KEY = 'aaf171de3477f5293832e0442a5a6693';
  private GEOCODING_URL = 'https://api.openweathermap.org/geo/1.0';

  // Validate coordinates
  private validateCoordinates(latitude: number, longitude: number): boolean {
    return (
      typeof latitude === 'number' &&
      typeof longitude === 'number' &&
      !isNaN(latitude) &&
      !isNaN(longitude) &&
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180
    );
  }

  // Validate location data
  private validateLocationData(data: any): LocationData | null {
    try {
      if (!data || typeof data !== 'object') {
        console.warn('Invalid location data format');
        return null;
      }

      const { latitude, longitude } = data;
      
      if (!this.validateCoordinates(latitude, longitude)) {
        console.warn('Invalid coordinates in location data');
        return null;
      }

      return {
        latitude,
        longitude,
        city: typeof data.city === 'string' ? data.city : undefined,
        country: typeof data.country === 'string' ? data.country : undefined,
      };
    } catch (error) {
      console.error('Error validating location data:', error);
      return null;
    }
  }

  // Validate geocoding response
  private validateGeocodingResponse(data: any): RawGeocodingResponse[] {
    if (!Array.isArray(data)) {
      console.warn('Geocoding response is not an array');
      return [];
    }

    return data.filter((item: any) => {
      if (!item || typeof item !== 'object') {
        return false;
      }

      // At minimum, we need coordinates
      if (!this.validateCoordinates(item.lat, item.lon)) {
        return false;
      }

      return true;
    });
  }

  // Request location permissions
  async requestLocationPermission(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  }

  // Get current location with validation
  async getCurrentLocation(): Promise<LocationData> {
    try {
      // Check if permission is granted
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        const granted = await this.requestLocationPermission();
        if (!granted) {
          throw new Error('Location permission denied');
        }
      }

      // Get current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 10000,
        distanceInterval: 1000,
      });

      const locationData: LocationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      // Validate the location data
      const validatedData = this.validateLocationData(locationData);
      if (!validatedData) {
        throw new Error('Invalid location data received from device');
      }

      return validatedData;
    } catch (error) {
      console.error('Error getting current location:', error);
      throw new Error(`Failed to get location: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get location name from coordinates using OpenWeatherMap reverse geocoding with validation
  async getLocationName(latitude: number, longitude: number): Promise<{ city: string; country: string }> {
    try {
      // Validate input coordinates
      if (!this.validateCoordinates(latitude, longitude)) {
        throw new Error('Invalid coordinates provided for geocoding');
      }

      const response = await fetch(
        `${this.GEOCODING_URL}/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${this.API_KEY}`
      );

      if (!response.ok) {
        throw new Error(`Reverse geocoding failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Validate the response
      const validatedData = this.validateGeocodingResponse(data);
      
      if (validatedData.length > 0) {
        const location = validatedData[0];
        return {
          city: location.name || location.local_names?.en || 'Unknown City',
          country: location.country || 'Unknown Country',
        };
      }

      // Fallback values if no valid data
      return { city: 'Unknown City', country: 'Unknown Country' };
    } catch (error) {
      console.error('Error getting location name:', error);
      return { city: 'Unknown City', country: 'Unknown Country' };
    }
  }

  // Check if location services are enabled
  async isLocationEnabled(): Promise<boolean> {
    try {
      const enabled = await Location.hasServicesEnabledAsync();
      return enabled;
    } catch (error) {
      console.error('Error checking location services:', error);
      return false;
    }
  }

  // Get location error message with enhanced error handling
  getLocationErrorMessage(error: any): string {
    if (!error) {
      return 'An unknown location error occurred.';
    }

    const errorMessage = error.message || error.toString() || 'Unknown error';

    if (errorMessage.includes('permission denied') || errorMessage.includes('denied')) {
      return 'Location permission denied. Please enable location access in settings.';
    }
    if (errorMessage.includes('location services') || errorMessage.includes('disabled')) {
      return 'Location services are disabled. Please enable GPS.';
    }
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return 'Network error. Please check your internet connection.';
    }
    if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
      return 'Location request timed out. Please try again.';
    }
    if (errorMessage.includes('invalid') || errorMessage.includes('coordinates')) {
      return 'Invalid location data received. Please try again.';
    }
    
    return `Unable to get your location: ${errorMessage}`;
  }

  // Validate and sanitize location data for storage/transmission
  sanitizeLocationData(data: LocationData): LocationData | null {
    try {
      const validated = this.validateLocationData(data);
      if (!validated) {
        return null;
      }

      // Round coordinates to reasonable precision (6 decimal places = ~1 meter accuracy)
      return {
        ...validated,
        latitude: Math.round(validated.latitude * 1000000) / 1000000,
        longitude: Math.round(validated.longitude * 1000000) / 1000000,
      };
    } catch (error) {
      console.error('Error sanitizing location data:', error);
      return null;
    }
  }

  // Check if two locations are the same (within reasonable tolerance)
  areLocationsEqual(loc1: LocationData, loc2: LocationData, toleranceMeters: number = 100): boolean {
    try {
      if (!this.validateLocationData(loc1) || !this.validateLocationData(loc2)) {
        return false;
      }

      // Calculate distance using Haversine formula
      const R = 6371000; // Earth's radius in meters
      const lat1Rad = (loc1.latitude * Math.PI) / 180;
      const lat2Rad = (loc2.latitude * Math.PI) / 180;
      const deltaLat = ((loc2.latitude - loc1.latitude) * Math.PI) / 180;
      const deltaLon = ((loc2.longitude - loc1.longitude) * Math.PI) / 180;

      const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
                Math.cos(lat1Rad) * Math.cos(lat2Rad) *
                Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      return distance <= toleranceMeters;
    } catch (error) {
      console.error('Error comparing locations:', error);
      return false;
    }
  }
}

export const locationService = new LocationService(); 