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
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleNext = () => {
    if (password && password === confirmPassword) {
      onNext({ password });
    }
  };

  const isValidPassword = password.length >= 6;
  const passwordsMatch = password === confirmPassword;
  const canContinue = isValidPassword && passwordsMatch && confirmPassword.length > 0;

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
        <InputField
          label="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
        
        {confirmPassword.length > 0 && !passwordsMatch && (
          <Text style={styles.errorText}>Passwords don't match</Text>
        )}
        
        {password.length > 0 && !isValidPassword && (
          <Text style={styles.errorText}>Password must be at least 6 characters</Text>
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
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 8,
  },
});
