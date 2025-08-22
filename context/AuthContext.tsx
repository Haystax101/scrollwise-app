// context/AuthContext.tsx

import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import { makeRedirectUri } from 'expo-auth-session';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';

// Define the shape of the context's value
interface AuthContextData {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
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
    };

    fetchSession();

    // Handle deep links for email verification
    const handleDeepLink = async (url: string) => {
      console.log('AuthContext: Received deep link:', url);
      
      try {
        // Parse the URL to extract tokens
        const parsedUrl = new URL(url);
        const fragment = parsedUrl.hash.substring(1); // Remove the '#'
        const params = new URLSearchParams(fragment);
        
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');
        const type = params.get('type');
        
        console.log('AuthContext: Parsed URL params:', { access_token: !!access_token, refresh_token: !!refresh_token, type });
        
        if (type === 'signup' && access_token && refresh_token) {
          console.log('AuthContext: Email verification tokens found, creating session...');
          
          // Set the session using the tokens from the email link
          const { data, error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          
          if (error) {
            console.error('AuthContext: Error creating session from email verification:', error);
            return;
          }
          
          if (data.session) {
            console.log('AuthContext: Email verification successful, user is now logged in');
            setSession(data.session);
            setUser(data.session.user);
          }
        }
      } catch (error) {
        console.error('AuthContext: Error parsing deep link URL:', error);
      }
    };

    // Listen for incoming deep links
    const handleInitialURL = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        console.log('AuthContext: Initial URL found:', initialUrl);
        handleDeepLink(initialUrl);
      }
    };

    // Handle URL when app is already running
    const subscription = Linking.addEventListener('url', ({ url }) => {
      console.log('AuthContext: App opened with URL:', url);
      handleDeepLink(url);
    });

    handleInitialURL();

    // Listen for changes in authentication state
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('AuthContext: Auth state changed:', event, session ? 'User logged in' : 'User logged out');
      setSession(session);
      setUser(session?.user ?? null);
    });

    // Cleanup the subscriptions when the component unmounts
    return () => {
      subscription?.remove();
      authSubscription.unsubscribe();
    };
  }, []);

  // Define the signOut function
  const signOut = async () => {
    console.log('AuthContext: Signing out user...');
    await supabase.auth.signOut();
    console.log('AuthContext: Sign out completed, user should be redirected to onboarding');
    // The onAuthStateChange listener will handle setting user and session to null
  };

  // The value provided to the context consumers
  // TypeScript will ensure this object matches the AuthContextData interface
  const value: AuthContextData = {
    session,
    user,
    loading,
    signOut,
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
