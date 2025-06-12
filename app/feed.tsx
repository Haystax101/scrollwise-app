import { useAuth } from '../context/AuthContext';
import { MainFeed } from '../components/MainFeed';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';

export default function FeedScreen() {
  const { user, loading } = useAuth();
  const router = useRouter();
  // TODO: Persist selectedIndustries in a global store or context if needed
  const [selectedIndustries] = useState<string[]>([]);
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/sign-in');
    }
  }, [user, loading]);
  if (loading || !user) return null;
  return <MainFeed industries={selectedIndustries} />;
}
