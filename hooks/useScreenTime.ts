import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { screenTracker } from '../lib/screenTracking';
import { useFocusEffect } from '@react-navigation/native';

interface UseScreenTimeOptions {
  screenName: string;
  trackScrollDepth?: boolean;
  additionalData?: Record<string, any>;
}

export const useScreenTime = ({ 
  screenName, 
  trackScrollDepth = false, 
  additionalData = {} 
}: UseScreenTimeOptions) => {
  const appState = useRef(AppState.currentState);
  const isScreenFocused = useRef(false);

  // Track when screen comes into focus/goes out of focus
  useFocusEffect(
    useCallback(() => {
      console.log(`Screen tracking: Entered ${screenName}`);
      isScreenFocused.current = true;
      screenTracker.enterScreen(screenName, additionalData);

      return () => {
        console.log(`Screen tracking: Exited ${screenName}`);
        isScreenFocused.current = false;
        screenTracker.exitScreen();
      };
    }, [screenName])
  );

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground - resume tracking if screen is focused
        if (isScreenFocused.current) {
          screenTracker.enterScreen(screenName, { 
            ...additionalData, 
            resumed_from_background: true 
          });
        }
      } else if (nextAppState.match(/inactive|background/)) {
        // App went to background - pause tracking
        if (isScreenFocused.current) {
          screenTracker.exitScreen();
        }
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [screenName, additionalData]);

  // Return tracking functions for manual use
  const trackScroll = useCallback((scrollPercent: number) => {
    if (trackScrollDepth) {
      screenTracker.trackActivity('scroll', { scrollPercent });
    }
  }, [trackScrollDepth]);

  const trackInteraction = useCallback((interactionType: string, data: Record<string, any> = {}) => {
    screenTracker.trackActivity('interaction', { interactionType, ...data });
  }, []);

  const trackContentEngagement = useCallback((
    contentType: string, 
    contentId: string, 
    engagementType: string, 
    data: Record<string, any> = {}
  ) => {
    screenTracker.trackContentEngagement(contentType, contentId, engagementType, data);
  }, []);

  return {
    trackScroll,
    trackInteraction,
    trackContentEngagement
  };
};