import { useAuth } from '../context/AuthContext';
import { MainFeed } from '../components/MainFeed';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useIndustries } from '../context/IndustriesContext';

export default function FeedScreen() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { industries } = useIndustries();
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/sign-in');
    }
  }, [user, loading]);
  if (loading || !user) return null;
  return <MainFeed industries={industries} />;
}
