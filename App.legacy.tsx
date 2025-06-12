import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, StatusBar, StyleSheet } from 'react-native';
import { SignIn } from './components/SignIn';
import { SignUp } from './components/SignUp';
import { Onboarding } from './components/Onboarding';
import { MainFeed } from './components/MainFeed';
import { Profile } from './components/Profile';
import { Header } from './components/Header';
import { Discover } from './components/Discover';
import Settings from './components/Settings';
import { useAuth } from './context/AuthContext';
import type { User, ScreenName } from './types';
// Removed: import { styled } from "nativewind";

// Removed: const StyledSafeAreaView = styled(SafeAreaView);
// Removed: const StyledView = styled(View);

export default function App() {
  const { user, loading, signOut } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<ScreenName>('signIn');
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        setCurrentScreen('signIn');
      } else if (currentScreen === 'signIn' || currentScreen === 'signUp') {
        setCurrentScreen('feed');
      }
    }
    // eslint-disable-next-line
  }, [user, loading]);

  const handleSignIn = (_user: User) => {
    // No-op: handled by AuthContext
  };

  const handleSignUp = (_user: User) => {
    setCurrentScreen('onboarding');
  };

  const handleOnboardingComplete = (industries: string[]) => {
    setSelectedIndustries(industries);
    setCurrentScreen('feed');
  };

  const navigateTo = (screen: ScreenName) => {
    setCurrentScreen(screen);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'signIn':
        return <SignIn onSignIn={handleSignIn} onSwitchToSignUp={() => setCurrentScreen('signUp')} />;
      case 'signUp':
        return <SignUp onSignUp={handleSignUp} onSwitchToSignIn={() => setCurrentScreen('signIn')} />;
      case 'onboarding':
        return <Onboarding onComplete={handleOnboardingComplete} />;
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
        return <SignIn onSignIn={handleSignIn} onSwitchToSignUp={() => setCurrentScreen('signUp')} />;
    }
  };

  const showHeader = currentScreen !== 'signIn' && currentScreen !== 'signUp' && currentScreen !== 'onboarding';
  const isAuthOrOnboarding = currentScreen === 'signIn' || currentScreen === 'signUp' || currentScreen === 'onboarding';
  const isMainFeed = currentScreen === 'feed';

  return (
    isMainFeed ? (
      <View style={[styles.flex1, { backgroundColor: '#000' }]}> 
        <StatusBar barStyle="light-content" backgroundColor="black" />
        {renderScreen()}
        {showHeader && <Header currentScreen={currentScreen} navigateTo={navigateTo} dark />}
      </View>
    ) : (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar 
          barStyle={isAuthOrOnboarding ? "dark-content" : "light-content"} 
          backgroundColor={isAuthOrOnboarding ? '#F9FAFB' : 'white'} 
        />
        <View style={styles.flex1}>
          {renderScreen()}
        </View>
        {showHeader && <Header currentScreen={currentScreen} navigateTo={navigateTo} />}
      </SafeAreaView>
    )
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB', // bg-gray-50
  },
  flex1: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
