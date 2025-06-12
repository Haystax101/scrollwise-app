import { Stack } from 'expo-router';
import { AuthProvider } from '../../context/AuthContext';

export default function AppLayout() {
  return (
    <AuthProvider>
      <Stack />
    </AuthProvider>
  );
}
