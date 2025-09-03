import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { OnboardingStyles } from './styles';

interface ButtonProps {
  children?: string;
  title?: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  title,
  onPress,
  disabled = false,
  variant = 'primary',
  style
}) => {
  const buttonText = title || children;
  return (
    <TouchableOpacity
      style={[
        styles.button,
        disabled && styles.disabled,
        variant === 'secondary' && styles.secondary,
        variant === 'outline' && styles.outline,
        style
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Text style={[
        styles.text, 
        variant === 'secondary' && styles.secondaryText,
        variant === 'outline' && styles.outlineText
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