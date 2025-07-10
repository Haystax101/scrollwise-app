import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

export type ThemeMode = 'light' | 'dark' | 'system';
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
  accent: string;
  
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
}

const lightTheme: ThemeColors = {
  background: '#F9FAFB',
  surface: '#FFFFFF',
  card: '#FFFFFF', 
  overlay: 'rgba(0,0,0,0.1)',
  
  text: '#111827',
  textSecondary: '#4B5563',
  textTertiary: '#6B7280',
  
  border: '#E5E7EB',
  separator: '#F3F4F6',
  
  primary: '#2563EB',
  primaryText: '#FFFFFF',
  accent: '#3B82F6',
  
  statusBarStyle: 'dark-content',
  statusBarBackground: '#F9FAFB',
  
  navigationBackground: '#FFFFFF',
  navigationBorder: '#E5E7EB',
  navigationActive: '#2563EB',
  navigationInactive: '#6B7280',
  
  inputBackground: '#F3F4F6',
  inputBorder: '#E5E7EB',
  inputText: '#111827',
  inputPlaceholder: '#9CA3AF',
};

const darkTheme: ThemeColors = {
  background: '#000000',
  surface: '#111111',
  card: '#1a1a1a',
  overlay: 'rgba(0,0,0,0.6)',
  
  text: '#FFFFFF',
  textSecondary: '#E5E5E5',
  textTertiary: '#B3B3B3',
  
  border: '#333333',
  separator: '#222222',
  
  primary: '#60A5FA',
  primaryText: '#FFFFFF',
  accent: '#818CF8',
  
  statusBarStyle: 'light-content',
  statusBarBackground: '#000000',
  
  navigationBackground: '#111111',
  navigationBorder: '#333333',
  navigationActive: '#FFFFFF',
  navigationInactive: '#888888',
  
  inputBackground: '#1a1a1a',
  inputBorder: '#404040',
  inputText: '#FFFFFF',
  inputPlaceholder: '#888888',
};

interface ThemeContextType {
  themeMode: ThemeMode;
  activeTheme: ActiveTheme;
  colors: ThemeColors;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [systemTheme, setSystemTheme] = useState<ColorSchemeName>(Appearance.getColorScheme());

  // Determine active theme based on mode and system preference
  const activeTheme: ActiveTheme = 
    themeMode === 'system' 
      ? (systemTheme === 'dark' ? 'dark' : 'light')
      : themeMode === 'dark' 
      ? 'dark' 
      : 'light';

  const isDark = activeTheme === 'dark';
  const colors = isDark ? darkTheme : lightTheme;

  // Load theme preference from Supabase when user is available
  useEffect(() => {
    const loadThemePreference = async () => {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('theme_preference')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error loading theme preference:', error);
          return;
        }

        if (data?.theme_preference) {
          setThemeModeState(data.theme_preference as ThemeMode);
        }
      } catch (error) {
        console.error('Exception loading theme preference:', error);
      }
    };

    loadThemePreference();
  }, [user?.id]);

  // Listen to system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemTheme(colorScheme);
    });

    return () => subscription?.remove();
  }, []);

  // Save theme preference to Supabase
  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);

    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ theme_preference: mode })
        .eq('id', user.id);

      if (error) {
        console.error('Error saving theme preference:', error);
      }
    } catch (error) {
      console.error('Exception saving theme preference:', error);
    }
  };

  const value: ThemeContextType = {
    themeMode,
    activeTheme,
    colors,
    isDark,
    setThemeMode,
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