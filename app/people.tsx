import { useAuth } from '../context/AuthContext';
import { People } from '../components/friends/People';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';

export default function PeoplePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/onboarding');
    }
  }, [user, loading]);

  if (loading || !user) return null;

  return <People initialUserId={params.userId as string} />;
}