import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingScreen } from '../../components/onboarding/OnboardingScreen';
import { OnboardingStyles } from '../../components/onboarding/styles';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

export default function EmailVerificationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user, loading } = useAuth();
  const [isChecking, setIsChecking] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  
  const email = params.email as string || user?.email;

  // Check for email confirmation status
  const checkEmailConfirmation = async () => {
    if (!user) return;
    
    setIsChecking(true);
    try {
      // Get fresh user data to check email confirmation
      const { data: { user: freshUser }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('Error checking user:', error);
        Alert.alert('Error', 'Failed to check email verification status');
        return;
      }

      if (freshUser?.email_confirmed_at) {
        console.log('Email verified, redirecting to onboarding');
        router.replace('/onboarding');
      } else {
        Alert.alert(
          'Email not verified', 
          'Please check your email and click the verification link, then try again.'
        );
      }
    } catch (error) {
      console.error('Error checking email confirmation:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsChecking(false);
    }
  };

  // Resend verification email
  const resendVerificationEmail = async () => {
    if (!email) return;
    
    setResendLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) {
        console.error('Error resending email:', error);
        Alert.alert('Error', 'Failed to resend verification email');
      } else {
        Alert.alert('Success', 'Verification email sent! Please check your inbox.');
      }
    } catch (error) {
      console.error('Error resending email:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  // Handle auto-redirect when user comes back from email verification
  useEffect(() => {
    if (user?.email_confirmed_at) {
      console.log('Email verified, redirecting to onboarding');
      router.replace('/onboarding');
    }
  }, [user?.email_confirmed_at]);

  // Also handle when user gains a session (successful email verification via deep link)
  useEffect(() => {
    if (user && !loading) {
      console.log('User session active, redirecting to main app flow');
      router.replace('/');
    }
  }, [user, loading]);

  if (loading) {
    return null;
  }

  const emailIcon = (
    <View style={styles.iconContainer}>
      <Ionicons name="mail-outline" size={64} color={OnboardingStyles.accent} />
    </View>
  );

  return (
    <OnboardingScreen
      icon={emailIcon}
      title="Check your email"
      description={`We've sent a verification link to ${email || 'your email address'}. Click the link in the email to verify your account.`}
      currentStep={0}
      totalSteps={1}
      onNext={checkEmailConfirmation}
      onBack={() => router.back()}
      buttonText={isChecking ? "Checking..." : "I've verified my email"}
      buttonDisabled={isChecking}
      secondaryButtonText={resendLoading ? "Sending..." : "Resend email"}
      onSecondaryAction={resendVerificationEmail}
      hideStepCounter={true}
      hideProgressDots={true}
      showBackButton={true}
    />
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: `${OnboardingStyles.accent}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },
});