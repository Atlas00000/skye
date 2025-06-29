import { Inter_400Regular, Inter_600SemiBold, useFonts } from '@expo-google-fonts/inter';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';

const { width, height } = Dimensions.get('window');

const ONBOARDING_STEPS = [
  {
    title: 'Welcome to Skye',
    subtitle: 'Your personal weather companion',
    description: 'Get accurate, beautiful weather forecasts with a stunning interface designed for you.',
    icon: 'partly-sunny',
    color: '#7ed957',
  },
  {
    title: 'Real-time Weather',
    subtitle: 'Always up to date',
    description: 'Access current conditions, hourly forecasts, and 5-day predictions with live data.',
    icon: 'cloud',
    color: '#b5c6d6',
  },
  {
    title: 'Voice Weather',
    subtitle: 'Listen to your forecast',
    description: 'Have your weather read aloud with our text-to-speech feature for hands-free access.',
    icon: 'volume-high',
    color: '#f7c873',
  },
  {
    title: 'Location Access',
    subtitle: 'Personalized forecasts',
    description: 'Allow location access to get weather for your current location automatically.',
    icon: 'location',
    color: '#7a8fa6',
  },
];

export default function OnboardingScreen() {
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_600SemiBold });
  const [currentStep, setCurrentStep] = useState(0);
  
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Initial animation
    Animated.timing(slideAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
    
    // Progress bar animation
    Animated.timing(progressAnim, { 
      toValue: (currentStep + 1) / ONBOARDING_STEPS.length, 
      duration: 300, 
      useNativeDriver: false 
    }).start();
  }, [currentStep]);

  const nextStep = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, delay: 100, useNativeDriver: true }),
      ]).start();
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding
      router.replace('/(tabs)');
    }
  };

  const skipOnboarding = () => {
    router.replace('/(tabs)');
  };

  if (!fontsLoaded) return null;

  const currentStepData = ONBOARDING_STEPS[currentStep];

  return (
    <View style={{ flex: 1, backgroundColor: '#f7fafd' }}>
      <LinearGradient
        colors={["#f7fafd", "#e3eaf7", "#c9d6e5"]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Skip Button */}
      <View style={styles.skipContainer}>
        <Pressable onPress={skipOnboarding} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
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
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <Animated.View 
          style={[
            styles.stepContainer,
            { 
              opacity: fadeAnim,
              transform: [
                {
                  translateX: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {/* Icon */}
          <BlurView intensity={60} tint="light" style={[styles.iconContainer, { borderColor: currentStepData.color + '20' }]}>
            <Ionicons name={currentStepData.icon as any} size={64} color={currentStepData.color} />
          </BlurView>

          {/* Text Content */}
          <View style={styles.textContainer}>
            <Text style={styles.title}>{currentStepData.title}</Text>
            <Text style={styles.subtitle}>{currentStepData.subtitle}</Text>
            <Text style={styles.description}>{currentStepData.description}</Text>
          </View>
        </Animated.View>
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomContainer}>
        {/* Step Indicators */}
        <View style={styles.stepIndicators}>
          {ONBOARDING_STEPS.map((_, index) => (
            <View
              key={index}
              style={[
                styles.stepDot,
                index === currentStep && styles.stepDotActive,
              ]}
            />
          ))}
        </View>

        {/* Next Button */}
        <BlurView intensity={60} tint="light" style={styles.nextButtonContainer}>
          <Pressable onPress={nextStep} style={styles.nextButton}>
            <Text style={styles.nextButtonText}>
              {currentStep === ONBOARDING_STEPS.length - 1 ? 'Get Started' : 'Next'}
            </Text>
            <Ionicons 
              name={currentStep === ONBOARDING_STEPS.length - 1 ? 'checkmark' : 'arrow-forward'} 
              size={20} 
              color="#fff" 
            />
          </Pressable>
        </BlurView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skipContainer: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
  },
  skipButton: {
    padding: 8,
  },
  skipText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#7a8fa6',
  },
  progressContainer: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#7ed957',
    borderRadius: 2,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  stepContainer: {
    alignItems: 'center',
    width: '100%',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 2,
    marginBottom: 40,
  },
  textContainer: {
    alignItems: 'center',
    maxWidth: 300,
  },
  title: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 32,
    color: '#7a8fa6',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#b5c6d6',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#b5c6d6',
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingBottom: 60,
  },
  stepIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 4,
  },
  stepDotActive: {
    backgroundColor: '#7ed957',
  },
  nextButtonContainer: {
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(200,220,255,0.18)',
    overflow: 'hidden',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    backgroundColor: '#7ed957',
  },
  nextButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#fff',
    marginRight: 8,
  },
}); 