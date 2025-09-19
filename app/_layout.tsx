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
import { Text, TextInput } from 'react-native';
import { useDeepLinkHandler } from '../lib/deepLinkHandler';

// Disable text scaling to maintain consistent UI layout
Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.maxFontSizeMultiplier = 1.0;

TextInput.defaultProps = TextInput.defaultProps || {};
TextInput.defaultProps.maxFontSizeMultiplier = 1.0;

// Component to handle deep links
function DeepLinkWrapper({ children }: { children: React.ReactNode }) {
  useDeepLinkHandler(); // This sets up the deep link listeners
  return <>{children}</>;
}

// This is the main layout for the entire app.
export default function RootLayout() {
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