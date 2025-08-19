import { useAuth } from '../context/AuthContext';
import { Profile } from '../components/Profile';
import { NewProfile } from '../components/profile/NewProfile';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

export default function ProfileScreen() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [useNewProfile, setUseNewProfile] = useState(true); // Toggle for testing

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/onboarding');
    }
  }, [user, loading]);

  if (loading || !user) return null;

  // Use new profile design by default, fallback to old design
  if (useNewProfile) {
    return <NewProfile user={user} navigateTo={router.replace} signOut={signOut} />;
  }

  // Legacy profile (keep for compatibility)
  const localUser = user ? { email: user.email ?? '', name: user.user_metadata?.name ?? '' } : null;
  return <Profile user={localUser} navigateTo={router.replace} signOut={signOut} />;
}
