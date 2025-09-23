// context/AuthContext.tsx

import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import { makeRedirectUri } from 'expo-auth-session';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { analytics, ANALYTICS_EVENTS } from '../lib/posthog';
import { ContentPreloader } from '../lib/ContentPreloader';

// Define the shape of the context's value
interface AuthContextData {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  signInWithOtp: (email: string) => Promise<boolean>;
  verifyOtp: (email: string, token: string) => Promise<boolean>;
}

// Create the context with a default undefined value
// Using undefined is a common practice to ensure the provider is used
const AuthContext = createContext<AuthContextData | undefined>(undefined);

// Define the props for the AuthProvider component
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * The AuthProvider component wraps the application and provides the auth context.
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Use TypeScript generics to type the state variables
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchSession = async () => {
      // The `data.session` is typed correctly by the Supabase client
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Error fetching session:", error.message);
        setLoading(false);
        return;
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Start content preloading if user is already signed in
      if (session?.user) {
        startContentPreloading(session.user.id);
      }
    };

    fetchSession();

    // Listen for changes in authentication state
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('AuthContext: Auth state changed:', event, session ? 'User logged in' : 'User logged out');
      setSession(session);
      setUser(session?.user ?? null);

      // Track authentication events with PostHog
      if (event === 'SIGNED_IN' && session?.user) {
        // Identify the user with PostHog
        analytics.identify(session.user.id, {
          email: session.user.email,
          created_at: session.user.created_at,
          app_metadata: session.user.app_metadata,
          user_metadata: session.user.user_metadata
        });

        // Track sign in event
        analytics.track(ANALYTICS_EVENTS.USER_SIGNED_IN, {
          user_id: session.user.id,
          email: session.user.email,
          sign_in_method: session.user.app_metadata?.provider || 'email',
          timestamp: new Date().toISOString()
        });

        // Start content preloading for signed-in users
        startContentPreloading(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        // Track sign out event
        analytics.track(ANALYTICS_EVENTS.USER_SIGNED_OUT, {
          timestamp: new Date().toISOString()
        });
        
        // Reset PostHog user data
        analytics.reset();
      } else if (event === 'PASSWORD_RECOVERY') {
        // Track password reset
        analytics.track(ANALYTICS_EVENTS.PASSWORD_RESET_REQUESTED, {
          timestamp: new Date().toISOString()
        });
      }
    });

    // Cleanup the subscriptions when the component unmounts
    return () => {
      authSubscription.unsubscribe();
    };
  }, []);

  // Start content preloading for authenticated users
  const startContentPreloading = async (userId: string) => {
    try {
      // Get user's industries for targeted content preloading
      const { data: userIndustries } = await supabase
        .from('user_industries')
        .select('industry_id')
        .eq('user_id', userId);

      const industryIds = userIndustries?.map(ui => ui.industry_id) || [];
      
      // Start preloading in background
      const preloader = ContentPreloader.getInstance();
      preloader.startPreloading(industryIds);
      
      console.log('🚀 Content preloading started for user industries:', industryIds);
    } catch (error) {
      console.error('❌ Failed to start content preloading:', error);
    }
  };

  // Define the signOut function
  const signOut = async () => {
    console.log('AuthContext: Signing out user...');

    // Track sign out initiation
    analytics.track(ANALYTICS_EVENTS.USER_SIGNED_OUT, {
      timestamp: new Date().toISOString(),
      initiated_by: 'user_action'
    });

    await supabase.auth.signOut();
    console.log('AuthContext: Sign out completed, user should be redirected to onboarding');

    // Reset PostHog user data
    analytics.reset();

    // The onAuthStateChange listener will handle setting user and session to null
  };

  // Define the deleteAccount function
  const deleteAccount = async () => {
    console.log('AuthContext: Deleting user account...');

    if (!user) {
      throw new Error('No user to delete');
    }

    // Track account deletion
    analytics.track('account_deleted', {
      user_id: user.id,
      timestamp: new Date().toISOString()
    });

    // Call the delete account edge function
    const { error } = await supabase.functions.invoke('delete-account', {
      headers: {
        Authorization: `Bearer ${session?.access_token}`,
      },
    });

    if (error) {
      console.error('Error deleting account:', error);
      throw error;
    }

    console.log('AuthContext: Account deletion completed');

    // Reset PostHog user data
    analytics.reset();

    // Explicitly sign out to ensure user is logged out and redirected to onboarding
    // This is necessary because the user account has been deleted from auth,
    // so the normal auth state change might not trigger properly
    console.log('AuthContext: Signing out after account deletion...');
    await supabase.auth.signOut();

    // Clear local state immediately to prevent any race conditions
    setSession(null);
    setUser(null);

    console.log('AuthContext: User signed out after account deletion, should redirect to onboarding');
  };

  const signInWithOtp = async (email: string): Promise<boolean> => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true, // Allow user creation for signup flow, or resend for existing users
      },
    });
    if (error) {
      console.error('Error sending OTP:', error);
      return false;
    }
    return true;
  };

  const verifyOtp = async (email: string, token: string): Promise<boolean> => {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });
    if (error) {
      console.error('Error verifying OTP:', error);
      return false;
    }
    if (data.session) {
      setSession(data.session);
      setUser(data.session.user);
      return true;
    }
    return false;
  };

  // The value provided to the context consumers
  // TypeScript will ensure this object matches the AuthContextData interface
  const value: AuthContextData = {
    session,
    user,
    loading,
    signOut,
    deleteAccount,
    signInWithOtp,
    verifyOtp,
  };

  // We only render the children once the initial loading is complete
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to use the AuthContext.
 * This provides a convenient way to access auth state and functions.
 */
export const useAuth = (): AuthContextData => {
  const context = useContext(AuthContext);

  // This check ensures that the hook is used within a component
  // that is a descendant of the AuthProvider.
  if (context === undefined) {
    console.trace('useAuth called outside of AuthProvider');
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Helper for Google Sign-In
// This can be expanded for other OAuth providers
const redirectUri = makeRedirectUri({
  scheme: 'your-app-scheme', // Make sure this is configured in your app.json
  path: 'auth/callback', // A path that your app can handle
});

// Example of how you might initiate Google Sign-In
// This function would be called from a button press in your UI
export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUri,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) {
    console.error('Error with Google Sign-In:', error.message);
  }
  
  return { data, error };
};