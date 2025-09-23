import { Dimensions, Platform } from 'react-native';
import { useMemo } from 'react';

const { width, height } = Dimensions.get('window');

// Screen size detection
export const isSmallScreen = width <= 375 && height <= 667; // iPhone SE and similar
export const isMediumScreen = width > 375 && width <= 414;
export const isLargeScreen = width > 414;

/**
 * Get responsive value based on screen size
 */
export const getResponsiveValue = (small: number, medium: number, large: number): number => {
  if (isSmallScreen) return small;
  if (isMediumScreen) return medium;
  return large;
};

/**
 * Scale font size based on screen width with a maximum scale factor
 */
export const getScaledFontSize = (baseFontSize: number): number => {
  const screenWidth = Dimensions.get('window').width;
  const baseWidth = 375; // iPhone SE width as baseline
  const scaleFactor = Math.min(screenWidth / baseWidth, 1.2); // Cap at 120%
  return Math.round(baseFontSize * scaleFactor);
};

/**
 * Responsive font sizes for consistent typography
 */
export const FONT_SIZES = {
  title: getScaledFontSize(20),
  content: getScaledFontSize(16),
  metadata: getScaledFontSize(12),
  action: getScaledFontSize(14),
  author: getScaledFontSize(12),
};

/**
 * Fixed height for bottom content section to ensure consistency
 */
const BOTTOM_SECTION_HEIGHT = {
  small: 280,   // iPhone SE - minimal but functional
  medium: 320,  // Standard iPhones
  large: 360    // Plus/Max iPhones
};

export const getBottomSectionHeight = (): number => {
  return getResponsiveValue(
    BOTTOM_SECTION_HEIGHT.small,
    BOTTOM_SECTION_HEIGHT.medium,
    BOTTOM_SECTION_HEIGHT.large
  );
};

/**
 * Get visual section height - only reduce on small screens, keep existing layout otherwise
 */
export const getVisualHeight = (): number => {
  const { width, height: screenHeight } = Dimensions.get('window');

  // iPad detection (iOS tablets typically 768px+ width AND iOS platform)
  const isTablet = Platform.OS === 'ios' && Math.min(width, screenHeight) >= 768;

  if (isTablet) return screenHeight * 0.55; // 55% for iPad
  if (isSmallScreen) return screenHeight * 0.38; // Reduced from 0.45 to 0.38 for small screens
  return screenHeight * 0.45; // Keep original 45% for medium/large screens
};

/**
 * Get total item height for feed layout calculations - use full screen height
 */
export const getTotalItemHeight = (): number => {
  const screenHeight = Dimensions.get('window').height;
  return screenHeight; // Always use full screen height for feed items
};

/**
 * Responsive padding values
 */
export const RESPONSIVE_PADDING = {
  horizontal: getResponsiveValue(12, 16, 20),
  vertical: getResponsiveValue(8, 12, 16),
  small: getResponsiveValue(4, 6, 8),
  medium: getResponsiveValue(8, 12, 16),
  large: getResponsiveValue(16, 20, 24),
};

/**
 * Content layout structure for consistent sizing
 */
export const CONTENT_LAYOUT = {
  metadata: { height: 40 },        // Site, industry, date info
  title: { minHeight: 50, maxHeight: 80 },  // 2-3 lines max
  author: { height: 25 },          // When present
  content: { minHeight: 100 },     // Main text content
  actions: { height: 50 },         // Like, save, comment buttons
  padding: { vertical: 16, horizontal: RESPONSIVE_PADDING.horizontal }
};

/**
 * Hook for responsive layout calculations with memoization
 */
export const useResponsiveLayout = () => {
  return useMemo(() => ({
    visualHeight: getVisualHeight(),
    totalHeight: getTotalItemHeight(),
    isSmallScreen,
    isMediumScreen,
    isLargeScreen,
    fontSizes: FONT_SIZES,
    padding: RESPONSIVE_PADDING,
    contentLayout: CONTENT_LAYOUT
  }), []);
};

/**
 * Get responsive bottom padding for content sections
 */
export const getResponsiveBottomPadding = (safeAreaBottom: number): number => {
  const basePadding = getResponsiveValue(40, 50, 60);
  return safeAreaBottom + basePadding;
};