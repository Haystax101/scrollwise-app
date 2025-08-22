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
    router.replace('/feed?refresh=true');
  };
  
  const onSignIn = () => {
    router.replace('/feed');
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
