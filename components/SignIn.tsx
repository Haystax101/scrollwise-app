import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, StyleSheet, Alert } from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import type { User } from '../types';
import { CustomCheckbox } from './CustomCheckbox';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';

interface SignInProps {
  onSignIn: (user: User) => void;
  onSwitchToSignUp: () => void;
}

export const SignIn: React.FC<SignInProps> = ({ onSignIn, onSwitchToSignUp }) => {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        Alert.alert(error.message);
      } else if (!data.session) {
        Alert.alert('Sign in failed.');
      } else {
        // Optionally fetch user profile here
        onSignIn({ email, name: 'Demo User' }); // Replace with actual user info if available
      }
    } catch (e) {
      Alert.alert('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const dynamicStyles = StyleSheet.create({
    outerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
      paddingHorizontal: 16,
      paddingVertical: 32,
    },
    innerContainer: {
      width: '100%',
      maxWidth: 400,
      padding: 32,
      backgroundColor: colors.card,
      borderRadius: 24,
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 4,
      borderWidth: 1,
      borderColor: colors.border,
    },
    iconCircle: {
      padding: 12,
      backgroundColor: colors.primary + '20',
      borderRadius: 9999,
    },
    title: {
      marginTop: 16,
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
    },
    subtitle: {
      marginTop: 8,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    input: {
      borderRadius: 8,
      width: '100%',
      paddingLeft: 40,
      paddingRight: 12,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      color: colors.inputText,
      fontSize: 16,
      backgroundColor: colors.inputBackground,
    },
    signInButton: {
      backgroundColor: colors.primary,
      paddingVertical: 12,
      borderRadius: 8,
      marginTop: 8,
    },
    signInButtonText: {
      color: colors.primaryText,
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
    },
    forgotText: {
      color: colors.primary,
      fontSize: 14,
    },
    bottomText: {
      textAlign: 'center',
      color: colors.textSecondary,
    },
    signUpText: {
      color: colors.primary,
      fontWeight: '600',
    },
  });

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={dynamicStyles.outerContainer}>
          <View style={dynamicStyles.innerContainer}>
            <View style={styles.centerItems}>
              <View style={dynamicStyles.iconCircle}>
                <MaterialCommunityIcons name="brain" size={40} color={colors.primary} />
              </View>
              <Text style={dynamicStyles.title}>ScrollWise</Text>
              <Text style={dynamicStyles.subtitle}>
                Feels like reels. Fuels like lectures.
              </Text>
            </View>

            <View style={styles.formSpacing}>
              <View style={styles.relativeBox}>
                <Feather
                  name="at-sign"
                  style={styles.inputIcon}
                  size={20}
                  color={colors.textTertiary}
                />
                <TextInput
                  style={dynamicStyles.input}
                  placeholder="Email address"
                  placeholderTextColor={colors.inputPlaceholder}
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
                  color={colors.textTertiary}
                />
                <TextInput
                  style={dynamicStyles.input}
                  placeholder="Password"
                  placeholderTextColor={colors.inputPlaceholder}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  accessibilityLabel="Password input"
                />
              </View>

              <View style={styles.rowBetween}>
                <CustomCheckbox label="Remember me" checked={rememberMe} onChange={setRememberMe} accessibilityLabelText="Remember me checkbox" />
                <TouchableOpacity onPress={() => {}} accessibilityLabel="Forgot your password button">
                  <Text style={dynamicStyles.forgotText} numberOfLines={1} ellipsizeMode="tail">
                    Forgot your password?
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={handleSubmit}
                style={[dynamicStyles.signInButton, loading && { opacity: 0.6 }]}
                accessibilityLabel="Sign in button"
                accessibilityRole="button"
                disabled={loading}
              >
                <Text style={dynamicStyles.signInButtonText}>{loading ? 'Signing in...' : 'Sign in'}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.centerTextMargin}>
              <Text style={dynamicStyles.bottomText}>
                Don't have an account?{' '}
                <Text onPress={onSwitchToSignUp} style={dynamicStyles.signUpText} accessibilityLabel="Switch to sign up button">
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
