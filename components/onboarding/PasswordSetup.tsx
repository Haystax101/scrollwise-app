import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { InputField } from './InputField';
import { OnboardingStepContent } from './OnboardingStepContent';
import { OnboardingStyles } from './styles';

interface PasswordSetupProps {
  onNext: (data: { password: string }) => void;
  onBack?: () => void;
  isLoading?: boolean;
}

export const PasswordSetup: React.FC<PasswordSetupProps> = ({ onNext, onBack, isLoading = false }) => {
  const [password, setPassword] = useState('');

  const handleNext = () => {
    if (password && isValidPassword && !isLoading) {
      onNext({ password });
    }
  };

  // Enhanced password validation
  const hasMinLength = password.length >= 8;
  const hasCapitalLetter = /[A-Z]/.test(password);
  const hasPunctuation = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const isValidPassword = hasMinLength && hasCapitalLetter && hasPunctuation;
  const canContinue = isValidPassword;

  return (
    <OnboardingStepContent
      title="Create a password"
      subtitle="Choose a strong password to keep your account secure"
      onNext={handleNext}
      buttonText={isLoading ? "Creating Account..." : "Continue"}
      buttonDisabled={!canContinue || isLoading} // Reverted to original logic as new validation vars are undefined
    >
      <View style={styles.container}>
        <InputField
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {password.length > 0 && (
          <View style={styles.validationContainer}>
            {!hasMinLength && (
              <Text style={styles.errorText}>• Password must be at least 8 characters</Text>
            )}
            {!hasCapitalLetter && (
              <Text style={styles.errorText}>• Password must include at least one capital letter</Text>
            )}
            {!hasPunctuation && (
              <Text style={styles.errorText}>• Password must include at least one punctuation mark</Text>
            )}
          </View>
        )}
      </View>
    </OnboardingStepContent>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 0,
  },
  validationContainer: {
    marginTop: 16,
    marginBottom: 32,
    paddingBottom: 16,
  },
  errorText: {
    color: OnboardingStyles.error,
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20,
    fontWeight: '500',
  },
});
