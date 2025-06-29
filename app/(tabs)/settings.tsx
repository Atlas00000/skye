import { Inter_400Regular, Inter_600SemiBold, useFonts } from '@expo-google-fonts/inter';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import LoadingScreen from '@/components/LoadingScreen';

export default function SettingsScreen() {
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_600SemiBold });
  const [units, setUnits] = useState('fahrenheit');
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const headerFade = useRef(new Animated.Value(0)).current;
  const settingsFade = useRef(new Animated.Value(0)).current;
  const settingAnims = useRef([0, 0, 0, 0, 0, 0, 0, 0].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    // Simulate loading settings
    const loadSettings = async () => {
      await new Promise(resolve => setTimeout(resolve, 800));
      setIsLoading(false);
      
      // Start animations
      Animated.sequence([
        Animated.timing(headerFade, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(settingsFade, { toValue: 1, duration: 500, delay: 200, useNativeDriver: true }),
        Animated.stagger(100, settingAnims.map(anim => 
          Animated.spring(anim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 7 })
        )),
      ]).start();
    };

    loadSettings();
  }, []);

  const handleUnitChange = (newUnit: string) => {
    setUnits(newUnit);
    // Add haptic feedback here if needed
  };

  const handleTtsToggle = (value: boolean) => {
    setTtsEnabled(value);
    // Add haptic feedback here if needed
  };

  const handleNotificationToggle = (value: boolean) => {
    setNotifications(value);
    // Add haptic feedback here if needed
  };

  const handleDarkModeToggle = (value: boolean) => {
    setDarkMode(value);
    // Add haptic feedback here if needed
  };

  if (!fontsLoaded) return <LoadingScreen message="Loading fonts..." />;

  if (isLoading) {
    return <LoadingScreen message="Loading settings..." />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f7fafd' }}>
      <LinearGradient
        colors={["#f7fafd", "#e3eaf7", "#c9d6e5"]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <Animated.View style={[styles.header, { opacity: headerFade }]}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Customize your weather experience</Text>
        </Animated.View>

        <Animated.View style={[styles.section, { opacity: settingsFade }]}>
          <Text style={styles.sectionTitle}>Weather Preferences</Text>
          
          <Animated.View style={[styles.settingCard, { opacity: settingAnims[0] }]}>
            <BlurView intensity={60} tint="light" style={styles.settingCardContent}>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Ionicons name="thermometer" size={20} color="#7ed957" />
                  <Text style={styles.settingLabel}>Temperature Units</Text>
                </View>
                <View style={styles.unitToggle}>
                  <Pressable 
                    style={[styles.unitButton, units === 'celsius' && styles.unitButtonActive]}
                    onPress={() => handleUnitChange('celsius')}
                  >
                    <Text style={[styles.unitText, units === 'celsius' && styles.unitTextActive]}>°C</Text>
                  </Pressable>
                  <Pressable 
                    style={[styles.unitButton, units === 'fahrenheit' && styles.unitButtonActive]}
                    onPress={() => handleUnitChange('fahrenheit')}
                  >
                    <Text style={[styles.unitText, units === 'fahrenheit' && styles.unitTextActive]}>°F</Text>
                  </Pressable>
                </View>
              </View>
            </BlurView>
          </Animated.View>
        </Animated.View>

        <Animated.View style={[styles.section, { opacity: settingsFade }]}>
          <Text style={styles.sectionTitle}>Audio & Voice</Text>
          
          <Animated.View style={[styles.settingCard, { opacity: settingAnims[1] }]}>
            <BlurView intensity={60} tint="light" style={styles.settingCardContent}>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Ionicons name="volume-high" size={20} color="#7ed957" />
                  <Text style={styles.settingLabel}>Text-to-Speech</Text>
                  <Text style={styles.settingDescription}>Read weather aloud</Text>
                </View>
                <Switch
                  value={ttsEnabled}
                  onValueChange={handleTtsToggle}
                  trackColor={{ false: '#e3eaf7', true: '#7ed957' }}
                  thumbColor="#fff"
                />
              </View>
            </BlurView>
          </Animated.View>
        </Animated.View>

        <Animated.View style={[styles.section, { opacity: settingsFade }]}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          <Animated.View style={[styles.settingCard, { opacity: settingAnims[2] }]}>
            <BlurView intensity={60} tint="light" style={styles.settingCardContent}>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Ionicons name="notifications" size={20} color="#7ed957" />
                  <Text style={styles.settingLabel}>Weather Alerts</Text>
                  <Text style={styles.settingDescription}>Severe weather notifications</Text>
                </View>
                <Switch
                  value={notifications}
                  onValueChange={handleNotificationToggle}
                  trackColor={{ false: '#e3eaf7', true: '#7ed957' }}
                  thumbColor="#fff"
                />
              </View>
            </BlurView>
          </Animated.View>
        </Animated.View>

        <Animated.View style={[styles.section, { opacity: settingsFade }]}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          
          <Animated.View style={[styles.settingCard, { opacity: settingAnims[3] }]}>
            <BlurView intensity={60} tint="light" style={styles.settingCardContent}>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Ionicons name="moon" size={20} color="#7ed957" />
                  <Text style={styles.settingLabel}>Dark Mode</Text>
                  <Text style={styles.settingDescription}>Use dark theme</Text>
                </View>
                <Switch
                  value={darkMode}
                  onValueChange={handleDarkModeToggle}
                  trackColor={{ false: '#e3eaf7', true: '#7ed957' }}
                  thumbColor="#fff"
                />
              </View>
            </BlurView>
          </Animated.View>
        </Animated.View>

        <Animated.View style={[styles.section, { opacity: settingsFade }]}>
          <Text style={styles.sectionTitle}>About</Text>
          
          <Animated.View style={[styles.settingCard, { opacity: settingAnims[4] }]}>
            <BlurView intensity={60} tint="light" style={styles.settingCardContent}>
              <Pressable style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Ionicons name="information-circle" size={20} color="#7ed957" />
                  <Text style={styles.settingLabel}>App Version</Text>
                </View>
                <Text style={styles.settingValue}>1.0.0</Text>
              </Pressable>
            </BlurView>
          </Animated.View>

          <Animated.View style={[styles.settingCard, { opacity: settingAnims[5] }]}>
            <BlurView intensity={60} tint="light" style={styles.settingCardContent}>
              <Pressable style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Ionicons name="document-text" size={20} color="#7ed957" />
                  <Text style={styles.settingLabel}>Privacy Policy</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#b5c6d6" />
              </Pressable>
            </BlurView>
          </Animated.View>

          <Animated.View style={[styles.settingCard, { opacity: settingAnims[6] }]}>
            <BlurView intensity={60} tint="light" style={styles.settingCardContent}>
              <Pressable style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Ionicons name="help-circle" size={20} color="#7ed957" />
                  <Text style={styles.settingLabel}>Help & Support</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#b5c6d6" />
              </Pressable>
            </BlurView>
          </Animated.View>

          <Animated.View style={[styles.settingCard, { opacity: settingAnims[7] }]}>
            <BlurView intensity={60} tint="light" style={styles.settingCardContent}>
              <Pressable style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Ionicons name="refresh" size={20} color="#7ed957" />
                  <Text style={styles.settingLabel}>Clear Cache</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#b5c6d6" />
              </Pressable>
            </BlurView>
          </Animated.View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 60,
    paddingBottom: 120,
    paddingHorizontal: 20,
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
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#b5c6d6',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#7a8fa6',
    marginBottom: 12,
    marginLeft: 4,
  },
  settingCard: {
    marginBottom: 8,
  },
  settingCardContent: {
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(200,220,255,0.18)',
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#7a8fa6',
    marginLeft: 12,
  },
  settingDescription: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#b5c6d6',
    marginLeft: 12,
    marginTop: 2,
  },
  settingValue: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#b5c6d6',
  },
  unitToggle: {
    flexDirection: 'row',
    backgroundColor: '#e3eaf7',
    borderRadius: 12,
    padding: 2,
  },
  unitButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  unitButtonActive: {
    backgroundColor: '#fff',
  },
  unitText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#b5c6d6',
  },
  unitTextActive: {
    color: '#7a8fa6',
  },
}); 