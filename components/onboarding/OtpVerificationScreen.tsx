import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Alert, TextInput, Keyboard, KeyboardAvoidingView, Platform, SafeAreaView, Text, TouchableOpacity, InputAccessoryView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingScreen } from './OnboardingScreen';
import { OnboardingStyles } from './styles';
import { useAuth } from '../../context/AuthContext';

interface OtpVerificationScreenProps {
  email?: string;
  onSuccess: () => void;
  onBack: () => void;
  skipInitialOtpSend?: boolean; // Skip sending OTP on mount if already sent
}

export const OtpVerificationScreen: React.FC<OtpVerificationScreenProps> = ({ email, onSuccess, onBack, skipInitialOtpSend = false }) => {
  const { user, loading, signInWithOtp, verifyOtp } = useAuth();
  const [token, setToken] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);

  const [hasTriedSendingOtp, setHasTriedSendingOtp] = useState(false);

  useEffect(() => {
    if (email && !hasTriedSendingOtp && !skipInitialOtpSend) {
      // Automatically send the OTP when the screen is shown (only once)
      setHasTriedSendingOtp(true);
      signInWithOtp(email);
    } else if (skipInitialOtpSend) {
      // Mark as tried so resend button works properly
      setHasTriedSendingOtp(true);
    }
  }, [email, hasTriedSendingOtp, signInWithOtp, skipInitialOtpSend]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const handleTokenChange = (text: string) => {
    // Only allow numbers
    const numericText = text.replace(/[^0-9]/g, '');
    setToken(numericText);
    
    // Auto-dismiss keyboard and auto-submit when 6 digits are entered
    if (numericText.length === 6) {
      Keyboard.dismiss();
      // Small delay to ensure keyboard dismisses before verification
      setTimeout(() => {
        handleVerifyOtp(numericText);
      }, 100);
    }
  };

  const handleVerifyOtp = async (otpCode?: string) => {
    const codeToVerify = otpCode || token.trim();
    
    if (!email || !codeToVerify) {
      Alert.alert('Error', 'Please enter the OTP.');
      return;
    }
    
    setIsVerifying(true);
    try {
      const success = await verifyOtp(email, codeToVerify);
      if (success) {
        onSuccess();
      } else {
        Alert.alert('Error', 'Invalid OTP. Please try again.');
        // Clear the input for retry
        setToken('');
        inputRef.current?.focus();
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      // Clear the input for retry
      setToken('');
      inputRef.current?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const resendOtp = async () => {
    if (!email) return;
    
    setResendLoading(true);
    try {
      const success = await signInWithOtp(email);
      if (success) {
        setToken(''); // Clear the input
        Alert.alert('Success', 'A new OTP has been sent to your email.');
        inputRef.current?.focus();
      } else {
        Alert.alert('Error', 'Failed to resend OTP.');
      }
    } catch (error) {
      console.error('Error resending OTP:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  // Don't auto-redirect during onboarding - let the parent component handle navigation
  // The onSuccess callback will handle the proper flow

  if (loading && !user) {
    return null; // Show nothing while initially loading auth state
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title}>Enter Your Code</Text>
          <Text style={styles.description}>
            We've sent a one-time password to {email || 'your email address'}. Enter the 6-digit code below.
          </Text>

          <View style={styles.inputContainer}>
            <TextInput
              ref={inputRef}
              style={[
                styles.input,
                token.length === 6 && styles.inputComplete
              ]}
              placeholder="______"
              placeholderTextColor="#9CA3AF"
              value={token}
              onChangeText={handleTokenChange}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              maxLength={6}
              autoFocus={true}
              autoCapitalize="none"
              selectTextOnFocus={true}
              blurOnSubmit={false}
              enablesReturnKeyAutomatically={false}
              inputAccessoryViewID="otpAccessory"
              onSubmitEditing={() => {
                if (token.length === 6) {
                  handleVerifyOtp();
                }
              }}
            />
          </View>
        </View>

        {/* Empty InputAccessoryView to hide the "Done" button */}
        <InputAccessoryView nativeID="otpAccessory">
          <View style={{ height: 0 }} />
        </InputAccessoryView>

        {/* Footer - This will be positioned above keyboard */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.verifyButton, (isVerifying || token.length < 6) && styles.verifyButtonDisabled]} 
            onPress={() => handleVerifyOtp()}
            disabled={isVerifying || token.length < 6}
          >
            <Text style={[styles.verifyButtonText, (isVerifying || token.length < 6) && styles.verifyButtonTextDisabled]}>
              {isVerifying ? "Verifying..." : token.length === 6 ? "Auto-verifying..." : "Verify"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.resendButton} onPress={resendOtp} disabled={resendLoading}>
            <Text style={styles.resendButtonText}>
              {resendLoading ? "Sending..." : "Resend Code"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: OnboardingStyles.backgroundColor,
  },
  keyboardContainer: {
    flex: 1,
    paddingHorizontal: OnboardingStyles.containerPaddingHorizontal,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 120, // Space for OnboardingProgressBar overlay
    paddingBottom: 40, // Give space above the footer
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: `${OnboardingStyles.accent}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: OnboardingStyles.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: OnboardingStyles.textSecondary,
    textAlign: 'center',
    maxWidth: 300,
    marginBottom: 32,
  },
  inputContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  input: {
    height: 64,
    borderColor: OnboardingStyles.borderColor,
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 20,
    fontSize: 24,
    fontWeight: '600',
    width: 200,
    textAlign: 'center',
    backgroundColor: OnboardingStyles.inputBackground,
    letterSpacing: 8,
    color: OnboardingStyles.textPrimary,
    shadowColor: OnboardingStyles.shadowColor,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputComplete: {
    borderColor: OnboardingStyles.accent,
    backgroundColor: `${OnboardingStyles.accent}08`,
  },
  footer: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20, // Account for home indicator on iOS
  },
  verifyButton: {
    width: '100%',
    height: 48,
    backgroundColor: OnboardingStyles.accent,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  verifyButtonDisabled: {
    backgroundColor: OnboardingStyles.textTertiary,
  },
  verifyButtonTextDisabled: {
    color: OnboardingStyles.borderColor,
  },
  resendButton: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  resendButtonText: {
    fontSize: 14,
    color: OnboardingStyles.accent,
    textAlign: 'center',
  },
});
