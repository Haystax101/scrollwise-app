import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import NewOnboarding from '../components/NewOnboarding';
import { useEffect } from 'react';

export default function OnboardingScreen() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  console.log('OnboardingScreen: Current state -', { user: user ? 'authenticated' : 'not authenticated', loading });
  
  const onComplete = () => {
    console.log('OnboardingScreen: Onboarding completed, redirecting to /feed');
    router.replace('/feed'); // Navigate to the main feed
  };
  
  const onSignIn = () => {
    console.log('OnboardingScreen: Sign in completed, redirecting to /feed');
    router.replace('/feed');
  };
  
  useEffect(() => {
    // Index.tsx now handles the initial routing decision
    // This screen should only be reached by users who need to complete onboarding
    console.log('OnboardingScreen: User is on onboarding screen, proceeding with flow');
  }, [user, loading]);
  
  if (loading) {
    console.log('OnboardingScreen: Loading auth state...');
    return null;
  }
  
  return <NewOnboarding onComplete={onComplete} onSignIn={onSignIn} />;
}
