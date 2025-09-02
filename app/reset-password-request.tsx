import React, { useState } from 'react';
import { View, Text, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { InputField } from '../components/onboarding/InputField';
import { Button } from '../components/onboarding/Button';
import { OnboardingScreen } from '../components/onboarding/OnboardingScreen';

export default function ResetPasswordRequest() {
  const router = useRouter();
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSendResetEmail = async () => {
    if (!email || !email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    setIsLoading(true);

    try {
      // Use custom scheme instead of exp:// to avoid SendGrid URL modification
      const redirectUrl = 'supercharged://update-password';
      
      console.log('Sending reset email with redirect URL:', redirectUrl);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        console.error('Error sending reset email:', error);
        Alert.alert(
          'Error',
          'Failed to send reset email. Please try again.'
        );
      } else {
        setEmailSent(true);
      }
    } catch (error) {
      console.error('Exception sending reset email:', error);
      Alert.alert(
        'Error',
        'An unexpected error occurred. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.replace('/onboarding');
  };

  if (emailSent) {
    return (
      <OnboardingScreen
        icon={null}
        title="Check Your Email"
        description="If an account with that email exists, a password reset link has been sent. Please check your email and follow the instructions."
        currentStep={0}
        totalSteps={1}
        onNext={handleBackToLogin}
        onBack={handleBackToLogin}
        hideStepCounter={true}
        hideProgressDots={true}
        showBackButton={true}
        buttonText="Back to Login"
        customContent={
          <View style={styles.iconContainer}>
            <View style={[styles.emailIcon, { backgroundColor: colors.primary }]}>
              <Text style={styles.emailIconText}>📧</Text>
            </View>
          </View>
        }
      />
    );
  }

  return (
    <OnboardingScreen
      icon={null}
      title="Reset Password"
      description="Enter your email address and we'll send you a link to reset your password."
      currentStep={0}
      totalSteps={1}
      onNext={handleSendResetEmail}
      onBack={handleBackToLogin}
      hideStepCounter={true}
      hideProgressDots={true}
      showBackButton={true}
      buttonText={isLoading ? "Sending..." : "Send Reset Link"}
      buttonDisabled={isLoading || !email}
      customContent={
        <View style={{ width: '100%', paddingHorizontal: 24 }}>
          <InputField
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    marginVertical: 32,
  },
  emailIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emailIconText: {
    fontSize: 32,
  },
});