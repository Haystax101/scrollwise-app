import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { Button } from './Button';
import Svg, { Path } from 'react-native-svg';

const streakOptions = [3, 4, 5, 6, 7];

interface StreakSelectionProps {
  onNext: (data: { weeklyGoal: number }) => void;
}

const FlameIcon = ({ selectedDays }: { selectedDays: number }) => {
  // Determine color based on selected days
  const getFlameColor = () => {
    if (selectedDays === 3 || selectedDays === 4) {
      return { primary: "#22C55E", secondary: "#16A34A" }; // Green
    } else if (selectedDays === 5 || selectedDays === 6) {
      return { primary: "#3B82F6", secondary: "#2563EB" }; // Blue
    } else {
      return { primary: "#F97316", secondary: "#EA580C" }; // Orange
    }
  };

  const colors = getFlameColor();

  return (
    <Svg width="96" height="96" viewBox="0 0 24 24" fill="none">
      {/* Main flame body */}
      <Path 
        d="M12 2C12 2 8 4 6 8C4.5 10.5 4.5 13.5 6 16C7.5 18.5 10 20 12 20C14 20 16.5 18.5 18 16C19.5 13.5 19.5 10.5 18 8C16 4 12 2 12 2Z" 
        fill={colors.primary}
        stroke={colors.secondary}
        strokeWidth="1.5"
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      {/* Inner flame detail */}
      <Path 
        d="M12 6C12 6 10 7.5 9 10C8.5 11.5 8.5 13 9.5 14.5C10.5 16 11.5 17 12 17C12.5 17 13.5 16 14.5 14.5C15.5 13 15.5 11.5 15 10C14 7.5 12 6 12 6Z" 
        fill={colors.secondary}
        strokeWidth="0"
      />
      {/* Flame tip */}
      <Path 
        d="M12 2C12 2 10.5 3 10 5C9.8 6 10 7 10.5 7.5C11 8 11.5 7.8 12 7C12.5 7.8 13 8 13.5 7.5C14 7 14.2 6 14 5C13.5 3 12 2 12 2Z" 
        fill={colors.primary}
        strokeWidth="0"
      />
    </Svg>
  );
};

export const StreakSelection: React.FC<StreakSelectionProps> = ({ onNext }) => {
  const [selectedDays, setSelectedDays] = useState<number>(3);

  const handleNext = () => {
    onNext({ weeklyGoal: selectedDays });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header} />

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>Set your weekly goal</Text>
        <Text style={styles.subtitle}>Light the fire and commit to your growth.</Text>
        
        <View style={styles.iconContainer}>
          <FlameIcon selectedDays={selectedDays} />
        </View>

        <View style={styles.selectionContainer}>
          {streakOptions.map((days) => (
            <TouchableOpacity
              key={days}
              style={[
                styles.dayOption,
                selectedDays === days && styles.dayOptionSelected,
              ]}
              onPress={() => setSelectedDays(days)}
            >
              <Text style={[
                styles.dayText,
                selectedDays === days && styles.dayTextSelected,
              ]}>
                {days}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Button
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
    height: 60,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 64,
    lineHeight: 24,
    maxWidth: 300,
  },
  iconContainer: {
    marginBottom: 64,
  },
  selectionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 999,
    padding: 8,
    width: '100%',
    maxWidth: 300,
  },
  dayOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayOptionSelected: {
    backgroundColor: '#FBBF24',
  },
  dayText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dayTextSelected: {
    color: '#000000',
  },
  footer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
});
