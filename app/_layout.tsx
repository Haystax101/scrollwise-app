import { AuthProvider } from '@/context/AuthContext';
import { IndustriesProvider } from '../context/IndustriesContext';
import { ThemeProvider } from '../context/ThemeContext';
import { NavigationProvider } from '../context/NavigationContext';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import AppHeader from '../components/AppHeader';
import { Platform } from 'react-native';

// This is the main layout for the entire app.
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <ThemeProvider>
          <NavigationProvider>
            <BottomSheetModalProvider>
              <IndustriesProvider>
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
                    name="discover"
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
                      presentation: 'modal',
                      headerShown: false,
                    }}
                  />
                  <Stack.Screen
                    name="update-password"
                    options={{
                      presentation: 'modal',
                      headerShown: false,
                    }}
                  />
                </Stack>
                <AppHeader />
              </IndustriesProvider>
            </BottomSheetModalProvider>
          </NavigationProvider>
        </ThemeProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}