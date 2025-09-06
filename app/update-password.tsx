import React, { useState, useEffect } from 'react';
import { View, Text, Alert, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { InputField } from '../components/onboarding/InputField';
import { Button } from '../components/onboarding/Button';
import { OnboardingScreen } from '../components/onboarding/OnboardingScreen';
import { analytics, ANALYTICS_EVENTS } from '../lib/posthog';

export default function UpdatePassword() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useTheme();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [passwordUpdated, setPasswordUpdated] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  useEffect(() => {
    console.log('UpdatePassword screen mounted');
    console.log('Route params received:', params);
    console.log('Param keys:', Object.keys(params));
    
    // Function to parse Supabase URL with fragments
    const parseSupabaseUrl = (url: string) => {
      try {
        console.log('Parsing URL:', url);
        
        // Supabase sends tokens in the fragment (after #), not query params
        let params: Record<string, any> = {};
        
        // Handle fragment-based parameters (after #)
        if (url.includes('#')) {
          const fragmentPart = url.split('#')[1];
          if (fragmentPart) {
            const fragmentParams = new URLSearchParams(fragmentPart);
            fragmentParams.forEach((value, key) => {
              params[key] = value;
            });
          }
        }
        
        // Also handle query parameters (after ?)
        if (url.includes('?')) {
          const parsed = Linking.parse(url);
          params = { ...params, ...(parsed.queryParams || {}) };
        }
        
        console.log('Parsed parameters:', params);
        return params;
      } catch (error) {
        console.error('Error parsing URL:', error);
        return {};
      }
    };

    // Listen for auth state changes to detect password recovery
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change event:', event);
      console.log('Session user ID:', session?.user?.id);
      console.log('Session access token:', session?.access_token ? `Present (${session.access_token.substring(0, 20)}...)` : 'Missing');
      console.log('Session expires at:', session?.expires_at);
      
      if (event === 'PASSWORD_RECOVERY') {
        console.log('PASSWORD_RECOVERY event detected - setting valid session');
        setIsValidSession(true);
      } else if (event === 'SIGNED_IN' && session?.user) {
        console.log('SIGNED_IN event detected during password reset flow');
        setIsValidSession(true);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        console.log('TOKEN_REFRESHED event detected - session should be valid');
        setIsValidSession(true);
      } else {
        console.log('Unhandled auth event during password reset:', event);
      }
    });

    // Handle initial URL when app opens from email link
    const handleInitialUrl = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          console.log('Initial URL found:', initialUrl);
          const parsedParams = parseSupabaseUrl(initialUrl);
          console.log('Parsed URL params:', parsedParams);
          
          // Check for errors first
          if (parsedParams.error) {
            console.log('Error found in URL:', parsedParams.error, parsedParams.error_description);
            handleUrlError(parsedParams.error as string, parsedParams.error_description as string);
            return;
          }
          
          // Check for password recovery tokens
          if (parsedParams.access_token && parsedParams.refresh_token && parsedParams.type === 'recovery') {
            console.log('Found recovery tokens in initial URL');
            await setSessionFromTokens(parsedParams.access_token as string, parsedParams.refresh_token as string);
            return;
          }
        }
      } catch (error) {
        console.error('Error handling initial URL:', error);
      }
    };

    // Listen for URL events (when app is already running)
    const linkingSubscription = Linking.addEventListener('url', async (event) => {
      console.log('Linking URL event:', event.url);
      const parsedParams = parseSupabaseUrl(event.url);
      console.log('Parsed linking params:', parsedParams);
      
      // Check for errors first
      if (parsedParams.error) {
        console.log('Error found in linking URL:', parsedParams.error, parsedParams.error_description);
        handleUrlError(parsedParams.error as string, parsedParams.error_description as string);
        return;
      }
      
      // Check for password recovery tokens  
      if (parsedParams.access_token && parsedParams.refresh_token && parsedParams.type === 'recovery') {
        console.log('Found recovery tokens in linking URL');
        await setSessionFromTokens(parsedParams.access_token as string, parsedParams.refresh_token as string);
      }
    });

    // Handle URL errors (expired links, access denied, etc.)
    const handleUrlError = (error: string, errorDescription: string) => {
      let userMessage = 'An error occurred with the password reset link.';
      
      if (error === 'access_denied') {
        if (errorDescription?.includes('expired')) {
          userMessage = 'This password reset link has expired. Please request a new one.';
        } else {
          userMessage = 'Access was denied. Please request a new password reset link.';
        }
      }
      
      setLinkError(userMessage);
    };

    // Handle URL parameters from expo-router params (fallback)
    const handleRouterParams = async () => {
      console.log('Checking router params for auth tokens...');
      console.log('Available params:', Object.keys(params));
      
      const accessToken = params.access_token || params.token;
      const refreshToken = params.refresh_token;
      const tokenType = params.type;
      
      if (accessToken && refreshToken && tokenType === 'recovery') {
        console.log('Found recovery tokens in router params');
        await setSessionFromTokens(accessToken as string, refreshToken as string);
      } else {
        console.log('No valid recovery tokens found in router params');
        console.log('Access token:', accessToken ? 'Present' : 'Missing');
        console.log('Refresh token:', refreshToken ? 'Present' : 'Missing');
        console.log('Token type:', tokenType);
      }
    };

    // Function to set session from tokens
    const setSessionFromTokens = async (accessToken: string, refreshToken: string) => {
      console.log('Setting session with tokens...');
      console.log('Access token length:', accessToken.length);
      console.log('Refresh token length:', refreshToken.length);
      
      try {
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });
        
        if (error) {
          console.error('Error setting session from tokens:', error);
          console.error('Error details:', error.message);
          
          // Handle specific error cases
          if (error.message.includes('expired') || error.message.includes('invalid')) {
            setLinkError('This password reset link has expired or is invalid. Please request a new one.');
          }
        } else if (data.session) {
          console.log('Successfully set session from tokens');
          console.log('Session user ID:', data.session.user?.id);
          console.log('Session expires at:', data.session.expires_at);
          
          // Wait a moment for auth state to propagate
          setTimeout(() => {
            setIsValidSession(true);
          }, 100);
        } else {
          console.error('No session returned from setSession');
        }
      } catch (error) {
        console.error('Exception setting session from tokens:', error);
      }
    };

    // Check if user is already in a session
    const checkExistingSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Existing session check:', session?.user ? 'User found' : 'No user');
      if (session?.user) {
        setIsValidSession(true);
      }
    };

    // Alternative approach: Use Supabase's exchangeCodeForSession for password recovery
    const handleCodeExchange = async () => {
      try {
        console.log('Attempting to exchange code for session...');
        
        // Check if we have an auth code in the URL
        const code = params.code as string;
        if (code) {
          console.log('Found auth code, exchanging for session...');
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          
          if (error) {
            console.error('Error exchanging code for session:', error);
          } else if (data.session) {
            console.log('Successfully exchanged code for session');
            setIsValidSession(true);
            return true;
          }
        }
        return false;
      } catch (error) {
        console.error('Exception during code exchange:', error);
        return false;
      }
    };

    // Execute all checks
    const initializeAuth = async () => {
      // First try the new code exchange method
      const codeExchangeSuccess = await handleCodeExchange();
      
      if (!codeExchangeSuccess) {
        // Fall back to the original token-based approach
        await handleInitialUrl();
        await handleRouterParams();
        await checkExistingSession();
      }
    };

    initializeAuth();

    // Set a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.log('Session verification timed out after 10 seconds');
      setSessionTimeout(true);
    }, 10000);

    // Cleanup
    return () => {
      authListener.subscription.unsubscribe();
      linkingSubscription?.remove();
      clearTimeout(timeout);
    };
  }, []);

  // Enhanced password validation (same as onboarding)
  const hasMinLength = password.length >= 8;
  const hasCapitalLetter = /[A-Z]/.test(password);
  const hasPunctuation = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const isValidPassword = hasMinLength && hasCapitalLetter && hasPunctuation;

  const handleUpdatePassword = async () => {
    if (!isValidPassword) {
      Alert.alert(
        'Invalid Password', 
        'Password must be at least 8 characters and include at least one capital letter and one punctuation mark.'
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Passwords Don\'t Match', 'Please make sure both password fields match.');
      return;
    }

    // Validate session before attempting update
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      console.error('No valid session found for password update');
      Alert.alert(
        'Session Expired',
        'Your password reset session has expired. Please request a new reset link.'
      );
      router.replace('/reset-password-request');
      return;
    }

    setIsLoading(true);

    try {
      console.log('Attempting to update password for user:', session.user.id);
      
      const { data, error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        console.error('Error updating password:', error);
        
        // Handle specific error cases
        if (error.message.includes('session')) {
          Alert.alert(
            'Session Expired',
            'Your password reset session has expired. Please request a new reset link.'
          );
          router.replace('/reset-password-request');
        } else {
          Alert.alert(
            'Update Failed',
            error.message || 'Failed to update password. Please try again.'
          );
        }
      } else {
        console.log('Password updated successfully:', data);
        
        // Track successful password reset completion
        analytics.track(ANALYTICS_EVENTS.PASSWORD_RESET_COMPLETED, {
          user_id: session.user.id,
          timestamp: new Date().toISOString()
        });
        
        setPasswordUpdated(true);
      }
    } catch (error) {
      console.error('Exception updating password:', error);
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

  // Show error state for link issues (expired, invalid, etc.)
  if (linkError) {
    return (
      <OnboardingScreen
        icon={null}
        title="Link Error"
        description={linkError}
        currentStep={0}
        totalSteps={1}
        onNext={() => router.push('/reset-password-request')}
        onBack={() => router.push('/onboarding')}
        hideStepCounter={true}
        hideProgressDots={true}
        showBackButton={true}
        buttonText="Request New Link"
        customContent={
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Password reset links expire after a few minutes for security. Click below to request a fresh link.
            </Text>
          </View>
        }
      />
    );
  }

  // Show loading state while waiting for auth state
  if (!isValidSession && !passwordUpdated && !sessionTimeout && !linkError) {
    return (
      <OnboardingScreen
        icon={null}
        title="Verifying Session"
        description="Please wait while we verify your password reset session..."
        currentStep={0}
        totalSteps={1}
        onNext={() => {}}
        onBack={handleBackToLogin}
        hideStepCounter={true}
        hideProgressDots={true}
        showBackButton={true}
        buttonText="Loading..."
        buttonDisabled={true}
        customContent={
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              If this page doesn't load properly, please try clicking the password reset link in your email again.
            </Text>
          </View>
        }
      />
    );
  }

  // Show error state if session verification failed
  if (sessionTimeout && !isValidSession && !passwordUpdated && !linkError) {
    return (
      <OnboardingScreen
        icon={null}
        title="Session Expired"
        description="The password reset session has expired or is invalid. Please request a new password reset link."
        currentStep={0}
        totalSteps={1}
        onNext={() => router.push('/reset-password-request')}
        onBack={handleBackToLogin}
        hideStepCounter={true}
        hideProgressDots={true}
        showBackButton={true}
        buttonText="Request New Link"
        customContent={
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              The link you used may have expired or been used already. Click below to request a new password reset link.
            </Text>
          </View>
        }
      />
    );
  }

  // Show success screen after password update
  if (passwordUpdated) {
    return (
      <OnboardingScreen
        icon={null}
        title="Password Updated"
        description="Your password has been successfully updated. You can now sign in with your new password."
        currentStep={0}
        totalSteps={1}
        onNext={handleBackToLogin}
        onBack={handleBackToLogin}
        hideStepCounter={true}
        hideProgressDots={true}
        showBackButton={false}
        buttonText="Continue to Login"
        customContent={
          <View style={styles.iconContainer}>
            <View style={[styles.successIcon, { backgroundColor: colors.primary }]}>
              <Text style={styles.successIconText}>✅</Text>
            </View>
          </View>
        }
      />
    );
  }

  // Show password update form
  return (
    <OnboardingScreen
      icon={null}
      title="Update Your Password"
      description="Enter your new password below."
      currentStep={0}
      totalSteps={1}
      onNext={handleUpdatePassword}
      onBack={handleBackToLogin}
      hideStepCounter={true}
      hideProgressDots={true}
      showBackButton={true}
      buttonText={isLoading ? "Updating..." : "Update Password"}
      buttonDisabled={isLoading || !isValidPassword || !confirmPassword || password !== confirmPassword}
      customContent={
        <View style={{ width: '100%', paddingHorizontal: 24 }}>
          <InputField
            label="New Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          
          {password.length > 0 && (
            <View style={styles.validationContainer}>
              {!hasMinLength && (
                <Text style={styles.validationText}>• Password must be at least 8 characters</Text>
              )}
              {!hasCapitalLetter && (
                <Text style={styles.validationText}>• Password must include at least one capital letter</Text>
              )}
              {!hasPunctuation && (
                <Text style={styles.validationText}>• Password must include at least one punctuation mark</Text>
              )}
            </View>
          )}

          <View style={{ marginTop: 16 }} />
          <InputField
            label="Confirm New Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
          
          {confirmPassword.length > 0 && password !== confirmPassword && (
            <View style={styles.validationContainer}>
              <Text style={styles.validationText}>• Passwords must match</Text>
            </View>
          )}
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 32,
    paddingHorizontal: 24,
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
  },
  iconContainer: {
    alignItems: 'center',
    marginVertical: 32,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successIconText: {
    fontSize: 32,
  },
  validationContainer: {
    marginTop: 12,
    marginBottom: 8,
  },
  validationText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20,
  },
});