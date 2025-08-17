import { useAuth } from '../context/AuthContext';
import { Discover } from '../components/Discover';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function DiscoverScreen() {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/onboarding');
    }
  }, [user, loading]);
  if (loading || !user) return null;
  return <Discover />;
}
