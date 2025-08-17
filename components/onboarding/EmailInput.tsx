import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { InputField } from './InputField';
import { OnboardingPage } from './OnboardingPage';

interface EmailInputProps {
  onNext: (data: { email: string }) => void;
  onBack: () => void;
  emailExistsError: boolean;
  onGoToLogin: () => void;
}

export const EmailInput: React.FC<EmailInputProps> = ({ onNext, onBack, emailExistsError, onGoToLogin }) => {
  const [email, setEmail] = useState('');

  const handleNext = () => {
    if (email.trim()) {
      onNext({ email: email.trim() });
    }
  };

  const isValidEmail = email.includes('@') && email.includes('.');

  return (
    <OnboardingPage
      title="What's your email?"
      subtitle="We'll use this to send you updates and keep your account secure"
      onBack={onBack}
      onNext={handleNext}
      buttonText="Continue"
      buttonDisabled={!isValidEmail}
    >
      <View style={styles.container}>
        <InputField
          label="Email address"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
        {emailExistsError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>There's already an account associated with this email.</Text>
            <TouchableOpacity onPress={onGoToLogin}>
              <Text style={styles.loginLink}>Go to Log In</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </OnboardingPage>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  errorContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#371A1A',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#F87171',
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 14,
    marginBottom: 8,
  },
  loginLink: {
    color: '#FBBF24',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
