import { Stack, useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function AppLayout() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const checkOnboarding = async () => {
      if (user) {
        const { data, error } = await supabase
          .from('user_industries')
          .select('user_id')
          .eq('user_id', user.id)
          .limit(1);

        if (error) {
          console.error('Error checking user industries:', error);
        } else if (!data || data.length === 0) {
          router.replace('/onboarding');
        }
      }
    };

    checkOnboarding();
  }, [user]);

  return <Stack screenOptions={{ headerShown: false }} />;
}
