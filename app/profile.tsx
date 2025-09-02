import { useAuth } from '../context/AuthContext';
import { NewProfile } from '../components/profile/NewProfile';
import { useScreenTime } from '../hooks/useScreenTime';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function ProfileScreen() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  // Initialize screen tracking for profile
  const { trackInteraction, trackContentEngagement } = useScreenTime({
    screenName: 'Profile',
    additionalData: {
      user_id: user?.id
    }
  });

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/onboarding');
    }
  }, [user, loading]);

  if (loading || !user) return null;

  return <NewProfile user={user} navigateTo={router.replace} signOut={signOut} />;
}
