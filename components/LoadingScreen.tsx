import { Inter_400Regular, Inter_600SemiBold, useFonts } from '@expo-google-fonts/inter';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, Text, View } from 'react-native';

const { width, height } = Dimensions.get('window');

interface LoadingScreenProps {
  message?: string;
  showProgress?: boolean;
  progress?: number;
}

export default function LoadingScreen({ 
  message = "Loading Skye...", 
  showProgress = false, 
  progress = 0 
}: LoadingScreenProps) {
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_600SemiBold });
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const textAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Main entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 7 }),
    ]).start();

    // Continuous rotation for the weather icon
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();

    // Shimmer effect
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();

    // Text fade in
    Animated.timing(textAnim, { toValue: 1, duration: 600, delay: 400, useNativeDriver: true }).start();

    // Progress animation
    if (showProgress) {
      Animated.timing(progressAnim, { toValue: progress, duration: 500, useNativeDriver: false }).start();
    }
  }, [progress]);

  if (!fontsLoaded) return null;

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, width + 100],
  });

  return (
    <View style={styles.container}>
      {/* Animated Gradient Background */}
      <LinearGradient
        colors={["#f7fafd", "#e3eaf7", "#c9d6e5"]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Shimmer Overlay */}
      <Animated.View
        style={[
          styles.shimmer,
          {
            transform: [{ translateX: shimmerTranslate }],
          },
        ]}
      >
        <LinearGradient
          colors={["transparent", "rgba(255,255,255,0.3)", "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1, width: 100 }}
        />
      </Animated.View>

      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        {/* Main Icon */}
        <BlurView intensity={60} tint="light" style={styles.iconContainer}>
          <Animated.View style={{ transform: [{ rotate }] }}>
            <Ionicons name="partly-sunny" size={64} color="#7ed957" />
          </Animated.View>
        </BlurView>

        {/* App Title */}
        <Animated.Text style={[styles.title, { opacity: textAnim }]}>Skye</Animated.Text>
        
        {/* Loading Message */}
        <Animated.Text style={[styles.message, { opacity: textAnim }]}>{message}</Animated.Text>

        {/* Progress Bar */}
        {showProgress && (
          <Animated.View style={[styles.progressContainer, { opacity: textAnim }]}>
            <View style={styles.progressBar}>
              <Animated.View 
                style={[
                  styles.progressFill, 
                  { 
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    })
                  }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
          </Animated.View>
        )}

        {/* Loading Dots */}
        <View style={styles.dotsContainer}>
          {[0, 1, 2].map((index) => (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                {
                  opacity: textAnim,
                  transform: [
                    {
                      scale: textAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.5, 1],
                      }),
                    },
                  ],
                },
              ]}
            />
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7fafd',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  content: {
    alignItems: 'center',
    zIndex: 2,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(200,220,255,0.18)',
    marginBottom: 32,
  },
  title: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 36,
    color: '#7a8fa6',
    marginBottom: 8,
    letterSpacing: 1,
  },
  message: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#b5c6d6',
    marginBottom: 32,
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  progressBar: {
    width: 200,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#7ed957',
    borderRadius: 3,
  },
  progressText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#b5c6d6',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#7ed957',
    marginHorizontal: 4,
  },
}); 