import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { Onboarding } from '../components/Onboarding';
import { useEffect } from 'react';

export default function OnboardingScreen() {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/sign-in');
    }
  }, [user, loading]);
  if (loading || !user) return null;
  return <Onboarding onComplete={() => router.replace('/feed')} />;
}
