import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './Button';
import Svg, { Path } from 'react-native-svg';

const streakOptions = [3, 4, 5, 6, 7];

interface StreakSelectionProps {
  onNext: (data: { weeklyGoal: number }) => void;
}

const FlameIcon = () => (
  <Svg width="96" height="96" viewBox="0 0 24 24" fill="none">
    <Path 
      d="M17.657 7.93C17.8351 7.29284 17.9241 6.62533 17.9241 5.95C17.9241 3.216 15.7081 1 12.9741 1C10.2401 1 8.02408 3.216 8.02408 5.95C8.02408 6.62533 8.11309 7.29284 8.2911 7.93C5.11408 9.181 3.24109 12.442 3.24109 16.15C3.24109 20.02 6.43509 23.15 10.3681 23.15H15.5801C19.5131 23.15 22.7071 20.02 22.7071 16.15C22.7071 12.442 20.8341 9.181 17.657 7.93Z" 
      stroke="#22C55E" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </Svg>
);

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
          <FlameIcon />
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
