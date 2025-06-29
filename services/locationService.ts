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

class LocationService {
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

  // Get current location
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

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.error('Error getting current location:', error);
      throw new Error(`Failed to get location: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get location name from coordinates (reverse geocoding)
  async getLocationName(latitude: number, longitude: number): Promise<{ city: string; country: string }> {
    try {
      const results = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (results.length > 0) {
        const location = results[0];
        return {
          city: location.city || location.subregion || 'Unknown City',
          country: location.country || 'Unknown Country',
        };
      }

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

  // Get location error message
  getLocationErrorMessage(error: any): string {
    if (error.message.includes('permission denied')) {
      return 'Location permission denied. Please enable location access in settings.';
    }
    if (error.message.includes('location services')) {
      return 'Location services are disabled. Please enable GPS.';
    }
    if (error.message.includes('network')) {
      return 'Network error. Please check your internet connection.';
    }
    return 'Unable to get your location. Please try again.';
  }
}

export const locationService = new LocationService(); 