import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import NewOnboarding from '../components/NewOnboarding';
import { useEffect } from 'react';

export default function OnboardingScreen() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const onComplete = () => {
    router.replace('/feed'); // Navigate to the main feed
  };
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/sign-in');
    }
  }, [user, loading]);
  if (loading || !user) return null;
  return <NewOnboarding onComplete={onComplete} />;
}
