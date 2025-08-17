import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { OnboardingStyles } from './styles';

interface ButtonProps {
  children: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onPress,
  disabled = false,
  variant = 'primary',
  style
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        disabled && styles.disabled,
        variant === 'secondary' && styles.secondary,
        style
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Text style={[styles.text, variant === 'secondary' && styles.secondaryText]}>
        {children}
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
  text: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryText: {
    color: '#9CA3AF',
  },
});