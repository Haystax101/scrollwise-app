import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './Button';
import { useNotificationsSafe } from '../../context/NotificationContext';

interface NotificationsProps {
  onNext: (data: { enableNotifications: boolean }) => void;
}

export const Notifications: React.FC<NotificationsProps> = ({ onNext }) => {
  // Use safe hook that doesn't throw if provider is missing
  const notifications = useNotificationsSafe();

  // Provide fallback values if context is not available
  const enableNotifications = notifications?.enableNotifications ?? (async () => false);
  const isLoading = notifications?.isLoading ?? false;
  const isSupported = notifications?.isSupported ?? false;
  const [isEnabling, setIsEnabling] = useState(false);

  const handleEnableNotifications = async () => {
    // If notifications context is not available, just skip
    if (!notifications) {
      console.warn('Notifications not available, skipping...');
      onNext({ enableNotifications: false });
      return;
    }

    if (!isSupported) {
      Alert.alert(
        'Not Supported',
        'Push notifications are only supported on physical devices. You can enable them later in settings.',
        [{ text: 'OK', onPress: () => onNext({ enableNotifications: false }) }]
      );
      return;
    }

    setIsEnabling(true);
    try {
      const success = await enableNotifications();

      if (success) {
        onNext({ enableNotifications: true });
      } else {
        Alert.alert(
          'Permission Denied',
          'To receive learning reminders, please enable notifications in your device settings.',
          [
            { text: 'Skip', onPress: () => onNext({ enableNotifications: false }) },
            { text: 'Try Again', onPress: handleEnableNotifications }
          ]
        );
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
      Alert.alert(
        'Error',
        'Something went wrong. You can enable notifications later in settings.',
        [{ text: 'OK', onPress: () => onNext({ enableNotifications: false }) }]
      );
    } finally {
      setIsEnabling(false);
    }
  };

  const handleMaybeLater = () => {
    onNext({ enableNotifications: false });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header} />

      {/* Content */}
      <View style={styles.content}>
        {/* Bell Icon */}
        <View style={styles.iconContainer}>
          <Ionicons name="notifications" size={96} color="#F59E0B" />
        </View>

        <Text style={styles.title}>Stay on track</Text>
        <Text style={styles.subtitle}>
          Get daily reminders to help you achieve your learning goals and build lasting habits
        </Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Button
          onPress={handleEnableNotifications}
          disabled={isEnabling || isLoading}
        >
          {isEnabling || isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.loadingText}>Enabling...</Text>
            </View>
          ) : (
            'Enable Notifications'
          )}
        </Button>
        <TouchableOpacity
          style={[styles.maybeButton, (isEnabling || isLoading) && styles.disabledButton]}
          onPress={handleMaybeLater}
          disabled={isEnabling || isLoading}
        >
          <Text style={[styles.maybeButtonText, (isEnabling || isLoading) && styles.disabledText]}>
            Maybe Later
          </Text>
        </TouchableOpacity>

        {!isSupported && (
          <Text style={styles.warningText}>
            Push notifications require a physical device
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBF0',
    paddingHorizontal: 32,
  },
  header: {
    height: 60,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
  footer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  maybeButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  maybeButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.5,
  },
  warningText: {
    fontSize: 12,
    color: '#F59E0B',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
});