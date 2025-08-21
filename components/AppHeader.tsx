import React, { useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/Header';
import { useRouter, usePathname } from 'expo-router';
import { View, StyleSheet, SafeAreaView } from 'react-native';

export default function AppHeader() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const previousTabIndex = useRef<number>(0);

  if (loading) {
    return null;
  }

  const noHeaderScreens = ['/sign-in', '/sign-up', '/onboarding'];
  if (noHeaderScreens.includes(pathname) || !user) {
    return null;
  }

  let currentScreen: 'home' | 'discover' | 'profile' | 'chats' | 'saved-feed' = 'home';
  if (pathname === '/feed') currentScreen = 'home';
  if (pathname === '/discover') currentScreen = 'discover';
  if (pathname === '/profile') currentScreen = 'profile';
  if (pathname === '/chats') currentScreen = 'chats';
  if (pathname === '/saved-feed') currentScreen = 'saved-feed';

  const useSafeArea = !['/feed'].includes(pathname);

  const header = (
    <View style={styles.headerContainer}>
      <Header currentScreen={currentScreen} navigateTo={router.replace} />
    </View>
  );

  if (useSafeArea) {
    return (
      <>
        <SafeAreaView style={{ backgroundColor: '#F3F4F6' }} />
        {header}
      </>
    );
  }
  return header;
}

const styles = StyleSheet.create({
  headerContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    backgroundColor: 'transparent',
  },
});
