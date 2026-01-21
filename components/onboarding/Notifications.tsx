import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { OnboardingStepContent } from './OnboardingStepContent';
import { OnboardingStyles } from './styles';

interface NotificationsProps {
  onNext: (data: { enableNotifications: boolean }) => void;
}

export const Notifications: React.FC<NotificationsProps> = ({ onNext }) => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleNext = () => {
    setIsLoading(true);
    onNext({ enableNotifications: isEnabled });
    // Loading state handling is usually done in parent if transition is slow, 
    // but here we just pass data.
  };

  return (
    <OnboardingStepContent
      title="Stay in the loop"
      subtitle="Get notified about new opportunities and community updates"
      onNext={handleNext}
      buttonText={isLoading ? "Finishing up..." : "Finish Setup"}
      buttonDisabled={isLoading}
    >
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.textContainer}>
            <Text style={styles.cardTitle}>Enable Push Notifications</Text>
            <Text style={styles.cardDescription}>
              We promise not to spam properly. You can change this later in settings.
            </Text>
          </View>
          <Switch
            trackColor={{ false: OnboardingStyles.borderColor, true: OnboardingStyles.accent }}
            thumbColor={isEnabled ? "#000000" : "#f4f3f4"}
            ios_backgroundColor={OnboardingStyles.borderColor}
            onValueChange={setIsEnabled}
            value={isEnabled}
          />
        </View>
      </View>
    </OnboardingStepContent>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
  },
  card: {
    backgroundColor: OnboardingStyles.cardBackground,
    borderRadius: 16,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: OnboardingStyles.borderColor,
  },
  textContainer: {
    flex: 1,
    paddingRight: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: OnboardingStyles.textPrimary,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: OnboardingStyles.textSecondary,
    lineHeight: 20,
  },
});