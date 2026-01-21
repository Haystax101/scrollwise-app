// Onboarding styling constants for consistent design
export const OnboardingStyles = {
  // Spacing
  containerPaddingHorizontal: 24, // Reduced slightly for better mobile fit
  textPaddingHorizontal: 8,
  contentMarginBottom: 24,
  inputMarginBottom: 16,
  footerPaddingVertical: 24,
  footerPaddingHorizontal: 16,
  headerHeight: 60,

  // Button sizing
  buttonHeight: 52, // Slightly taller for better touch target
  buttonPaddingHorizontal: 32,
  buttonBorderRadius: 16,
  buttonMinWidth: '100%', // Full width by default

  // Typography spacing
  titleMarginBottom: 12,
  subtitleLineHeight: 24,

  // Input styling
  inputHeight: 56,
  inputBorderRadius: 12, // More rounded
  inputPaddingHorizontal: 16,

  // Colors - Dark Mode Theme  
  backgroundColor: '#0F172A',        // Slate 900 - Deep dark blue/black
  textPrimary: '#F8FAFC',            // Slate 50 - Almost white
  textSecondary: '#94A3B8',          // Slate 400 - Light bluish grey
  textTertiary: '#64748B',           // Slate 500
  accent: '#EAB308',                 // Golden yellow (unchanged, pops against dark)
  accentHover: '#CA8A04',            // Darker gold
  buttonTextColor: '#000000',        // Black text on gold button
  inputBackground: '#1E293B',        // Slate 800 - Lighter than background
  cardBackground: '#1E293B',         // Slate 800
  borderColor: '#334155',            // Slate 700
  borderColorActive: '#EAB308',      // Gold
  shadowColor: 'rgba(0, 0, 0, 0.4)', // Darker shadow for dark mode

  // New specific UI colors
  progressBarTrack: '#1E293B',
  progressBarFill: '#EAB308',
  success: '#22C55E',
  error: '#EF4444',
} as const;