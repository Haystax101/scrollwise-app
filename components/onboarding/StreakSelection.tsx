import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './Button';

const streakOptions = [
  { days: 3, color: '#10B981', label: 'Beginner' },
  { days: 4, color: '#10B981', label: 'Steady' },
  { days: 5, color: '#3B82F6', label: 'Committed' },
  { days: 6, color: '#3B82F6', label: 'Dedicated' },
  { days: 7, color: '#F59E0B', label: 'Supercharged' },
];

interface StreakSelectionProps {
  onNext: (data: { weeklyGoal: number }) => void;
  onBack: () => void;
}

export const StreakSelection: React.FC<StreakSelectionProps> = ({ onNext, onBack }) => {
  const [selectedDays, setSelectedDays] = useState<number>(5); // Default to middle option

  const handleNext = () => {
    onNext({ weeklyGoal: selectedDays });
  };

  const getCurrentOption = () => {
    return streakOptions.find(opt => opt.days === selectedDays) || streakOptions[2];
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Flame Icon */}
        <View style={styles.iconContainer}>
          <Ionicons 
            name="flame" 
            size={96} 
            color={getCurrentOption().color} 
          />
        </View>

        <Text style={styles.title}>Set your weekly goal</Text>
        <Text style={styles.subtitle}>
          How many days per week do you want to learn something new?
        </Text>

        {/* Current Selection Display */}
        <View style={styles.selectionDisplay}>
          <Text style={styles.selectedDays}>{selectedDays}</Text>
          <Text style={styles.selectedLabel}>{getCurrentOption().label}</Text>
        </View>

        {/* Slider Picker Bar */}
        <View style={styles.sliderContainer}>
          <View style={styles.sliderTrack}>
            {streakOptions.map((option, index) => {
              const isSelected = selectedDays === option.days;
              return (
                <TouchableOpacity
                  key={option.days}
                  style={[
                    styles.sliderDot,
                    isSelected && [styles.sliderDotSelected, { backgroundColor: option.color }]
                  ]}
                  onPress={() => setSelectedDays(option.days)}
                >
                  <View style={[
                    styles.sliderDotInner,
                    isSelected && styles.sliderDotInnerSelected
                  ]} />
                </TouchableOpacity>
              );
            })}
          </View>
          
          {/* Labels below slider */}
          <View style={styles.sliderLabels}>
            {streakOptions.map((option) => (
              <Text key={option.days} style={[
                styles.sliderLabelText,
                selectedDays === option.days && { color: option.color, fontWeight: '600' }
              ]}>
                {option.days}
              </Text>
            ))}
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Button
          fullWidth
          onPress={handleNext}
        >
          Continue
        </Button>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    paddingHorizontal: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 64,
  },
  iconContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 24,
    maxWidth: 300,
  },
  selectionDisplay: {
    alignItems: 'center',
    marginBottom: 48,
  },
  selectedDays: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#FBBF24',
    marginBottom: 8,
  },
  selectedLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sliderContainer: {
    width: '100%',
    maxWidth: 320,
    marginBottom: 32,
  },
  sliderTrack: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
    position: 'relative',
  },
  sliderDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#6B7280',
  },
  sliderDotSelected: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderColor: '#FBBF24',
  },
  sliderDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6B7280',
  },
  sliderDotInnerSelected: {
    backgroundColor: '#000000',
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  sliderLabelText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  footer: {
    paddingVertical: 32,
  },
});