import { Inter_400Regular, Inter_600SemiBold, useFonts } from '@expo-google-fonts/inter';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, Stack } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';

const { width } = Dimensions.get('window');

export default function NotFoundScreen() {
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_600SemiBold });
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const iconAnim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Staggered entrance animations
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 50, friction: 8 }),
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 8 }),
      ]),
      Animated.timing(iconAnim, { toValue: 1, duration: 600, delay: 200, useNativeDriver: true }),
      Animated.timing(buttonAnim, { toValue: 1, duration: 600, delay: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  if (!fontsLoaded) return null;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        {/* Animated Gradient Background */}
        <LinearGradient
          colors={["#f7fafd", "#e3eaf7", "#c9d6e5"]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <Animated.View 
          style={[
            styles.content,
            { 
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim }
              ]
            }
          ]}
        >
          {/* Main Icon */}
          <Animated.View style={[styles.iconContainer, { opacity: iconAnim }]}>
            <BlurView intensity={60} tint="light" style={styles.iconBlur}>
              <Ionicons name="cloud-offline" size={80} color="#b5c6d6" />
            </BlurView>
          </Animated.View>

          {/* Error Code */}
          <Text style={styles.errorCode}>404</Text>
          
          {/* Error Title */}
          <Text style={styles.errorTitle}>Page Not Found</Text>
          
          {/* Error Description */}
          <Text style={styles.errorDescription}>
            Oops! The weather forecast you're looking for seems to have drifted away like a cloud in the wind.
          </Text>

          {/* Action Buttons */}
          <Animated.View style={[styles.buttonContainer, { opacity: buttonAnim }]}>
            <Link href="/(tabs)" asChild>
              <Pressable style={styles.primaryButton}>
                <BlurView intensity={60} tint="light" style={styles.buttonBlur}>
                  <Ionicons name="home" size={20} color="#fff" style={styles.buttonIcon} />
                  <Text style={styles.primaryButtonText}>Go Home</Text>
                </BlurView>
              </Pressable>
            </Link>

            <Pressable style={styles.secondaryButton}>
              <BlurView intensity={40} tint="light" style={styles.secondaryButtonBlur}>
                <Ionicons name="refresh" size={20} color="#7a8fa6" style={styles.buttonIcon} />
                <Text style={styles.secondaryButtonText}>Try Again</Text>
              </BlurView>
            </Pressable>
          </Animated.View>

          {/* Helpful Links */}
          <Animated.View style={[styles.linksContainer, { opacity: buttonAnim }]}>
            <Text style={styles.linksTitle}>Quick Navigation</Text>
            <View style={styles.linksRow}>
              <Link href="/(tabs)/locations" asChild>
                <Pressable style={styles.linkItem}>
                  <Ionicons name="location" size={16} color="#7a8fa6" />
                  <Text style={styles.linkText}>Locations</Text>
                </Pressable>
              </Link>
              <Link href="/(tabs)/forecast" asChild>
                <Pressable style={styles.linkItem}>
                  <Ionicons name="partly-sunny" size={16} color="#7a8fa6" />
                  <Text style={styles.linkText}>Forecast</Text>
                </Pressable>
              </Link>
              <Link href="/(tabs)/settings" asChild>
                <Pressable style={styles.linkItem}>
                  <Ionicons name="settings" size={16} color="#7a8fa6" />
                  <Text style={styles.linkText}>Settings</Text>
                </Pressable>
              </Link>
            </View>
          </Animated.View>
        </Animated.View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7fafd',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
    maxWidth: 400,
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconBlur: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(200,220,255,0.18)',
  },
  errorCode: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 72,
    color: '#7a8fa6',
    marginBottom: 8,
    letterSpacing: -2,
  },
  errorTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 24,
    color: '#7a8fa6',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorDescription: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#b5c6d6',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 32,
  },
  primaryButton: {
    marginBottom: 12,
    borderRadius: 24,
    overflow: 'hidden',
  },
  buttonBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    backgroundColor: '#7ed957',
  },
  primaryButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#fff',
  },
  secondaryButton: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  secondaryButtonBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(200,220,255,0.18)',
  },
  secondaryButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#7a8fa6',
  },
  buttonIcon: {
    marginRight: 8,
  },
  linksContainer: {
    alignItems: 'center',
  },
  linksTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#7a8fa6',
    marginBottom: 16,
  },
  linksRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(200,220,255,0.13)',
  },
  linkText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#7a8fa6',
    marginLeft: 6,
  },
});
