import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { ArticleCard } from './ArticleCard';
import { PaperCard } from './PaperCard';
import { BookCard } from './BookCard';
import InsightCard from './InsightCard';
import { ContentCard } from './ContentCard';
import type { Article, Insight, FeedItem, Industry, Paper, Book } from '../types';
import { FeedManager } from '../lib/FeedManager';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useIndustries } from '../context/IndustriesContext';
import { CommentsModal } from './CommentsModal';
import { supabase } from '../lib/supabase';
import { useResponsiveLayout } from '../utils/screenUtils';
import { getDeviceInfo, useDeviceOrientation } from '../utils/deviceDetection';

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
  showBackButton?: boolean;
  backTo?: string | null;
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
    console.log('📱 MainFeed: loadInitialContent called', { feedManager: !!feedManager });
    if (!feedManager) {
      console.log('📱 MainFeed: No feedManager, returning early');
      return;
    }

    console.log('📱 MainFeed: Setting isLoading to true');
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

      if (uniqueContent.length === 0) {
        console.error(`📱 MainFeed: ❌ No content loaded! This will trigger empty state.`);
        console.error(`📱 MainFeed: Initial content: ${initialContent.length}, Additional: ${additionalContent.length}`);
        setFeedItems([]);
      } else {
        console.log(`📱 MainFeed: ✅ Successfully loaded ${uniqueContent.length} feed items`);
        setFeedItems(uniqueContent);
      }

      // Always assume more content exists initially - let loadMoreContent determine if we're actually at the end
      setHasMore(true);

      // Only set loading to false after we've set the feed items
      console.log('📱 MainFeed: Setting isLoading to false after content is set');
      setIsLoading(false);
    } catch (error) {
      console.error('📱 MainFeed: Error loading initial content:', error);
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

    console.log('📱 MainFeed: refreshContent called, setting isRefreshing to true');
    setIsRefreshing(true);
    try {
      console.log('📱 MainFeed: Fetching fresh content for refresh...');
      const freshContent = await feedManager.fetchContent(10);
      console.log(`📱 MainFeed: Refresh fetchContent returned ${freshContent.length} items`);

      const uniqueContent = freshContent.filter((item, index, self) =>
        self.findIndex(i => String(i.id) === String(item.id)) === index
      );
      console.log(`📱 MainFeed: After refresh deduplication: ${uniqueContent.length} unique items`);

      // Set content and refresh state together to avoid race condition
      setFeedItems(uniqueContent);
      setHasMore(true);

      console.log('📱 MainFeed: Setting isRefreshing to false after content is set');
      setIsRefreshing(false);
    } catch (error) {
      console.error('📱 MainFeed: Error refreshing content:', error);
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
  showBackButton,
  backTo,
  trackScroll,
  trackInteraction,
  trackContentEngagement
}) => {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { allIndustries } = useIndustries();
  const { totalHeight } = useResponsiveLayout();
  const { isTablet } = getDeviceInfo();
  const { isLandscape } = useDeviceOrientation();

  // Comments modal state
  const [commentsArticleId, setCommentsArticleId] = useState<number | null>(null);
  const [commentsSource, setCommentsSource] = useState<'legacy' | 'content_slides' | null>(null);

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
  const handleOpenComments = useCallback((articleId: number, source?: 'legacy' | 'content_slides') => {
    setCommentsArticleId(articleId);
    setCommentsSource(source || 'legacy'); // Default to legacy for backward compatibility
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
    console.log('📱 MainFeed: useEffect triggered', { feedManager: !!feedManager });
    if (feedManager) {
      console.log('📱 MainFeed: Calling loadInitialContent from useEffect');
      loadInitialContent();
    }
  }, [feedManager, loadInitialContent]);

  // Memoized render functions
  const renderItem = useCallback(({ item, index }: { item: FeedItem; index: number }) => {
    const isActive = index === currentIndex;

    switch (item.type) {
      case 'article':
        const article = item as Article;

        // If article has slides, use ContentCard
        if (article.hasSlides) {
          console.log(`📱 MainFeed: Rendering ContentCard for article ${article.id} (has slides)`);
          return (
            <ContentCard
              contentId={article.id}
              contentType="article"
              title={article.title}
              source={article.site_name}
              date={article.date || article.created_at}
              category={(article as any).category} // Category from content_slides
              authors={article.author ? [article.author] : undefined}
              likesCount={article.likes_count}
              commentsCount={article.comments_count}
              savesCount={article.saves_count}
              onOpenComments={handleOpenComments}
              onUserInteraction={handleUserInteraction}
            />
          );
        }

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
            showBackButton={showBackButton}
            backTo={backTo}
            onOpenComments={handleOpenComments}
            onUserInteraction={handleUserInteraction}
            preload={index < 3}
          />
        );
      case 'paper':
        const paper = item as Paper;

        // If paper has slides, use ContentCard
        if (paper.hasSlides) {
          console.log(`📱 MainFeed: Rendering ContentCard for paper ${paper.id} (has slides)`);
          return (
            <ContentCard
              contentId={paper.id}
              contentType="paper"
              title={paper.title}
              source={paper.site_name}
              date={paper.date || paper.created_at}
              category={(paper as any).category} // Category from content_slides
              authors={paper.authors}
              likesCount={paper.likes_count}
              commentsCount={paper.comments_count}
              savesCount={paper.saves_count}
              onOpenComments={handleOpenComments}
              onUserInteraction={handleUserInteraction}
            />
          );
        }

        return (
          <PaperCard
            paper={paper}
            isActive={isActive}
            showBackButton={showBackButton}
            backTo={backTo}
            onOpenComments={handleOpenComments}
            onUserInteraction={handleUserInteraction}
          />
        );
      case 'video':
      case 'podcast':
        // Videos and podcasts are always from content_slides, so use ContentCard
        console.log(`📱 MainFeed: Rendering ContentCard for ${item.type} ${item.id}`);
        return (
          <ContentCard
            contentId={item.id}
            contentType={item.type as 'video' | 'podcast'}
            title={(item as any).title}
            source={(item as any).site_name}
            date={(item as any).date || (item as any).created_at}
            category={(item as any).category}
            authors={(item as any).author ? [(item as any).author] : undefined}
            likesCount={(item as any).likes_count}
            commentsCount={(item as any).comments_count}
            savesCount={(item as any).saves_count}
            onOpenComments={handleOpenComments}
            onUserInteraction={handleUserInteraction}
          />
        );
      case 'book':
        return (
          <BookCard
            book={item as Book}
            showBackButton={showBackButton}
            backTo={backTo}
            onOpenComments={handleOpenComments}
            onUserInteraction={handleUserInteraction}
          />
        );
      case 'insight':
        return <InsightCard insight={item as Insight} showBackButton={showBackButton} backTo={backTo} />;
      default:
        console.warn(`📱 MainFeed: Unknown content type: ${(item as any).type}`);
        return null;
    }
  }, [currentIndex, showBackButton, backTo, handleOpenComments, handleUserInteraction]);

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
        <ActivityIndicator size={isTablet ? "large" : "small"} color={colors.primary} />
        <Text style={[
          styles.footerText,
          {
            color: colors.text,
            fontSize: isTablet ? 16 : 14,
            marginTop: isTablet ? 12 : 8
          }
        ]}>Loading more content...</Text>
      </View>
    );
  }, [isLoadingMore, colors, isTablet]);

  // Loading state
  if (isLoading) {
    console.log('📱 MainFeed: Rendering loading state');
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[
          styles.loadingText,
          {
            color: colors.text,
            fontSize: isTablet ? 18 : 16,
            paddingHorizontal: isTablet ? 40 : 20
          }
        ]}>
          Loading your personalized feed...
        </Text>
      </View>
    );
  }

  // Empty state - but don't show if we're refreshing
  if (feedItems.length === 0 && !isRefreshing) {
    console.error('📱 MainFeed: SHOWING "No content available" screen');
    console.error('📱 MainFeed: Current state - isLoading:', isLoading, 'isRefreshing:', isRefreshing, 'feedItems.length:', feedItems.length);
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
        <Text style={[
          styles.emptyText,
          {
            color: colors.text,
            fontSize: isTablet ? 20 : 18,
            paddingHorizontal: isTablet ? 60 : 16,
            lineHeight: isTablet ? 28 : 24
          }
        ]}>
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
        // Performance optimizations - responsive for tablets
        removeClippedSubviews={true}
        maxToRenderPerBatch={isTablet ? 4 : 3}
        updateCellsBatchingPeriod={isTablet ? 40 : 50}
        initialNumToRender={isTablet ? 3 : 2}
        windowSize={isTablet ? 7 : 5}
      />

      {/* Comments Modal */}
      <CommentsModal
        videoId={commentsArticleId}
        visible={!!commentsArticleId}
        onClose={handleCloseComments}
        onCommentsCountChange={handleCommentsCountChange}
        contentType={
          commentsArticleId
            ? (feedItems.find(item => item.id === commentsArticleId)?.type as 'article' | 'paper' | 'book' | 'insight' | 'video' | 'podcast') || 'article'
            : undefined
        }
        useContentTables={commentsSource === 'content_slides'}
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