import { useAuth } from '../context/AuthContext';
import { MainFeed } from '../components/MainFeed';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSearchParams } from 'expo-router/build/hooks';
import { useEffect, useState, useCallback } from 'react';
import { useIndustries } from '../context/IndustriesContext';

export default function FeedScreen() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { industries } = useIndustries();
  const params = useSearchParams();
  const contentId = params.get('contentId');
  const contentType = params.get('contentType') as 'article' | 'paper' | 'book' | null;
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (params.get('refresh') === 'true') {
      setRefreshKey(prev => prev + 1);
      // Optionally remove the query param from the URL without a full reload
      router.setParams({ refresh: undefined }); 
    }
  }, [params]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/onboarding');
    }
  }, [user, loading]);

  // Force refresh when navigating to feed tab
  useFocusEffect(
    useCallback(() => {
      if (user && industries.length > 0) {
        setRefreshKey(prev => prev + 1);
      }
    }, [user, industries.length])
  );
  if (loading || !user) return null;
  return (
    <MainFeed 
      key={refreshKey} // Force remount when refreshKey changes
      industries={industries} 
      initialArticleId={contentId ? Number(contentId) : undefined}
      initialContentType={contentType ?? undefined}
    />
  );
}
