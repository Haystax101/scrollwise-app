import { useRouter } from 'expo-router';
import { useSearchParams } from 'expo-router/build/hooks';
import { useAuth } from '../context/AuthContext';
import { useIndustries } from '../context/IndustriesContext';
import NewOnboarding from '../components/NewOnboarding';
import { useEffect } from 'react';

export default function OnboardingScreen() {
  const { user, loading } = useAuth();
  const { refreshIndustries } = useIndustries();
  const router = useRouter();
  const params = useSearchParams();
  const tutorialOnly = params.get('tutorialOnly') === 'true';
  
  console.log('OnboardingScreen: Current state -', { user: user ? 'authenticated' : 'not authenticated', loading, tutorialOnly });
  
  const onComplete = () => {
    console.log('OnboardingScreen: Onboarding completed, redirecting to /feed with refresh');
    router.replace('/feed?refresh=true'); // Navigate to the main feed with refresh param
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
  
  return <NewOnboarding onComplete={onComplete} onSignIn={onSignIn} tutorialOnly={tutorialOnly} refreshMainFeed={refreshIndustries} />;
}
