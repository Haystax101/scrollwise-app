import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Button } from './Button';
import { OnboardingPage } from './OnboardingPage';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingStyles } from './styles';
import { NotificationService } from '../../services/notificationService';

const streakOptions = [
  { days: 10, title: 'Getting Started', subtitle: '10 day streak goal', icon: 'flame' as const, color: '#FFE4B5' },
  { days: 20, title: 'Building Momentum', subtitle: '20 day streak goal', icon: 'flame' as const, color: '#FFA500' },
  { days: 30, title: 'Committed Learner', subtitle: '30 day streak goal', icon: 'flame' as const, color: '#FF8C00' },
  { days: 40, title: 'Streak Champion', subtitle: '40 day streak goal', icon: 'flame' as const, color: '#FF4500' },
];

interface StreakSelectionProps {
  onNext: (data: { streakGoal: number; enableNotifications?: boolean }) => void;
  onBack?: () => void;
}

export const StreakSelection: React.FC<StreakSelectionProps> = ({ onNext, onBack }) => {
  const [selectedDays, setSelectedDays] = useState<number>(10);
  const [isRequestingPermissions, setIsRequestingPermissions] = useState(false);

  const handleNext = async () => {
    // First, proceed with the streak goal
    setIsRequestingPermissions(true);

    try {
      // Request notification permissions
      if (NotificationService.isDeviceSupported()) {
        const result = await NotificationService.registerForPushNotifications();

        if (result.success) {
          console.log('Notifications enabled during onboarding');
          onNext({ streakGoal: selectedDays, enableNotifications: true });
        } else {
          console.log('User declined notifications or they failed to enable');
          // Still proceed, just without notifications
          onNext({ streakGoal: selectedDays, enableNotifications: false });
        }
      } else {
        console.log('Device does not support push notifications');
        onNext({ streakGoal: selectedDays, enableNotifications: false });
      }
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      // Proceed anyway
      onNext({ streakGoal: selectedDays, enableNotifications: false });
    } finally {
      setIsRequestingPermissions(false);
    }
  };

  return (
    <OnboardingPage
      title="Set your streak goal"
      subtitle="Choose your daily learning streak target to stay motivated"
      onNext={handleNext}
      onBack={onBack}
      buttonText={isRequestingPermissions ? "Setting up..." : "Continue"}
      buttonDisabled={isRequestingPermissions}
    >
      <View style={styles.container}>
        <View style={styles.notificationInfo}>
          <Ionicons name="notifications-outline" size={20} color="#6B7280" />
          <Text style={styles.notificationText}>
            We'll ask for notification permission to send you daily learning reminders
          </Text>
        </View>
        <View style={styles.streakWrapper}>
          {isRequestingPermissions && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={OnboardingStyles.accent} />
              <Text style={styles.loadingText}>Requesting notification permissions...</Text>
            </View>
          )}
          {streakOptions.map((option) => {
            const isSelected = selectedDays === option.days;
            return (
              <TouchableOpacity
                key={option.days}
                style={[
                  styles.streakItem,
                  isSelected && styles.streakItemSelected
                ]}
                onPress={() => setSelectedDays(option.days)}
              >
                <View style={[
                  styles.streakIcon,
                  isSelected && styles.streakIconSelected
                ]}>
                  <Ionicons 
                    name={option.icon} 
                    size={24} 
                    color={isSelected ? OnboardingStyles.accent : option.color} 
                  />
                </View>
                <View style={styles.streakTextContainer}>
                  <Text style={[
                    styles.streakTitle,
                    isSelected && styles.streakTitleSelected
                  ]}>
                    {option.title}
                  </Text>
                  <Text style={[
                    styles.streakSubtitle,
                    isSelected && styles.streakSubtitleSelected
                  ]}>
                    {option.subtitle}
                  </Text>
                </View>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={24} color={OnboardingStyles.accent} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </OnboardingPage>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 10,
  },
  notificationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    gap: 8,
  },
  notificationText: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  streakWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    position: 'relative',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderRadius: 12,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  streakItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16, // Reduced from 20
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12, // Reduced from 16
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: 'rgba(0, 0, 0, 0.05)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  streakItemSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: OnboardingStyles.accent,
    borderWidth: 2,
  },
  streakIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  streakIconSelected: {
    backgroundColor: '#FEF3C7',
  },
  streakTextContainer: {
    flex: 1,
  },
  streakTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  streakTitleSelected: {
    color: '#1F2937',
  },
  streakSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  streakSubtitleSelected: {
    color: '#6B7280',
  },
});
