import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

export type ThemeMode = 'light' | 'dark';
export type ActiveTheme = 'light' | 'dark';

export interface ThemeColors {
  // Backgrounds
  background: string;
  surface: string;
  card: string;
  overlay: string;

  // Text
  text: string;
  textSecondary: string;
  textTertiary: string;

  // Borders & Separators
  border: string;
  separator: string;

  // Interactive elements
  primary: string;
  primaryText: string;
  readButtonText: string;
  accent: string;
  likeColor: string;
  error: string;

  // Book cover text colors
  bookTitle: string;
  bookMeta: string;
  bookSummary: string;
  bookSwipeHint: string;

  // Status bar
  statusBarStyle: 'light-content' | 'dark-content';
  statusBarBackground: string;

  // Navigation
  navigationBackground: string;
  navigationBorder: string;
  navigationActive: string;
  navigationInactive: string;

  // Input fields
  inputBackground: string;
  inputBorder: string;
  inputText: string;
  inputPlaceholder: string;

  // Design System 2.0
  gold: string;
  glassBorder: string;
  glassBg: string;
  glassBgStrong: string;
}

const lightTheme: ThemeColors = {
  background: '#F9FAFB',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  overlay: 'rgba(0,0,0,0.1)',

  text: '#1F2937',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',

  border: '#E5E7EB',
  separator: '#F3F4F6',

  primary: '#EAB308',
  primaryText: '#000000',
  readButtonText: '#000000',
  accent: '#EAB308',
  likeColor: '#EF4444',
  error: '#EF4444',

  bookTitle: '#FFFFFF',
  bookMeta: 'rgba(255,255,255,0.9)',
  bookSummary: 'rgba(255,255,255,0.9)',
  bookSwipeHint: 'rgba(255,255,255,0.8)',

  statusBarStyle: 'dark-content',
  statusBarBackground: '#F9FAFB',

  navigationBackground: '#FFFFFF',
  navigationBorder: '#E5E7EB',
  navigationActive: '#EAB308',
  navigationInactive: '#6B7280',

  inputBackground: '#F3F4F6',
  inputBorder: '#E5E7EB',
  inputText: '#1F2937',
  inputPlaceholder: '#9CA3AF',

  gold: '#FFD700', // Standard gold
  glassBorder: 'rgba(0, 0, 0, 0.1)',
  glassBg: 'rgba(255, 255, 255, 0.6)',
  glassBgStrong: 'rgba(255, 255, 255, 0.8)',
};

const darkTheme: ThemeColors = {
  background: '#0A0B1E',
  surface: '#1A1B2E',
  card: '#1A1B2E',
  overlay: 'rgba(0, 0, 0, 0.5)',

  text: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textTertiary: '#71717A',

  border: '#2D2D3A',
  separator: '#2D2D3A',

  primary: '#EAB308',
  primaryText: '#000000',
  readButtonText: '#000000',
  accent: '#EAB308',
  likeColor: '#EF4444',
  error: '#EF4444',

  bookTitle: '#FFFFFF',
  bookMeta: 'rgba(255,255,255,0.9)',
  bookSummary: 'rgba(255,255,255,0.9)',
  bookSwipeHint: 'rgba(255,255,255,0.8)',

  statusBarStyle: 'light-content',
  statusBarBackground: '#0A0B1E',

  navigationBackground: '#0A0B1E',
  navigationBorder: '#2D2D3A',
  navigationActive: '#EAB308',
  navigationInactive: '#71717A',

  inputBackground: '#1A1B2E',
  inputBorder: '#2D2D3A',
  inputText: '#FFFFFF',
  inputPlaceholder: '#71717A',

  gold: '#FDB202', // Design spec gold
  glassBorder: 'rgba(255, 255, 255, 0.1)',
  glassBg: 'rgba(255, 255, 255, 0.05)',
  glassBgStrong: 'rgba(255, 255, 255, 0.08)',
};

interface ThemeContextType {
  themeMode: ThemeMode;
  activeTheme: ActiveTheme;
  colors: ThemeColors;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  getCardTextColor: () => string;
  getCardSecondaryTextColor: () => string;
  getCardTertiaryTextColor: () => string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('dark');

  // Force dark theme
  const activeTheme: ActiveTheme = 'dark';

  const isDark = true;
  const colors = darkTheme;

  // Helper function to get appropriate text color for cards
  const getCardTextColor = (): string => {
    return '#FFFFFF';
  };

  // Helper function to get secondary text color for cards
  const getCardSecondaryTextColor = (): string => {
    return 'rgba(255, 255, 255, 0.7)';
  };

  // Helper function to get tertiary text color for cards
  const getCardTertiaryTextColor = (): string => {
    return 'rgba(255, 255, 255, 0.6)';
  };

  // Load theme preference from Supabase when user is available
  useEffect(() => {
    const loadThemePreference = async () => {
      if (!user?.id) return;

      // Always force state to dark
      setThemeModeState('dark');

      try {
        // Check DB to ensure it's also set to dark (for consistency across devices/sessions)
        const { data, error } = await supabase
          .from('profiles')
          .select('theme_preference')
          .eq('id', user.id)
          .single();

        if (data?.theme_preference !== 'dark') {
          console.log('ThemeContext: Enforcing dark mode in database...');
          await supabase
            .from('profiles')
            .update({ theme_preference: 'dark' })
            .eq('id', user.id);
        }
      } catch (error) {
        console.warn('ThemeContext: Error enforcing dark mode:', error);
      }
    };

    loadThemePreference();
  }, [user?.id]);


  // Save theme preference to Supabase
  const setThemeMode = async (mode: ThemeMode) => {
    console.log('ThemeContext: setThemeMode called with mode:', mode);
    console.log('ThemeContext: Current themeMode state before change:', themeMode);
    console.log('ThemeContext: User ID:', user?.id);

    setThemeModeState(mode);
    console.log('ThemeContext: Updated local theme state to:', mode);

    if (!user?.id) {
      console.log('ThemeContext: No user ID available, skipping database save');
      return;
    }

    try {
      // First, verify the profile exists and we can read it
      console.log('ThemeContext: Checking if profile exists and is readable...');
      const { data: existingProfile, error: readError } = await supabase
        .from('profiles')
        .select('id, theme_preference')
        .eq('id', user.id)
        .single();

      if (readError) {
        console.error('ThemeContext: Cannot read profile:', readError);
        return;
      }

      console.log('ThemeContext: Profile exists, current theme_preference:', existingProfile?.theme_preference);
      console.log('ThemeContext: Profile ID in database:', existingProfile?.id);
      console.log('ThemeContext: User ID we are updating:', user.id);
      console.log('ThemeContext: IDs match:', existingProfile?.id === user.id);

      console.log('ThemeContext: Saving theme preference to database...');
      const { data, error, count } = await supabase
        .from('profiles')
        .update({ theme_preference: mode })
        .eq('id', user.id);

      console.log('ThemeContext: Update response - data:', data);
      console.log('ThemeContext: Update response - count:', count);
      console.log('ThemeContext: Update response - error:', error);

      if (error) {
        console.error('ThemeContext: Error saving theme preference:', error);
        console.error('ThemeContext: Error details:', JSON.stringify(error));
        console.error('ThemeContext: Error code:', error.code);
        console.error('ThemeContext: Error message:', error.message);
      } else {
        console.log('ThemeContext: Update query executed without error');

        // Check if any rows were actually affected
        if (count === 0) {
          console.error('ThemeContext:  No rows were updated! This suggests RLS policy or constraint issue');
        }

        // Verify the update by immediately reading back the value
        console.log('ThemeContext: Verifying update by reading back value...');
        const { data: verifyData, error: verifyError } = await supabase
          .from('profiles')
          .select('theme_preference')
          .eq('id', user.id)
          .single();

        if (verifyError) {
          console.error('ThemeContext: Error verifying theme preference update:', verifyError);
        } else {
          console.log('ThemeContext: Verification read - theme_preference is now:', verifyData?.theme_preference);
          if (verifyData?.theme_preference === mode) {
            console.log('ThemeContext:  Update verified successfully!');
          } else {
            console.error('ThemeContext:  Update verification failed! Expected:', mode, 'Got:', verifyData?.theme_preference);
            console.error('ThemeContext: This suggests a database constraint or RLS policy is blocking the update');
          }
        }
      }
    } catch (error) {
      console.error('ThemeContext: Exception saving theme preference:', error);
      console.error('ThemeContext: Exception details:', JSON.stringify(error));
    }
  };

  const value: ThemeContextType = {
    themeMode,
    activeTheme,
    colors,
    isDark,
    setThemeMode,
    getCardTextColor,
    getCardSecondaryTextColor,
    getCardTertiaryTextColor,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 