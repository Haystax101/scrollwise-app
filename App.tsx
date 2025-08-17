import { useState, useEffect } from 'react';
import { SafeAreaView, View, StatusBar, StyleSheet } from 'react-native';
import { Onboarding } from './components/Onboarding';
import { MainFeed } from './components/MainFeed';
import { Profile } from './components/Profile';
import { Header } from './components/Header';
import { Discover } from './components/Discover';
import Settings from './components/Settings';
import { useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';
import type { ScreenName, Industry } from './types';
// Removed: import { GestureHandlerRootView } from 'react-native-gesture-handler';
// Removed: import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
// Removed: import { styled } from "nativewind";

// Removed: const StyledSafeAreaView = styled(SafeAreaView);
// Removed: const StyledView = styled(View);

export default function App() {
  const { user, loading, signOut } = useAuth();
  const { colors } = useTheme();
  const [currentScreen, setCurrentScreen] = useState<ScreenName>('onboarding');
  const [selectedIndustries, setSelectedIndustries] = useState<Industry[]>([]);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        setCurrentScreen('onboarding');
      } else if (currentScreen === 'onboarding') {
        setCurrentScreen('feed');
      }
    }
    // eslint-disable-next-line
  }, [user, loading]);

  // Handle when user signs in via onboarding
  const handleSignIn = () => {
    setCurrentScreen('feed');
  };

  const handleOnboardingComplete = (interests: Industry[]) => {
    setSelectedIndustries(interests);
    setCurrentScreen('feed');
  };

  const navigateTo = (screen: ScreenName) => {
    setCurrentScreen(screen);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'onboarding':
        return <Onboarding onComplete={handleOnboardingComplete} onSignIn={handleSignIn} />;
      case 'feed':
        return <MainFeed industries={selectedIndustries} />;
      case 'discover':
        return <Discover />;
      case 'profile':
        // Map Supabase user to local User type
        const localUser = user
          ? { email: user.email ?? '', name: user.user_metadata?.name ?? '' }
          : null;
        return <Profile user={localUser} navigateTo={navigateTo as any} signOut={signOut} />;
      case 'settings':
        return <Settings navigateTo={navigateTo as any} signOut={signOut} />;
      default:
        return <Onboarding onComplete={handleOnboardingComplete} onSignIn={handleSignIn} />;
    }
  };

  const showHeader = currentScreen !== 'onboarding';

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
  });

  return (
    <View style={dynamicStyles.container}>
      <StatusBar 
        barStyle={colors.statusBarStyle} 
        backgroundColor={colors.statusBarBackground} 
      />
      <SafeAreaView style={dynamicStyles.container}>
        <View style={dynamicStyles.container}>
          {renderScreen()}
        </View>
        {showHeader && <Header currentScreen={currentScreen} navigateTo={navigateTo} />}
      </SafeAreaView>
    </View>
  );
}
