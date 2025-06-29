import { Inter_400Regular, Inter_600SemiBold, useFonts } from '@expo-google-fonts/inter';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import LoadingScreen from '@/components/LoadingScreen';
import { LocationData, locationService } from '@/services/locationService';
import { LoadingState, WeatherData, weatherService } from '@/services/weatherService';

const { width } = Dimensions.get('window');

interface LocationWithWeather extends LocationData {
  weather?: WeatherData;
  isCurrent?: boolean;
}

const CITY_SUGGESTIONS = [
  { city: 'San Francisco', country: 'US', latitude: 37.7749, longitude: -122.4194 },
  { city: 'New York', country: 'US', latitude: 40.7128, longitude: -74.0060 },
  { city: 'London', country: 'GB', latitude: 51.5074, longitude: -0.1278 },
  { city: 'Tokyo', country: 'JP', latitude: 35.6895, longitude: 139.6917 },
  { city: 'Paris', country: 'FR', latitude: 48.8566, longitude: 2.3522 },
  { city: 'Sydney', country: 'AU', latitude: -33.8688, longitude: 151.2093 },
  { city: 'Berlin', country: 'DE', latitude: 52.52, longitude: 13.405 },
  { city: 'Toronto', country: 'CA', latitude: 43.6532, longitude: -79.3832 },
  { city: 'Moscow', country: 'RU', latitude: 55.7558, longitude: 37.6173 },
  { city: 'Beijing', country: 'CN', latitude: 39.9042, longitude: 116.4074 },
];

export default function LocationsScreen() {
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_600SemiBold });
  const [locations, setLocations] = useState<LocationWithWeather[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: true,
    progress: 0,
    message: 'Loading locations...',
    error: null,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);

  const [cardAnims, setCardAnims] = useState<Animated.Value[]>([]);
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const headerFade = useRef(new Animated.Value(0)).current;

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<typeof CITY_SUGGESTIONS>([]);

  const loadLocationsData = async () => {
    try {
      setLoadingState(prev => ({ ...prev, isLoading: true, error: null }));

      // Get current location
      setLoadingState(prev => ({ ...prev, progress: 0.2, message: 'Getting your location...' }));
      const location = await locationService.getCurrentLocation();
      setCurrentLocation(location);

      // Get location name
      setLoadingState(prev => ({ ...prev, progress: 0.4, message: 'Finding your city...' }));
      const locationName = await locationService.getLocationName(location.latitude, location.longitude);

      // Get weather for current location
      setLoadingState(prev => ({ ...prev, progress: 0.6, message: 'Loading weather data...' }));
      const weather = await weatherService.fetchWeatherData(location.latitude, location.longitude);

      // Create locations array with current location
      const locationsData: LocationWithWeather[] = [
        {
          ...location,
          city: locationName.city,
          country: locationName.country,
          weather,
          isCurrent: true,
        },
        // Add some sample locations (in a real app, these would come from user's saved locations)
        {
          latitude: 37.7749,
          longitude: -122.4194,
          city: 'San Francisco',
          country: 'US',
          weather: undefined,
          isCurrent: false,
        },
        {
          latitude: 40.7128,
          longitude: -74.0060,
          city: 'New York',
          country: 'US',
          weather: undefined,
          isCurrent: false,
        },
      ];

      setLocations(locationsData);
      setCardAnims(locationsData.map(() => new Animated.Value(0)));
      setLoadingState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      console.error('Error loading locations data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load locations data';
      setLoadingState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMessage
      }));
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadLocationsData();
    setIsRefreshing(false);
  };

  const handleLocationPress = (location: LocationWithWeather) => {
    // In a real app, this would navigate to the weather details for this location
    console.log('Location pressed:', location);
  };

  const handleAddLocation = () => {
    // In a real app, this would open a location search/add interface
    console.log('Add location pressed');
  };

  // Search/filter logic
  useEffect(() => {
    if (searchQuery.length === 0) {
      setSearchResults([]);
      return;
    }
    const results = CITY_SUGGESTIONS.filter(city =>
      city.city.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setSearchResults(results);
  }, [searchQuery]);

  // Add city to locations
  const handleAddCity = async (city: typeof CITY_SUGGESTIONS[0]) => {
    setSearchQuery('');
    setSearchResults([]);
    setLoadingState(prev => ({ ...prev, isLoading: true, message: `Adding ${city.city}...` }));
    try {
      const weather = await weatherService.fetchWeatherData(city.latitude, city.longitude);
      setLocations(prev => [
        ...prev,
        {
          ...city,
          weather,
          isCurrent: false,
        },
      ]);
    } catch (error) {
      setLoadingState(prev => ({ ...prev, isLoading: false, error: 'Failed to add city.' }));
    }
    setLoadingState(prev => ({ ...prev, isLoading: false }));
  };

  useEffect(() => {
    loadLocationsData();
  }, []);

  useEffect(() => {
    if (locations.length > 0) {
      // Create dynamic animation arrays based on data length
      const newCardAnims = locations.map(() => new Animated.Value(0));
      setCardAnims(newCardAnims);

      // Header fade in
      Animated.timing(headerFade, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();

      // Staggered card animations
      newCardAnims.forEach((anim, i) => {
        Animated.timing(anim, {
          toValue: 1,
          duration: 600,
          delay: i * 150,
          useNativeDriver: true,
        }).start();
      });

      // Shimmer effect
      Animated.loop(
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [locations]);

  if (!fontsLoaded) return <LoadingScreen message="Loading fonts..." />;

  if (loadingState.isLoading && locations.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={["#f7fafd", "#e3eaf7", "#c9d6e5"]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <LoadingScreen 
          message={loadingState.message} 
          showProgress={true} 
          progress={loadingState.progress} 
        />
      </View>
    );
  }

  if (loadingState.error && locations.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <LinearGradient
          colors={["#f7fafd", "#e3eaf7", "#c9d6e5"]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <BlurView intensity={60} tint="light" style={styles.errorCard}>
          <Ionicons name="location-off" size={64} color="#b5c6d6" />
          <Text style={styles.errorTitle}>Unable to Load Locations</Text>
          <Text style={styles.errorMessage}>{loadingState.error}</Text>
          <Pressable onPress={handleRefresh} style={styles.retryButton}>
            <BlurView intensity={40} tint="light" style={styles.retryButtonBlur}>
              <Ionicons name="refresh" size={20} color="#7ed957" />
              <Text style={styles.retryButtonText}>Try Again</Text>
            </BlurView>
          </Pressable>
        </BlurView>
      </View>
    );
  }

  const shimmerTranslate = shimmerAnim.interpolate({ inputRange: [0, 1], outputRange: [-100, 300] });

  return (
    <View style={styles.container}>
      {/* Background */}
      <LinearGradient
        colors={["#f7fafd", "#e3eaf7", "#c9d6e5"]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Search Bar */}
      <View style={{ paddingHorizontal: 20, paddingTop: 32, marginBottom: 8 }}>
        <BlurView intensity={40} tint="light" style={{ borderRadius: 16, padding: 8 }}>
          <TextInput
            placeholder="Search city..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{ fontFamily: 'Inter_400Regular', fontSize: 16, color: '#7a8fa6', padding: 8 }}
            placeholderTextColor="#b5c6d6"
          />
        </BlurView>
        {/* Suggestions Dropdown */}
        {searchResults.length > 0 && (
          <View style={{ backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 12, marginTop: 4, maxHeight: 180, overflow: 'hidden' }}>
            <FlatList
              data={searchResults}
              keyExtractor={item => item.city + item.country}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => handleAddCity(item)} style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#e3eaf7' }}>
                  <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 16, color: '#7a8fa6' }}>{item.city}, {item.country}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}
      </View>

      {/* Header */}
      <Animated.View style={[styles.header, { opacity: headerFade }]}>
        <Text style={styles.title}>Locations</Text>
        <Pressable onPress={handleRefresh} style={styles.refreshButton}>
          <BlurView intensity={30} tint="light" style={styles.refreshButtonBlur}>
            <Ionicons name="refresh" size={20} color="#7ed957" />
          </BlurView>
        </Pressable>
      </Animated.View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <Animated.View style={{ opacity: isRefreshing ? 1 : 0 }}>
            <LoadingScreen message="Refreshing..." showProgress={true} progress={0.5} />
          </Animated.View>
        }
      >
        {/* Current Location Card */}
        {locations.map((location, index) => {
          const anim = cardAnims[index];
          const scale = anim ? anim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) : 1;
          const opacity = anim || 0;
          const translateY = anim ? anim.interpolate({ inputRange: [0, 1], outputRange: [50, 0] }) : 0;

          return (
            <Animated.View
              key={index}
              style={[
                styles.locationCard,
                {
                  opacity,
                  transform: [{ scale }, { translateY }],
                },
              ]}
            >
              <Pressable onPress={() => handleLocationPress(location)} style={styles.cardPressable}>
                <BlurView intensity={60} tint="light" style={styles.cardBlur}>
                  <View style={styles.cardHeader}>
                    <View style={styles.locationInfo}>
                      <Text style={styles.cityName}>{location.city}</Text>
                      <Text style={styles.countryName}>{location.country}</Text>
                      {location.isCurrent && (
                        <View style={styles.currentBadge}>
                          <Ionicons name="location" size={12} color="#7ed957" />
                          <Text style={styles.currentText}>Current</Text>
                        </View>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={24} color="#b5c6d6" />
                  </View>

                  {location.weather && (
                    <View style={styles.weatherInfo}>
                      <View style={styles.weatherMain}>
                        <Ionicons name={location.weather.current.icon as any} size={32} color="#b5c6d6" />
                        <Text style={styles.temperature}>{location.weather.current.temp}°</Text>
                      </View>
                      <Text style={styles.weatherDescription}>{location.weather.current.description}</Text>
                      <View style={styles.weatherDetails}>
                        <View style={styles.detailItem}>
                          <Ionicons name="water" size={16} color="#b5c6d6" />
                          <Text style={styles.detailText}>{location.weather.current.humidity}%</Text>
                        </View>
                        <View style={styles.detailItem}>
                          <Ionicons name="navigate" size={16} color="#b5c6d6" />
                          <Text style={styles.detailText}>{location.weather.current.wind_speed} mph</Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Shimmer effect */}
                  <Animated.View
                    pointerEvents="none"
                    style={[
                      StyleSheet.absoluteFill,
                      {
                        opacity: 0.1,
                        transform: [{ translateX: shimmerTranslate }, { rotate: '15deg' }],
                      },
                    ]}
                  >
                    <LinearGradient
                      colors={["#fff", "#e3eaf7", "#fff"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{ flex: 1, width: 120 }}
                    />
                  </Animated.View>
                </BlurView>
              </Pressable>
            </Animated.View>
          );
        })}

        {/* Add Location Button */}
        <Pressable onPress={handleAddLocation} style={styles.addLocationButton}>
          <BlurView intensity={40} tint="light" style={styles.addLocationBlur}>
            <Ionicons name="add-circle-outline" size={32} color="#7ed957" />
            <Text style={styles.addLocationText}>Add New Location</Text>
          </BlurView>
        </Pressable>

        {/* Location Management Info */}
        <BlurView intensity={30} tint="light" style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={24} color="#b5c6d6" />
          <Text style={styles.infoText}>
            Tap on a location to view detailed weather information. 
            Add new locations to track weather in multiple cities.
          </Text>
        </BlurView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorCard: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  errorTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 24,
    color: '#7a8fa6',
    marginBottom: 12,
  },
  errorMessage: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#b5c6d6',
    marginBottom: 20,
  },
  retryButton: {
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(200,220,255,0.18)',
  },
  retryButtonBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#7ed957',
    marginLeft: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 32,
    color: '#7a8fa6',
    marginBottom: 4,
  },
  refreshButton: {
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(200,220,255,0.18)',
  },
  refreshButtonBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingTop: 60,
    paddingBottom: 120,
    paddingHorizontal: 20,
  },
  locationCard: {
    marginBottom: 12,
  },
  cardPressable: {
    flex: 1,
  },
  cardBlur: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(200,220,255,0.18)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationInfo: {
    flex: 1,
  },
  cityName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#7a8fa6',
  },
  countryName: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#b5c6d6',
  },
  currentBadge: {
    backgroundColor: '#7ed957',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  currentText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    color: '#fff',
  },
  weatherInfo: {
    marginTop: 12,
  },
  weatherMain: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  temperature: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#7a8fa6',
    marginLeft: 8,
  },
  weatherDescription: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#b5c6d6',
  },
  weatherDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  detailText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#b5c6d6',
  },
  addLocationButton: {
    borderRadius: 20,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(200,220,255,0.18)',
  },
  addLocationBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addLocationText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#7a8fa6',
    marginLeft: 8,
  },
  infoCard: {
    borderRadius: 20,
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(200,220,255,0.18)',
  },
  infoText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#b5c6d6',
  },
}); 