import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Alert, TextInput, Keyboard, Text, TouchableOpacity, InputAccessoryView } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingStepContent } from './OnboardingStepContent';
import { OnboardingStyles } from './styles';
import { useAuth } from '../../context/AuthContext';

interface OtpVerificationScreenProps {
  email?: string;
  onSuccess: () => void;
  // onBack removed
  skipInitialOtpSend?: boolean;
}

export const OtpVerificationScreen: React.FC<OtpVerificationScreenProps> = ({ email, onSuccess, skipInitialOtpSend = false }) => {
  const { user, loading, signInWithOtp, verifyOtp } = useAuth();
  const [token, setToken] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
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

  if (loading && !user) {
    return null;
  }

  return (
    <OnboardingStepContent
      title="Enter Your Code"
      subtitle={`We've sent a one-time password to ${email || 'your email address'}. Enter the 6-digit code below.`}
      onNext={() => handleVerifyOtp()}
      buttonText={isVerifying ? "Verifying..." : "Verify"}
      buttonDisabled={isVerifying || token.length < 6}
      alternativeComponent={
        <TouchableOpacity style={styles.resendButton} onPress={resendOtp} disabled={resendLoading}>
          <Text style={styles.resendButtonText}>
            {resendLoading ? "Sending..." : "Resend Code"}
          </Text>
        </TouchableOpacity>
      }
    >
      <View style={styles.container}>
        <View style={styles.inputContainer}>
          <TextInput
            ref={inputRef}
            style={[
              styles.input,
              token.length === 6 && styles.inputComplete
            ]}
            placeholder="______"
            placeholderTextColor={OnboardingStyles.textTertiary}
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
            keyboardAppearance="dark"
            selectionColor={OnboardingStyles.accent}
          />
        </View>

        {/* Empty InputAccessoryView to hide the "Done" button */}
        <InputAccessoryView nativeID="otpAccessory">
          <View style={{ height: 0 }} />
        </InputAccessoryView>
      </View>
    </OnboardingStepContent>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 0,
  },
  inputContainer: {
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
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
    backgroundColor: 'rgba(234, 179, 8, 0.05)',
  },
  resendButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  resendButtonText: {
    fontSize: 14,
    color: OnboardingStyles.accent,
    textAlign: 'center',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
