import { AuthProvider } from '@/context/AuthContext';
import { IndustriesProvider } from '../context/IndustriesContext';
import { Slot } from 'expo-router';
import AppHeader from '../components/AppHeader';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

// This is the main layout for the entire app.
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <AuthProvider>
          <IndustriesProvider>
            <Slot />
            <AppHeader />
          </IndustriesProvider>
        </AuthProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}