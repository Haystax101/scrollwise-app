import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Keyboard } from 'react-native';
import { InputField } from './InputField';
import { OnboardingPage } from './OnboardingPage';
import { supabase } from '../../lib/supabase';

interface EmailInputProps {
  onNext: (data: { email: string }) => void;
  onBack: () => void;
  emailExistsError: boolean;
  onGoToLogin: () => void;
}

export const EmailInput: React.FC<EmailInputProps> = ({ onNext, onBack, emailExistsError, onGoToLogin }) => {
  const [email, setEmail] = useState('');
  const [emailExists, setEmailExists] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Dismiss keyboard when email error appears
  useEffect(() => {
    if (emailExistsError || emailExists) {
      Keyboard.dismiss();
    }
  }, [emailExistsError, emailExists]);

  // Real-time email checking with debounce - only check after 5 characters
  useEffect(() => {
    const checkEmail = async () => {
      const trimmedEmail = email.trim().toLowerCase();

      // Only check if email has more than 5 characters
      if (trimmedEmail.length <= 5) {
        setEmailExists(false);
        return;
      }

      try {
        // Check if any profile email contains this partial email
        const { data, error } = await supabase
          .from('profiles')
          .select('email')
          .ilike('email', `%${trimmedEmail}%`)
          .limit(1);

        if (!error && data && data.length > 0) {
          // Check if we have an exact match
          const exactMatch = data.some(profile => profile.email === trimmedEmail);
          setEmailExists(exactMatch);
        } else {
          setEmailExists(false);
        }
      } catch (error) {
        console.error('Error checking email:', error);
        setEmailExists(false);
      }
    };

    // Debounce the email check
    const timeoutId = setTimeout(checkEmail, 500);
    return () => clearTimeout(timeoutId);
  }, [email]);

  const handleNext = () => {
    if (email.trim() && !isLoading) {
      setIsLoading(true);
      onNext({ email: email.trim() });
      // Reset loading state after 2 seconds if we don't navigate away
      setTimeout(() => setIsLoading(false), 2000);
    }
  };

  const isValidEmail = email.includes('@') && email.includes('.');

  return (
    <OnboardingPage
      title="What's your email?"
      subtitle="We'll use this to send you updates and keep your account secure"
      onBack={onBack}
      onNext={handleNext}
      buttonText={isLoading ? "Sending code..." : "Continue"}
      buttonDisabled={!isValidEmail || emailExists || isLoading}
    >
      <View style={styles.container}>
        <InputField
          label="Email address"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {(emailExists || emailExistsError) && (
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
    justifyContent: 'flex-start',
    paddingTop: 20,
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
