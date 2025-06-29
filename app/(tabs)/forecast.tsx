import { Inter_400Regular, Inter_600SemiBold, useFonts } from '@expo-google-fonts/inter';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import LoadingScreen from '@/components/LoadingScreen';
import { locationService } from '@/services/locationService';
import { LoadingState, WeatherData, weatherService } from '@/services/weatherService';

const { width } = Dimensions.get('window');

export default function ForecastScreen() {
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_600SemiBold });
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: true,
    progress: 0,
    message: 'Loading forecast...',
    error: null,
  });
  const [currentStep, setCurrentStep] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [cardAnims, setCardAnims] = useState<Animated.Value[]>([]);
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const loadForecastData = async () => {
    try {
      setLoadingState(prev => ({ ...prev, isLoading: true, error: null }));
      setCurrentStep(0);

      // Get current location
      setCurrentStep(1);
      setLoadingState(prev => ({ ...prev, progress: 0.2, message: 'Getting your location...' }));
      const location = await locationService.getCurrentLocation();

      // Fetch weather data
      setCurrentStep(2);
      const data = await weatherService.fetchWeatherData(location.latitude, location.longitude, (progress, message) => {
        setLoadingState(prev => ({ ...prev, progress: 0.2 + (progress * 0.8), message }));
      });

      setWeatherData(data);
      setLoadingState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      console.error('Error loading forecast data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load forecast data';
      setLoadingState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMessage
      }));
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadForecastData();
    setIsRefreshing(false);
  };

  useEffect(() => {
    loadForecastData();
  }, []);

  useEffect(() => {
    if (!weatherData) return;

    // Create dynamic animation arrays based on data length
    const newCardAnims = weatherData.daily.map(() => new Animated.Value(0));
    setCardAnims(newCardAnims);

    // Progress animation
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Shimmer effect
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Staggered card animations
    newCardAnims.forEach((anim, i) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 600,
        delay: i * 150,
        useNativeDriver: true,
      }).start();
    });
  }, [weatherData]);

  if (!fontsLoaded) return <LoadingScreen message="Loading fonts..." />;

  if (loadingState.isLoading && !weatherData) {
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
        
        {/* Progress Steps */}
        <View style={styles.progressSteps}>
          <View style={[styles.step, currentStep >= 1 && styles.stepActive]}>
            <Ionicons name="location" size={20} color={currentStep >= 1 ? "#7ed957" : "#b5c6d6"} />
            <Text style={[styles.stepText, currentStep >= 1 && styles.stepTextActive]}>Location</Text>
          </View>
          <View style={[styles.step, currentStep >= 2 && styles.stepActive]}>
            <Ionicons name="cloud" size={20} color={currentStep >= 2 ? "#7ed957" : "#b5c6d6"} />
            <Text style={[styles.stepText, currentStep >= 2 && styles.stepTextActive]}>Weather</Text>
          </View>
          <View style={[styles.step, currentStep >= 3 && styles.stepActive]}>
            <Ionicons name="checkmark-circle" size={20} color={currentStep >= 3 ? "#7ed957" : "#b5c6d6"} />
            <Text style={[styles.stepText, currentStep >= 3 && styles.stepTextActive]}>Ready</Text>
          </View>
        </View>
      </View>
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
          <Text style={styles.errorTitle}>Unable to Load Forecast</Text>
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

  if (!weatherData) return null;

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

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>5-Day Forecast</Text>
        <Text style={styles.subtitle}>{weatherData.location.city}</Text>
        <Pressable onPress={handleRefresh} style={styles.refreshButton}>
          <BlurView intensity={30} tint="light" style={styles.refreshButtonBlur}>
            <Ionicons name="refresh" size={20} color="#7ed957" />
          </BlurView>
        </Pressable>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <Animated.View style={{ opacity: isRefreshing ? 1 : 0 }}>
            <LoadingScreen message="Refreshing..." showProgress={true} progress={0.5} />
          </Animated.View>
        }
      >
        {/* Daily Forecast Cards */}
        {weatherData.daily.map((day, index) => {
          const anim = cardAnims[index];
          const scale = anim ? anim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) : 1;
          const opacity = anim || 0;
          const translateY = anim ? anim.interpolate({ inputRange: [0, 1], outputRange: [50, 0] }) : 0;

          return (
            <Animated.View
              key={index}
              style={[
                styles.forecastCard,
                {
                  opacity,
                  transform: [{ scale }, { translateY }],
                },
              ]}
            >
              <BlurView intensity={60} tint="light" style={styles.cardBlur}>
                <View style={styles.cardHeader}>
                  <Text style={styles.dayText}>{day.day}</Text>
                  <Ionicons name={day.icon as any} size={32} color="#b5c6d6" />
                </View>
                
                <View style={styles.cardContent}>
                  <View style={styles.tempContainer}>
                    <Text style={styles.tempText}>{day.temp}°</Text>
                    <Text style={styles.tempLabel}>High</Text>
                  </View>
                  
                  <View style={styles.detailsContainer}>
                    <View style={styles.detailRow}>
                      <Ionicons name="thermometer" size={16} color="#b5c6d6" />
                      <Text style={styles.detailText}>Feels like {weatherData.current.feels_like}°</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="water" size={16} color="#b5c6d6" />
                      <Text style={styles.detailText}>{weatherData.current.humidity}% humidity</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="navigate" size={16} color="#b5c6d6" />
                      <Text style={styles.detailText}>{weatherData.current.wind_speed} mph wind</Text>
                    </View>
                  </View>
                </View>

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
            </Animated.View>
          );
        })}

        {/* Hourly Forecast Section */}
        <View style={styles.hourlySection}>
          <Text style={styles.sectionTitle}>Hourly Forecast</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hourlyScroll}>
            {weatherData.hourly.map((hour, index) => (
              <View key={index} style={styles.hourlyCard}>
                <BlurView intensity={40} tint="light" style={styles.hourlyBlur}>
                  <Text style={styles.hourText}>{hour.hour}</Text>
                  <Ionicons name={hour.icon as any} size={24} color="#b5c6d6" />
                  <Text style={styles.hourTemp}>{hour.temp}°</Text>
                </BlurView>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Weather Summary */}
        <BlurView intensity={50} tint="light" style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Weather Summary</Text>
          <Text style={styles.summaryText}>
            {weatherData.current.description} with temperatures around {weatherData.current.temp}°. 
            Humidity is at {weatherData.current.humidity}% with {weatherData.current.wind_speed} mph winds.
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
    borderRadius: 24,
    padding: 24,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(200,220,255,0.18)',
    overflow: 'hidden',
  },
  errorTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 24,
    color: '#7a8fa6',
    marginBottom: 16,
  },
  errorMessage: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#b5c6d6',
    marginBottom: 24,
  },
  retryButton: {
    padding: 12,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.22)',
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
  progressSteps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#7ed957',
  },
  stepText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#b5c6d6',
    marginLeft: 8,
  },
  stepTextActive: {
    fontFamily: 'Inter_600SemiBold',
    color: '#7ed957',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 32,
    color: '#7a8fa6',
    marginRight: 20,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#b5c6d6',
  },
  refreshButton: {
    padding: 12,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.22)',
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
  forecastCard: {
    marginBottom: 20,
  },
  cardBlur: {
    borderRadius: 24,
    padding: 24,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(200,220,255,0.18)',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dayText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#7a8fa6',
    flex: 1,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tempContainer: {
    flex: 1,
  },
  tempText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 48,
    color: '#7a8fa6',
    marginBottom: 4,
  },
  tempLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#b5c6d6',
  },
  detailsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#b5c6d6',
    marginLeft: 8,
  },
  hourlySection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 24,
    color: '#7a8fa6',
    marginBottom: 16,
  },
  hourlyScroll: {
    flexDirection: 'row',
  },
  hourlyCard: {
    marginRight: 20,
    minWidth: 60,
  },
  hourlyBlur: {
    borderRadius: 24,
    padding: 24,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(200,220,255,0.18)',
    overflow: 'hidden',
  },
  hourText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#b5c6d6',
    marginBottom: 4,
  },
  hourTemp: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#7a8fa6',
    marginTop: 4,
  },
  summaryCard: {
    borderRadius: 24,
    padding: 24,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(200,220,255,0.18)',
    overflow: 'hidden',
  },
  summaryTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 24,
    color: '#7a8fa6',
    marginBottom: 16,
  },
  summaryText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#b5c6d6',
  },
}); 