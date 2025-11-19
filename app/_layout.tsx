import { AuthProvider } from '@/context/AuthContext';
import { IndustriesProvider } from '../context/IndustriesContext';
import { ThemeProvider } from '../context/ThemeContext';
import { NavigationProvider } from '../context/NavigationContext';
import { NotificationProvider } from '../context/NotificationContext';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import AppHeader from '../components/AppHeader';
import { PostHogProvider } from 'posthog-react-native';
import { posthog } from '../lib/posthog';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { useDeepLinkHandler } from '../lib/deepLinkHandler';
import { useFonts, Oswald_200ExtraLight, Oswald_300Light, Oswald_400Regular, Oswald_500Medium, Oswald_600SemiBold, Oswald_700Bold } from '@expo-google-fonts/oswald';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

// Keep splash screen visible while fonts load
SplashScreen.preventAutoHideAsync();

// Note: Text scaling prevention removed due to React 19 deprecation
// If needed, use allowFontScaling={false} on individual Text/TextInput components

// Component to handle deep links
function DeepLinkWrapper({ children }: { children: React.ReactNode }) {
  useDeepLinkHandler(); // This sets up the deep link listeners
  return <>{children}</>;
}

// This is the main layout for the entire app.
export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Oswald_200ExtraLight,
    Oswald_300Light,
    Oswald_400Regular,
    Oswald_500Medium,
    Oswald_600SemiBold,
    Oswald_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <PostHogProvider client={posthog}>
      <ErrorBoundary>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <AuthProvider>
            <ThemeProvider>
              <NavigationProvider>
                <NotificationProvider>
                  <BottomSheetModalProvider>
                    <IndustriesProvider>
                      <DeepLinkWrapper>
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen
                    name="feed" 
                    options={({ route }) => ({
                      animation: (route.params as any)?.animationDirection === 'left' 
                        ? 'slide_from_left' 
                        : 'slide_from_right',
                    })}
                  />
                  <Stack.Screen
                    name="vault"
                    options={({ route }) => ({
                      animation: (route.params as any)?.animationDirection === 'left'
                        ? 'slide_from_left'
                        : 'slide_from_right',
                    })}
                  />
                  <Stack.Screen
                    name="people"
                    options={({ route }) => ({
                      animation: (route.params as any)?.animationDirection === 'left'
                        ? 'slide_from_left'
                        : 'slide_from_right',
                    })}
                  />
                  <Stack.Screen
                    name="chats"
                    options={({ route }) => ({
                      animation: (route.params as any)?.animationDirection === 'left' 
                        ? 'slide_from_left' 
                        : 'slide_from_right',
                    })}
                  />
                  <Stack.Screen 
                    name="profile"
                    options={({ route }) => ({
                      animation: (route.params as any)?.animationDirection === 'left' 
                        ? 'slide_from_left' 
                        : 'slide_from_right',
                    })}
                  />
                  <Stack.Screen 
                    name="saved-feed"
                    options={({ route }) => ({
                      animation: (route.params as any)?.animationDirection === 'left' 
                        ? 'slide_from_left' 
                        : 'slide_from_right',
                    })}
                  />
                  <Stack.Screen
                    name="chat/[id]"
                    options={{
                      presentation: 'modal',
                      headerShown: false,
                    }}
                  />
                  <Stack.Screen
                    name="reset-password-request"
                    options={{
                      headerShown: false,
                    }}
                  />
                  <Stack.Screen
                    name="update-password"
                    options={{
                      headerShown: false,
                    }}
                  />
                  <Stack.Screen
                    name="shared"
                    options={{
                      headerShown: false,
                      animation: 'none',
                    }}
                  />
                </Stack>
                    <AppHeader />
                      </DeepLinkWrapper>
                    </IndustriesProvider>
                  </BottomSheetModalProvider>
                </NotificationProvider>
              </NavigationProvider>
            </ThemeProvider>
          </AuthProvider>
        </GestureHandlerRootView>
      </ErrorBoundary>
    </PostHogProvider>
  );
}