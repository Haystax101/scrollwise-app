import { AuthProvider } from '@/context/AuthContext';
import { IndustriesProvider } from '../context/IndustriesContext';
import { ThemeProvider } from '../context/ThemeContext';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import AppHeader from '../components/AppHeader';

// This is the main layout for the entire app.
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <ThemeProvider>
          <BottomSheetModalProvider>
            <IndustriesProvider>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen
                  name="chat/[id]"
                  options={{
                    presentation: 'modal',
                    headerShown: false,
                  }}
                />
              </Stack>
              <AppHeader />
            </IndustriesProvider>
          </BottomSheetModalProvider>
        </ThemeProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}