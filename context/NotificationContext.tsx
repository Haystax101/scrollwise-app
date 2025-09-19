import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { NotificationService, NotificationPermissionStatus } from '../services/notificationService';
import * as Notifications from 'expo-notifications';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  permissionStatus: NotificationPermissionStatus | null;
  isLoading: boolean;
  pushToken: string | null;
  requestPermissions: () => Promise<boolean>;
  enableNotifications: () => Promise<boolean>;
  disableNotifications: () => Promise<void>;
  isSupported: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermissionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [isSupported] = useState(() => NotificationService.isDeviceSupported());

  // Initialize notification status
  useEffect(() => {
    const initializeNotifications = async () => {
      if (!isSupported) return;

      try {
        const status = await NotificationService.getPermissionStatus();
        setPermissionStatus(status);

        if (status.granted) {
          const token = await NotificationService.getExpoPushToken();
          setPushToken(token);
        }

        // Set up notification categories for iOS
        await NotificationService.setupNotificationCategories();
      } catch (error) {
        console.error('Error initializing notifications:', error);
      }
    };

    initializeNotifications();
  }, [isSupported]);

  // Set up notification listeners
  useEffect(() => {
    if (!isSupported) return;

    const subscriptions = NotificationService.addNotificationListeners({
      onNotificationReceived: (notification) => {
        console.log('Notification received:', notification);
        // Handle foreground notification display
      },
      onNotificationResponse: (response) => {
        console.log('Notification response:', response);
        // Handle notification tap/action
        const data = response.notification.request.content.data;

        // Route user based on notification data
        if (data.route) {
          // Navigation logic would go here
          console.log('Navigate to:', data.route);
        }
      },
    });

    return () => {
      NotificationService.removeNotificationListeners(subscriptions);
    };
  }, [isSupported]);

  const requestPermissions = async (): Promise<boolean> => {
    if (!isSupported) return false;

    setIsLoading(true);
    try {
      const result = await NotificationService.requestPermissions();
      setPermissionStatus(result);
      return result.granted;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const enableNotifications = async (): Promise<boolean> => {
    if (!isSupported) return false;

    setIsLoading(true);
    try {
      const result = await NotificationService.registerForPushNotifications();

      if (result.success && result.token) {
        setPushToken(result.token);

        // Store push token in database
        if (user?.id) {
          await savePushTokenToDatabase(user.id, result.token);
        }

        // Update permission status
        const status = await NotificationService.getPermissionStatus();
        setPermissionStatus(status);

        return true;
      } else {
        console.error('Failed to enable notifications:', result.error);
        return false;
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const disableNotifications = async (): Promise<void> => {
    try {
      // Cancel all scheduled notifications
      await NotificationService.cancelAllNotifications();

      // Remove push token from database
      if (user?.id && pushToken) {
        await removePushTokenFromDatabase(user.id, pushToken);
      }

      setPushToken(null);
    } catch (error) {
      console.error('Error disabling notifications:', error);
    }
  };

  const savePushTokenToDatabase = async (userId: string, token: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('push_tokens')
        .upsert({
          user_id: userId,
          token,
          platform: 'ios',
          is_active: true,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,token',
        });

      if (error) {
        console.error('Error saving push token:', error);
      }
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  };

  const removePushTokenFromDatabase = async (userId: string, token: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('push_tokens')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('token', token);

      if (error) {
        console.error('Error removing push token:', error);
      }
    } catch (error) {
      console.error('Error removing push token:', error);
    }
  };

  const value: NotificationContextType = {
    permissionStatus,
    isLoading,
    pushToken,
    requestPermissions,
    enableNotifications,
    disableNotifications,
    isSupported,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Safe version that doesn't throw - useful for components that might be used outside provider
export const useNotificationsSafe = (): NotificationContextType | null => {
  const context = useContext(NotificationContext);
  return context || null;
};