import React, { useState, useRef } from 'react';
import { TextInput, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { OnboardingStyles } from './styles';

interface InputFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences'
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;
  const inputRef = useRef<TextInput>(null);

  const handleFocus = () => {
    setIsFocused(true);
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (!value) {
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  };

  const labelStyle = {
    top: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 4],
    }),
    fontSize: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    color: isFocused ? '#F59E0B' : '#6B7280',
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => {
        inputRef.current?.focus();
      }}
      activeOpacity={1}
    >
      <Animated.Text style={[styles.label, labelStyle]}>
        {label}
      </Animated.Text>
      <TextInput
        ref={inputRef}
        style={[styles.input, isFocused && styles.inputFocused]}
        value={value}
        onChangeText={onChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        placeholderTextColor={OnboardingStyles.textTertiary}
        selectionColor={OnboardingStyles.accent}
        keyboardAppearance="dark"
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginBottom: 16,
  },
  input: {
    height: OnboardingStyles.inputHeight,
    paddingHorizontal: OnboardingStyles.inputPaddingHorizontal,
    paddingTop: 20,
    paddingBottom: 8,
    backgroundColor: OnboardingStyles.inputBackground,
    borderRadius: OnboardingStyles.inputBorderRadius,
    borderBottomWidth: 2,
    borderBottomColor: OnboardingStyles.borderColor,
    color: OnboardingStyles.textPrimary,
    fontSize: 16,
    shadowColor: OnboardingStyles.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
  },
  inputFocused: {
    borderBottomColor: OnboardingStyles.accent,
  },
  label: {
    position: 'absolute',
    left: 16,
    fontWeight: '400',
    zIndex: 1,
  },
});