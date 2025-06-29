import { Inter_400Regular, Inter_600SemiBold, useFonts } from '@expo-google-fonts/inter';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import LoadingScreen from '@/components/LoadingScreen';
import { LocationData, locationService } from '@/services/locationService';
import { CitySearchResult, weatherService } from '@/services/weatherService';

const { width } = Dimensions.get('window');

interface LocationWithWeather extends LocationData {
  weather?: any;
  isCurrent?: boolean;
}

interface LoadingState {
  isLoading: boolean;
  progress: number;
  message: string;
  error: string | null;
}

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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CitySearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAddingCity, setIsAddingCity] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [loadingWeatherFor, setLoadingWeatherFor] = useState<number | null>(null); // Track which location is loading weather
  const [showSearch, setShowSearch] = useState(false); // Add state to control search visibility

  const [cardAnims, setCardAnims] = useState<Animated.Value[]>([]);
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const headerFade = useRef(new Animated.Value(0)).current;
  const searchInputRef = useRef<TextInput>(null); // Add ref for search input
  const router = useRouter();

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

  const handleLocationPress = async (location: LocationWithWeather, index: number) => {
    try {
      // If location already has weather data, just log it (in a real app, this would navigate to details)
      if (location.weather) {
        console.log('Location pressed:', location);
        // TODO: Navigate to weather details screen
        return;
      }

      // If location doesn't have weather data, fetch it
      setLoadingWeatherFor(index);
      const weather = await weatherService.fetchWeatherData(location.latitude, location.longitude);
      
      // Update the location with weather data
      setLocations(prev => prev.map((loc, i) => 
        i === index ? { ...loc, weather } : loc
      ));
    } catch (error) {
      console.error('Error fetching weather for location:', error);
      // Show error message to user
    } finally {
      setLoadingWeatherFor(null);
    }
  };

  const handleAddLocation = () => {
    // Show search interface and focus the input
    setShowSearch(true);
    setSearchQuery('');
    setSearchResults([]);
    // Focus the search input after a short delay to ensure it's rendered
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  };

  // Search/filter logic with debouncing
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await weatherService.searchCities(query, 8);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (searchQuery.trim()) {
      const timeout = setTimeout(() => {
        performSearch(searchQuery);
      }, 500); // 500ms delay
      setSearchTimeout(timeout);
    } else {
      setSearchResults([]);
    }

    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchQuery, performSearch]);

  // Check if city is already in locations
  const isCityAlreadyAdded = useCallback((city: CitySearchResult) => {
    return locations.some(location => 
      location.latitude === city.latitude && 
      location.longitude === city.longitude
    );
  }, [locations]);

  // Add city to locations
  const handleAddCity = async (city: CitySearchResult) => {
    if (isCityAlreadyAdded(city)) {
      // City already exists, just clear search
      setSearchQuery('');
      setSearchResults([]);
      setShowSearch(false);
      return;
    }

    setIsAddingCity(true);
    try {
      // Create new location using the search result data directly
      const newLocation: LocationWithWeather = {
        latitude: city.latitude,
        longitude: city.longitude,
        city: city.name, // Use the name from search results
        country: city.country, // Use the country from search results
      };

      // Add to locations list
      setLocations(prev => [...prev, newLocation]);
      
      // Fetch weather data for the new location
      const weather = await weatherService.fetchWeatherData(city.latitude, city.longitude);
      
      // Update the location with weather data
      setLocations(prev => prev.map((loc, i) => 
        i === prev.length - 1 ? { ...loc, weather } : loc
      ));
      
      // Clear search and close search interface
      setSearchQuery('');
      setSearchResults([]);
      setShowSearch(false);
      searchInputRef.current?.blur();
    } catch (error) {
      console.error('Error adding city:', error);
      // Still add the location even if weather fetch fails
      setLocations(prev => [...prev, newLocation]);
      // Clear search and close search interface
      setSearchQuery('');
      setSearchResults([]);
      setShowSearch(false);
      searchInputRef.current?.blur();
    } finally {
      setIsAddingCity(false);
    }
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
      <View style={styles.searchContainer}>
        <BlurView intensity={40} tint="light" style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#b5c6d6" style={{ marginRight: 12 }} />
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder="Search cities..."
            placeholderTextColor="#b5c6d6"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="words"
          />
          {isSearching && (
            <View style={styles.searchLoading}>
              <Animated.View
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 8,
                  borderWidth: 2,
                  borderColor: '#b5c6d6',
                  borderTopColor: 'transparent',
                  transform: [{ rotate: shimmerAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }],
                }}
              />
            </View>
          )}
          {/* Add close button when search is active */}
          {(showSearch || searchQuery.trim()) && (
            <Pressable 
              onPress={() => {
                setShowSearch(false);
                setSearchQuery('');
                setSearchResults([]);
                searchInputRef.current?.blur();
              }}
              style={{ marginLeft: 8 }}
            >
              <Ionicons name="close" size={20} color="#b5c6d6" />
            </Pressable>
          )}
        </BlurView>

        {/* Search Results */}
        {(showSearch || searchResults.length > 0) && (
          <BlurView intensity={50} tint="light" style={styles.searchResults}>
            <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false}>
              {searchResults.map((city, index) => {
                const isAlreadyAdded = isCityAlreadyAdded(city);
                return (
                  <TouchableOpacity
                    key={`${city.name}-${city.country}-${index}`}
                    style={[styles.searchResultItem, isAlreadyAdded && styles.searchResultItemDisabled]}
                    onPress={() => !isAlreadyAdded && handleAddCity(city)}
                    disabled={isAlreadyAdded || isAddingCity}
                  >
                    <View style={styles.searchResultContent}>
                      <Text style={[styles.searchResultCity, isAlreadyAdded && styles.searchResultCityDisabled]}>
                        {city.name}
                      </Text>
                      <Text style={[styles.searchResultCountry, isAlreadyAdded && styles.searchResultCountryDisabled]}>
                        {city.state ? `${city.state}, ` : ''}{city.country}
                      </Text>
                    </View>
                    {isAlreadyAdded ? (
                      <Ionicons name="checkmark-circle" size={20} color="#7ed957" />
                    ) : (
                      <Ionicons name="add-circle-outline" size={20} color="#b5c6d6" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </BlurView>
        )}

        {/* No Results State */}
        {showSearch && searchQuery.trim() && !isSearching && searchResults.length === 0 && (
          <BlurView intensity={50} tint="light" style={styles.noResultsCard}>
            <Ionicons name="search-outline" size={24} color="#b5c6d6" />
            <Text style={styles.noResultsText}>No cities found</Text>
            <Text style={styles.noResultsSubtext}>Try a different search term</Text>
          </BlurView>
        )}

        {/* Search Prompt */}
        {showSearch && !searchQuery.trim() && (
          <BlurView intensity={50} tint="light" style={styles.searchPromptCard}>
            <Ionicons name="search-outline" size={24} color="#b5c6d6" />
            <Text style={styles.searchPromptText}>Start typing to search cities</Text>
            <Text style={styles.searchPromptSubtext}>Search for any city worldwide</Text>
          </BlurView>
        )}

        {/* Adding City Loading Overlay */}
        {isAddingCity && (
          <View style={styles.addingOverlay}>
            <BlurView intensity={60} tint="light" style={styles.addingCard}>
              <Animated.View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: '#7ed957',
                  borderTopColor: 'transparent',
                  transform: [{ rotate: shimmerAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }],
                }}
              />
              <Text style={styles.addingText}>Adding city...</Text>
            </BlurView>
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
              <Pressable onPress={() => handleLocationPress(location, index)} style={styles.cardPressable}>
                <BlurView intensity={60} tint="light" style={styles.cardBlur}>
                  {({ pressed }) => (
                    <View style={[styles.cardContent, pressed && { opacity: 0.8 }]}>
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
                        {loadingWeatherFor === index ? (
                          <Animated.View
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: 10,
                              borderWidth: 2,
                              borderColor: '#7ed957',
                              borderTopColor: 'transparent',
                              transform: [{ rotate: shimmerAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }],
                            }}
                          />
                        ) : (
                          <Ionicons name="chevron-forward" size={24} color="#b5c6d6" />
                        )}
                      </View>
                      {location.weather && (
                        <View style={styles.weatherInfo}>
                          <View style={styles.weatherRow}>
                            <Ionicons name={location.weather.current.icon as any} size={20} color="#b5c6d6" />
                            <Text style={styles.weatherTemp}>{location.weather.current.temp}°</Text>
                            <Text style={styles.weatherDesc}>{location.weather.current.description}</Text>
                          </View>
                        </View>
                      )}
                    </View>
                  )}
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
  cardContent: {
    flex: 1,
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
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(227, 234, 247, 0.3)',
  },
  weatherRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherTemp: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#7a8fa6',
    marginLeft: 8,
  },
  weatherDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#b5c6d6',
    marginLeft: 8,
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
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 32,
    marginBottom: 8,
  },
  searchBar: {
    borderRadius: 16,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#7a8fa6',
  },
  searchLoading: {
    marginLeft: 12,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#b5c6d6',
    borderTopColor: 'transparent',
  },
  searchResults: {
    borderRadius: 12,
    marginTop: 4,
    maxHeight: 200,
    overflow: 'hidden',
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(227, 234, 247, 0.3)',
  },
  searchResultItemDisabled: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    opacity: 0.6,
  },
  searchResultContent: {
    flex: 1,
  },
  searchResultCity: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#7a8fa6',
    marginBottom: 2,
  },
  searchResultCityDisabled: {
    color: '#b5c6d6',
  },
  searchResultCountry: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#b5c6d6',
  },
  searchResultCountryDisabled: {
    color: '#7a8fa6',
  },
  addingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  addingCard: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  addingText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#7a8fa6',
    marginTop: 12,
  },
  noResultsCard: {
    borderRadius: 12,
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(200,220,255,0.18)',
    alignItems: 'center',
  },
  noResultsText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#7a8fa6',
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#b5c6d6',
  },
  searchPromptCard: {
    borderRadius: 12,
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(200,220,255,0.18)',
    alignItems: 'center',
  },
  searchPromptText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#7a8fa6',
    marginBottom: 8,
  },
  searchPromptSubtext: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#b5c6d6',
  },
}); 