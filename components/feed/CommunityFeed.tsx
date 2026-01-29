import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity, ActivityIndicator, Modal, TextInput, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Animated, Dimensions } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { communityService, FeedItem as FeedItemType } from '../../lib/communityService';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { FeedItem } from '../../components/communities/FeedItem';
import { ViewTracking } from '../../lib/viewTracking';
import InsightCard from '../InsightCard';
import { TimelapseFeedCard } from './TimelapseFeedCard';

interface CommunityFeedProps {
    selectedCommunity: any | null;
    highlightId?: string | null;
    highlightType?: 'timelapse' | 'insight' | 'post'; // Added type
}

// Animated Wrapper for 3D Effect
const AnimatedFeedItem = React.memo(({ children, isFocused, onLayout }: { children: React.ReactNode, isFocused: boolean, onLayout?: (event: any) => void }) => {
    const opacity = useRef(new Animated.Value(isFocused ? 1 : 0.5)).current;

    // Use stable scale animation too for extra "pop" if desired later

    useEffect(() => {
        Animated.timing(opacity, {
            toValue: isFocused ? 1 : 0.5,
            duration: 250,
            useNativeDriver: true
        }).start();
    }, [isFocused]);

    return (
        <Animated.View
            onLayout={onLayout}
            style={{
                opacity,
                marginVertical: 12 // Consistent spacing
            }}
        >
            {children}
        </Animated.View>
    );
});

export const CommunityFeed: React.FC<CommunityFeedProps> = (props) => {
    const { selectedCommunity, highlightId, highlightType } = props;
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const { session } = useAuth();
    const router = useRouter();

    // Data State
    const [feed, setFeed] = useState<FeedItemType[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewCounts, setViewCounts] = useState<Map<string, number>>(new Map());

    // Autoplay State
    const [viewableItemIds, setViewableItemIds] = useState<string[]>([]);
    const flatListRef = useRef<FlatList>(null);

    // UI State
    const [messageText, setMessageText] = useState('');
    const [sending, setSending] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchFeed();
    }, [selectedCommunity, highlightId]);

    // Scroll to highlight (effect)
    // Scroll to highlight (effect)
    useEffect(() => {
        if (highlightId && feed.length > 0) {
            const index = feed.findIndex(item => String(item.id) === String(highlightId));

            if (index !== -1 && flatListRef.current) {
                // If it's the first item (which it should be due to sorting), snap immediately
                if (index === 0) {
                    flatListRef.current.scrollToOffset({ offset: 0, animated: false });
                } else {
                    // Fallback for other positions (rare given sorting logic)
                    setTimeout(() => {
                        flatListRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
                    }, 500);
                }
            }
        }
    }, [feed, highlightId]);

    const fetchFeed = async () => {
        console.log("CommunityFeed: Fetching feed...", { highlightId, highlightType, hasSelectedCommunity: !!selectedCommunity });

        // Only show loading indicator on initial load, not background refresh
        if (feed.length === 0) setLoading(true);

        try {
            if (selectedCommunity) {
                // Specific Community Feed (Chat + Posts)
                const data = await communityService.getCommunityFeed(selectedCommunity.id);
                setFeed(data);
            } else {
                // General FYP (Posts + Insights + TIMELAPSES)
                if (!session?.user) return;

                // Load view counts first
                const counts = await ViewTracking.loadViewCounts(session.user.id);
                setViewCounts(counts);

                const [posts, insights, timelapses] = await Promise.all([
                    communityService.getGeneralFeed(50, 0, session.user.id),
                    communityService.getInsights(20, session.user.id),
                    communityService.getTimelapses(20, session.user.id) // New Fetch
                ]);

                // Merge and Filter/Sort Logic
                let allCandidates = [...posts, ...insights, ...timelapses];

                // CHECK FOR MISSING HIGHLIGHT
                if (highlightId && highlightType) {
                    const exists = allCandidates.some(item => String(item.id) === String(highlightId));
                    if (!exists) {
                        // Fetch explicitly
                        let missingItem: FeedItemType | null = null;
                        if (highlightType === 'timelapse') {
                            missingItem = await communityService.getTimelapseById(highlightId);
                        } else if (highlightType === 'insight') {
                            missingItem = await communityService.getInsightById(highlightId);
                        }

                        if (missingItem) {
                            console.log("Found missing highlighted item, appending:", highlightId);
                            allCandidates.push(missingItem);
                        }
                    }
                }

                // Filtering Logic (3x for others, 1x for self)
                let filtered = allCandidates.filter((item: any) => {
                    // ALWAYS show highlighted item if present (ignoring view tracking limits)
                    if (highlightId && String(item.id) === String(highlightId)) return true;

                    const viewKey = `${item.type}-${item.id}`; // e.g., insight-123
                    const count = counts.get(viewKey) || 0;

                    if (item.user_id === session.user.id) {
                        return count < 1;
                    } else {
                        return count < 3;
                    }
                });

                // Soft Fallback: If filtered list is too short (< 5), backfill with random "seen" items to maintain scroll feel
                if (filtered.length < 5 && allCandidates.length > filtered.length) {
                    console.log("Filtered feed sparse, backfilling with seen items");
                    const existingIds = new Set(filtered.map(i => i.id));

                    // Simple shuffle/find loop to add items not already in filtered
                    const seenItems = allCandidates.filter(i => !existingIds.has(i.id));

                    // Add up to 10 more to guarantee scrollability
                    const backfill = seenItems.slice(0, 10);
                    filtered.push(...backfill);
                }

                // Sorting Logic
                const sorted = filtered.sort((a, b) => {
                    const keyA = `${a.type}-${a.id}`;
                    const keyB = `${b.type}-${b.id}`;
                    const countA = counts.get(keyA) || 0;
                    const countB = counts.get(keyB) || 0;

                    // Special Case: Friend Timelapses ALWAYS first. 
                    // Assuming 'isFriend' property exists from getTimelapses, for others false.
                    // We might need to enrich other types or just handle timelapse priority.

                    // Check if *either* is a priority timelapse
                    const isFriendTimeLapseA = (a.type === 'timelapse' && (a as any).isFriend);
                    const isFriendTimeLapseB = (b.type === 'timelapse' && (b as any).isFriend);

                    // Priority 0: Highlighted Item
                    if (highlightId) {
                        if (String(a.id) === String(highlightId)) return -1;
                        if (String(b.id) === String(highlightId)) return 1;
                    }

                    // Priority 1: Timelapses by Friends
                    if (isFriendTimeLapseA && !isFriendTimeLapseB) return -1;
                    if (!isFriendTimeLapseA && isFriendTimeLapseB) return 1;

                    if (countA !== countB) {
                        return countA - countB;
                    }
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                });

                setFeed(sorted);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Viewability Config
    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 60,
        minimumViewTime: 50, // Reduced from 200 for instant 3D effect
    }).current;

    const handleSendMessage = async () => {
        if (!messageText.trim() || !selectedCommunity || !session?.user) return;

        setSending(true);
        const newMessage: FeedItemType = {
            id: 'temp-' + Date.now(),
            type: 'message',
            content: messageText,
            user_id: session.user.id,
            created_at: new Date().toISOString(),
            author_name: 'You',
            author_avatar: ''
        };
        // Optimistic update
        setFeed([newMessage, ...feed]);
        setMessageText('');

        await communityService.sendMessage(selectedCommunity.id, newMessage.content, session.user.id);
        setSending(false);
        fetchFeed(); // Sync
    };

    const handleCreatePost = () => {
        if (selectedCommunity) {
            router.push({
                pathname: '/create-community-post',
                params: { communityId: selectedCommunity.id }
            });
        }
    };

    // 3D Scroll Logic
    const [focusedId, setFocusedId] = useState<string | null>(null);
    const { height: screenHeight } = Dimensions.get('window');
    const [containerHeight, setContainerHeight] = useState(screenHeight);
    const [headerHeight, setHeaderHeight] = useState(0);

    // Snapping Logic
    const [snapOffsets, setSnapOffsets] = useState<number[]>([]);
    const itemHeights = useRef(new Map<number, number>());
    const updateSnapOffsetsTimeout = useRef<NodeJS.Timeout | null>(null);

    const recalculateOffsets = useCallback(() => {
        const offsets: number[] = [];

        // Use ACTUAL container height for precise centering
        // If containerHeight is 0 (initial), fallback to screenHeight to avoid NaNs
        const visibleHeight = containerHeight > 0 ? containerHeight : screenHeight;

        // Layout Configuration
        const PADDING_TOP = selectedCommunity ? 120 : visibleHeight * 0.35;
        const ITEM_MARGIN = 24; // 12 top + 12 bottom

        // Start from Padding + Header Height (so items are shifted down by header)
        let currentY = PADDING_TOP + headerHeight;

        const sortedIndices = Array.from(itemHeights.current.keys()).sort((a, b) => a - b);

        if (sortedIndices.length === 0) return;
        const maxIndex = sortedIndices[sortedIndices.length - 1];

        for (let i = 0; i <= maxIndex; i++) {
            const h = itemHeights.current.get(i) || 200;

            // Center of this item relative to the scroll view content:
            const itemStart = currentY + (ITEM_MARGIN / 2);
            const itemCenter = itemStart + (h / 2);

            // Snap Offset: The scroll position where this point is in the middle of screen.
            // visibleHeight / 2 is the visual center relative to the top of the container.
            const centerOffset = itemCenter - (visibleHeight / 2);
            offsets.push(Math.max(0, centerOffset));

            // Advance running Y
            currentY += h + ITEM_MARGIN;
        }

        setSnapOffsets(offsets);
    }, [containerHeight, screenHeight, selectedCommunity, headerHeight]);

    // Recalculate when header height changes
    useEffect(() => {
        recalculateOffsets();
    }, [headerHeight]);

    const handleItemLayout = useCallback((index: number, event: any) => {
        const { height } = event.nativeEvent.layout;
        itemHeights.current.set(index, height);

        // Debounce calculation to avoid thrashing
        if (updateSnapOffsetsTimeout.current) clearTimeout(updateSnapOffsetsTimeout.current);

        updateSnapOffsetsTimeout.current = setTimeout(recalculateOffsets, 100);
    }, [recalculateOffsets]);

    const handleScroll = useCallback((event: any) => {
        const offsetY = event.nativeEvent.contentOffset.y;

        // Find closest snap offset
        // We can optimize this binary search later if needed, but linear is fine for <100 items
        let minDiff = Infinity;
        let closestIndex = -1;

        snapOffsets.forEach((snapOffset, index) => {
            const diff = Math.abs(offsetY - snapOffset);
            if (diff < minDiff) {
                minDiff = diff;
                closestIndex = index;
            }
        });

        if (closestIndex !== -1 && feed[closestIndex]) {
            setFocusedId(feed[closestIndex].id);
        }
    }, [snapOffsets, feed]);

    const handleActionComment = useCallback((itemId: string) => {
        console.log("Open comments for", itemId);
    }, []);

    const handleActionDelete = useCallback(() => {
        fetchFeed();
    }, []);

    const handleActionProfile = useCallback((userId: string) => {
        router.push({
            pathname: '/user-profile',
            params: { userId }
        });
    }, []);

    const handleViewableItemsChanged = useCallback(({ viewableItems }: any) => {
        if (!session?.user) return;

        // Autoplay Logic - Keep this for video visibility
        const visibleIds = viewableItems.map((v: any) => v.item.id);
        setViewableItemIds(visibleIds);

        // Track Views
        viewableItems.forEach(async (viewToken: any) => {
            const item = viewToken.item;
            if (['insight', 'timelapse', 'post'].includes(item.type)) {
                const newCounts = await ViewTracking.markAsViewed(session.user.id, item.id, item.type, viewCounts);
                setViewCounts(newCounts);
            }
        });
    }, [session?.user, viewCounts]);



    const renderItem = ({ item, index }: { item: any, index: number }) => {
        const isFocused = focusedId === item.id;

        let content;
        if (item.type === 'insight') {
            content = <InsightCard insight={item} />;
        } else if (item.type === 'timelapse') {
            // Play only if FOCUSED (stricter than visible)
            content = (
                <TimelapseFeedCard
                    item={item}
                    currentUserId={session?.user?.id || ''}
                    isVisible={isFocused}
                    onCommentPress={() => handleActionComment(item.id)}
                    onDelete={handleActionDelete}
                    onProfilePress={() => handleActionProfile(item.user_id)}
                />
            );
        } else {
            content = (
                <FeedItem
                    item={item}
                    currentUserId={session?.user?.id || ''}
                    onCommentPress={() => handleActionComment(item.id)}
                    onProfilePress={() => handleActionProfile(item.user_id)}
                />
            );
        }

        return (
            <AnimatedFeedItem
                isFocused={isFocused}
                onLayout={(e) => handleItemLayout(index, e)}
            >
                {content}
            </AnimatedFeedItem>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>

            {/* Header/Selector removed (handled by parent Index) */}

            {/* Feed List */}

            <FlatList
                ref={flatListRef}
                data={feed}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                onViewableItemsChanged={handleViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}

                // Snap Props
                snapToOffsets={snapOffsets}
                snapToAlignment="start"
                decelerationRate="fast"
                disableIntervalMomentum={true} // Strict "One Item Per Scroll"

                ListHeaderComponent={
                    <View
                        style={styles.headerCtaContainer}
                        onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
                    >
                        <View style={[styles.ctaContent, { backgroundColor: colors.card + 'D0', borderColor: colors.border }]}>
                            <View>
                                <Text style={[styles.ctaTitle, { color: colors.text }]}>What are you working on?</Text>
                                <Text style={[styles.ctaSubtitle, { color: colors.textSecondary }]}>Share a quick update</Text>
                            </View>
                            <TouchableOpacity
                                style={[styles.ctaButton, { backgroundColor: colors.primary }]}
                                onPress={() => router.push('/(tabs)/create')}
                            >
                                <Text style={styles.ctaButtonText}>Post</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                }

                // Scroll Handling
                onScroll={handleScroll}
                scrollEventThrottle={16} // 60fps

                // Optimization to prevent flickering
                removeClippedSubviews={false} // Keep views mounted to avoid image reload flicker
                windowSize={5} // Render more items ahead/behind
                initialNumToRender={3}
                maxToRenderPerBatch={3}
                showsVerticalScrollIndicator={false}

                onLayout={(e) => {
                    const { height } = e.nativeEvent.layout;
                    if (Math.abs(height - containerHeight) > 10) {
                        setContainerHeight(height);
                    }
                }}

                onScrollToIndexFailed={(info) => {
                    const wait = new Promise(resolve => setTimeout(resolve, 500));
                    wait.then(() => {
                        flatListRef.current?.scrollToIndex({ index: info.index, animated: true, viewPosition: 0.5 });
                    });
                }}

                contentContainerStyle={{
                    // Inverted List for Chat:
                    paddingTop: selectedCommunity ? 120 : containerHeight * 0.35,
                    paddingBottom: containerHeight * 0.35,
                    paddingHorizontal: 0
                }}
                inverted={!!selectedCommunity}

                refreshing={refreshing}
                onRefresh={fetchFeed}
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.emptyContainer}>
                            <Text style={{ color: colors.textSecondary }}>No posts yet.</Text>
                        </View>
                    ) : null
                }
            />

            {/* Loading Indicator */}
            {loading && (
                <View style={[styles.loadingOverlay, { top: insets.top + 150 }]}>
                    <ActivityIndicator color={colors.primary} />
                </View>
            )}

            {/* Chat Input (Only for Specific Groups) */}
            {selectedCommunity && (
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0} // Adjust for TabBar height
                    style={[styles.inputWrapper, { bottom: Platform.OS === 'ios' ? 85 : 65 }]} // Floating above TabBar
                >
                    <View style={[styles.inputContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
                        <TouchableOpacity onPress={handleCreatePost} style={styles.attachButton}>
                            <Feather name="plus" size={24} color={colors.primary} />
                        </TouchableOpacity>

                        <TextInput
                            style={[styles.textInput, { color: colors.text, backgroundColor: colors.background }]}
                            placeholder={`Message ${selectedCommunity.name}...`}
                            placeholderTextColor={colors.textSecondary}
                            value={messageText}
                            onChangeText={setMessageText}
                            multiline
                        />

                        <TouchableOpacity
                            onPress={handleSendMessage}
                            style={[styles.sendButton, { opacity: messageText.trim() ? 1 : 0.5 }]}
                            disabled={!messageText.trim() || sending}
                        >
                            <Feather name="send" size={20} color="white" />
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingOverlay: {
        position: 'absolute',
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 40,
    },
    inputWrapper: {
        position: 'absolute',
        left: 0,
        right: 0,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderTopWidth: 1,
    },
    attachButton: {
        padding: 8,
        marginRight: 8,
    },
    textInput: {
        flex: 1,
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
        maxHeight: 80,
        fontSize: 14,
        fontWeight: '400',
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#4F46E5',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },
    headerCtaContainer: {
        marginBottom: 20,
        marginHorizontal: 20,
        alignItems: 'center',
    },
    ctaContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        // Glass effect simulated
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    ctaTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    ctaSubtitle: {
        fontSize: 12,
    },
    ctaButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
    },
    ctaButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
});
