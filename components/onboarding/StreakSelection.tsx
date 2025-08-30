import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { Button } from './Button';
import { OnboardingPage } from './OnboardingPage';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingStyles } from './styles';

const streakOptions = [
  { days: 4, title: 'Consistent', subtitle: '4 days per week', icon: 'flame' as const, color: '#3B82F6' },
  { days: 5, title: 'Committed', subtitle: '5 days per week', icon: 'trending-up' as const, color: '#F59E0B' },
  { days: 6, title: 'Dedicated', subtitle: '6 days per week', icon: 'rocket' as const, color: '#EF4444' },
  { days: 7, title: 'Champion', subtitle: '7 days per week', icon: 'trophy' as const, color: '#8B5CF6' },
];

interface StreakSelectionProps {
  onNext: (data: { weeklyGoal: number }) => void;
}

export const StreakSelection: React.FC<StreakSelectionProps> = ({ onNext }) => {
  const [selectedDays, setSelectedDays] = useState<number>(4);

  const handleNext = () => {
    onNext({ weeklyGoal: selectedDays });
  };

  return (
    <OnboardingPage
      title="Set your weekly goal"
      subtitle="Choose how many days per week you want to engage with content"
      onNext={handleNext}
      buttonText="Continue"
    >
      <View style={styles.container}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
        </ScrollView>
      </View>
    </OnboardingPage>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 20,
  },
  content: {
    flex: 1,
  },
  streakWrapper: {
    paddingHorizontal: 16,
  },
  streakItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
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
