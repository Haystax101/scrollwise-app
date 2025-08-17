import { Redirect, useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Index() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [checkingOnboarding, setCheckingOnboarding] = useState(false);
  
  console.log('Index: Current state -', { user: user ? 'authenticated' : 'not authenticated', loading });
  
  // Check if user has completed onboarding
  const checkOnboardingCompletion = async (userId: string) => {
    try {
      setCheckingOnboarding(true);
      const { data, error } = await supabase
        .from('user_industries')
        .select('industry_id')
        .eq('user_id', userId)
        .limit(1);
      
      if (error) {
        console.error('Index: Error checking onboarding status:', error);
        return false;
      }
      
      return data && data.length > 0;
    } catch (error) {
      console.error('Index: Error checking onboarding completion:', error);
      return false;
    } finally {
      setCheckingOnboarding(false);
    }
  };
  
  useEffect(() => {
    if (!loading && user) {
      console.log('Index: User authenticated, checking onboarding status...');
      checkOnboardingCompletion(user.id).then((hasCompletedOnboarding) => {
        if (hasCompletedOnboarding) {
          console.log('Index: User completed onboarding, redirecting to /feed');
          router.replace('/feed');
        } else {
          console.log('Index: User has not completed onboarding, redirecting to /onboarding');
          router.replace('/onboarding');
        }
      });
    }
  }, [user, loading]);
  
  if (loading || checkingOnboarding) {
    console.log('Index: Loading auth state or checking onboarding...');
    return null;
  }
  
  if (!user) {
    console.log('Index: No user, redirecting to /onboarding');
    return <Redirect href="/onboarding" />;
  }
  
  return null;
}
