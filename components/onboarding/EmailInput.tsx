import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Keyboard } from 'react-native';
import { InputField } from './InputField';
import { OnboardingStepContent } from './OnboardingStepContent'; // Updated import
import { supabase } from '../../lib/supabase';
import { OnboardingStyles } from './styles'; // Use styles for colors

interface EmailInputProps {
  onNext: (data: { email: string }) => void;
  // onBack removed as it's handled by OnboardingLayout
  emailExistsError: boolean;
  onGoToLogin: () => void;
}

export const EmailInput: React.FC<EmailInputProps> = ({ onNext, emailExistsError, onGoToLogin }) => {
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
    <OnboardingStepContent
      title="What's your email?"
      subtitle="We'll use this to send you updates and keep your account secure"
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
    </OnboardingStepContent>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 0,
  },
  errorContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)', // Red tint
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: OnboardingStyles.error,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 14,
    marginBottom: 8,
  },
  loginLink: {
    color: OnboardingStyles.accent,
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
