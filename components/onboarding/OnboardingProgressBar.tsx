import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingStyles } from './styles';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

interface OnboardingProgressBarProps {
  currentStep: number;
  totalSteps: number;
  showStepNumbers?: boolean;
  onBack?: () => void;
  hideBackButton?: boolean;
}

// Motivational text generator
const getMotivationalText = (current: number, total: number): string => {
  const remaining = total - current;

  if (remaining === 0) return "All done! 🎉";
  if (remaining === 1) return "One last step!";
  if (remaining === 2) return "Almost there! Just 2 more";
  if (remaining <= 3) return `Just ${remaining} more steps!`;
  if (current >= total * 0.75) return "You're crushing it! 💪";
  if (current >= total * 0.5) return "Halfway there! 🔥";
  return `${remaining} steps to go`;
};

export const OnboardingProgressBar: React.FC<OnboardingProgressBarProps> = ({
  currentStep,
  totalSteps,
  showStepNumbers = true,
  onBack,
  hideBackButton = false
}) => {
  const progress = (currentStep / totalSteps) * 100;
  const progressValue = useSharedValue(0);

  // Trigger haptic feedback
  const triggerHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  useEffect(() => {
    progressValue.value = withSpring(progress, {
      damping: 20,
      stiffness: 150,
      mass: 0.5,
    }, () => {
      // Haptic feedback on animation complete
      runOnJS(triggerHaptic)();
    });
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: `${progressValue.value}%`,
    };
  });

  const motivationalText = getMotivationalText(currentStep, totalSteps);

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
            {currentStep} of {totalSteps}
          </Text>
          <View style={styles.spacer} />
        </View>
      )}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground} />
        <Animated.View
          style={[
            styles.progressBarFill,
            animatedStyle
          ]}
        />
        <View style={styles.progressBarOverlay} />
      </View>
      <Text style={styles.motivationalText} maxFontSizeMultiplier={1.2}>
        {motivationalText}
      </Text>
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
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
    flex: 1,
    textAlign: 'center',
  },
  spacer: {
    width: 48, // Same as back button + margin to center the text
  },
  progressBarContainer: {
    height: 12, // Increased from 8px to 12px (50% larger)
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  progressBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(234, 179, 8, 0.15)', // Light yellow tint
    borderRadius: 8,
  },
  progressBarFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: OnboardingStyles.accent, // Golden color
    borderRadius: 8,
    minWidth: 12, // Ensure minimum visible progress
  },
  progressBarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  motivationalText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
  },
});