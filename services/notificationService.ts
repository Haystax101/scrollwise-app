import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Configure notification handler with modern 2025 API
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,  // Updated from shouldShowAlert (deprecated)
    shouldShowList: true,    // Added for iOS notification list
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: Notifications.PermissionStatus;
}

export class NotificationService {
  /**
   * Check if device supports push notifications
   */
  static isDeviceSupported(): boolean {
    return Device.isDevice; // Only real devices support push notifications
  }

  /**
   * Set up Android notification channels (required for Android 13+)
   */
  static async setupAndroidChannels(): Promise<void> {
    if (Platform.OS !== 'android') return;

    try {
      // Social notifications channel
      await Notifications.setNotificationChannelAsync('social', {
        name: 'Social',
        importance: Notifications.AndroidImportance.HIGH,
        description: 'Friend requests, likes, and comments',
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250],
        enableLights: true,
        lightColor: '#FF6B9D',
      });

      // Learning notifications channel
      await Notifications.setNotificationChannelAsync('learning', {
        name: 'Learning',
        importance: Notifications.AndroidImportance.DEFAULT,
        description: 'Streak reminders and learning goals',
        sound: 'default',
        vibrationPattern: [0, 500],
        enableLights: true,
        lightColor: '#FF6B9D',
      });

      // System notifications channel
      await Notifications.setNotificationChannelAsync('system', {
        name: 'System',
        importance: Notifications.AndroidImportance.LOW,
        description: 'App updates and system notifications',
        sound: 'default',
        enableLights: true,
        lightColor: '#FF6B9D',
      });

      console.log('✅ Android notification channels created');
    } catch (error) {
      console.error('❌ Error setting up Android channels:', error);
    }
  }

  /**
   * Request notification permissions from the user with enhanced options
   */
  static async requestPermissions(): Promise<NotificationPermissionStatus> {
    try {
      // Set up Android channels before requesting permissions
      if (Platform.OS === 'android') {
        await this.setupAndroidChannels();
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();

      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
            allowDisplayInCarPlay: true,
            allowCriticalAlerts: false, // Requires special entitlement
            allowProvisional: false,
            allowAnnouncements: true,
          },
          android: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
          },
        });
        finalStatus = status;
      }

      return {
        granted: finalStatus === 'granted',
        canAskAgain: existingStatus === 'undetermined',
        status: finalStatus,
      };
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return {
        granted: false,
        canAskAgain: false,
        status: 'denied',
      };
    }
  }

  /**
   * Get current notification permission status
   */
  static async getPermissionStatus(): Promise<NotificationPermissionStatus> {
    try {
      const { status } = await Notifications.getPermissionsAsync();

      return {
        granted: status === 'granted',
        canAskAgain: status === 'undetermined',
        status,
      };
    } catch (error) {
      console.error('Error getting notification permissions:', error);
      return {
        granted: false,
        canAskAgain: false,
        status: 'denied',
      };
    }
  }

  /**
   * Generate Expo push token for this device
   */
  static async getExpoPushToken(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        console.warn('Push notifications only work on physical devices');
        return null;
      }

      // Try multiple ways to get project ID for 2025 compatibility
      const projectId =
        process.env.EXPO_PUBLIC_PROJECT_ID ||
        Constants.expoConfig?.extra?.eas?.projectId ||
        Constants.easConfig?.projectId;

      if (!projectId) {
        console.error('Project ID not found. Set EXPO_PUBLIC_PROJECT_ID environment variable.');
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      return token.data;
    } catch (error) {
      console.error('Error getting Expo push token:', error);
      return null;
    }
  }

  /**
   * Register for push notifications (combines permission request and token generation)
   */
  static async registerForPushNotifications(): Promise<{
    success: boolean;
    token?: string;
    error?: string;
  }> {
    try {
      if (!Device.isDevice) {
        return {
          success: false,
          error: 'Push notifications only work on physical devices',
        };
      }

      // Request permissions
      const permissionResult = await this.requestPermissions();

      if (!permissionResult.granted) {
        return {
          success: false,
          error: 'Notification permissions not granted',
        };
      }

      // Get push token
      const token = await this.getExpoPushToken();

      if (!token) {
        return {
          success: false,
          error: 'Failed to get push token',
        };
      }

      return {
        success: true,
        token,
      };
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Set up notification categories for iOS
   */
  static async setupNotificationCategories(): Promise<void> {
    if (Platform.OS !== 'ios') return;

    try {
      await Notifications.setNotificationCategoryAsync('learning-reminder', [
        {
          identifier: 'open-app',
          buttonTitle: 'Open App',
          options: {
            opensAppToForeground: true,
          },
        },
        {
          identifier: 'dismiss',
          buttonTitle: 'Dismiss',
          options: {
            opensAppToForeground: false,
          },
        },
      ]);
    } catch (error) {
      console.error('Error setting up notification categories:', error);
    }
  }

  /**
   * Schedule a local notification
   */
  static async scheduleLocalNotification(
    title: string,
    body: string,
    trigger: Notifications.NotificationTriggerInput,
    data?: any
  ): Promise<string | null> {
    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || {},
          categoryIdentifier: 'learning-reminder',
        },
        trigger,
      });

      return identifier;
    } catch (error) {
      console.error('Error scheduling local notification:', error);
      return null;
    }
  }

  /**
   * Cancel a scheduled notification
   */
  static async cancelNotification(identifier: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  static async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  }

  /**
   * Add notification listeners with enhanced features
   */
  static addNotificationListeners(callbacks: {
    onNotificationReceived?: (notification: Notifications.Notification) => void;
    onNotificationResponse?: (response: Notifications.NotificationResponse) => void;
    onPushTokenRefresh?: (token: string) => void;
  }): Notifications.Subscription[] {
    const subscriptions: Notifications.Subscription[] = [];

    if (callbacks.onNotificationReceived) {
      const receivedSubscription = Notifications.addNotificationReceivedListener(
        callbacks.onNotificationReceived
      );
      subscriptions.push(receivedSubscription);
    }

    if (callbacks.onNotificationResponse) {
      const responseSubscription = Notifications.addNotificationResponseReceivedListener(
        callbacks.onNotificationResponse
      );
      subscriptions.push(responseSubscription);
    }

    // Add push token refresh listener (handles token rollovers)
    if (callbacks.onPushTokenRefresh) {
      const tokenSubscription = Notifications.addPushTokenListener((event) => {
        console.log('🔄 Push token refreshed:', event.data);
        callbacks.onPushTokenRefresh?.(event.data);
      });
      subscriptions.push(tokenSubscription);
    }

    return subscriptions;
  }

  /**
   * Remove notification listeners
   */
  static removeNotificationListeners(subscriptions: Notifications.Subscription[]): void {
    subscriptions.forEach(subscription => {
      subscription.remove();
    });
  }
}