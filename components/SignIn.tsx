import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import type { User } from '../types';
import { CustomCheckbox } from './CustomCheckbox';
// Removed: import { styled } from "nativewind";

// Removed: const StyledView = styled(View);
// Removed: const StyledText = styled(Text);
// Removed: const StyledTextInput = styled(TextInput);
// Removed: const StyledTouchableOpacity = styled(TouchableOpacity);
// Removed: const StyledScrollView = styled(ScrollView);
// Removed: const StyledKeyboardAvoidingView = styled(KeyboardAvoidingView);

interface SignInProps {
  onSignIn: (user: User) => void;
  onSwitchToSignUp: () => void;
}

export const SignIn: React.FC<SignInProps> = ({ onSignIn, onSwitchToSignUp }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = () => {
    // Basic validation, can be expanded
    if (!email || !password) {
      alert("Please fill in all fields.");
      return;
    }
    onSignIn({ email, name: 'Demo User' }); // Name can be fetched or set later
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.outerContainer}>
          <View style={styles.innerContainer}>
            <View style={styles.centerItems}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="brain" size={40} color="#2563EB" />
              </View>
              <Text style={styles.title}>ScrollWise</Text>
              <Text style={styles.subtitle}>
                Feels like reels. Fuels like lectures.
              </Text>
            </View>

            <View style={styles.formSpacing}>
              <View style={styles.relativeBox}>
                <Feather
                  name="at-sign"
                  style={styles.inputIcon}
                  size={20}
                  color="#9CA3AF"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Email address"
                  placeholderTextColor="#6B7280"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  accessibilityLabel="Email address input"
                />
              </View>
              <View style={styles.relativeBox}>
                <Feather
                  name="lock"
                  style={styles.inputIcon}
                  size={20}
                  color="#9CA3AF"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#6B7280"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  accessibilityLabel="Password input"
                />
              </View>

              <View style={styles.rowBetween}>
                <CustomCheckbox label="Remember me" checked={rememberMe} onChange={setRememberMe} accessibilityLabelText="Remember me checkbox" />
                <TouchableOpacity onPress={() => console.log('Forgot password pressed')} accessibilityLabel="Forgot your password button">
                  <Text style={styles.forgotText} numberOfLines={1} ellipsizeMode="tail">
                    Forgot your password?
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={handleSubmit}
                style={styles.signInButton}
                accessibilityLabel="Sign in button"
                accessibilityRole="button"
              >
                <Text style={styles.signInButtonText}>Sign in</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.centerTextMargin}>
              <Text style={styles.bottomText}>
                Don't have an account?{' '}
                <Text onPress={onSwitchToSignUp} style={styles.signUpText} accessibilityLabel="Switch to sign up button">
                  Sign up
                </Text>
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  outerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0e7ff', // blue-50
    paddingHorizontal: 16,
    paddingVertical: 32,
  },
  innerContainer: {
    width: '100%',
    maxWidth: 400,
    padding: 32,
    backgroundColor: '#fff',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  centerItems: {
    alignItems: 'center',
  },
  iconCircle: {
    padding: 12,
    backgroundColor: '#dbeafe', // blue-100
    borderRadius: 9999,
  },
  title: {
    marginTop: 16,
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827', // gray-900
  },
  subtitle: {
    marginTop: 8,
    color: '#4b5563', // gray-600
    textAlign: 'center',
  },
  formSpacing: {
    marginTop: 24,
    gap: 16,
  },
  relativeBox: {
    position: 'relative',
    marginBottom: 8,
  },
  inputIcon: {
    position: 'absolute',
    left: 12,
    top: '50%',
    marginTop: -10,
    zIndex: 10,
  },
  input: {
    borderRadius: 8,
    width: '100%',
    paddingLeft: 40,
    paddingRight: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#d1d5db', // gray-300
    color: '#111827', // gray-900
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 4,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
    flexWrap: 'wrap',
  },
  forgotText: {
    fontWeight: '500',
    color: '#2563EB', // blue-600
    fontSize: 14,
    textAlign: 'right',
  },
  signInButton: {
    width: '100%',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#2563EB', // blue-600
    alignItems: 'center',
    marginTop: 8,
  },
  signInButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  centerTextMargin: {
    marginTop: 24,
    alignItems: 'center',
  },
  bottomText: {
    fontSize: 14,
    color: '#4b5563', // gray-600
  },
  signUpText: {
    fontWeight: '500',
    color: '#2563EB', // blue-600
    textDecorationLine: 'underline',
  },
});
