import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingStyles } from './styles';

interface OnboardingProgressBarProps {
  currentStep: number;
  totalSteps: number;
  showStepNumbers?: boolean;
  onBack?: () => void;
  hideBackButton?: boolean;
}

export const OnboardingProgressBar: React.FC<OnboardingProgressBarProps> = ({ 
  currentStep, 
  totalSteps, 
  showStepNumbers = true,
  onBack,
  hideBackButton = false
}) => {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <View style={styles.container}>
      {showStepNumbers && (
        <View style={styles.stepHeader}>
          {onBack && !hideBackButton && (
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color="#1F2937" />
            </TouchableOpacity>
          )}
          <Text style={styles.stepText} maxFontSizeMultiplier={1.2}>
            Step {currentStep} of {totalSteps}
          </Text>
          <View style={styles.spacer} />
        </View>
      )}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground} />
        <View 
          style={[
            styles.progressBarFill, 
            { width: `${progress}%` }
          ]} 
        />
        <View style={styles.progressBarOverlay} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 60, // Space for iPhone notch/status bar
    backgroundColor: 'transparent',
    zIndex: 1000,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  stepText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    flex: 1,
    textAlign: 'center',
  },
  spacer: {
    width: 48, // Same as back button + margin to center the text
  },
  progressBarContainer: {
    height: 8,
    position: 'relative',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
  },
  progressBarFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: OnboardingStyles.accent, // Golden color
    borderRadius: 4,
    minWidth: 8, // Ensure minimum visible progress
  },
  progressBarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
});