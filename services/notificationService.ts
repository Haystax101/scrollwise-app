import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
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
   * Request notification permissions from the user
   */
  static async requestPermissions(): Promise<NotificationPermissionStatus> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();

      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
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

      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      if (!projectId) {
        console.error('Project ID not found. Make sure EAS is configured.');
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
   * Add notification listeners
   */
  static addNotificationListeners(callbacks: {
    onNotificationReceived?: (notification: Notifications.Notification) => void;
    onNotificationResponse?: (response: Notifications.NotificationResponse) => void;
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