import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import type { ScreenName } from '../types';

interface HeaderProps {
  currentScreen: ScreenName;
  navigateTo: (screen: ScreenName) => void;
}

const NAV_ITEMS = [
  { name: 'Home', screen: 'feed' as ScreenName, icon: (props: any) => <Feather name="home" {...props} />, accessibilityLabel: "Navigate to Home screen" },
  { name: 'Discover', screen: 'discover' as ScreenName, icon: (props: any) => <Feather name="search" {...props} />, accessibilityLabel: "Navigate to Discover screen" },
  { name: 'Profile', screen: 'profile' as ScreenName, icon: (props: any) => <Feather name="user" {...props} />, accessibilityLabel: "Navigate to Profile screen" },
];

export const Header: React.FC<HeaderProps> = ({ currentScreen, navigateTo }) => {
  const { colors } = useTheme();

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
          const isActive = currentScreen === item.screen;
          const IconComponent = item.icon;
          return (
            <TouchableOpacity
              key={item.screen}
              onPress={() => navigateTo(item.screen)}
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