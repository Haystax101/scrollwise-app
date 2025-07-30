import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, Text, FlatList, ActivityIndicator, Dimensions, StyleSheet, RefreshControl } from 'react-native';
import { VideoCard } from './VideoCard';
import InsightCard from './InsightCard';
import type { Article, Insight, FeedItem } from '../types';
import { FeedAlgorithm } from '../lib/feedAlgorithm';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useIndustries } from '../context/IndustriesContext'; // <-- ADD THIS LINE
import { CommentsModal } from './CommentsModal';
import { supabase } from '../lib/supabase';

interface MainFeedProps {
  industries: Industry[]; // Changed from number[] to Industry[]
  initialArticleId?: number;
}

const { height: screenHeight } = Dimensions.get('window');

export const MainFeed: React.FC<MainFeedProps> = ({ industries, initialArticleId }) => {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { allIndustries } = useIndustries(); // Get all industries
  const [currentArticleIndex, setCurrentArticleIndex] = useState(0);
  const [articles, setArticles] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [commentsArticleId, setCommentsArticleId] = useState<number | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const feedAlgorithmRef = useRef<FeedAlgorithm | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // Extract just the industry IDs for the algorithm
  const industryIds = useMemo(() => industries.map(ind => ind.id), [industries]);

  // Initialize feed algorithm when user or industries change
  useEffect(() => {
    if (user && industryIds.length > 0 && allIndustries.length > 0) {
      feedAlgorithmRef.current = new FeedAlgorithm(user.id, industryIds, allIndustries);
      loadInitialFeed();
    } else if (!user || industryIds.length === 0) {
      setIsLoading(false);
    }
  }, [user, industryIds.join(','), allIndustries]);

  // Load initial feed (first 3 articles for faster loading, or specific article if provided)
  const loadInitialFeed = async () => {
    if (!feedAlgorithmRef.current) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      let newArticles: Article[] = [];
      
      // If we have an initialArticleId (from saved post), fetch that specific article first
      if (initialArticleId) {
        const specificArticle = await feedAlgorithmRef.current.fetchSpecificArticle(initialArticleId);
        
        if (specificArticle) {
          newArticles.push(specificArticle);
          setCurrentArticleIndex(0); // Start viewing the specific article
        }
      }
      
      // Load additional articles from algorithm
      const algorithmArticles = await feedAlgorithmRef.current.fetchArticles(3);
      
      // Fetch insights from other users
      if (user) {
        const { data: insightsData, error: insightsError } = await supabase
          .from('insights')
          .select(`
            id,
            content,
            author_id,
            author:profiles!author_id (
              full_name,
              avatar_url
            )
          `)
          .not('author_id', 'eq', user.id);
          
        if (insightsError) {
          console.error('Error fetching insights for feed:', insightsError);
        }
        
        const insights: Insight[] = (insightsData || [])
          .filter((item: any) => item.author) // Filter out insights with no author
          .map((item: any) => ({
            id: item.id,
            type: 'insight',
            content: item.content,
            author_id: item.author_id,
            author_name: item.author.full_name,
            author_avatar: item.author.avatar_url,
          }));
        
        // Combine insights and articles, with insights at the top
        const combinedFeed: FeedItem[] = [...insights, ...newArticles, ...algorithmArticles];
        
        setArticles(combinedFeed);
      } else {
        // If no user, just show articles
        setArticles([...newArticles, ...algorithmArticles]);
      }
      
      setHasMore(true);
      
      // Set initial index - 0 if we have a specific article, otherwise 0 for first algorithm article
      if (!initialArticleId) {
        setCurrentArticleIndex(0);
      }
      
      // Start background prefetching immediately after initial load
      setTimeout(() => {
        prefetchMoreArticles();
      }, 100); // Small delay to ensure UI is responsive
      
    } catch (error) {
      console.error('Error loading initial feed:', error);
      setArticles([]);
    }
    setIsLoading(false);
  };

  // Background prefetch function for smoother experience
  const prefetchMoreArticles = useCallback(async () => {
    if (!feedAlgorithmRef.current || isLoadingMore || !hasMore) return;
    
    try {
      const newArticles = await feedAlgorithmRef.current.fetchArticles(7); // Prefetch 7 more to total 10
      
      if (newArticles.length > 0) {
        setArticles(prev => [...prev, ...newArticles]);
        setHasMore(newArticles.length === 7); // If we got less than 7, probably no more
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error prefetching articles:', error);
    }
  }, [isLoadingMore, hasMore]);

  // Load more articles for infinite scroll
  const loadMoreArticles = useCallback(async () => {
    if (!feedAlgorithmRef.current || isLoadingMore || !hasMore) return;
    
    setIsLoadingMore(true);
    try {
      const newArticles = await feedAlgorithmRef.current.fetchArticles(8); // Load 8 more for smooth scrolling
      
      if (newArticles.length > 0) {
        setArticles(prev => [...prev, ...newArticles]);
        setHasMore(newArticles.length === 8); // If we got less than 8, probably no more
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more articles:', error);
    }
    setIsLoadingMore(false);
  }, [isLoadingMore, hasMore]);

  // Pull to refresh - reset and load fresh feed (maintaining specific article if present)
  const handleRefresh = useCallback(async () => {
    if (!feedAlgorithmRef.current) return;
    
    setIsRefreshing(true);
    try {
      feedAlgorithmRef.current.reset(); // Reset algorithm state
      
      let newArticles: Article[] = [];
      
      // If we have an initialArticleId, fetch it first again (in case it was updated)
      if (initialArticleId) {
        const specificArticle = await feedAlgorithmRef.current.fetchSpecificArticle(initialArticleId);
        
        if (specificArticle) {
          newArticles.push(specificArticle);
        }
      }
      
      // Load additional fresh articles
      const remainingCount = initialArticleId ? 2 : 3;
      const algorithmArticles = await feedAlgorithmRef.current.fetchArticles(remainingCount);
      newArticles = [...newArticles, ...algorithmArticles];
      
      setArticles(newArticles);
      setHasMore(true); // Always assume more after refresh
      setCurrentArticleIndex(0);
      
      // Scroll back to top
      if (flatListRef.current && newArticles.length > 0) {
        flatListRef.current.scrollToIndex({ index: 0, animated: true });
      }
      
      // Background prefetch after refresh
      setTimeout(() => {
        prefetchMoreArticles();
      }, 200); // Slightly longer delay for refresh
      
    } catch (error) {
      console.error('Error refreshing feed:', error);
    }
    setIsRefreshing(false);
  }, [prefetchMoreArticles, initialArticleId]);

  // Note: Removed scroll-to-index logic since specific articles are now positioned at the top of the feed

  // Handle viewable items change - optimized with fewer dependencies
  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const newIndex = viewableItems[0].index;
      setCurrentArticleIndex(newIndex);
      
      // Trigger infinite scroll earlier for smoother experience (when 2-3 items remain)
      if (newIndex >= 2 && newIndex >= articles.length - 3) {
        loadMoreArticles();
      }
    }
  }, [articles.length, loadMoreArticles]);

  // Memoize viewability config to prevent recreation
  const viewabilityConfig = useMemo(() => ({
    itemVisiblePercentThreshold: 50 // Item is considered viewable when 50% visible
  }), []);

  // Memoize callbacks to prevent recreation
  const handleOpenComments = useCallback((articleId: number) => {
    setCommentsArticleId(articleId);
  }, []);

  const handleCloseComments = useCallback(() => {
    setCommentsArticleId(null);
  }, []);

  // Update comment count in real time
  const handleCommentsCountChange = useCallback((count: number) => {
    if (commentsArticleId == null) return;
    setArticles((prev) => prev.map(article => article.id === commentsArticleId ? { ...article, comments: count } : article));
  }, [commentsArticleId]);

  // Track user interactions for the algorithm
  const handleUserInteraction = useCallback((articleId: number, action: 'like' | 'save' | 'unlike' | 'unsave') => {
    if (feedAlgorithmRef.current) {
      feedAlgorithmRef.current.updateUserInteraction(articleId, action);
    }
  }, []);

  // Memoized render item function - now with conditional rendering
  const renderItem = useCallback(({ item, index }: { item: FeedItem; index: number }) => {
    if (item.type === 'insight') {
      const insightProps = {
        id: String(item.id),
        content: (item as Insight).content,
        author_id: (item as Insight).author_id,
        author_name: (item as Insight).author_name,
        author_avatar: (item as Insight).author_avatar,
      };
      return <InsightCard insight={insightProps} />;
    }

    return (
      <VideoCard
        video={item as Article}
        isActive={index === currentArticleIndex}
        onOpenComments={handleOpenComments}
        onUserInteraction={handleUserInteraction}
      />
    );
  }, [currentArticleIndex, handleOpenComments, handleUserInteraction]);

  // Memoized key extractor
  const keyExtractor = useCallback((item: FeedItem) => item.id.toString(), []);

  // Memoized getItemLayout for performance optimization
  const getItemLayout = useCallback((_data: any, index: number) => ({
    length: screenHeight,
    offset: screenHeight * index,
    index
  }), []);

  // Render loading footer for infinite scroll
  const renderFooter = useCallback(() => {
    if (!isLoadingMore) return null;
    return (
      <View style={dynamicStyles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={dynamicStyles.footerText}>Loading more articles...</Text>
      </View>
    );
  }, [isLoadingMore, colors.primary]);

  const dynamicStyles = StyleSheet.create({
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
      paddingHorizontal: 20,
    },
    loadingText: {
      color: colors.text,
      fontSize: 16,
      marginTop: 16,
      textAlign: 'center',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
      paddingHorizontal: 16,
    },
    emptyText: {
      color: colors.text,
      fontSize: 18,
      textAlign: 'center',
    },
    list: {
      backgroundColor: colors.background,
    },
    footerLoader: {
      padding: 20,
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    footerText: {
      color: colors.text,
      marginTop: 8,
      fontSize: 14,
    },
  });

  if (isLoading) {
    return (
      <View style={dynamicStyles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={dynamicStyles.loadingText}>Curating your personalized feed...</Text>
      </View>
    );
  }

  if (articles.length === 0) {
    return (
      <View style={dynamicStyles.emptyContainer}>
        <Text style={dynamicStyles.emptyText}>No articles available for the selected industries. Please update your preferences in Profile or try refreshing.</Text>
      </View>
    );
  }
  
  return (
    <>
      <FlatList
        ref={flatListRef}
        data={articles}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        pagingEnabled // This creates the reel effect
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={getItemLayout}
        style={dynamicStyles.list}
        accessibilityHint="Scroll vertically to read articles"
        initialScrollIndex={currentArticleIndex}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListFooterComponent={renderFooter}
        onEndReachedThreshold={0.3} // Earlier trigger for smoother loading
        onEndReached={loadMoreArticles}
        // Performance optimization props
        removeClippedSubviews={true} // Remove off-screen views to free up resources
        maxToRenderPerBatch={4} // Reduced further for faster initial rendering
        updateCellsBatchingPeriod={50} // Faster batching for immediate responsiveness
        initialNumToRender={2} // Only render 2 items initially for fastest startup
        windowSize={8} // Smaller window for faster initial load
        legacyImplementation={false} // Use modern VirtualizedList implementation
      />
      {/* CommentsModal will be rendered here, controlled by commentsArticleId */}
      <CommentsModal
        videoId={commentsArticleId}
        visible={!!commentsArticleId}
        onClose={handleCloseComments}
        onCommentsCountChange={handleCommentsCountChange}
      />
    </>
  );
};

// Static styles removed - now using dynamic theme-based styles
