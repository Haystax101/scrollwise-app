import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { Button } from './Button';
import { OnboardingPage } from './OnboardingPage';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingStyles } from './styles';

const streakOptions = [
  { days: 10, title: 'Getting Started', subtitle: '10 day streak goal', icon: 'flame' as const, color: '#FFE4B5' },
  { days: 20, title: 'Building Momentum', subtitle: '20 day streak goal', icon: 'flame' as const, color: '#FFA500' },
  { days: 30, title: 'Committed Learner', subtitle: '30 day streak goal', icon: 'flame' as const, color: '#FF8C00' },
  { days: 40, title: 'Streak Champion', subtitle: '40 day streak goal', icon: 'flame' as const, color: '#FF4500' },
];

interface StreakSelectionProps {
  onNext: (data: { streakGoal: number }) => void;
  onBack?: () => void;
}

export const StreakSelection: React.FC<StreakSelectionProps> = ({ onNext, onBack }) => {
  const [selectedDays, setSelectedDays] = useState<number>(10);

  const handleNext = () => {
    onNext({ streakGoal: selectedDays });
  };

  return (
    <OnboardingPage
      title="Set your streak goal"
      subtitle="Choose your daily learning streak target to stay motivated"
      onNext={handleNext}
      onBack={onBack}
      buttonText="Continue"
    >
      <View style={styles.container}>
        <View style={styles.streakWrapper}>
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
    paddingTop: 10, // Reduced from 20
  },
  streakWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 10, // Added vertical padding to container
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
