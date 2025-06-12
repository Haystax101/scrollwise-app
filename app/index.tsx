import { Redirect, useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';

export default function Index() {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && user) {
      router.replace('/feed');
    }
  }, [user, loading]);
  if (loading) return null;
  if (!user) return <Redirect href="/sign-in" />;
  return null;
}
