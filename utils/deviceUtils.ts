import { Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Device detection utilities for optimizing layouts on specific devices
 */

export interface DeviceInfo {
  isSmallScreenWithHomeButton: boolean;
  screenHeight: number;
  screenWidth: number;
  safeAreaBottom: number;
}

/**
 * Hook to detect if the current device is iPhone SE or similar small screen with home button
 * iPhone SE characteristics:
 * - Screen height: 667pt (iPhone SE 2nd/3rd gen)
 * - Has home button (safe area bottom is typically 0)
 * - Not iPhone 12/13 mini (which have notches and different safe areas)
 */
export const useDeviceInfo = (): DeviceInfo => {
  const { height, width } = Dimensions.get('window');
  const insets = useSafeAreaInsets();

  // iPhone SE dimensions (2nd and 3rd generation): 375 x 667 points
  const isIPhoneSEHeight = height === 667;
  const isIPhoneSEWidth = width === 375;

  // Home button devices typically have minimal bottom safe area (0-5pt)
  // Devices with home indicator have larger bottom safe area (20-34pt)
  const hasHomeButton = insets.bottom <= 5;

  const isSmallScreenWithHomeButton = isIPhoneSEHeight && isIPhoneSEWidth && hasHomeButton;

  return {
    isSmallScreenWithHomeButton,
    screenHeight: height,
    screenWidth: width,
    safeAreaBottom: insets.bottom,
  };
};

/**
 * Static function to check if device is iPhone SE without requiring hooks
 * Use this in components where you can't use hooks
 */
export const isSmallScreenWithHomeButton = (): boolean => {
  const { height, width } = Dimensions.get('window');

  // iPhone SE dimensions check
  const isIPhoneSEDimensions = height === 667 && width === 375;

  // Note: This static version can't check safe area insets
  // Use the hook version when possible for more accurate detection
  return isIPhoneSEDimensions;
};

/**
 * Get reduced height percentage for StaticVisual on small screens
 */
export const getStaticVisualHeightMultiplier = (deviceInfo: DeviceInfo): number => {
  return deviceInfo.isSmallScreenWithHomeButton ? 0.75 : 1.0; // 25% reduction on iPhone SE
};

/**
 * Get additional bottom padding for content that might be obscured by navigation
 */
export const getContentBottomPadding = (deviceInfo: DeviceInfo): number => {
  return deviceInfo.isSmallScreenWithHomeButton ? 12 : 0; // Extra 8pt padding on iPhone SE
};