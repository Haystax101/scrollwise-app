// context/AuthContext.tsx

import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
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

    // Listen for changes in authentication state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('AuthContext: Auth state changed:', event, session ? 'User logged in' : 'User logged out');
      setSession(session);
      setUser(session?.user ?? null);
    });

    // Cleanup the subscription when the component unmounts
    return () => {
      subscription.unsubscribe();
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
