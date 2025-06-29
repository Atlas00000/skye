import { Inter_400Regular, Inter_600SemiBold, useFonts } from '@expo-google-fonts/inter';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import LoadingScreen from '@/components/LoadingScreen';
import ScreenTransition from '@/components/ScreenTransition';
import { locationService } from '@/services/locationService';
import { navigationService } from '@/services/navigationService';
import { LoadingState, WeatherData, weatherService } from '@/services/weatherService';

const { width } = Dimensions.get('window');

function useCountUp(to: number, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start = 0;
    const startTime = Date.now();
    function animate() {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setValue(Math.round(start + (to - start) * progress));
      if (progress < 1) requestAnimationFrame(animate);
    }
    animate();
  }, [to, duration]);
  return value;
}

export default function HomeScreen() {
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_600SemiBold });
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: true,
    progress: 0,
    message: 'Loading Skye...',
    error: null,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showTransition, setShowTransition] = useState(false);
  
  const scrollY = useRef(new Animated.Value(0)).current;
  const cloudAnim = useRef(new Animated.Value(0)).current;
  const mistAnim = useRef(new Animated.Value(0)).current;
  const headerFade = useRef(new Animated.Value(0)).current;
  const dateFade = useRef(new Animated.Value(0)).current;
  const summaryFade = useRef(new Animated.Value(0)).current;
  const detailsFade = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const [hourlyAnims, setHourlyAnims] = useState<Animated.Value[]>([]);
  const [dailyAnims, setDailyAnims] = useState<Animated.Value[]>([]);
  const alertAnim = useRef(new Animated.Value(-60)).current;
  const [pressedIndex, setPressedIndex] = useState<number | null>(null);
  const router = useRouter();

  // Safe data access functions
  const getSafeTemperature = (temp: any): number => {
    if (typeof temp === 'number' && !isNaN(temp)) {
      return Math.round(temp);
    }
    return 0;
  };

  const getSafeString = (value: any, fallback: string = ''): string => {
    return typeof value === 'string' ? value : fallback;
  };

  const getSafeArray = (value: any): any[] => {
    return Array.isArray(value) ? value : [];
  };

  const tempValue = useCountUp(getSafeTemperature(weatherData?.current.temp) || 0, 1200);

  // Load weather data with real location
  const loadWeatherData = useCallback(async (showProgress = true) => {
    try {
      setLoadingState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Try to load cached data first
      const cachedData = await weatherService.getCachedWeatherData();
      if (cachedData && !showProgress) {
        // Validate cached data before using it
        if (isValidWeatherData(cachedData)) {
          setWeatherData(cachedData);
          setLoadingState(prev => ({ ...prev, isLoading: false }));
          return;
        } else {
          console.warn('Invalid cached data found, clearing cache');
          await weatherService.clearCache();
        }
      }

      // Get current location
      setLoadingState(prev => ({ ...prev, progress: 0.1, message: 'Getting your location...' }));
      const location = await locationService.getCurrentLocation();
      
      // Validate location data
      if (!location || !isValidLocationData(location)) {
        throw new Error('Invalid location data received');
      }
      
      // Get location name
      setLoadingState(prev => ({ ...prev, progress: 0.2, message: 'Finding your city...' }));
      const locationName = await locationService.getLocationName(location.latitude, location.longitude);

      // Fetch weather data with progress tracking
      const data = await weatherService.fetchWeatherData(location.latitude, location.longitude, (progress, message) => {
        setLoadingState(prev => ({ ...prev, progress: 0.2 + (progress * 0.8), message }));
      });

      // Validate weather data before setting it
      if (!isValidWeatherData(data)) {
        throw new Error('Invalid weather data received from API');
      }

      // Update location name if not provided by weather API
      if (!data.location.city || data.location.city === 'Unknown City') {
        data.location.city = locationName.city;
        data.location.country = locationName.country;
      }

      setWeatherData(data);
      setLoadingState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      console.error('Error loading weather data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load weather data';
      setLoadingState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMessage
      }));
    }
  }, []);

  // Data validation functions
  const isValidWeatherData = (data: any): data is WeatherData => {
    try {
      if (!data || typeof data !== 'object') return false;

      // Check required top-level fields
      const requiredFields = ['current', 'hourly', 'daily', 'location', 'lastUpdated'];
      for (const field of requiredFields) {
        if (!(field in data)) {
          console.warn(`Weather data missing required field: ${field}`);
          return false;
        }
      }

      // Validate current weather
      const current = data.current;
      if (!current || typeof current !== 'object') return false;

      const currentRequired = ['temp', 'feels_like', 'humidity', 'wind_speed', 'description', 'icon', 'precipitation'];
      for (const field of currentRequired) {
        if (!(field in current) || typeof current[field] === 'undefined') {
          console.warn(`Current weather missing field: ${field}`);
          return false;
        }
      }

      // Validate arrays
      if (!Array.isArray(data.hourly) || !Array.isArray(data.daily)) {
        console.warn('Weather data has invalid hourly or daily arrays');
        return false;
      }

      // Validate location
      const location = data.location;
      if (!location || typeof location !== 'object' || 
          !location.city || !location.country) {
        console.warn('Weather data has invalid location');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error validating weather data:', error);
      return false;
    }
  };

  const isValidLocationData = (data: any): boolean => {
    try {
      if (!data || typeof data !== 'object') return false;

      const { latitude, longitude } = data;
      
      return (
        typeof latitude === 'number' &&
        typeof longitude === 'number' &&
        !isNaN(latitude) &&
        !isNaN(longitude) &&
        latitude >= -90 && latitude <= 90 &&
        longitude >= -180 && longitude <= 180
      );
    } catch (error) {
      console.error('Error validating location data:', error);
      return false;
    }
  };

  // Refresh weather data
  const refreshWeather = useCallback(async () => {
    setIsRefreshing(true);
    await loadWeatherData(true);
    setIsRefreshing(false);
  }, [loadWeatherData]);

  // Handle navigation with transitions
  const handleNavigation = useCallback(async (screen: string) => {
    setShowTransition(true);
    await navigationService.navigateTo(screen);
    setTimeout(() => setShowTransition(false), 500);
  }, []);

  useEffect(() => {
    loadWeatherData(false);
  }, [loadWeatherData]);

  useEffect(() => {
    if (!weatherData) return;

    // Create dynamic animation arrays based on data length
    const newHourlyAnims = weatherData.hourly.map(() => new Animated.Value(0));
    const newDailyAnims = weatherData.daily.map(() => new Animated.Value(0));
    setHourlyAnims(newHourlyAnims);
    setDailyAnims(newDailyAnims);

    // Header fade in
    Animated.sequence([
      Animated.timing(headerFade, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(dateFade, { toValue: 1, duration: 500, delay: 200, useNativeDriver: true }),
    ]).start();

    // Summary/details fade in
    Animated.timing(summaryFade, { toValue: 1, duration: 600, delay: 400, useNativeDriver: true }).start();
    Animated.timing(detailsFade, { toValue: 1, duration: 600, delay: 600, useNativeDriver: true }).start();

    // Shimmer
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1800,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Hourly/daily staggered
    newHourlyAnims.forEach((anim, i) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 500,
        delay: 800 + i * 120,
        useNativeDriver: true,
      }).start();
    });

    newDailyAnims.forEach((anim, i) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 500,
        delay: 1200 + i * 120,
        useNativeDriver: true,
      }).start();
    });

    // Cloud/mist animations
    Animated.loop(
      Animated.sequence([
        Animated.timing(cloudAnim, { toValue: 1, duration: 4000, useNativeDriver: true }),
        Animated.timing(cloudAnim, { toValue: 0, duration: 4000, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(mistAnim, { toValue: 1, duration: 9000, useNativeDriver: true }),
        Animated.timing(mistAnim, { toValue: 0, duration: 9000, useNativeDriver: true }),
      ])
    ).start();

    // Alert slide in
    Animated.spring(alertAnim, {
      toValue: 0,
      useNativeDriver: true,
      friction: 7,
      tension: 60,
      delay: 1800,
    }).start();
  }, [weatherData]);

  if (!fontsLoaded) return <LoadingScreen message="Loading fonts..." />;

  if (loadingState.isLoading && !weatherData) {
    return (
      <LoadingScreen 
        message={loadingState.message} 
        showProgress={true} 
        progress={loadingState.progress} 
      />
    );
  }

  if (loadingState.error && !weatherData) {
    return (
      <View style={styles.errorContainer}>
        <LinearGradient
          colors={["#f7fafd", "#e3eaf7", "#c9d6e5"]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <BlurView intensity={60} tint="light" style={styles.errorCard}>
          <Ionicons name="cloud-offline" size={64} color="#b5c6d6" />
          <Text style={styles.errorTitle}>Unable to Load Weather</Text>
          <Text style={styles.errorMessage}>{loadingState.error}</Text>
          <Pressable onPress={refreshWeather} style={styles.retryButton}>
            <BlurView intensity={40} tint="light" style={styles.retryButtonBlur}>
              <Ionicons name="refresh" size={20} color="#7ed957" />
              <Text style={styles.retryButtonText}>Try Again</Text>
            </BlurView>
          </Pressable>
        </BlurView>
      </View>
    );
  }

  if (!weatherData) return null;

  // Parallax for header
  const headerTranslate = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [0, -60],
    extrapolate: 'clamp',
  });
  const cloudTranslate = cloudAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 20] });
  const mistOpacity = mistAnim.interpolate({ inputRange: [0, 1], outputRange: [0.18, 0.32] });
  const mistDrift = mistAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 30] });
  const shimmerTranslate = shimmerAnim.interpolate({ inputRange: [0, 1], outputRange: [-100, 300] });

  return (
    <View style={{ flex: 1, backgroundColor: '#f7fafd' }}>
      {/* Screen Transition Overlay */}
      <ScreenTransition 
        isVisible={showTransition} 
        message="Switching screens..." 
        type="slide" 
      />

      {/* Animated Gradient Background */}
      <LinearGradient
        colors={["#f7fafd", "#e3eaf7", "#c9d6e5"]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Animated Mist Overlay */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: mistOpacity, transform: [{ translateX: mistDrift }] }]}> 
        <BlurView intensity={60} tint="light" style={{ flex: 1 }} />
      </Animated.View>

      {/* Last Updated Widget */}
      <View style={{ position: 'absolute', top: 18, left: 0, right: 0, alignItems: 'center', zIndex: 10 }}>
        <Text style={{ fontFamily: 'Inter_400Regular', color: '#b5c6d6', fontSize: 13, opacity: 0.7 }}>
          {`Last updated: ${getSafeString(weatherData.lastUpdated, 'Unknown')}`}
        </Text>
      </View>

      {/* Settings Button */}
      <View style={{ position: 'absolute', top: 18, right: 18, zIndex: 11 }}>
        <Pressable onPress={() => handleNavigation('settings')}>
          <BlurView intensity={30} tint="light" style={{ borderRadius: 16, padding: 8 }}>
            <Ionicons name="settings-outline" size={22} color="#b5c6d6" />
          </BlurView>
        </Pressable>
      </View>

      <Animated.ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshWeather}
            tintColor="#7a8fa6"
            colors={["#7a8fa6"]}
            progressBackgroundColor="rgba(255,255,255,0.8)"
          />
        }
      >
        {/* Header with City, Date, Animated Cloud */}
        <Animated.View style={[styles.header, { transform: [{ translateY: headerTranslate }], opacity: headerFade }]}> 
          <Text style={styles.city}>{getSafeString(weatherData.location.city, 'Unknown City')}</Text>
          <Animated.Text style={[styles.date, { opacity: dateFade }]}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', hour: 'numeric', minute: '2-digit' })}
          </Animated.Text>
          <Animated.View style={{
            marginTop: 8,
            transform: [
              { translateX: cloudTranslate },
              { scale: 1.1 },
            ],
          }}>
            <Ionicons name={getSafeString(weatherData.current.icon, 'cloud') as any} size={54} color="#b5c6d6" style={styles.cloudIcon} />
          </Animated.View>
        </Animated.View>

        {/* Current Weather Glass Card with shimmer */}
        <BlurView intensity={60} tint="light" style={styles.glassCard}>
          <View style={{ overflow: 'hidden', width: '100%', alignItems: 'center' }}>
            {/* Shimmer */}
            <Animated.View
              pointerEvents="none"
              style={[
                StyleSheet.absoluteFill,
                {
                  height: 80,
                  top: 0,
                  left: 0,
                  opacity: 0.18,
                  transform: [{ translateX: shimmerTranslate }, { rotate: '15deg' }],
                  backgroundColor: 'transparent',
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
            <Animated.Text style={[styles.temp, { opacity: summaryFade }]}>{getSafeTemperature(weatherData.current.temp)}°</Animated.Text>
            <Animated.Text style={[styles.summary, { 
              opacity: summaryFade, 
              transform: [{ 
                translateY: summaryFade ? summaryFade.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) : 0 
              }] 
            }]}>
              {getSafeString(weatherData.current.description, 'Unknown conditions')}
            </Animated.Text>
            <Animated.View style={[styles.detailsRow, { 
              opacity: detailsFade, 
              transform: [{ 
                translateY: detailsFade ? detailsFade.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) : 0 
              }] 
            }] }>
              <View style={styles.detailItem}>
                <Ionicons name="water" size={20} color="#b5c6d6" />
                <Text style={styles.detailValue}>{getSafeTemperature(weatherData.current.humidity)}%</Text>
                <Text style={styles.detailLabel}>Humidity</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="navigate" size={20} color="#b5c6d6" />
                <Text style={styles.detailValue}>{getSafeTemperature(weatherData.current.wind_speed)} km/h</Text>
                <Text style={styles.detailLabel}>Wind</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="eye" size={20} color="#b5c6d6" />
                <Text style={styles.detailValue}>{getSafeTemperature(weatherData.current.visibility)} km</Text>
                <Text style={styles.detailLabel}>Visibility</Text>
              </View>
            </Animated.View>
          </View>
        </BlurView>

        {/* Feels Like & UV Index Widget */}
        <BlurView intensity={50} tint="light" style={[styles.glassCard, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 18, paddingHorizontal: 24 }]}> 
          <View style={{ flex: 1, alignItems: 'center' }}>
            <MaterialCommunityIcons name="thermometer" size={28} color="#b5c6d6" />
            <Text style={{ fontFamily: 'Inter_400Regular', color: '#b5c6d6', fontSize: 13, marginTop: 2 }}>Feels Like</Text>
            <Text style={{ fontFamily: 'Inter_600SemiBold', color: '#7a8fa6', fontSize: 18, marginTop: 2 }}>{getSafeTemperature(weatherData.current.feels_like)}°</Text>
          </View>
          <View style={{ width: 1, height: 38, backgroundColor: '#e3eaf7', marginHorizontal: 18, opacity: 0.18 }} />
          <View style={{ flex: 1, alignItems: 'center' }}>
            <MaterialCommunityIcons name="weather-sunny-alert" size={28} color="#f7c873" />
            <Text style={{ fontFamily: 'Inter_400Regular', color: '#b5c6d6', fontSize: 13, marginTop: 2 }}>UV Index</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
              <Text style={{ fontFamily: 'Inter_600SemiBold', color: '#7a8fa6', fontSize: 18 }}>{getSafeTemperature(weatherData.current.uv_index)}</Text>
              <View style={{ width: 60, height: 8, backgroundColor: '#e3eaf7', borderRadius: 4, marginLeft: 8, overflow: 'hidden' }}>
                <View style={{ width: (getSafeTemperature(weatherData.current.uv_index) / 11) * 60, height: 8, backgroundColor: '#f7c873', borderRadius: 4 }} />
              </View>
            </View>
          </View>
        </BlurView>

        {/* Precipitation Widget */}
        <BlurView intensity={50} tint="light" style={[styles.glassCard, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 18, paddingHorizontal: 24 }]}> 
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Ionicons name="rainy" size={28} color="#7a8fa6" />
            <Text style={{ fontFamily: 'Inter_400Regular', color: '#b5c6d6', fontSize: 13, marginTop: 2 }}>Precipitation</Text>
            <Text style={{ fontFamily: 'Inter_600SemiBold', color: '#7a8fa6', fontSize: 18, marginTop: 2 }}>{getSafeTemperature(weatherData.current.precipitation)}%</Text>
          </View>
          <View style={{ width: 1, height: 38, backgroundColor: '#e3eaf7', marginHorizontal: 18, opacity: 0.18 }} />
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Ionicons name="cloud" size={28} color="#b5c6d6" />
            <Text style={{ fontFamily: 'Inter_400Regular', color: '#b5c6d6', fontSize: 13, marginTop: 2 }}>Conditions</Text>
            <Text style={{ fontFamily: 'Inter_600SemiBold', color: '#7a8fa6', fontSize: 16, marginTop: 2, textAlign: 'center' }}>{getSafeString(weatherData.current.description, 'Unknown')}</Text>
          </View>
        </BlurView>

        {/* Sunrise & Sunset Widget */}
        <BlurView intensity={50} tint="light" style={[styles.glassCard, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 18, paddingHorizontal: 24 }]}> 
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Ionicons name="sunny-outline" size={28} color="#f7c873" />
            <Text style={{ fontFamily: 'Inter_400Regular', color: '#b5c6d6', fontSize: 13, marginTop: 2 }}>Sunrise</Text>
            <Text style={{ fontFamily: 'Inter_600SemiBold', color: '#7a8fa6', fontSize: 18, marginTop: 2 }}>{getSafeString(weatherData.current.sunrise, '--:--')}</Text>
          </View>
          <View style={{ width: 1, height: 38, backgroundColor: '#e3eaf7', marginHorizontal: 18, opacity: 0.18 }} />
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Ionicons name="moon-outline" size={28} color="#b5c6d6" />
            <Text style={{ fontFamily: 'Inter_400Regular', color: '#b5c6d6', fontSize: 13, marginTop: 2 }}>Sunset</Text>
            <Text style={{ fontFamily: 'Inter_600SemiBold', color: '#7a8fa6', fontSize: 18, marginTop: 2 }}>{getSafeString(weatherData.current.sunset, '--:--')}</Text>
          </View>
        </BlurView>

        {/* Air Quality Widget */}
        <BlurView intensity={50} tint="light" style={[styles.glassCard, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 18, paddingHorizontal: 24 }]}> 
          <View style={{ flex: 1, alignItems: 'center' }}>
            <MaterialCommunityIcons name="air-filter" size={28} color={getSafeString(weatherData.current.aqi_color, '#b5c6d6')} />
            <Text style={{ fontFamily: 'Inter_400Regular', color: '#b5c6d6', fontSize: 13, marginTop: 2 }}>Air Quality</Text>
            <Text style={{ fontFamily: 'Inter_600SemiBold', color: '#7a8fa6', fontSize: 18, marginTop: 2 }}>{getSafeTemperature(weatherData.current.aqi)}</Text>
          </View>
          <View style={{ flex: 2, marginLeft: 18 }}>
            <Text style={{ fontFamily: 'Inter_400Regular', color: getSafeString(weatherData.current.aqi_color, '#b5c6d6'), fontSize: 15, marginBottom: 4 }}>{getSafeString(weatherData.current.aqi_status, 'Unknown')}</Text>
            <View style={{ width: 90, height: 8, backgroundColor: '#e3eaf7', borderRadius: 4, overflow: 'hidden' }}>
              <View style={{ width: (getSafeTemperature(weatherData.current.aqi) / 500) * 90, height: 8, backgroundColor: getSafeString(weatherData.current.aqi_color, '#b5c6d6'), borderRadius: 4 }} />
            </View>
          </View>
        </BlurView>

        {/* Hourly Forecast - Swipeable, staggered */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hourly Forecast</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hourlyRow}>
            {getSafeArray(weatherData.hourly).map((h, i) => {
              const scale = pressedIndex === i ? 0.96 : 1;
              const anim = hourlyAnims && hourlyAnims[i];
              return (
                <Animated.View
                  key={i}
                  style={{
                    opacity: anim ? anim : 0,
                    transform: [
                      { translateY: anim ? anim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) : 0 },
                      { scale },
                    ],
                  }}
                >
                  <Pressable
                    onPressIn={() => setPressedIndex(i)}
                    onPressOut={() => setPressedIndex(null)}
                    style={({ pressed }) => [styles.hourlyCard, pressed && { opacity: 0.8 }]}
                  >
                    <Text style={styles.hourlyHour}>{getSafeString(h.hour, '--')}</Text>
                    <Ionicons name={getSafeString(h.icon, 'cloud') as any} size={28} color="#b5c6d6" />
                    <Text style={styles.hourlyTemp}>{getSafeTemperature(h.temp)}°</Text>
                  </Pressable>
                </Animated.View>
              );
            })}
          </ScrollView>
        </View>

        {/* Daily Forecast - Scrollable, staggered */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5-Day Forecast</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dailyRow}>
            {getSafeArray(weatherData.daily).map((d, i) => {
              const scale = pressedIndex === 100 + i ? 0.96 : 1;
              const anim = dailyAnims && dailyAnims[i];
              return (
                <Animated.View
                  key={i}
                  style={{
                    opacity: anim ? anim : 0,
                    transform: [
                      { translateY: anim ? anim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) : 0 },
                      { scale },
                    ],
                  }}
                >
                  <Pressable
                    onPressIn={() => setPressedIndex(100 + i)}
                    onPressOut={() => setPressedIndex(null)}
                    style={({ pressed }) => [styles.dailyCard, pressed && { opacity: 0.8 }]}
                  >
                    <Text style={styles.dailyDay}>{getSafeString(d.day, '--')}</Text>
                    <Ionicons name={getSafeString(d.icon, 'cloud') as any} size={28} color="#b5c6d6" />
                    <Text style={styles.dailyTemp}>{getSafeTemperature(d.temp)}°</Text>
                  </Pressable>
                </Animated.View>
              );
            })}
          </ScrollView>
        </View>

        {/* Radar Section - Misty Animated Placeholder with shimmer/particle */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Live Radar</Text>
          <BlurView intensity={40} tint="light" style={styles.radarCard}>
            <Animated.View style={{ opacity: mistOpacity, flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="cloud-outline" size={48} color="#b5c6d6" style={{ opacity: 0.5 }} />
              <Text style={styles.radarText}>Misty radar coming soon…</Text>
              {/* Simple shimmer/particle effect */}
              <Animated.View
                style={{
                  position: 'absolute',
                  left: shimmerTranslate,
                  top: 30,
                  width: 60,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: '#e3eaf7',
                  opacity: 0.13,
                }}
              />
            </Animated.View>
            <View style={{ alignItems: 'center', marginTop: 8 }}>
              <BlurView intensity={30} tint="light" style={{ borderRadius: 16, paddingHorizontal: 18, paddingVertical: 8, marginTop: 8 }}>
                <Text style={{ fontFamily: 'Inter_600SemiBold', color: '#7a8fa6', fontSize: 15 }}>View Full Map</Text>
              </BlurView>
            </View>
          </BlurView>
        </View>

        {/* Alerts Section - slide in from top with bounce */}
        <View style={styles.section}>
          <Animated.View style={{ transform: [{ translateY: alertAnim }] }}>
            <BlurView intensity={30} tint="light" style={styles.alertCard}>
              <Ionicons name="information-circle-outline" size={20} color="#b5c6d6" style={{ marginRight: 8 }} />
              <Text style={styles.alertText}>No weather alerts.</Text>
            </BlurView>
          </Animated.View>
        </View>
      </Animated.ScrollView>

      {/* Speak Weather Floating Button */}
      <View style={{ position: 'absolute', bottom: 32, right: 24, zIndex: 20 }}>
        <BlurView intensity={40} tint="light" style={{ borderRadius: 32, padding: 16, flexDirection: 'row', alignItems: 'center', shadowColor: '#b5c6d6', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}>
          <Ionicons name="volume-high" size={24} color="#7a8fa6" />
          <Text style={{ fontFamily: 'Inter_600SemiBold', color: '#7a8fa6', fontSize: 16, marginLeft: 8 }}>Speak Weather</Text>
        </BlurView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 48,
    paddingBottom: 32,
    alignItems: 'center',
    minHeight: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 18,
  },
  city: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 28,
    color: '#7a8fa6',
    letterSpacing: 0.5,
  },
  date: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#b5c6d6',
    marginTop: 2,
  },
  cloudIcon: {
    textShadowColor: '#e3eaf7',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  glassCard: {
    width: width * 0.9,
    alignSelf: 'center',
    borderRadius: 32,
    padding: 28,
    marginBottom: 24,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(200,220,255,0.18)',
    overflow: 'hidden',
  },
  temp: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 64,
    color: '#7a8fa6',
    marginBottom: 2,
  },
  summary: {
    fontFamily: 'Inter_400Regular',
    fontSize: 22,
    color: '#b5c6d6',
    marginBottom: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
  },
  detailItem: {
    alignItems: 'center',
    flex: 1,
  },
  detailValue: {
    fontFamily: 'Inter_600SemiBold',
    color: '#7a8fa6',
    fontSize: 16,
    marginTop: 2,
  },
  detailLabel: {
    fontFamily: 'Inter_400Regular',
    color: '#b5c6d6',
    fontSize: 12,
    marginTop: 1,
  },
  section: {
    width: width * 0.95,
    alignSelf: 'center',
    marginBottom: 18,
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    color: '#7a8fa6',
    fontSize: 18,
    marginBottom: 8,
    marginLeft: 4,
  },
  hourlyRow: {
    flexDirection: 'row',
  },
  hourlyCard: {
    width: 80,
    alignItems: 'center',
    borderRadius: 24,
    marginRight: 10,
    paddingVertical: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(200,220,255,0.13)',
  },
  hourlyHour: {
    fontFamily: 'Inter_400Regular',
    color: '#b5c6d6',
    fontSize: 13,
    marginBottom: 2,
  },
  hourlyTemp: {
    fontFamily: 'Inter_600SemiBold',
    color: '#7a8fa6',
    fontSize: 16,
    marginTop: 2,
  },
  dailyRow: {
    flexDirection: 'row',
  },
  dailyCard: {
    width: 70,
    alignItems: 'center',
    borderRadius: 20,
    marginRight: 10,
    paddingVertical: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(200,220,255,0.13)',
  },
  dailyDay: {
    fontFamily: 'Inter_400Regular',
    color: '#b5c6d6',
    fontSize: 13,
    marginBottom: 2,
  },
  dailyTemp: {
    fontFamily: 'Inter_600SemiBold',
    color: '#7a8fa6',
    fontSize: 16,
    marginTop: 2,
  },
  radarCard: {
    height: 120,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(200,220,255,0.13)',
    marginTop: 4,
  },
  radarText: {
    fontFamily: 'Inter_400Regular',
    color: '#b5c6d6',
    fontSize: 15,
    marginTop: 6,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(200,220,255,0.13)',
    marginBottom: 8,
  },
  alertText: {
    fontFamily: 'Inter_400Regular',
    color: '#7a8fa6',
    fontSize: 15,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorCard: {
    alignItems: 'center',
    borderRadius: 24,
    padding: 32,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(200,220,255,0.18)',
    maxWidth: 300,
  },
  errorTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 20,
    color: '#7a8fa6',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#b5c6d6',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  retryButtonBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(200,220,255,0.18)',
  },
  retryButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#7ed957',
    marginLeft: 8,
  },
});

