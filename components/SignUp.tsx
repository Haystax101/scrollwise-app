import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, StyleSheet, Alert } from 'react-native';
import { MaterialCommunityIcons, Feather, FontAwesome } from '@expo/vector-icons';
import type { User } from '../types';
import { CustomCheckbox } from './CustomCheckbox';
import { supabase } from '../lib/supabase';


interface SignUpProps {
  onSignUp: (user: User) => void;
  onSwitchToSignIn: () => void;
}

export const SignUp: React.FC<SignUpProps> = ({ onSignUp, onSwitchToSignIn }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Passwords don't match!");
      return;
    }
    if (!agreedToTerms) {
      Alert.alert('You must agree to the terms and privacy policy.');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        },
      });
      if (error) {
        Alert.alert(error.message);
      } else if (!data.session) {
        Alert.alert('Please check your inbox for email verification!');
        // Optionally, you can still call onSignUp here if you want to move to the next screen
      } else {
        // Signed up and session created
        onSignUp({ email, name });
      }
    } catch (e) {
      Alert.alert('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };
  
  const termsLabel = (
    <Text style={{ fontSize: 14, color: '#111827', lineHeight: 20 }}>
      I agree to the{' '}
      <Text
        onPress={() => console.log("Terms link pressed")}
        style={{ fontWeight: '500', color: '#2563EB', textDecorationLine: 'underline' }}
      >
        Terms of Service
      </Text>
      {' '}and{' '}
      <Text
        onPress={() => console.log("Privacy link pressed")}
        style={{ fontWeight: '500', color: '#2563EB', textDecorationLine: 'underline' }}
      >
        Privacy Policy
      </Text>
    </Text>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.outerContainer}>
          <View style={styles.innerContainer}>
            <View style={styles.centerItems}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="brain" size={40} color="#2563EB" />
              </View>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>
                Join ScrollWise to start learning
              </Text>
            </View>

            <View style={styles.formSpacing}>
              <View style={styles.relativeBox}>
                <FontAwesome
                  name="user"
                  style={styles.inputIcon}
                  size={20}
                  color="#9CA3AF"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Full name"
                  placeholderTextColor="#6B7280"
                  value={name}
                  onChangeText={setName}
                  accessibilityLabel="Full name input"
                />
              </View>
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
              <View style={styles.relativeBox}>
                <Feather
                  name="lock"
                  style={styles.inputIcon}
                  size={20}
                  color="#9CA3AF"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm password"
                  placeholderTextColor="#6B7280"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  accessibilityLabel="Confirm password input"
                />
              </View>

              <CustomCheckbox label={termsLabel} checked={agreedToTerms} onChange={setAgreedToTerms} required accessibilityLabelText="Agree to terms and privacy policy checkbox" />

              <TouchableOpacity
                onPress={handleSubmit}
                style={[styles.signUpButton, loading && { opacity: 0.6 }]}
                accessibilityLabel="Create account button"
                accessibilityRole="button"
                disabled={loading}
              >
                <Text style={styles.signUpButtonText}>{loading ? 'Creating...' : 'Create Account'}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.centerTextMargin}>
                <Text style={styles.bottomText}>
                Already have an account?{' '}
                <Text onPress={onSwitchToSignIn} style={styles.signInText} accessibilityLabel="Switch to sign in button">
                  Sign in
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
  signUpButton: {
    width: '100%',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#2563EB', // blue-600
    alignItems: 'center',
    marginTop: 8,
  },
  signUpButtonText: {
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
  signInText: {
    fontWeight: '500',
    color: '#2563EB', // blue-600
    textDecorationLine: 'underline',
  },
});
