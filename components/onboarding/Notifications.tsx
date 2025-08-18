import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './Button';

interface NotificationsProps {
  onNext: (data: { enableNotifications: boolean }) => void;
}

export const Notifications: React.FC<NotificationsProps> = ({ onNext }) => {
  const handleEnableNotifications = () => {
    onNext({ enableNotifications: true });
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
        >
          Enable Notifications
        </Button>
        <TouchableOpacity 
          style={styles.maybeButton} 
          onPress={handleMaybeLater}
        >
          <Text style={styles.maybeButtonText}>Maybe Later</Text>
        </TouchableOpacity>
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
});