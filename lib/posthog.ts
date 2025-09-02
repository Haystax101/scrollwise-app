import PostHog from 'posthog-react-native';
import Constants from 'expo-constants';

// Check if running in Expo Go (using the new API)
// executionEnvironment values: 'bareWorkflow' (dev build), 'storeClient' (Expo Go), 'standalone' (production)
const isExpoGo = Constants.executionEnvironment === 'storeClient';

// Initialize PostHog
export const posthog = new PostHog(
  'phc_VUFkZZdUc7a8KXc8zesHSBW98J3cwcaflT0p3IeDRbz', // Replace with your actual API key
  {
    host: 'https://eu.i.posthog.com', // or 'https://us.i.posthog.com' for US
    // Optional configuration
    captureAppLifecycleEvents: !isExpoGo, // Only enable in dev/standalone builds
    flushInterval: 30, // Flush events every 30 seconds
    flushAt: 10, // Flush when 10 events are queued
    
    // Error tracking configuration  
    captureConsoleErrorsAsEvents: true, // Capture console errors as events
    captureJSExceptions: true, // Capture JavaScript exceptions
    
    // Privacy settings
    sanitizeProperties: (properties: Record<string, any>) => {
      // Remove sensitive data from properties
      const sanitized = { ...properties };
      delete sanitized.password;
      delete sanitized.email;
      delete sanitized.phone;
      return sanitized;
    }
  }
);

// Utility functions for common tracking events
export const analytics = {
  // User events
  identify: (userId: string, properties?: Record<string, any>) => {
    posthog.identify(userId, properties);
  },

  // Track custom events
  track: (eventName: string, properties?: Record<string, any>) => {
    posthog.capture(eventName, properties);
  },

  // Screen tracking
  screen: (screenName: string, properties?: Record<string, any>) => {
    posthog.screen(screenName, properties);
  },

  // User properties
  setUserProperties: (properties: Record<string, any>) => {
    posthog.setPersonPropertiesForFlags(properties);
  },

  // Reset user (logout)
  reset: () => {
    posthog.reset();
  },

  // Flush events immediately
  flush: () => {
    posthog.flush();
  },

  // Error tracking
  captureException: (error: Error, context?: Record<string, any>) => {
    posthog.capture('$exception', {
      $exception_type: error.name,
      $exception_message: error.message,
      $exception_stack: error.stack,
      ...context
    });
  },

  // Feature flags
  isFeatureEnabled: (flagKey: string): boolean => {
    return posthog.isFeatureEnabled(flagKey) ?? false;
  },

  getFeatureFlag: (flagKey: string): string | boolean | undefined => {
    const flag = posthog.getFeatureFlag(flagKey);
    return flag !== null ? flag : undefined;
  }
};

// Common event names for consistency
export const ANALYTICS_EVENTS = {
  // Authentication
  USER_SIGNED_UP: 'user_signed_up',
  USER_SIGNED_IN: 'user_signed_in',
  USER_SIGNED_OUT: 'user_signed_out',
  PASSWORD_RESET_REQUESTED: 'password_reset_requested',
  PASSWORD_RESET_COMPLETED: 'password_reset_completed',

  // Onboarding
  ONBOARDING_STARTED: 'onboarding_started',
  ONBOARDING_STEP_COMPLETED: 'onboarding_step_completed',
  ONBOARDING_COMPLETED: 'onboarding_completed',

  // Profile
  PROFILE_VIEWED: 'profile_viewed',
  PROFILE_UPDATED: 'profile_updated',
  PROFILE_PHOTO_UPLOADED: 'profile_photo_uploaded',

  // Content engagement
  CONTENT_LIKED: 'content_liked',
  CONTENT_SAVED: 'content_saved',
  CONTENT_SHARED: 'content_shared',
  COMMENT_POSTED: 'comment_posted',
  INSIGHT_PUBLISHED: 'insight_published',

  // Navigation
  SCREEN_VIEWED: 'screen_viewed',
  TAB_SWITCHED: 'tab_switched',

  // Achievements
  ACHIEVEMENT_EARNED: 'achievement_earned',
  LEVEL_UP: 'level_up',

  // Errors
  ERROR_OCCURRED: 'error_occurred',
  APP_CRASHED: 'app_crashed'
} as const;