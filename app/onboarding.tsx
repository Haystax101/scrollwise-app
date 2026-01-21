import { useRouter } from 'expo-router';
import { useSearchParams } from 'expo-router/build/hooks';
import { useAuth } from '../context/AuthContext';
import { useIndustries } from '../context/IndustriesContext';
import NewOnboarding from '../components/NewOnboarding';

export default function OnboardingScreen() {
  const { loading } = useAuth();
  const { refreshIndustries } = useIndustries();
  const router = useRouter();
  const params = useSearchParams();
  const tutorialOnly = params.get('tutorialOnly') === 'true';

  const onComplete = () => {
    router.replace('/profile');
  };

  const onSignIn = () => {
    router.replace('/(tabs)');
  };

  if (loading) {
    return null;
  }

  return <NewOnboarding
    onComplete={onComplete}
    onSignIn={onSignIn}
    tutorialOnly={tutorialOnly}
    refreshMainFeed={refreshIndustries}
  />;
}
