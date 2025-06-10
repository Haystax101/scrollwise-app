import React from 'react';
import { View, Text, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { ScreenName } from '../types';
// Removed: import { styled } from "nativewind";

// Removed: const StyledView = styled(View);
// Removed: const StyledText = styled(Text);
// Removed: const StyledTouchableOpacity = styled(TouchableOpacity);

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
  return (
    <View style={[styles.header, { paddingBottom: Platform.OS === 'ios' ? 10 : 0 }]}> 
      <View style={styles.navRow}>
        {NAV_ITEMS.map((item) => {
          const isActive = currentScreen === item.screen;
          const IconComponent = item.icon;
          return (
            <TouchableOpacity
              key={item.screen}
              onPress={() => navigateTo(item.screen)}
              style={[styles.navItem, isActive ? styles.activeNavItem : styles.inactiveNavItem]}
              accessibilityLabel={item.accessibilityLabel}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
            >
              <IconComponent size={24} color={isActive ? '#2563EB' : '#6B7280'} />
              <Text style={[styles.navText, isActive ? styles.activeNavText : styles.inactiveNavText]}>
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
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 64, // h-16
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
  },
  activeNavText: {
    color: '#2563EB', // blue-600
  },
  inactiveNavText: {
    color: '#6B7280', // gray-500
  },
});