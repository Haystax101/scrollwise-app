import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { SignIn } from '../components/SignIn';
import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function SignInScreen() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!loading && user) {
      // Check if user has completed their profile
      const checkProfileCompletion = async () => {
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('interests, experience')
            .eq('id', user.id)
            .single();

          if (profileError || !profileData || !profileData.interests || !profileData.experience) {
            // User needs to complete onboarding
            router.replace('/onboarding');
          } else {
            // User has completed profile, go to feed
            router.replace('/feed');
          }
        } catch (error) {
          console.error('Error checking profile completion:', error);
          // Default to onboarding if there's an error
          router.replace('/onboarding');
        }
      };

      checkProfileCompletion();
    }
  }, [user, loading]);
  
  if (loading || user) return null;
  return <SignIn onSignIn={() => {}} onSwitchToSignUp={() => router.replace('/sign-up')} />;
}
