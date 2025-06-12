import { AuthProvider } from '@/context/AuthContext';
import { Slot } from 'expo-router';
import AppHeader from '../components/AppHeader';

// This is the main layout for the entire app.
export default function RootLayout() {
  // You can wrap this Slot in any providers you need.
  // e.g., <ThemeProvider><Slot /></ThemeProvider>
  return (
    <AuthProvider>
        <Slot />
        <AppHeader />
    </AuthProvider>  
  );
}