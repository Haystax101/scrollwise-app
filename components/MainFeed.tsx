import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, FlatList, ActivityIndicator, Dimensions, StyleSheet, RefreshControl } from 'react-native';
import { ArticleCard } from './ArticleCard';
import { PaperCard } from './PaperCard';
import { BookCard } from './BookCard';
import InsightCard from './InsightCard';
import type { Article, Insight, FeedItem, Industry, Paper, Book } from '../types';
import { FeedManager } from '../lib/FeedManager';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useIndustries } from '../context/IndustriesContext';
import { CommentsModal } from './CommentsModal';
import QuizCard, { QuizQuestion } from './QuizCard';
import { supabase } from '../lib/supabase';

/**
 * MainFeed Component - Completely Rewritten
 * 
 * Key improvements:
 * - Simple, predictable data flow
 * - Modern React patterns with custom hooks
 * - Clean separation of concerns
 * - Reliable infinite scroll without complex caching
 * - Standard deduplication using React keys and Set-based tracking
 */

interface MainFeedProps {
  industries: Industry[];
  initialArticleId?: number | string;
  initialContentType?: 'article' | 'paper' | 'book' | 'insight';
  trackScroll?: (scrollPercent: number) => void;
  trackInteraction?: (interactionType: string, data?: Record<string, any>) => void;
  trackContentEngagement?: (contentType: string, contentId: string, engagementType: string, data?: Record<string, any>) => void;
}

const { height: screenHeight } = Dimensions.get('window');

/**
 * Custom hook for feed data management
 */
function useFeedData(feedManager: FeedManager | null, initialContentId?: number | string, initialContentType?: string) {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Track displayed content IDs to prevent duplicates
  const displayedIds = useMemo(() => new Set(feedItems.map(item => String(item.id))), [feedItems]);

  const loadInitialContent = useCallback(async () => {
    if (!feedManager) return;

    setIsLoading(true);
    try {
      let initialContent: FeedItem[] = [];

      // If we have an initial content ID, fetch it first
      if (initialContentId && initialContentType) {
        const specificContent = await feedManager.fetchSpecificContent(
          initialContentId, 
          initialContentType as 'article' | 'paper' | 'book' | 'insight'
        );
        if (specificContent) {
          initialContent = [specificContent];
        }
      }

      // Fetch additional content for the feed
      const additionalContent = await feedManager.fetchContent(initialContent.length > 0 ? 9 : 10);
      
      // Combine and deduplicate
      const allContent = [...initialContent, ...additionalContent];
      const uniqueContent = allContent.filter((item, index, self) => 
        self.findIndex(i => String(i.id) === String(item.id)) === index
      );

      setFeedItems(uniqueContent);
      setHasMore(uniqueContent.length >= 8); // Assume more content exists if we got a good amount
    } catch (error) {
      console.error('📱 MainFeed: Error loading initial content:', error);
    } finally {
      setIsLoading(false);
    }
  }, [feedManager, initialContentId, initialContentType]);

  const loadMoreContent = useCallback(async () => {
    if (!feedManager || isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    try {
      const moreContent = await feedManager.fetchContent(10);
      
      // Filter out already displayed content
      const newContent = moreContent.filter(item => !displayedIds.has(String(item.id)));
      
      if (newContent.length > 0) {
        setFeedItems(prev => [...prev, ...newContent]);
        setHasMore(newContent.length >= 5); // Continue if we got a reasonable amount
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('📱 MainFeed: Error loading more content:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [feedManager, isLoadingMore, hasMore, displayedIds]);

  const refreshContent = useCallback(async () => {
    if (!feedManager) return;

    setIsRefreshing(true);
    try {
      // Clear current content and reload
      setFeedItems([]);
      
      const freshContent = await feedManager.fetchContent(10);
      const uniqueContent = freshContent.filter((item, index, self) => 
        self.findIndex(i => String(i.id) === String(item.id)) === index
      );

      setFeedItems(uniqueContent);
      setHasMore(true);
    } catch (error) {
      console.error('📱 MainFeed: Error refreshing content:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [feedManager]);

  return {
    feedItems,
    isLoading,
    isLoadingMore,
    isRefreshing,
    hasMore,
    loadInitialContent,
    loadMoreContent,
    refreshContent
  };
}

/**
 * Custom hook for content interaction tracking
 */
function useContentTracking(
  feedManager: FeedManager | null,
  trackScroll?: (scrollPercent: number) => void,
  trackInteraction?: (interactionType: string, data?: Record<string, any>) => void,
  trackContentEngagement?: (contentType: string, contentId: string, engagementType: string, data?: Record<string, any>) => void
) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scrollCount, setScrollCount] = useState(0);

  const handleViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const newIndex = viewableItems[0].index;
      const currentItem = viewableItems[0].item as FeedItem;

      // Update current index
      const oldIndex = currentIndex;
      setCurrentIndex(newIndex);

      // Track viewed content
      if (feedManager && currentItem) {
        feedManager.markAsViewed(currentItem.id, currentItem.type);
        
        // Track engagement
        trackContentEngagement?.(
          currentItem.type,
          String(currentItem.id),
          'view',
          {
            content_title: 'title' in currentItem ? currentItem.title : 'Insight',
            scroll_position: newIndex
          }
        );
      }

      // Track scroll activity
      if (newIndex > oldIndex) {
        const newScrollCount = scrollCount + 1;
        setScrollCount(newScrollCount);
        
        trackScroll?.(newIndex * 10); // Simple scroll percentage
        trackInteraction?.('scroll', {
          from_index: oldIndex,
          to_index: newIndex,
          content_type: currentItem?.type
        });
      }
    }
  }, [currentIndex, scrollCount, feedManager, trackScroll, trackInteraction, trackContentEngagement]);

  const handleUserInteraction = useCallback((contentId: number, action: 'like' | 'save' | 'unlike' | 'unsave') => {
    trackInteraction?.(action, {
      content_id: contentId,
      engagement_type: action
    });
  }, [trackInteraction]);

  return {
    currentIndex,
    handleViewableItemsChanged,
    handleUserInteraction
  };
}

/**
 * Main Feed Component
 */
export const MainFeed: React.FC<MainFeedProps> = ({
  industries,
  initialArticleId,
  initialContentType,
  trackScroll,
  trackInteraction,
  trackContentEngagement
}) => {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { allIndustries } = useIndustries();

  // Comments modal state
  const [commentsArticleId, setCommentsArticleId] = useState<number | null>(null);

  // Quiz state (simplified)
  const [quizVisible, setQuizVisible] = useState(false);
  const [quizQuestion, setQuizQuestion] = useState<QuizQuestion | null>(null);

  // Create feed manager
  const feedManager = useMemo(() => {
    if (!user || industries.length === 0 || allIndustries.length === 0) {
      return null;
    }
    
    const industryIds = industries.map(ind => ind.id);
    return new FeedManager(user.id, industryIds, allIndustries);
  }, [user, industries, allIndustries]);

  // Use custom hooks for data and tracking
  const {
    feedItems,
    isLoading,
    isLoadingMore,
    isRefreshing,
    hasMore,
    loadInitialContent,
    loadMoreContent,
    refreshContent
  } = useFeedData(feedManager, initialArticleId, initialContentType);

  const {
    currentIndex,
    handleViewableItemsChanged,
    handleUserInteraction
  } = useContentTracking(feedManager, trackScroll, trackInteraction, trackContentEngagement);

  // Load initial content when feed manager is ready
  useEffect(() => {
    if (feedManager) {
      loadInitialContent();
    }
  }, [feedManager, loadInitialContent]);

  // Memoized callbacks
  const handleOpenComments = useCallback((articleId: number) => {
    setCommentsArticleId(articleId);
  }, []);

  const handleCloseComments = useCallback(() => {
    setCommentsArticleId(null);
  }, []);

  const handleCommentsCountChange = useCallback((count: number) => {
    // Update comment count in feed items - simple approach
    // In a production app, you might want to use a state management solution here
  }, []);

  // Memoized render functions
  const renderItem = useCallback(({ item, index }: { item: FeedItem; index: number }) => {
    const isActive = index === currentIndex;

    switch (item.type) {
      case 'article':
        return (
          <ArticleCard
            article={item as Article}
            isActive={isActive}
            onOpenComments={handleOpenComments}
            onUserInteraction={handleUserInteraction}
          />
        );
      case 'paper':
        return (
          <PaperCard
            paper={item as Paper}
            isActive={isActive}
            onOpenComments={handleOpenComments}
            onUserInteraction={handleUserInteraction}
          />
        );
      case 'book':
        return (
          <BookCard
            book={item as Book}
            onOpenComments={handleOpenComments}
            onUserInteraction={handleUserInteraction}
          />
        );
      case 'insight':
        return <InsightCard insight={item as Insight} />;
      default:
        return null;
    }
  }, [currentIndex, handleOpenComments, handleUserInteraction]);

  const keyExtractor = useCallback((item: FeedItem) => String(item.id), []);

  const getItemLayout = useCallback((_data: any, index: number) => ({
    length: screenHeight,
    offset: screenHeight * index,
    index
  }), []);

  const renderFooter = useCallback(() => {
    if (!isLoadingMore) return null;
    return (
      <View style={[styles.footerLoader, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={[styles.footerText, { color: colors.text }]}>Loading more content...</Text>
      </View>
    );
  }, [isLoadingMore, colors]);

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Loading your personalized feed...
        </Text>
      </View>
    );
  }

  // Empty state
  if (feedItems.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.emptyText, { color: colors.text }]}>
          No content available. Try refreshing or updating your industry preferences.
        </Text>
      </View>
    );
  }

  return (
    <>
      <FlatList
        data={feedItems}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        getItemLayout={getItemLayout}
        style={[styles.list, { backgroundColor: colors.background }]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshContent}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListFooterComponent={renderFooter}
        onEndReached={loadMoreContent}
        onEndReachedThreshold={0.5}
        // Performance optimizations
        removeClippedSubviews={true}
        maxToRenderPerBatch={3}
        updateCellsBatchingPeriod={50}
        initialNumToRender={2}
        windowSize={5}
      />

      {/* Comments Modal */}
      <CommentsModal
        videoId={commentsArticleId}
        visible={!!commentsArticleId}
        onClose={handleCloseComments}
        onCommentsCountChange={handleCommentsCountChange}
        contentType={
          commentsArticleId 
            ? (feedItems.find(item => item.id === commentsArticleId)?.type as 'article' | 'paper' | 'book') || 'article'
            : undefined
        }
      />

      {/* Quiz Modal - Simplified */}
      <QuizCard 
        visible={quizVisible} 
        onClose={() => setQuizVisible(false)} 
        question={quizQuestion} 
      />
    </>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  emptyText: {
    fontSize: 18,
    textAlign: 'center',
  },
  list: {
    flex: 1,
  },
  footerLoader: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    marginTop: 8,
    fontSize: 14,
  },
});