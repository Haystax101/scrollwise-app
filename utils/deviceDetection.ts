import { useState, useEffect } from 'react';
import { Dimensions, Platform } from 'react-native';

export interface DeviceInfo {
  isTablet: boolean;
  isLandscape: boolean;
  screenWidth: number;
  screenHeight: number;
  isLargeScreen: boolean;
}

export const getDeviceInfo = (): DeviceInfo => {
  const { width, height } = Dimensions.get('window');
  const isLandscape = width > height;

  // iPad detection (iOS tablets typically 768px+ width)
  const isTablet = Platform.OS === 'ios' && Math.min(width, height) >= 768;
  const isLargeScreen = Math.min(width, height) >= 768; // For Android tablets too

  return {
    isTablet,
    isLandscape,
    screenWidth: width,
    screenHeight: height,
    isLargeScreen
  };
};

export const useDeviceOrientation = () => {
  const [deviceInfo, setDeviceInfo] = useState(getDeviceInfo());

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', () => {
      setDeviceInfo(getDeviceInfo());
    });

    return () => subscription?.remove();
  }, []);

  return deviceInfo;
};

// Responsive utility functions
export const getResponsiveSpacing = (baseSize: number) => {
  const { isTablet, isLandscape } = getDeviceInfo();

  if (isTablet && isLandscape) {
    return baseSize * 1.5; // Increase spacing on landscape tablet
  }
  if (isTablet) {
    return baseSize * 1.25; // Moderate increase on portrait tablet
  }
  return baseSize; // Default mobile spacing
};

export const getResponsiveFontSize = (baseSize: number) => {
  const { isTablet } = getDeviceInfo();
  return isTablet ? Math.max(baseSize, 16) : baseSize; // Minimum 16px on tablets
};

export const getResponsiveAnimationHeight = (screenHeight: number) => {
  // Maintain 35-45% height consistently across all devices
  const percentage = 0.4; // 40% of screen height
  const maxHeight = 400; // Cap at 400px for very large screens
  return Math.min(screenHeight * percentage, maxHeight);
};

export const getContentContainerStyle = () => {
  const { screenWidth, isTablet } = getDeviceInfo();

  if (isTablet) {
    return {
      paddingHorizontal: Math.max(24, screenWidth * 0.03),
      // Don't limit width - let content use full width as requested
    };
  }
  return {
    paddingHorizontal: 16
  };
};