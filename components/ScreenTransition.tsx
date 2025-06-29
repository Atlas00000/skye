import { Inter_400Regular, Inter_600SemiBold, useFonts } from '@expo-google-fonts/inter';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';

const { width, height } = Dimensions.get('window');

interface ScreenTransitionProps {
  isVisible: boolean;
  onComplete?: () => void;
  message?: string;
  type?: 'fade' | 'slide' | 'scale' | 'slideUp';
}

export default function ScreenTransition({ 
  isVisible, 
  onComplete, 
  message = "Loading...",
  type = 'fade'
}: ScreenTransitionProps) {
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_600SemiBold });
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(height)).current;
  const iconAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      // Show transition
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 7 }),
        Animated.spring(slideAnim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 7 }),
        Animated.spring(slideUpAnim, { toValue: 0, useNativeDriver: true, tension: 50, friction: 7 }),
      ]).start();

      // Icon animation
      Animated.timing(iconAnim, { toValue: 1, duration: 600, delay: 200, useNativeDriver: true }).start();

      // Shimmer effect
      Animated.loop(
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        })
      ).start();
    } else {
      // Hide transition
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 0.8, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(slideUpAnim, { toValue: height, duration: 200, useNativeDriver: true }),
      ]).start(() => {
        onComplete?.();
      });
    }
  }, [isVisible]);

  if (!fontsLoaded) return null;

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, width + 100],
  });

  const getTransformStyle = () => {
    switch (type) {
      case 'slide':
        return {
          transform: [
            { translateX: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [width, 0] }) },
            { scale: scaleAnim }
          ]
        };
      case 'scale':
        return {
          transform: [{ scale: scaleAnim }]
        };
      case 'slideUp':
        return {
          transform: [
            { translateY: slideUpAnim },
            { scale: scaleAnim }
          ]
        };
      default: // fade
        return {
          transform: [{ scale: scaleAnim }]
        };
    }
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
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
          colors={["transparent", "rgba(255,255,255,0.2)", "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1, width: 80 }}
        />
      </Animated.View>

      <Animated.View style={[styles.content, getTransformStyle()]}>
        {/* Icon */}
        <Animated.View style={[styles.iconContainer, { opacity: iconAnim }]}>
          <BlurView intensity={60} tint="light" style={styles.iconBlur}>
            <Ionicons name="partly-sunny" size={48} color="#7ed957" />
          </BlurView>
        </Animated.View>

        {/* Message */}
        <Animated.Text style={[styles.message, { opacity: iconAnim }]}>{message}</Animated.Text>

        {/* Loading Dots */}
        <View style={styles.dotsContainer}>
          {[0, 1, 2].map((index) => (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                {
                  opacity: iconAnim,
                  transform: [
                    {
                      scale: iconAnim.interpolate({
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
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7fafd',
    zIndex: 9999,
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
    marginBottom: 24,
  },
  iconBlur: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(200,220,255,0.18)',
  },
  message: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#7a8fa6',
    marginBottom: 24,
    textAlign: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#7ed957',
    marginHorizontal: 3,
  },
}); 