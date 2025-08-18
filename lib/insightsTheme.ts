// Extended theme utilities for the new insights publishing flow
import { useTheme } from '../context/ThemeContext';

export const useInsightsTheme = () => {
  const { colors, isDark } = useTheme();

  // Extended colors for insights UI based on the guide
  const insightsColors = {
    ...colors,
    // Black/White base colors from guide
    black: '#000000',
    white: '#FFFFFF',
    
    // Gray scale from guide
    gray: {
      900: isDark ? '#1F2937' : '#1F2937',
      800: isDark ? '#374151' : '#374151', 
      700: isDark ? '#4B5563' : '#4B5563',
      400: isDark ? '#9CA3AF' : '#9CA3AF',
      300: isDark ? '#D1D5DB' : '#D1D5DB',
    },
    
    // Yellow accent from guide
    yellow: {
      400: '#FBBF24', // Main yellow from guide
    },
    
    // Overrides for insights-specific usage
    insightsBackground: isDark ? '#000000' : '#FFFFFF',
    insightsCard: isDark ? '#1F2937' : '#FFFFFF',
    insightsInput: isDark ? '#1F2937' : '#F3F4F6',
    insightsBorder: isDark ? '#374151' : '#E5E7EB',
    insightsTextPrimary: isDark ? '#FFFFFF' : '#1F2937',
    insightsTextSecondary: isDark ? '#9CA3AF' : '#6B7280',
    insightsAccent: '#FBBF24',
    insightsAccentText: '#000000',
  };

  const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  };

  const borderRadius = {
    sm: 4,
    md: 8,
    lg: 12,
    full: 9999,
  };

  return {
    colors: insightsColors,
    spacing,
    borderRadius,
    isDark,
  };
};

export const insightsTheme = {
  colors: {
    black: '#000000',
    white: '#FFFFFF',
    gray: {
      900: '#1F2937',
      800: '#374151',
      700: '#4B5563',
      400: '#9CA3AF',
      300: '#D1D5DB',
    },
    yellow: {
      400: '#FBBF24',
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    full: 9999,
  },
};