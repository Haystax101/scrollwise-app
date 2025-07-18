import { useAuth } from '../context/AuthContext';
import { Header } from '../components/Header';
import { useRouter, usePathname } from 'expo-router';
import { View, StyleSheet, SafeAreaView } from 'react-native';

export default function AppHeader() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  if (loading || !user) return null;

  // Map pathname to ScreenName for Header
  let currentScreen: any = 'feed';
  let useSafeArea = false;
  if (pathname === '/discover') {
    currentScreen = 'discover';
    useSafeArea = true;
  } else if (pathname === '/profile') {
    currentScreen = 'profile';
    useSafeArea = true;
  } else if (pathname === '/settings') {
    currentScreen = 'settings';
  } else if (pathname === '/chats') {
    currentScreen = 'chats';
    useSafeArea = true;
  }

  // Only apply SafeAreaView to the top, not the bottom (header is fixed at bottom)
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
