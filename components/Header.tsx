import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useDirectionalNavigation } from '../context/NavigationContext';

type ScreenName = 'home' | 'discover' | 'profile' | 'chats' | 'saved-feed';

type HeaderProps = {
  currentScreen: ScreenName;
  navigateTo: (path: string) => void;
};

const NAV_ITEMS = [
  { name: 'Home', screenName: 'home' as ScreenName, path: '/feed', icon: (props: any) => <Feather name="home" {...props} />, accessibilityLabel: "Navigate to Home screen" },
  { name: 'Discover', screenName: 'discover' as ScreenName, path: '/discover', icon: (props: any) => <Feather name="search" {...props} />, accessibilityLabel: "Navigate to Discover screen" },
  { name: 'Insights', screenName: 'chats' as ScreenName, path: '/chats', icon: (props: any) => <Feather name="message-square" {...props} />, accessibilityLabel: "Navigate to Insights screen" },
  { name: 'Profile', screenName: 'profile' as ScreenName, path: '/profile', icon: (props: any) => <Feather name="user" {...props} />, accessibilityLabel: "Navigate to Profile screen" },
];

export const Header: React.FC<HeaderProps> = ({ currentScreen, navigateTo }) => {
  const { colors } = useTheme();
  const { navigateWithDirection } = useDirectionalNavigation();

  const dynamicStyles = StyleSheet.create({
    header: {
      backgroundColor: colors.navigationBackground,
      borderTopWidth: 1,
      borderTopColor: colors.navigationBorder,
      zIndex: 50,
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      paddingBottom: 0,
    },
    navText: {
      fontSize: 12,
      marginTop: 4,
      marginBottom: 15,
    },
    activeNavText: {
      color: colors.navigationActive,
    },
    inactiveNavText: {
      color: colors.navigationInactive,
    },
  });

  return (
    <View style={dynamicStyles.header}>
      <View style={styles.navRow}>
        {NAV_ITEMS.map((item) => {
          const isActive = currentScreen === item.screenName;
          const IconComponent = item.icon;
          return (
            <TouchableOpacity
              key={item.screenName}
              onPress={() => navigateWithDirection(item.path)}
              style={styles.navItem}
              accessibilityLabel={item.accessibilityLabel}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
            >
              <IconComponent 
                size={24} 
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