import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useDirectionalNavigation } from '../context/NavigationContext';
import { feedNavigationService } from '../services/FeedNavigationService';
import { getDeviceInfo, useDeviceOrientation } from '../utils/deviceDetection';
import { useDeviceInfo } from '../utils/deviceUtils';

type ScreenName = 'home' | 'vault' | 'people' | 'profile' | 'chats' | 'saved-feed';

type HeaderProps = {
  currentScreen: ScreenName;
  navigateTo: (path: string) => void;
};

const NAV_ITEMS = [
  { name: 'Home', screenName: 'home' as ScreenName, path: '/feed', icon: (props: any) => <Feather name="home" {...props} />, accessibilityLabel: "Navigate to Home screen" },
  { name: 'Vault', screenName: 'vault' as ScreenName, path: '/vault', icon: (props: any) => <Feather name="archive" {...props} />, accessibilityLabel: "Navigate to Vault screen" },
  { name: 'People', screenName: 'people' as ScreenName, path: '/people', icon: (props: any) => <Feather name="users" {...props} />, accessibilityLabel: "Navigate to People screen" },
  { name: 'Insights', screenName: 'chats' as ScreenName, path: '/chats', icon: (props: any) => <Feather name="message-square" {...props} />, accessibilityLabel: "Navigate to Insights screen" },
  { name: 'Profile', screenName: 'profile' as ScreenName, path: '/profile', icon: (props: any) => <Feather name="user" {...props} />, accessibilityLabel: "Navigate to Profile screen" },
];

export const Header: React.FC<HeaderProps> = ({ currentScreen, navigateTo }) => {
  const { colors } = useTheme();
  const { navigateWithDirection } = useDirectionalNavigation();
  const { isTablet } = getDeviceInfo();
  const { isLandscape } = useDeviceOrientation();
  const deviceInfo = useDeviceInfo();

  const handleNavigation = (path: string, screenName: ScreenName) => {
    const isLeavingFeed = currentScreen === 'home' && screenName !== 'home';
    const isGoingToFeed = currentScreen !== 'home' && screenName === 'home';

    console.log(`🚀 Navigation: ${currentScreen} → ${screenName} (leavingFeed: ${isLeavingFeed}, goingToFeed: ${isGoingToFeed})`);

    if (isLeavingFeed) {
      // User is navigating away from feed - trigger proactive cache refresh
      feedNavigationService.onFeedTabInactive();
    } else if (isGoingToFeed) {
      // User is navigating to feed - mark as active
      feedNavigationService.onFeedTabActive();
    }

    navigateWithDirection(path);
  };

  const dynamicStyles = StyleSheet.create({
    header: {
      backgroundColor: colors.navigationBackground,
      borderTopWidth: 1,
      borderTopColor: colors.navigationBorder,
      zIndex: 50,
      position: 'absolute',
      left: isTablet && isLandscape ? '20%' : 0,
      right: isTablet && isLandscape ? '20%' : 0,
      bottom: 0,
      paddingBottom: 0,
      paddingHorizontal: isTablet ? 40 : 0,
    },
    navText: {
      fontSize: isTablet ? 14 : 12,
      marginTop: isTablet ? 6 : 4,
      marginBottom: isTablet ? 20 : (deviceInfo.isSmallScreenWithHomeButton ? 8 : 15),
      fontWeight: isTablet ? '500' : 'normal',
    },
    activeNavText: {
      color: colors.navigationActive,
    },
    inactiveNavText: {
      color: colors.navigationInactive,
    },
  });

  const responsiveNavRowStyles = {
    ...styles.navRow,
    height: isTablet ? 100 : (deviceInfo.isSmallScreenWithHomeButton ? 76 : 84),
    paddingHorizontal: isTablet ? 20 : 0,
  };

  return (
    <View style={dynamicStyles.header}>
      <View style={responsiveNavRowStyles}>
        {NAV_ITEMS.map((item) => {
          const isActive = currentScreen === item.screenName;
          const IconComponent = item.icon;
          return (
            <TouchableOpacity
              key={item.screenName}
              onPress={() => handleNavigation(item.path, item.screenName)}
              style={styles.navItem}
              accessibilityLabel={item.accessibilityLabel}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
            >
              <IconComponent
                size={isTablet ? 28 : 24}
                color={isActive ? colors.navigationActive : colors.navigationInactive}
              />
              <Text style={[
                dynamicStyles.navText,
                isActive ? dynamicStyles.activeNavText : dynamicStyles.inactiveNavText
              ]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 84,
  },
  navItem: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
});