// Onboarding styling constants for consistent design
export const OnboardingStyles = {
  // Spacing
  containerPaddingHorizontal: 32,
  textPaddingHorizontal: 16, // Added padding for text elements
  contentMarginBottom: 24,
  inputMarginBottom: 16,
  footerPaddingVertical: 32,
  footerPaddingHorizontal: 16,
  headerHeight: 60,
  
  // Button sizing
  buttonHeight: 48,
  buttonPaddingHorizontal: 48,
  buttonBorderRadius: 16,
  buttonMinWidth: 280, // Ensure minimum width
  
  // Typography spacing
  titleMarginBottom: 8,
  subtitleLineHeight: 24,
  
  // Input styling
  inputHeight: 56,
  inputBorderRadius: 8,
  inputPaddingHorizontal: 16,
  
  // Colors - Light Mode Theme
  backgroundColor: '#FFFBF0',        // Warm cream background
  textPrimary: '#1F2937',            // Dark grey for primary text
  textSecondary: '#6B7280',          // Medium grey for secondary text
  textTertiary: '#9CA3AF',           // Light grey for tertiary text
  accent: '#F59E0B',                 // Rich yellow accent
  accentHover: '#D97706',            // Darker yellow for hover states
  inputBackground: '#FFFFFF',         // Pure white for inputs
  cardBackground: '#FFFFFF',          // White for cards/containers
  borderColor: '#E5E7EB',            // Light grey borders
  borderColorActive: '#F59E0B',       // Yellow borders when active
  shadowColor: 'rgba(0, 0, 0, 0.1)', // Subtle shadows
} as const;