import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, Text, FlatList, ActivityIndicator, Dimensions, StyleSheet, RefreshControl } from 'react-native';
import { VideoCard } from './VideoCard';
import type { Article } from '../types';
import { FeedAlgorithm } from '../lib/feedAlgorithm';
import { useAuth } from '../context/AuthContext';
import { CommentsModal } from './CommentsModal';

interface MainFeedProps {
  industries: number[]; // Changed from string[] to number[]
  initialArticleId?: number;
}

const { height: screenHeight } = Dimensions.get('window');

export const MainFeed: React.FC<MainFeedProps> = ({ industries, initialArticleId }) => {
  const { user } = useAuth();
  const [currentArticleIndex, setCurrentArticleIndex] = useState(0);
  const [articles, setArticles] = useState<Article[]>([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [commentsArticleId, setCommentsArticleId] = useState<number | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const feedAlgorithmRef = useRef<FeedAlgorithm | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // Debug logging for props
  console.log('🔍 MainFeed: Component initialized with props:', {
    industries,
    initialArticleId,
    userId: user?.id
  });

  // Industries are already numbers, no conversion needed
  const industryIds = industries;

  // Initialize feed algorithm when user or industries change
  useEffect(() => {
    console.log('🔍 MainFeed: useEffect triggered');
    console.log('🔍 MainFeed: user exists?', !!user);
    console.log('🔍 MainFeed: user id:', user?.id);
    console.log('🔍 MainFeed: industries:', industries);
    console.log('🔍 MainFeed: industryIds:', industryIds);
    
    if (user && industryIds.length > 0) {
      console.log('🔍 MainFeed: Creating FeedAlgorithm and loading initial feed');
      feedAlgorithmRef.current = new FeedAlgorithm(user.id, industryIds);
      loadInitialFeed();
    } else {
      console.log('🔍 MainFeed: Missing user or industries, not loading feed');
      setIsLoading(false);
    }
  }, [user, industries.join(',')]);

  // Load initial feed (first 3 articles for faster loading, or specific article if provided)
  const loadInitialFeed = async () => {
    console.log('🔍 MainFeed: loadInitialFeed called');
    if (!feedAlgorithmRef.current) {
      console.log('🔍 MainFeed: No feedAlgorithmRef, returning');
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      let newArticles: Article[] = [];
      
      // If we have an initialArticleId (from saved post), fetch that specific article first
      if (initialArticleId) {
        console.log('🔍 MainFeed: SAVED POST FLOW - initialArticleId detected:', initialArticleId);
        console.log('🔍 MainFeed: SAVED POST FLOW - feedAlgorithmRef exists:', !!feedAlgorithmRef.current);
        console.log('🔍 MainFeed: SAVED POST FLOW - About to call fetchSpecificArticle...');
        
        const specificArticle = await feedAlgorithmRef.current.fetchSpecificArticle(initialArticleId);
        
        console.log('🔍 MainFeed: SAVED POST FLOW - fetchSpecificArticle result:', specificArticle);
        
        if (specificArticle) {
          console.log('🔍 MainFeed: SAVED POST FLOW - SUCCESS! Found specific article:', {
            id: specificArticle.id,
            title: specificArticle.title,
            type: specificArticle.type
          });
          newArticles.push(specificArticle);
          console.log('🔍 MainFeed: SAVED POST FLOW - Added to newArticles, length now:', newArticles.length);
          setCurrentArticleIndex(0); // Start viewing the specific article
        } else {
          console.log('🔍 MainFeed: SAVED POST FLOW - FAILED! Specific article not found, loading regular feed');
        }
      } else {
        console.log('🔍 MainFeed: NORMAL FLOW - No initialArticleId, loading regular feed');
      }
      
      // Load additional articles from algorithm (will exclude the specific one if it was fetched)
      const remainingCount = initialArticleId ? 2 : 3; // Load 2 more if we have specific article, 3 if not
      console.log('📊 FeedAlgorithm: Loading', remainingCount, 'additional articles for industries:', industryIds);
      const algorithmArticles = await feedAlgorithmRef.current.fetchArticles(remainingCount);
      console.log('📊 FeedAlgorithm: Fetched', algorithmArticles.length, 'algorithm articles');
      
      // Combine specific article (if any) with algorithm articles
      newArticles = [...newArticles, ...algorithmArticles];
      console.log('🔍 MainFeed: FINAL STEP - Total articles to set:', newArticles.length);
      console.log('🔍 MainFeed: FINAL STEP - Articles details:', newArticles.map(a => ({ 
        id: a.id, 
        title: a.title?.substring(0, 50) + '...', 
        type: a.type, 
        industry: a.industry 
      })));
      
      console.log('🔍 MainFeed: FINAL STEP - Calling setArticles...');
      setArticles(newArticles);
      console.log('🔍 MainFeed: FINAL STEP - setArticles completed');
      setHasMore(true); // Always assume there's more after initial small batch
      
      // Set initial index - 0 if we have a specific article, otherwise 0 for first algorithm article
      if (!initialArticleId) {
        setCurrentArticleIndex(0);
      }
      
      // Start background prefetching immediately after initial load
      setTimeout(() => {
        prefetchMoreArticles();
      }, 100); // Small delay to ensure UI is responsive
      
    } catch (error) {
      console.error('📊 FeedAlgorithm: Error loading initial feed:', error);
      setArticles([]);
    }
    console.log('🔍 MainFeed: Setting isLoading to false');
    setIsLoading(false);
  };

  // Background prefetch function for smoother experience
  const prefetchMoreArticles = useCallback(async () => {
    if (!feedAlgorithmRef.current || isLoadingMore || !hasMore) return;
    
    try {
      console.log('📊 FeedAlgorithm: Background prefetching articles...');
      const newArticles = await feedAlgorithmRef.current.fetchArticles(7); // Prefetch 7 more to total 10
      console.log('📊 FeedAlgorithm: Prefetched', newArticles.length, 'articles in background');
      
      if (newArticles.length > 0) {
        setArticles(prev => [...prev, ...newArticles]);
        setHasMore(newArticles.length === 7); // If we got less than 7, probably no more
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('📊 FeedAlgorithm: Error prefetching articles:', error);
    }
  }, [isLoadingMore, hasMore]);

  // Load more articles for infinite scroll
  const loadMoreArticles = useCallback(async () => {
    if (!feedAlgorithmRef.current || isLoadingMore || !hasMore) return;
    
    setIsLoadingMore(true);
    try {
      console.log('📊 FeedAlgorithm: Loading more articles...');
      const newArticles = await feedAlgorithmRef.current.fetchArticles(8); // Load 8 more for smooth scrolling
      console.log('📊 FeedAlgorithm: Fetched', newArticles.length, 'more articles');
      
      if (newArticles.length > 0) {
        setArticles(prev => [...prev, ...newArticles]);
        setHasMore(newArticles.length === 8); // If we got less than 8, probably no more
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('📊 FeedAlgorithm: Error loading more articles:', error);
    }
    setIsLoadingMore(false);
  }, [isLoadingMore, hasMore]);

  // Pull to refresh - reset and load fresh feed (maintaining specific article if present)
  const handleRefresh = useCallback(async () => {
    if (!feedAlgorithmRef.current) return;
    
    setIsRefreshing(true);
    try {
      console.log('📊 FeedAlgorithm: Refreshing feed...');
      feedAlgorithmRef.current.reset(); // Reset algorithm state
      
      let newArticles: Article[] = [];
      
      // If we have an initialArticleId, fetch it first again (in case it was updated)
      if (initialArticleId) {
        console.log('📊 FeedAlgorithm: Re-fetching specific saved article on refresh:', initialArticleId);
        const specificArticle = await feedAlgorithmRef.current.fetchSpecificArticle(initialArticleId);
        
        if (specificArticle) {
          console.log('📊 FeedAlgorithm: Re-found specific article:', specificArticle.title);
          newArticles.push(specificArticle);
        }
      }
      
      // Load additional fresh articles
      const remainingCount = initialArticleId ? 2 : 3;
      const algorithmArticles = await feedAlgorithmRef.current.fetchArticles(remainingCount);
      newArticles = [...newArticles, ...algorithmArticles];
      
      console.log('📊 FeedAlgorithm: Refreshed with', newArticles.length, 'total articles');
      
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
      console.error('📊 FeedAlgorithm: Error refreshing feed:', error);
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
      console.log('📊 FeedAlgorithm: Updated interaction -', action, 'for article', articleId);
    }
  }, []);

  // Memoized render item function - removes unnecessary View wrapper
  const renderItem = useCallback(({ item, index }: { item: Article; index: number }) => (
    <VideoCard
      video={item}
      isActive={index === currentArticleIndex}
      onOpenComments={handleOpenComments}
      onUserInteraction={handleUserInteraction}
    />
  ), [currentArticleIndex, handleOpenComments, handleUserInteraction]);

  // Memoized key extractor
  const keyExtractor = useCallback((item: Article) => item.id.toString(), []);

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
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#3b82f6" />
        <Text style={styles.footerText}>Loading more articles...</Text>
      </View>
    );
  }, [isLoadingMore]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="white" />
        <Text style={styles.loadingText}>Curating your personalized feed...</Text>
      </View>
    );
  }

  if (articles.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No articles available for the selected industries. Please update your preferences in Profile or try refreshing.</Text>
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
        style={styles.list}
        accessibilityHint="Scroll vertically to read articles"
        initialScrollIndex={currentArticleIndex}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#3b82f6"
            colors={['#3b82f6']}
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

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingHorizontal: 20,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingHorizontal: 16,
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
  },
  list: {
    backgroundColor: '#000',
  },
  footerLoader: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#000',
  },
  footerText: {
    color: '#fff',
    marginTop: 8,
    fontSize: 14,
  },
});
