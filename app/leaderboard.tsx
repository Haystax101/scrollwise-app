import { useAuth } from '../context/AuthContext';
import { Leaderboard } from '../components/friends/Leaderboard';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function LeaderboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/onboarding');
    }
  }, [user, loading]);

  if (loading || !user) return null;

  return <Leaderboard />;
}