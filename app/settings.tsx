import { useAuth } from '../context/AuthContext';
import Settings from '../components/Settings';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function SettingsScreen() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/onboarding');
    }
  }, [user, loading]);
  if (loading || !user) return null;
  return <Settings navigateTo={router.replace} signOut={signOut} />;
}
