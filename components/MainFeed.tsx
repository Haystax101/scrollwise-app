import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, RefreshControl } from 'react-native';
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
import { supabase } from '../lib/supabase';
import { useResponsiveLayout } from '../utils/screenUtils';

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
        console.log(`🎯 MainFeed: Loading initial content - ID: ${initialContentId} (type: ${typeof initialContentId}), Type: ${initialContentType}`);
        const specificContent = await feedManager.fetchSpecificContent(
          initialContentId, 
          initialContentType as 'article' | 'paper' | 'book' | 'insight'
        );
        if (specificContent) {
          console.log(`✅ MainFeed: Successfully loaded initial content: ${specificContent.type} ${specificContent.id}`);
          initialContent = [specificContent];
        } else {
          console.error(`❌ MainFeed: Failed to load initial content: ${initialContentType} ${initialContentId}`);
        }
      }

      // Fetch additional content for the feed
      const targetCount = initialContent.length > 0 ? 9 : 10;
      console.log(`📱 MainFeed: Fetching ${targetCount} additional content items...`);
      const additionalContent = await feedManager.fetchContent(targetCount);
      console.log(`📱 MainFeed: fetchContent returned ${additionalContent.length} items`);

      // Combine and deduplicate
      const allContent = [...initialContent, ...additionalContent];
      console.log(`📱 MainFeed: Combined content: ${allContent.length} items total`);

      const uniqueContent = allContent.filter((item, index, self) =>
        self.findIndex(i => String(i.id) === String(item.id)) === index
      );
      console.log(`📱 MainFeed: After deduplication: ${uniqueContent.length} unique items`);

      setFeedItems(uniqueContent);

      if (uniqueContent.length === 0) {
        console.error(`📱 MainFeed: ❌ No content loaded! This will trigger empty state.`);
        console.error(`📱 MainFeed: Initial content: ${initialContent.length}, Additional: ${additionalContent.length}`);
      } else {
        console.log(`📱 MainFeed: ✅ Successfully loaded ${uniqueContent.length} feed items`);
      }

      // Always assume more content exists initially - let loadMoreContent determine if we're actually at the end
      setHasMore(true);
    } catch (error) {
      console.error('📱 MainFeed: Error loading initial content:', error);
    } finally {
      setIsLoading(false);
    }
  }, [feedManager, initialContentId, initialContentType]);

  const loadMoreContent = useCallback(async () => {
    console.log(`📱 MainFeed: loadMoreContent called - feedManager: ${!!feedManager}, isLoadingMore: ${isLoadingMore}, hasMore: ${hasMore}`);
    if (!feedManager || isLoadingMore || !hasMore) {
      console.log(`📱 MainFeed: loadMoreContent early return - not loading`);
      return;
    }

    console.log(`📱 MainFeed: Starting to load more content - current feed size: ${feedItems.length}`);
    setIsLoadingMore(true);
    try {
      const moreContent = await feedManager.fetchContent(10);
      console.log(`📱 MainFeed: Fetched ${moreContent.length} more items from FeedManager`);
      
      // Filter out already displayed content
      const newContent = moreContent.filter(item => !displayedIds.has(String(item.id)));
      console.log(`📱 MainFeed: After deduplication: ${newContent.length} new items (filtered ${moreContent.length - newContent.length} duplicates)`);
      
      if (newContent.length > 0) {
        setFeedItems(prev => {
          const updated = [...prev, ...newContent];
          console.log(`📱 MainFeed: Feed updated - from ${prev.length} to ${updated.length} items`);
          return updated;
        });
        // Continue loading if we got any content from database, even if some was filtered
        setHasMore(true); 
        console.log(`📱 MainFeed: hasMore remains true (added ${newContent.length} new items from ${moreContent.length} fetched)`);
      } else {
        // Only stop if database returned nothing OR returned very little (suggesting we're near the end)
        const shouldContinue = moreContent.length >= 3; // Be more conservative
        setHasMore(shouldContinue);
        console.log(`📱 MainFeed: No new content after deduplication - hasMore set to ${shouldContinue} (database returned ${moreContent.length} items)`);
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
      
      // IMPORTANT: Reset quiz session when feed refreshes to enforce 5-content rule - COMMENTED OUT
      // await feedManager.resetQuizSession();
      // console.log('🧠 MainFeed: Quiz session reset on refresh - user must view 5 content pieces before quiz');
      
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

  // Update specific feed item
  const updateFeedItem = useCallback((contentId: number, updates: { comments_count?: number }) => {
    setFeedItems(prev => 
      prev.map(item => 
        item.id === contentId ? { ...item, ...updates } as FeedItem : item
      )
    );
  }, []);

  return {
    feedItems,
    isLoading,
    isLoadingMore,
    isRefreshing,
    hasMore,
    loadInitialContent,
    loadMoreContent,
    refreshContent,
    updateFeedItem
  };
}

/**
 * Custom hook for content interaction tracking
 */
function useContentTracking(
  feedManager: FeedManager | null,
  trackScroll?: (scrollPercent: number) => void,
  trackInteraction?: (interactionType: string, data?: Record<string, any>) => void,
  trackContentEngagement?: (contentType: string, contentId: string, engagementType: string, data?: Record<string, any>) => void,
  recordContentView?: (contentId: string | number, contentType: string) => Promise<void>,
  // showQuizForRecentContent?: (currentIndex: number) => Promise<void>, // COMMENTED OUT
  // feedLocked?: boolean, // COMMENTED OUT
  feedItems?: FeedItem[],
  loadMoreContent?: () => Promise<void>,
  isLoadingMore?: boolean,
  hasMore?: boolean
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
        // Updated to pass the content item for quiz tracking
        feedManager.markAsViewed(currentItem.id, currentItem.type, currentItem);
        
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

        // Record content view in database for quiz system
        recordContentView?.(currentItem.id, currentItem.type);
      }

      // Track scroll activity and check for quiz triggers
      if (newIndex > oldIndex) {
        const newScrollCount = scrollCount + 1;
        setScrollCount(newScrollCount);
        
        trackScroll?.(newIndex * 10); // Simple scroll percentage
        trackInteraction?.('scroll', {
          from_index: oldIndex,
          to_index: newIndex,
          content_type: currentItem?.type
        });

        // Check if it's time to show a quiz using new QuizSessionManager - COMMENTED OUT
        // if (!feedLocked && feedManager && showQuizForRecentContent) {
        //   const quizCheck = feedManager.shouldShowQuiz();
        //   if (quizCheck.show) {
        //     console.log(`🧠 Quiz trigger: ${quizCheck.reason}`);
        //     showQuizForRecentContent(newIndex);
        //   } else {
        //     console.log(`🧠 Quiz check: ${quizCheck.reason}`);
        //   }
        // }

        // Preemptive loading: start loading more content when we're close to the end
        if (feedItems && loadMoreContent && hasMore && !isLoadingMore) { // Removed feedLocked check
          const remainingItems = feedItems.length - newIndex;
          const threshold = 3; // Start loading when 3 items remaining
          
          if (remainingItems <= threshold) {
            console.log(`🚀 Preemptive loading triggered - ${remainingItems} items remaining, threshold: ${threshold}`);
            loadMoreContent();
          }
        }
      }
    }
  }, [currentIndex, scrollCount, feedManager, trackScroll, trackInteraction, trackContentEngagement, recordContentView, feedItems, loadMoreContent, hasMore, isLoadingMore]);

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
  const { totalHeight } = useResponsiveLayout();

  // Comments modal state
  const [commentsArticleId, setCommentsArticleId] = useState<number | null>(null);

  // Quiz state with full functionality - COMMENTED OUT
  // const [quizVisible, setQuizVisible] = useState(false);
  // const [quizQuestion, setQuizQuestion] = useState<QuizQuestion | null>(null);
  // const [feedLocked, setFeedLocked] = useState(false);

  // Create feed manager
  const feedManager = useMemo(() => {
    if (!user || industries.length === 0 || allIndustries.length === 0) {
      return null;
    }
    
    const industryIds = industries.map(ind => ind.id);
    return new FeedManager(user.id, industryIds, allIndustries);
  }, [user, industries, allIndustries]);

  // Memoized callbacks
  const handleOpenComments = useCallback((articleId: number) => {
    setCommentsArticleId(articleId);
  }, []);

  const handleCloseComments = useCallback(() => {
    setCommentsArticleId(null);
  }, []);

  // Record content view in database for quiz system
  const recordContentView = useCallback(async (contentId: string | number, contentType: string) => {
    if (!user) return;
    
    try {
      await supabase.rpc('record_content_view', {
        p_user_id: user.id,
        p_content_type: contentType,
        p_content_id: contentId,
        p_view_duration: 3
      });
    } catch (error) {
      console.error('Error recording content view:', error);
    }
  }, [user]);



  // Handle quiz answer - COMMENTED OUT
  // const handleQuizAnswer = useCallback(async (answerIndex: number) => {
  //   if (!quizQuestion || !feedManager) return;
  //
  //   try {
  //     await feedManager.handleQuizAttempt(quizQuestion, answerIndex);
  //     console.log('🧠 Quiz attempt recorded');
  //   } catch (error) {
  //     console.error('Error handling quiz attempt:', error);
  //   }
  // }, [quizQuestion, feedManager]);

  // Handle quiz close - COMMENTED OUT
  // const handleQuizClose = useCallback(() => {
  //   setQuizVisible(false);
  //   setFeedLocked(false);
  //   setQuizQuestion(null);
  //   console.log('🧠 Quiz closed');
  // }, []);

  // Use custom hooks for data and tracking
  const {
    feedItems,
    isLoading,
    isLoadingMore,
    isRefreshing,
    hasMore,
    loadInitialContent,
    loadMoreContent,
    refreshContent,
    updateFeedItem
  } = useFeedData(feedManager, initialArticleId, initialContentType);

  // Handle comments count change after getting updateFeedItem from hook
  const handleCommentsCountChange = useCallback((newCount: number) => {
    // Update comment count in feed items for the currently open comment modal
    if (commentsArticleId) {
      updateFeedItem(commentsArticleId, { comments_count: newCount });
    }
  }, [commentsArticleId, updateFeedItem]);

  // Show quiz for recently viewed content using QuizSessionManager - COMMENTED OUT
  // const showQuizForRecentContent = useCallback(async (currentIndexParam: number) => {
  //   if (!user || !feedManager) return;
  //
  //   try {
  //     // Get the content that was viewed in THIS session (before current item)
  //     const currentSessionContent = feedItems.slice(0, currentIndexParam);
  //
  //     console.log(`🧠 Generating quiz from ${currentSessionContent.length} pieces of current session content (items 0-${currentIndexParam-1})`);
  //
  //     // Generate quiz question from current session content only
  //     const quiz = await feedManager.generateQuizQuestionFromContent(currentSessionContent);
  //
  //     if (quiz) {
  //       setQuizQuestion(quiz);
  //       setQuizVisible(true);
  //       setFeedLocked(true);
  //       console.log('🧠 Quiz shown for content:', quiz.sourceTitle);
  //     } else {
  //       console.log('🧠 No quiz question generated from current session content');
  //     }
  //   } catch (error) {
  //     console.error('Error showing quiz for recent content:', error);
  //   }
  // }, [user, feedManager, feedItems]);

  const {
    currentIndex,
    handleViewableItemsChanged,
    handleUserInteraction
  } = useContentTracking(
    feedManager, 
    trackScroll, 
    trackInteraction, 
    trackContentEngagement,
    recordContentView,
    // showQuizForRecentContent, // COMMENTED OUT
    // feedLocked, // COMMENTED OUT
    feedItems,
    loadMoreContent,
    isLoadingMore,
    hasMore
  );

  // Load initial content when feed manager is ready
  useEffect(() => {
    if (feedManager) {
      loadInitialContent();
    }
  }, [feedManager, loadInitialContent]);

  // Memoized render functions
  const renderItem = useCallback(({ item, index }: { item: FeedItem; index: number }) => {
    const isActive = index === currentIndex;

    switch (item.type) {
      case 'article':
        const article = item as Article;
        // Debug logging for article passed to ArticleCard
        console.log(`📱 MainFeed: Rendering ArticleCard for article ${article.id}:`, {
          id: article.id,
          title: article.title?.substring(0, 30),
          summary_length: article.summary?.length || 0,
          longer_summary_length: article.longer_summary?.length || 0,
          hasLongerSummary: !!article.longer_summary,
          longer_summary_preview: article.longer_summary ? `${article.longer_summary.substring(0, 50)}...` : 'NOT PRESENT'
        });

        return (
          <ArticleCard
            article={article}
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
    length: totalHeight,
    offset: totalHeight * index,
    index
  }), [totalHeight]);

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
    console.error('📱 MainFeed: SHOWING "No content available" screen');
    console.error('📱 MainFeed: Debug info:', {
      feedManagerExists: !!feedManager,
      userIndustries: industries.map(i => i.id),
      allIndustriesCount: allIndustries.length,
      hasUser: !!user
    });
    
    if (feedManager) {
      console.error('📱 MainFeed: FeedManager debug info:', feedManager.getDebugInfo());
    }
    
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
        onEndReached={() => {
          console.log(`🚀 FlatList onEndReached triggered - feedItems.length: ${feedItems.length}, hasMore: ${hasMore}, isLoadingMore: ${isLoadingMore}`);
          loadMoreContent();
        }}
        onEndReachedThreshold={0.8}
        onScrollBeginDrag={() => {
          console.log(`📱 FlatList onScrollBeginDrag - feedItems.length: ${feedItems.length}`);
        }}
        onScrollEndDrag={() => {
          console.log(`📱 FlatList onScrollEndDrag - feedItems.length: ${feedItems.length}`);
        }}
        onMomentumScrollBegin={() => {
          console.log(`📱 FlatList onMomentumScrollBegin - feedItems.length: ${feedItems.length}`);
        }}
        onMomentumScrollEnd={() => {
          console.log(`📱 FlatList onMomentumScrollEnd - feedItems.length: ${feedItems.length}`);
        }}
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
            ? (feedItems.find(item => item.id === commentsArticleId)?.type as 'article' | 'paper' | 'book' | 'insight') || 'article'
            : undefined
        }
      />

      {/* Quiz Modal - With full functionality - COMMENTED OUT FOR NOW */}
      {/*
      <QuizCard
        visible={quizVisible}
        onClose={handleQuizClose}
        question={quizQuestion}
        onAnswer={handleQuizAnswer}
      />
      */}
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