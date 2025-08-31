import { useAuth } from '../context/AuthContext';
import { NewProfile } from '../components/profile/NewProfile';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function ProfileScreen() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/onboarding');
    }
  }, [user, loading]);

  if (loading || !user) return null;

  return <NewProfile user={user} navigateTo={router.replace} signOut={signOut} />;
}
