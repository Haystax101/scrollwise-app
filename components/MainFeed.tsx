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
  const [hasScrolledToInitial, setHasScrolledToInitial] = useState(false);
  const feedAlgorithmRef = useRef<FeedAlgorithm | null>(null);
  const [hasMore, setHasMore] = useState(true);

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

  // Load initial feed (first 10 articles)
  const loadInitialFeed = async () => {
    console.log('🔍 MainFeed: loadInitialFeed called');
    if (!feedAlgorithmRef.current) {
      console.log('🔍 MainFeed: No feedAlgorithmRef, returning');
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      console.log('📊 FeedAlgorithm: Loading initial feed for industries:', industryIds);
      const newArticles = await feedAlgorithmRef.current.fetchArticles(10);
      console.log('📊 FeedAlgorithm: Fetched', newArticles.length, 'articles');
      console.log('📊 FeedAlgorithm: Articles:', newArticles.map(a => ({ id: a.id, title: a.title, type: a.type, industry: a.industry })));
      
      setArticles(newArticles);
      setHasMore(newArticles.length === 10); // Assume there's more if we got exactly 10
      setCurrentArticleIndex(0);
      
      // Handle initial article ID if provided
      if (initialArticleId && newArticles.length > 0) {
        const idx = newArticles.findIndex((article) => article.id === initialArticleId);
        if (idx !== -1) {
          setCurrentArticleIndex(idx);
        }
      }
    } catch (error) {
      console.error('📊 FeedAlgorithm: Error loading initial feed:', error);
      setArticles([]);
    }
    console.log('🔍 MainFeed: Setting isLoading to false');
    setIsLoading(false);
  };

  // Load more articles for infinite scroll
  const loadMoreArticles = useCallback(async () => {
    if (!feedAlgorithmRef.current || isLoadingMore || !hasMore) return;
    
    setIsLoadingMore(true);
    try {
      console.log('📊 FeedAlgorithm: Loading more articles...');
      const newArticles = await feedAlgorithmRef.current.fetchArticles(10);
      console.log('📊 FeedAlgorithm: Fetched', newArticles.length, 'more articles');
      
      if (newArticles.length > 0) {
        setArticles(prev => [...prev, ...newArticles]);
        setHasMore(newArticles.length === 10); // If we got less than 10, probably no more
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('📊 FeedAlgorithm: Error loading more articles:', error);
    }
    setIsLoadingMore(false);
  }, [isLoadingMore, hasMore]);

  // Pull to refresh - reset and load fresh feed
  const handleRefresh = useCallback(async () => {
    if (!feedAlgorithmRef.current) return;
    
    setIsRefreshing(true);
    try {
      console.log('📊 FeedAlgorithm: Refreshing feed...');
      feedAlgorithmRef.current.reset(); // Reset algorithm state
      const newArticles = await feedAlgorithmRef.current.fetchArticles(10);
      console.log('📊 FeedAlgorithm: Refreshed with', newArticles.length, 'articles');
      
      setArticles(newArticles);
      setHasMore(newArticles.length === 10);
      setCurrentArticleIndex(0);
      
      // Scroll back to top
      if (flatListRef.current && newArticles.length > 0) {
        flatListRef.current.scrollToIndex({ index: 0, animated: true });
      }
    } catch (error) {
      console.error('📊 FeedAlgorithm: Error refreshing feed:', error);
    }
    setIsRefreshing(false);
  }, []);

  // Imperatively scroll to the correct index after articles are loaded
  useEffect(() => {
    if (
      initialArticleId &&
      articles.length > 0 &&
      !hasScrolledToInitial
    ) {
      const idx = articles.findIndex((article) => article.id === initialArticleId);
      if (idx !== -1 && flatListRef.current) {
        flatListRef.current.scrollToIndex({ index: idx, animated: false });
        setHasScrolledToInitial(true);
      }
    }
  }, [initialArticleId, articles, hasScrolledToInitial]);

  // Handle viewable items change - optimized with fewer dependencies
  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const newIndex = viewableItems[0].index;
      setCurrentArticleIndex(newIndex);
      
      // Trigger infinite scroll when user reaches 6th or 7th item
      if (newIndex >= 5 && newIndex <= articles.length - 5) {
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
        onEndReachedThreshold={0.1} // Backup infinite scroll trigger
        onEndReached={loadMoreArticles}
        // Performance optimization props
        removeClippedSubviews={true} // Remove off-screen views to free up resources
        maxToRenderPerBatch={5} // Reduce batch size for smoother scrolling
        updateCellsBatchingPeriod={100} // Increase batching period for better responsiveness
        initialNumToRender={3} // Only render 3 items initially to improve startup time
        windowSize={10} // Reduce window size to save memory while maintaining smooth scrolling
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
