import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { InputField } from './InputField';
import { OnboardingPage } from './OnboardingPage';

interface PasswordSetupProps {
  onNext: (data: { password: string }) => void;
  onBack: () => void;
}

export const PasswordSetup: React.FC<PasswordSetupProps> = ({ onNext, onBack }) => {
  const [password, setPassword] = useState('');

  const handleNext = () => {
    if (password && isValidPassword) {
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
    <OnboardingPage
      title="Create a password"
      subtitle="Choose a strong password to keep your account secure"
      onBack={onBack}
      onNext={handleNext}
      buttonText="Continue"
      buttonDisabled={!canContinue}
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
    </OnboardingPage>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 20, // Add some space from the title
  },
  validationContainer: {
    marginTop: 16, // More space after input field
    marginBottom: 24, // Increased bottom margin to prevent overlap with continue button
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20,
  },
});
