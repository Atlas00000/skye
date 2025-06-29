import { router } from 'expo-router';

export interface NavigationState {
  isTransitioning: boolean;
  currentScreen: string;
  previousScreen: string | null;
}

class NavigationService {
  private state: NavigationState = {
    isTransitioning: false,
    currentScreen: 'home',
    previousScreen: null,
  };

  private listeners: Array<(state: NavigationState) => void> = [];

  // Navigate with transition
  async navigateTo(screen: string, transitionType: 'fade' | 'slide' | 'scale' | 'slideUp' = 'slide') {
    if (this.state.isTransitioning) return;

    this.setState({
      isTransitioning: true,
      previousScreen: this.state.currentScreen,
    });

    // Simulate transition delay
    await this.delay(300);

    // Update current screen
    this.setState({
      currentScreen: screen,
      isTransitioning: false,
    });

    // Navigate using Expo Router
    router.push(`/(tabs)/${screen}`);
  }

  // Get current navigation state
  getState(): NavigationState {
    return { ...this.state };
  }

  // Subscribe to navigation state changes
  subscribe(listener: (state: NavigationState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Update state and notify listeners
  private setState(newState: Partial<NavigationState>) {
    this.state = { ...this.state, ...newState };
    this.listeners.forEach(listener => listener(this.state));
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Screen-specific transition types
  getTransitionType(fromScreen: string, toScreen: string): 'fade' | 'slide' | 'scale' | 'slideUp' {
    // Define transition types based on screen relationships
    const transitions: Record<string, Record<string, 'fade' | 'slide' | 'scale' | 'slideUp'>> = {
      home: {
        locations: 'slide',
        forecast: 'slide',
        settings: 'slide',
      },
      locations: {
        home: 'slide',
        forecast: 'slide',
        settings: 'slide',
      },
      forecast: {
        home: 'slide',
        locations: 'slide',
        settings: 'slide',
      },
      settings: {
        home: 'slide',
        locations: 'slide',
        forecast: 'slide',
      },
    };

    return transitions[fromScreen]?.[toScreen] || 'slide';
  }

  // Check if navigation is in progress
  isNavigating(): boolean {
    return this.state.isTransitioning;
  }

  // Get transition message based on screens
  getTransitionMessage(fromScreen: string, toScreen: string): string {
    const messages: Record<string, Record<string, string>> = {
      home: {
        locations: 'Loading locations...',
        forecast: 'Loading forecast...',
        settings: 'Loading settings...',
      },
      locations: {
        home: 'Loading home...',
        forecast: 'Loading forecast...',
        settings: 'Loading settings...',
      },
      forecast: {
        home: 'Loading home...',
        locations: 'Loading locations...',
        settings: 'Loading settings...',
      },
      settings: {
        home: 'Loading home...',
        locations: 'Loading locations...',
        forecast: 'Loading forecast...',
      },
    };

    return messages[fromScreen]?.[toScreen] || 'Loading...';
  }
}

export const navigationService = new NavigationService(); 