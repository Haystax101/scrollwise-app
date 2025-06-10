import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { ScreenName } from '../types';


interface HeaderProps {
  currentScreen: ScreenName;
  navigateTo: (screen: ScreenName) => void;
  dark?: boolean;
}

const NAV_ITEMS = [
  { name: 'Home', screen: 'feed' as ScreenName, icon: (props: any) => <Feather name="home" {...props} />, accessibilityLabel: "Navigate to Home screen" },
  { name: 'Discover', screen: 'discover' as ScreenName, icon: (props: any) => <Feather name="search" {...props} />, accessibilityLabel: "Navigate to Discover screen" },
  { name: 'Profile', screen: 'profile' as ScreenName, icon: (props: any) => <Feather name="user" {...props} />, accessibilityLabel: "Navigate to Profile screen" },
];

export const Header: React.FC<HeaderProps> = ({ currentScreen, navigateTo, dark }) => {
  return (
    <View style={[styles.header, dark && styles.headerDark]}>
      <View style={styles.navRow}>
        {NAV_ITEMS.map((item) => {
          const isActive = currentScreen === item.screen;
          const IconComponent = item.icon;
          return (
            <TouchableOpacity
              key={item.screen}
              onPress={() => navigateTo(item.screen)}
              style={[styles.navItem, isActive ? (dark ? styles.activeNavItemDark : styles.activeNavItem) : (dark ? styles.inactiveNavItemDark : styles.inactiveNavItem)]}
              accessibilityLabel={item.accessibilityLabel}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
            >
              <IconComponent size={24} color={isActive ? (dark ? '#fff' : '#2563EB') : (dark ? '#9CA3AF' : '#6B7280')} />
              <Text style={[styles.navText, isActive ? (dark ? styles.activeNavTextDark : styles.activeNavText) : (dark ? styles.inactiveNavTextDark : styles.inactiveNavText)]}>
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
  header: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb', // gray-200
    zIndex: 50,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingBottom: 0,
  },
  headerDark: {
    backgroundColor: '#18181b', // dark background
    borderTopColor: '#27272a',
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 84, // h-16
  },
  navItem: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  activeNavItem: {},
  inactiveNavItem: {},
  navText: {
    fontSize: 12,
    marginTop: 4,
    marginBottom: 15,
  },
  activeNavText: {
    color: '#2563EB', // blue-600
  },
  inactiveNavText: {
    color: '#6B7280', // gray-500
  },
  activeNavTextDark: {
    color: '#fff',
  },
  inactiveNavTextDark: {
    color: '#9CA3AF',
  },
  activeNavItemDark: {},
  inactiveNavItemDark: {},
});