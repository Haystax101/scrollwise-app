import { useAuth } from '../context/AuthContext';
import { Profile } from '../components/Profile';
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
  // Map Supabase user to local User type for Profile
  const localUser = user ? { email: user.email ?? '', name: user.user_metadata?.name ?? '' } : null;
  return <Profile user={localUser} navigateTo={router.replace} signOut={signOut} />;
}
