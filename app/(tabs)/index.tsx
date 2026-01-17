import { useAuth } from '../../context/AuthContext';
import { MainFeed } from '../../components/MainFeed';
import { CommunityFeed } from '../../components/feed/CommunityFeed';
import { communityService } from '../../lib/communityService';
import { FeedToggleHeader, FeedType } from '../../components/feed/FeedToggleHeader';
import { useRouter } from 'expo-router';
import { useSearchParams } from 'expo-router/build/hooks';
import { useEffect, useState } from 'react';
import { useIndustries } from '../../context/IndustriesContext';
import { useScreenTime } from '../../hooks/useScreenTime';
import { screenTracker } from '../../lib/screenTracking';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
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

    // Community Feed State (Lifted)
    const [selectedCommunity, setSelectedCommunity] = useState<any | null>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [myCommunities, setMyCommunities] = useState<any[]>([]);

    useEffect(() => {
        if (user) {
            communityService.getMyCommunities(user.id).then(setMyCommunities);
        }
    }, [user]);

    const handleToggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

    const handleSelectCommunity = (comm: any | null) => {
        setSelectedCommunity(comm);
        setIsDropdownOpen(false);
    };

    if (loading || !user) return null;

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header Switcher */}
            <FeedToggleHeader
                activeFeed={activeFeed}
                onToggle={setActiveFeed}
                activeCommunity={selectedCommunity}
                onToggleDropdown={handleToggleDropdown}
                isDropdownOpen={isDropdownOpen}
            />

            {/* Dropdown Overlay (Rendered here to be on top of feed) */}
            {isDropdownOpen && activeFeed === 'community' && (
                <View style={[styles.dropdownOverlay, { top: 120, backgroundColor: colors.card, borderColor: colors.border }]}>
                    <TouchableOpacity
                        style={[styles.dropdownItem]}
                        onPress={() => handleSelectCommunity(null)}
                    >
                        <Text style={[styles.dropdownText, { color: !selectedCommunity ? colors.primary : colors.text }]}>General (FYP)</Text>
                    </TouchableOpacity>
                    {myCommunities.map(c => (
                        <TouchableOpacity
                            key={c.id}
                            style={styles.dropdownItem}
                            onPress={() => handleSelectCommunity(c)}
                        >
                            <Text style={[styles.dropdownText, { color: selectedCommunity?.id === c.id ? colors.primary : colors.text }]}>
                                {c.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

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
                <CommunityFeed
                    selectedCommunity={selectedCommunity}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    dropdownOverlay: {
        position: 'absolute',
        left: 160, // Align under the Community button (Button Width 140, +20 padding + 140 offset?) 
        // Wait, Header is padded 20. Learning is [0-140]. Community is [140-280].
        // So Community starts at 20 + 140 = 160.
        // Let's set left: 160.
        width: 160, // Match button width roughly? Or just be flexible.
        zIndex: 200,
        borderRadius: 16,
        borderWidth: 1,
        padding: 8,
        elevation: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    dropdownItem: {
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    dropdownText: {
        fontSize: 16,
        fontWeight: '600',
    }
});
