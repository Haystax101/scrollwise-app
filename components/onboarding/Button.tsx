import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { OnboardingStyles } from './styles';
import * as Haptics from 'expo-haptics';

interface ButtonProps {
  children?: string;
  title?: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  style?: ViewStyle;
  textStyle?: TextStyle;
  disableHaptics?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  title,
  onPress,
  disabled = false,
  variant = 'primary',
  style,
  textStyle,
  disableHaptics = false
}) => {
  const buttonText = title || children;

  const handlePress = async () => {
    if (!disabled && !disableHaptics) {
      // Trigger haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onPress();
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        disabled && styles.disabled,
        variant === 'secondary' && styles.secondary,
        variant === 'outline' && styles.outline,
        style
      ]}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Text style={[
        styles.text,
        variant === 'secondary' && styles.secondaryText,
        variant === 'outline' && styles.outlineText,
        textStyle
      ]}>
        {buttonText}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: OnboardingStyles.buttonHeight,
    paddingHorizontal: OnboardingStyles.buttonPaddingHorizontal,
    borderRadius: OnboardingStyles.buttonBorderRadius,
    backgroundColor: OnboardingStyles.accent,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: OnboardingStyles.buttonMinWidth,
  },
  disabled: {
    opacity: 0.5,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: OnboardingStyles.borderColor,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: OnboardingStyles.accent,
  },
  text: {
    color: OnboardingStyles.buttonTextColor,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryText: {
    color: '#9CA3AF',
  },
  outlineText: {
    color: OnboardingStyles.accent,
  },
});