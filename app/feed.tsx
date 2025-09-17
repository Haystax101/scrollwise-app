import { useAuth } from '../context/AuthContext';
import { MainFeed } from '../components/MainFeed';
import { useRouter } from 'expo-router';
import { useSearchParams } from 'expo-router/build/hooks';
import { useEffect, useState } from 'react';
import { useIndustries } from '../context/IndustriesContext';
import { useScreenTime } from '../hooks/useScreenTime';
import { screenTracker } from '../lib/screenTracking';

export default function FeedScreen() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { industries } = useIndustries();
  const params = useSearchParams();
  const contentId = params.get('contentId');
  const contentType = params.get('contentType') as 'article' | 'paper' | 'book' | 'insight' | null;
  const [refreshKey, setRefreshKey] = useState(0);

  // Initialize screen tracking for main feed
  const { trackScroll, trackInteraction, trackContentEngagement } = useScreenTime({
    screenName: 'MainFeed',
    trackScrollDepth: true,
    additionalData: {
      industries_count: industries.length,
      initial_content_id: contentId,
      initial_content_type: contentType
    }
  });

  // Initialize user tracking when user is available
  useEffect(() => {
    if (user?.id) {
      screenTracker.initializeTracking(user.id);
    }
  }, [user?.id]);

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

  // Force refresh when navigating to feed tab - COMMENTED OUT FOR FEED PERSISTENCE
  // useFocusEffect(
  //   useCallback(() => {
  //     if (user && industries.length > 0) {
  //       setRefreshKey(prev => prev + 1);
  //     }
  //   }, [user, industries.length])
  // );
  if (loading || !user) return null;
  return (
    <MainFeed 
      key={refreshKey} // Force remount when refreshKey changes
      industries={industries} 
      initialArticleId={contentId ? (contentType === 'insight' ? contentId : Number(contentId)) : undefined}
      initialContentType={contentType ?? undefined}
      trackScroll={trackScroll}
      trackInteraction={trackInteraction}
      trackContentEngagement={trackContentEngagement}
    />
  );
}
