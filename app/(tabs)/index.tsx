import { useAuth } from '../../context/AuthContext';
import { MainFeed } from '../../components/MainFeed';
import { CommunityFeed } from '../../components/feed/CommunityFeed';
import { FeedToggleHeader, FeedType } from '../../components/feed/FeedToggleHeader';
import { useRouter } from 'expo-router';
import { useSearchParams } from 'expo-router/build/hooks';
import { useEffect, useState } from 'react';
import { useIndustries } from '../../context/IndustriesContext';
import { useScreenTime } from '../../hooks/useScreenTime';
import { screenTracker } from '../../lib/screenTracking';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export default function FeedScreen() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const { industries } = useIndustries();
    const { colors } = useTheme();
    const params = useSearchParams();

    // Feed State
    const [activeFeed, setActiveFeed] = useState<FeedType>('learning');

    // Params for deep linking / specific content
    const contentId = params.get('contentId');
    const contentType = params.get('contentType') as 'article' | 'paper' | 'book' | 'insight' | null;
    const showBackButton = params.get('showBackButton') === 'true';
    const backTo = params.get('backTo');
    const [refreshKey, setRefreshKey] = useState(0);

    // Initialize screen tracking for main feed
    const { trackScroll, trackInteraction, trackContentEngagement } = useScreenTime({
        screenName: 'MainFeed',
        trackScrollDepth: true,
        additionalData: {
            industries_count: industries.length,
            initial_content_id: contentId,
            initial_content_type: contentType,
            active_feed: activeFeed
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
            router.setParams({ refresh: undefined });
        }
    }, [params]);

    useEffect(() => {
        if (!loading && !user) {
            router.replace('/onboarding');
        }
    }, [user, loading]);

    if (loading || !user) return null;

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header Switcher */}
            <FeedToggleHeader activeFeed={activeFeed} onToggle={setActiveFeed} />

            {/* Feeds */}
            {activeFeed === 'learning' ? (
                <MainFeed
                    key={`learning-${refreshKey}`}
                    industries={industries}
                    initialArticleId={contentId ? (contentType === 'insight' ? contentId : Number(contentId)) : undefined}
                    initialContentType={contentType ?? undefined}
                    showBackButton={showBackButton}
                    backTo={backTo}
                    trackScroll={trackScroll}
                    trackInteraction={trackInteraction}
                    trackContentEngagement={trackContentEngagement}
                />
            ) : (
                <CommunityFeed />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    }
});
