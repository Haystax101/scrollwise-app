import { useAuth } from '../context/AuthContext';
import { NewProfile } from '../components/profile/NewProfile';
import { useScreenTime } from '../hooks/useScreenTime';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function ProfileScreen() {
  console.log('🔍 ProfileScreen: Component mounting');
  
  try {
    const { user, loading, signOut } = useAuth();
    console.log('🔍 ProfileScreen: Auth state:', { 
      hasUser: !!user, 
      userId: user?.id, 
      loading, 
      userEmail: user?.email 
    });
    
    const router = useRouter();
    console.log('🔍 ProfileScreen: Router initialized');

    // Initialize screen tracking for profile
    console.log('🔍 ProfileScreen: Initializing screen tracking');
    const { trackInteraction, trackContentEngagement } = useScreenTime({
      screenName: 'Profile',
      additionalData: {
        user_id: user?.id
      }
    });
    console.log('🔍 ProfileScreen: Screen tracking initialized');

    useEffect(() => {
      console.log('🔍 ProfileScreen: useEffect triggered', { user: !!user, loading });
      if (!loading && !user) {
        console.log('🔍 ProfileScreen: No user found, redirecting to onboarding');
        router.replace('/onboarding');
      }
    }, [user, loading]);

    console.log('🔍 ProfileScreen: Before render check', { loading, hasUser: !!user });
    
    if (loading || !user) {
      console.log('🔍 ProfileScreen: Returning null due to loading or no user');
      return null;
    }

    console.log('🔍 ProfileScreen: About to render NewProfile component');
    return <NewProfile user={user} navigateTo={router.replace} signOut={signOut} />;
    
  } catch (error) {
    console.error('🚨 ProfileScreen: CRITICAL ERROR:', error);
    console.error('🚨 ProfileScreen: Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return null;
  }
}
