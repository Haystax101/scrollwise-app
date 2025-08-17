import { useAuth } from '../context/AuthContext';
import { MainFeed } from '../components/MainFeed';
import { useRouter } from 'expo-router';
import { useSearchParams } from 'expo-router/build/hooks';
import { useEffect } from 'react';
import { useIndustries } from '../context/IndustriesContext';

export default function FeedScreen() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { industries } = useIndustries();
  const params = useSearchParams();
  const contentId = params.get('contentId');
  const contentType = params.get('contentType') as 'article' | 'paper' | 'book' | null;
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/onboarding');
    }
  }, [user, loading]);
  if (loading || !user) return null;
  return (
    <MainFeed 
      industries={industries} 
      initialArticleId={contentId ? Number(contentId) : undefined}
      initialContentType={contentType ?? undefined}
    />
  );
}
