import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Tabs } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, Platform, Pressable, StyleSheet, View } from 'react-native';

import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const tabAnimations = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  useEffect(() => {
    // Staggered tab animations
    tabAnimations.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 600,
        delay: index * 100,
        useNativeDriver: true,
      }).start();
    });
  }, []);

  const CustomTabBar = ({ state, descriptors, navigation }: any) => {
    return (
      <View style={styles.tabBarContainer}>
        <BlurView intensity={80} tint="light" style={styles.tabBar}>
          <LinearGradient
            colors={["rgba(255,255,255,0.25)", "rgba(255,255,255,0.15)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          {state.routes.map((route: any, index: number) => {
            const { options } = descriptors[route.key];
            const label = options.tabBarLabel ?? options.title ?? route.name;
            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            };

            return (
              <Animated.View
                key={route.key}
                style={[
                  styles.tabItem,
                  {
                    opacity: tabAnimations[index],
                    transform: [
                      {
                        translateY: tabAnimations[index].interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={isFocused ? { selected: true } : {}}
                  accessibilityLabel={options.tabBarAccessibilityLabel}
                  testID={options.tabBarTestID}
                  onPress={onPress}
                  onLongPress={onLongPress}
                  style={styles.tabButton}
                >
                  <Animated.View
                    style={[
                      styles.tabIconContainer,
                      {
                        backgroundColor: isFocused ? 'rgba(126, 217, 87, 0.15)' : 'transparent',
                        transform: [
                          {
                            scale: isFocused ? 1.1 : 1,
                          },
                        ],
                      },
                    ]}
                  >
                    <Ionicons
                      name={getTabIcon(route.name, isFocused)}
                      size={24}
                      color={isFocused ? '#7ed957' : '#b5c6d6'}
                    />
                  </Animated.View>
                  <Animated.Text
                    style={[
                      styles.tabLabel,
                      {
                        color: isFocused ? '#7ed957' : '#b5c6d6',
                        transform: [
                          {
                            scale: isFocused ? 1.05 : 1,
                          },
                        ],
                      },
                    ]}
                  >
                    {label}
                  </Animated.Text>
                  {isFocused && (
                    <Animated.View
                      style={[
                        styles.activeIndicator,
                        {
                          opacity: tabAnimations[index],
                        },
                      ]}
                    />
                  )}
                </Pressable>
              </Animated.View>
            );
          })}
        </BlurView>
      </View>
    );
  };

  const getTabIcon = (routeName: string, isFocused: boolean) => {
    switch (routeName) {
      case 'index':
        return isFocused ? 'home' : 'home-outline';
      case 'forecast':
        return isFocused ? 'partly-sunny' : 'partly-sunny-outline';
      case 'settings':
        return isFocused ? 'settings' : 'settings-outline';
      default:
        return 'home-outline';
    }
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' }, // Hide default tab bar
      }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="forecast"
        options={{
          title: 'Forecast',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    paddingTop: 12,
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(200,220,255,0.18)',
    paddingHorizontal: 8,
    paddingVertical: 8,
    shadowColor: '#b5c6d6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
  },
  tabButton: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    position: 'relative',
  },
  tabIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  tabLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    textAlign: 'center',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#7ed957',
  },
});
