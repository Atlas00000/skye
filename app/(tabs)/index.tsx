import { Inter_400Regular, Inter_600SemiBold, useFonts } from '@expo-google-fonts/inter';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';

const { width } = Dimensions.get('window');

const PLACEHOLDER = {
  city: 'San Francisco',
  date: 'Monday, 10:30 AM',
  summary: 'Cloudy',
  temp: 68,
  icon: 'cloud',
  details: [
    { icon: 'water', label: 'Humidity', value: '65%' },
    { icon: 'navigate', label: 'Wind', value: '8 mph' },
    { icon: 'eye', label: 'Visibility', value: '10 mi' },
  ],
  hourly: [
    { hour: '11 AM', temp: 68, icon: 'cloud' },
    { hour: '12 PM', temp: 69, icon: 'cloudy-night' },
    { hour: '1 PM', temp: 70, icon: 'partly-sunny' },
    { hour: '2 PM', temp: 71, icon: 'rainy' },
    { hour: '3 PM', temp: 70, icon: 'cloud' },
    { hour: '4 PM', temp: 68, icon: 'cloud-outline' },
  ],
  daily: [
    { day: 'Mon', temp: 68, icon: 'cloud' },
    { day: 'Tue', temp: 67, icon: 'rainy' },
    { day: 'Wed', temp: 69, icon: 'partly-sunny' },
    { day: 'Thu', temp: 70, icon: 'cloudy-night' },
    { day: 'Fri', temp: 71, icon: 'cloud' },
  ],
  alerts: [
    { type: 'info', message: 'No weather alerts.' },
  ],
};

export default function HomeScreen() {
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_600SemiBold });
  const scrollY = useRef(new Animated.Value(0)).current;
  const cloudAnim = useRef(new Animated.Value(0)).current;
  const mistAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(cloudAnim, { toValue: 1, duration: 4000, useNativeDriver: true }),
        Animated.timing(cloudAnim, { toValue: 0, duration: 4000, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(mistAnim, { toValue: 1, duration: 6000, useNativeDriver: true }),
        Animated.timing(mistAnim, { toValue: 0, duration: 6000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  if (!fontsLoaded) return null;

  // Parallax for header
  const headerTranslate = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [0, -60],
    extrapolate: 'clamp',
  });
  const cloudTranslate = cloudAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 20] });
  const mistOpacity = mistAnim.interpolate({ inputRange: [0, 1], outputRange: [0.18, 0.32] });

  return (
    <View style={{ flex: 1, backgroundColor: '#f7fafd' }}>
      {/* Animated Gradient Background */}
      <LinearGradient
        colors={["#f7fafd", "#e3eaf7", "#c9d6e5"]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Animated Mist Overlay */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: mistOpacity }]}> 
        <BlurView intensity={60} tint="light" style={{ flex: 1 }} />
      </Animated.View>
      <Animated.ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      >
        {/* Header with City, Date, Animated Cloud */}
        <Animated.View style={[styles.header, { transform: [{ translateY: headerTranslate }] }]}> 
          <Text style={styles.city}>{PLACEHOLDER.city}</Text>
          <Text style={styles.date}>{PLACEHOLDER.date}</Text>
          <Animated.View style={{
            marginTop: 8,
            transform: [
              { translateX: cloudTranslate },
              { scale: 1.1 },
            ],
          }}>
            <Ionicons name="cloud" size={54} color="#b5c6d6" style={styles.cloudIcon} />
          </Animated.View>
        </Animated.View>

        {/* Current Weather Glass Card */}
        <BlurView intensity={60} tint="light" style={styles.glassCard}>
          <Text style={styles.temp}>{PLACEHOLDER.temp}°</Text>
          <Text style={styles.summary}>{PLACEHOLDER.summary}</Text>
          <View style={styles.detailsRow}>
            {PLACEHOLDER.details.map((d) => (
              <View key={d.label} style={styles.detailItem}>
                <Ionicons name={d.icon as any} size={20} color="#b5c6d6" />
                <Text style={styles.detailValue}>{d.value}</Text>
                <Text style={styles.detailLabel}>{d.label}</Text>
              </View>
            ))}
          </View>
        </BlurView>

        {/* Hourly Forecast - Swipeable */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hourly Forecast</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hourlyRow}>
            {PLACEHOLDER.hourly.map((h, i) => (
              <BlurView key={i} intensity={40} tint="light" style={styles.hourlyCard}>
                <Text style={styles.hourlyHour}>{h.hour}</Text>
                <Ionicons name={h.icon as any} size={28} color="#b5c6d6" />
                <Text style={styles.hourlyTemp}>{h.temp}°</Text>
              </BlurView>
            ))}
          </ScrollView>
        </View>

        {/* Daily Forecast - Scrollable */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5-Day Forecast</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dailyRow}>
            {PLACEHOLDER.daily.map((d, i) => (
              <BlurView key={i} intensity={40} tint="light" style={styles.dailyCard}>
                <Text style={styles.dailyDay}>{d.day}</Text>
                <Ionicons name={d.icon as any} size={28} color="#b5c6d6" />
                <Text style={styles.dailyTemp}>{d.temp}°</Text>
              </BlurView>
            ))}
          </ScrollView>
        </View>

        {/* Radar Section - Misty Animated Placeholder */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Live Radar</Text>
          <BlurView intensity={40} tint="light" style={styles.radarCard}>
            <Animated.View style={{ opacity: mistOpacity, flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="cloud-outline" size={48} color="#b5c6d6" style={{ opacity: 0.5 }} />
              <Text style={styles.radarText}>Misty radar coming soon…</Text>
            </Animated.View>
          </BlurView>
        </View>

        {/* Alerts Section */}
        <View style={styles.section}>
          {PLACEHOLDER.alerts.map((a, i) => (
            <BlurView key={i} intensity={30} tint="light" style={styles.alertCard}>
              <Ionicons name="information-circle-outline" size={20} color="#b5c6d6" style={{ marginRight: 8 }} />
              <Text style={styles.alertText}>{a.message}</Text>
            </BlurView>
          ))}
        </View>
      </Animated.ScrollView>
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
});
