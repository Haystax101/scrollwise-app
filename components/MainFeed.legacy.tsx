import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, Text, FlatList, ActivityIndicator, Dimensions, StyleSheet, RefreshControl } from 'react-native';
import { ArticleCard } from './ArticleCard';
import { PaperCard } from './PaperCard';
import { BookCard } from './BookCard';
import InsightCard from './InsightCard';
import type { Article, Insight, FeedItem, Industry, Paper, Book } from '../types';
import { FeedAlgorithm } from '../lib/feedAlgorithm';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useIndustries } from '../context/IndustriesContext'; // <-- ADD THIS LINE
import { CommentsModal } from './CommentsModal';
import QuizCard, { QuizQuestion } from './QuizCard';
import { supabase } from '../lib/supabase';
import { screenTracker } from '../lib/screenTracking';
import { feedNavigationService } from '../services/FeedNavigationService';

interface MainFeedProps {
  industries: Industry[]; // Changed from number[] to Industry[]
  initialArticleId?: number | string;
  initialContentType?: 'article' | 'paper' | 'book' | 'insight';
  // Add tracking functions passed from parent
  trackScroll?: (scrollPercent: number) => void;
  trackInteraction?: (interactionType: string, data?: Record<string, any>) => void;
  trackContentEngagement?: (contentType: string, contentId: string, engagementType: string, data?: Record<string, any>) => void;
}

const { height: screenHeight } = Dimensions.get('window');

// Utility function to deduplicate articles by ID
const deduplicateArticles = (existing: FeedItem[], newItems: FeedItem[]): FeedItem[] => {
  const existingIds = new Set(existing.map(item => String(item.id)));
  return newItems.filter(item => !existingIds.has(String(item.id)));
};

// Progressive content loading utility
const createProgressiveLoader = (
  feedAlgorithm: any,
  setArticles: React.Dispatch<React.SetStateAction<FeedItem[]>>
) => {
  const stages = [
    { count: 3, delay: 100 },     // Stage 1: Immediate scrolling content
    { count: 4, delay: 2500 },    // Stage 2: Reading time content  
    { count: 8, delay: 10000 },   // Stage 3: Deep browsing content
  ];
  
  stages.forEach(({ count, delay }) => {
    setTimeout(async () => {
      try {
        if (feedAlgorithm?.current) {
          const content = await feedAlgorithm.current.fetchArticles(count);
          setArticles(prev => [...prev, ...deduplicateArticles(prev, content)]);
        }
      } catch (error) {
        console.error(`Error loading progressive content (${count} items):`, error);
      }
    }, delay);
  });
};

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
  const { allIndustries } = useIndustries(); // Get all industries
  const [currentArticleIndex, setCurrentArticleIndex] = useState(0);
  const [articles, setArticles] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [commentsArticleId, setCommentsArticleId] = useState<number | null>(null);
  const [quizVisible, setQuizVisible] = useState(false);
  const [quizQuestion, setQuizQuestion] = useState<QuizQuestion | null>(null);
  const [scrollCount, setScrollCount] = useState(0);
  const [nextQuizAt, setNextQuizAt] = useState<number>(Math.floor(Math.random() * 5) + 10); // Random between 10-14
  const [feedLocked, setFeedLocked] = useState(false);
  const [viewedContent, setViewedContent] = useState<Set<string>>(new Set());
  const flatListRef = useRef<FlatList>(null);


  const feedAlgorithmRef = useRef<FeedAlgorithm | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // Extract just the industry IDs for the algorithm
  const industryIds = useMemo(() => industries.map(ind => ind.id), [industries]);

  // Initialize feed algorithm when user or industries change
  useEffect(() => {
    if (user && industryIds.length > 0 && allIndustries.length > 0) {
      feedAlgorithmRef.current = new FeedAlgorithm(user.id, industryIds, allIndustries);
      
      // NUCLEAR OPTION: Uncomment this line to reset all tracking on app startup
      // feedAlgorithmRef.current.nuclearReset();
      
      // Register with navigation service for proactive cache management
      feedNavigationService.registerFeedAlgorithm(feedAlgorithmRef.current);
      feedNavigationService.onFeedTabActive();
      
      loadInitialFeed();
    } else if (!user || industryIds.length === 0) {
      setIsLoading(false);
    }

    // Cleanup function
    return () => {
      // Trigger proactive cache refresh when component unmounts (user navigating away)
      feedNavigationService.onFeedTabInactive();
      feedNavigationService.unregisterFeedAlgorithm();
    };
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
      
      // If we have an initialArticleId (from navigation), fetch that specific content first
      if (initialArticleId) {
        const typeToFetch: 'article' | 'paper' | 'book' | 'insight' = initialContentType || 'article';
        const specificArticle = await feedAlgorithmRef.current.fetchSpecificContent(initialArticleId, typeToFetch);
        
        if (specificArticle) {
          newArticles.push(specificArticle as Article);
          setCurrentArticleIndex(0); // Start viewing the specific article
          
          // Set the specific content immediately for instant display
          setArticles(newArticles);
          setIsLoading(false); // Stop loading immediately to show content
          
          // Use progressive loading utility
          createProgressiveLoader(feedAlgorithmRef, setArticles);
          setHasMore(true);
          
          return; // Exit early since we've set up the content
        }
      }
      
      // Load content using instant loading strategy - get first 2 articles with fast fetch
      const initialArticles = await feedAlgorithmRef.current.fetchArticlesFast(2);
      
      if (initialArticles.length > 0) {
        // Show first 2 articles immediately to eliminate loading screen completely
        setArticles(initialArticles);
        setIsLoading(false); // Stop loading immediately to show content
        setCurrentArticleIndex(0);
        setHasMore(true);
        
        // CRITICAL FIX: Sequential loading instead of overlapping setTimeout chaos
        // Start background initialization immediately
        if (feedAlgorithmRef.current) {
          feedAlgorithmRef.current.initializeInBackground();
          
          // Sequential loading with proper delays to prevent overlays
          const loadMoreContent = async () => {
            try {
              // Wait 100ms, then load 3 more articles
              await new Promise(resolve => setTimeout(resolve, 100));
              if (feedAlgorithmRef.current) {
                const nextContent = await feedAlgorithmRef.current.fetchArticles(3);
                setArticles(prev => [...prev, ...deduplicateArticles(prev, nextContent)]);
                
                // Wait another 2 seconds, then load 5 more
                await new Promise(resolve => setTimeout(resolve, 2000));
                if (feedAlgorithmRef.current) {
                  const moreContent = await feedAlgorithmRef.current.fetchArticles(5);
                  setArticles(prev => [...prev, ...deduplicateArticles(prev, moreContent)]);
                  
                  // Wait another 5 seconds, then load bulk content
                  await new Promise(resolve => setTimeout(resolve, 5000));
                  if (feedAlgorithmRef.current) {
                    const bulkContent = await feedAlgorithmRef.current.fetchArticles(8);
                    setArticles(prev => [...prev, ...deduplicateArticles(prev, bulkContent)]);
                  }
                }
              }
            } catch (error) {
              console.error('Error in sequential loading:', error);
            }
          };
          
          // Start the sequential loading process
          loadMoreContent();
        }
        
        return; // Exit early since we've set up progressive loading
      } else {
        // Fallback to traditional loading if no initial articles available
        const algorithmContent = await feedAlgorithmRef.current.fetchArticles(5);
        setArticles(algorithmContent);
        setHasMore(true);
        setCurrentArticleIndex(0);
      }
      
    } catch (error) {
      console.error('Error loading initial feed:', error);
      setArticles([]);
    }
    setIsLoading(false);
  };

  // Progressive prefetch function for smoother experience
  const prefetchMoreArticles = useCallback(async () => {
    if (!feedAlgorithmRef.current || isLoadingMore || !hasMore) return;
    
    try {
      // Start with immediate content for scrolling
      const immediateArticles = await feedAlgorithmRef.current.fetchArticles(2);
      
      if (immediateArticles.length > 0) {
        setArticles(prev => [...prev, ...deduplicateArticles(prev, immediateArticles)]);
        
        // Load more content progressively
        setTimeout(async () => {
          try {
            const moreArticles = await feedAlgorithmRef.current.fetchArticles(3);
            setArticles(prev => [...prev, ...deduplicateArticles(prev, moreArticles)]);
            setHasMore(moreArticles.length > 0);
          } catch (error) {
            console.error('Error prefetching additional articles:', error);
          }
        }, 1500); // 1.5 second delay for additional content
        
        setHasMore(true);
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
      // Try to fetch from the main algorithm first
      let newArticles = await feedAlgorithmRef.current.fetchArticles(5);
      
      // If algorithm returns fewer items, fetch fallback content
      if (newArticles.length < 5 && newArticles.length > 0) {
        const fallbackArticles = await fetchFallbackContent(5 - newArticles.length);
        newArticles = [...newArticles, ...fallbackArticles];
      }
      
      // If still no content, fetch older content or from different time periods
      if (newArticles.length === 0) {
        const olderContent = await fetchOlderContent(5);
        newArticles = olderContent;
      }
      
      if (newArticles.length > 0) {
        // Deduplicate by ID to prevent duplicate content
        setArticles(prev => [...prev, ...deduplicateArticles(prev, newArticles)]);
        // Keep loading as long as we get some content
        setHasMore(newArticles.length >= 3);
      } else {
        // Absolute fallback - show message and allow refresh
        setHasMore(false);
        console.log('Reached end of available content');
      }
    } catch (error) {
      console.error('Error loading more articles:', error);
    }
    setIsLoadingMore(false);
  }, [isLoadingMore, hasMore]);

  // Fallback content fetcher for when main algorithm runs out
  const fetchFallbackContent = async (count: number): Promise<Article[]> => {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(count * 2); // Get more for filtering

      if (error || !data) return [];

      // Filter out already fetched articles
      const filteredData = data.filter(item => 
        !articles.some(article => article.id === item.id)
      );

      return filteredData.slice(0, count).map(item => ({
        ...item,
        type: 'article' as const,
        author: item.author || 'Content Team'
      }));
    } catch (error) {
      console.error('Error fetching fallback content:', error);
      return [];
    }
  };

  // Fetch older content for ultimate fallback
  const fetchOlderContent = async (count: number): Promise<Article[]> => {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .order('views_count', { ascending: false }) // Popular content
        .limit(count * 2);

      if (error || !data) return [];

      const filteredData = data.filter(item => 
        !articles.some(article => article.id === item.id)
      );

      return filteredData.slice(0, count).map(item => ({
        ...item,
        type: 'article' as const,
        author: item.author || 'Content Team'
      }));
    } catch (error) {
      console.error('Error fetching older content:', error);
      return [];
    }
  };

  // Pull to refresh - reset and load fresh feed (maintaining specific article if present)
  const handleRefresh = useCallback(async () => {
    if (!feedAlgorithmRef.current) return;
    
    setIsRefreshing(true);
    try {
      feedAlgorithmRef.current.reset(); // Reset algorithm state
      await feedAlgorithmRef.current.forceFastCacheRefresh(); // Force refresh fast cache
      
      let newArticles: Article[] = [];
      
      // If we have an initialArticleId, fetch it first again (in case it was updated)
      if (initialArticleId) {
        const specificArticle = await feedAlgorithmRef.current.fetchSpecificContent(initialArticleId, 'article');
        
        if (specificArticle) {
          newArticles.push(specificArticle as Article);
        }
      }
      
      // Load additional fresh articles
      const remainingCount = initialArticleId ? 2 : 3;
      const algorithmArticles = await feedAlgorithmRef.current.fetchArticles(remainingCount);
      newArticles = [...newArticles, ...algorithmArticles] as Article[];
      
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

  // Function to get a quiz question for a specific piece of content
  const getQuizForContent = async (contentItem: FeedItem): Promise<QuizQuestion | null> => {
    try {
      const { data, error } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('content_type', contentItem.type)
        .eq('content_id', contentItem.id)
        .maybeSingle();

      if (error || !data) {
        console.log('No quiz found for content:', contentItem.type, contentItem.id);
        return null;
      }

      // Validate that all options are present and non-empty
      const options = [data.option_a, data.option_b, data.option_c, data.option_d];
      const hasValidOptions = options.every(option => option && option.trim().length > 0);
      
      if (!hasValidOptions) {
        console.log('Quiz has blank options, skipping:', data.id);
        return null;
      }

      // Validate that the question text exists and correct_option_index is valid
      if (!data.question || data.question.trim().length === 0) {
        console.log('Quiz has blank question, skipping:', data.id);
        return null;
      }

      if (data.correct_option_index < 0 || data.correct_option_index > 3) {
        console.log('Quiz has invalid correct_option_index, skipping:', data.id);
        return null;
      }

      return {
        id: data.id,
        question: data.question,
        option_a: data.option_a,
        option_b: data.option_b, 
        option_c: data.option_c,
        option_d: data.option_d,
        correct_option_index: data.correct_option_index,
        content_type: data.content_type,
        content_id: data.content_id,
        content_title: contentItem.title
      };
    } catch (error) {
      console.error('Error fetching quiz question:', error);
      return null;
    }
  };

  // Function to record content view
  const recordContentView = async (contentItem: FeedItem) => {
    if (!user) return;
    
    const viewKey = `${contentItem.type}-${contentItem.id}`;
    if (viewedContent.has(viewKey)) return; // Already recorded
    
    try {
      await supabase.rpc('record_content_view', {
        p_user_id: user.id,
        p_content_type: contentItem.type,
        p_content_id: contentItem.id,
        p_view_duration: 3 // Assume 3+ seconds = viewed
      });
      
      setViewedContent(prev => new Set([...prev, viewKey]));
    } catch (error) {
      console.error('Error recording content view:', error);
    }
  };

  // Function to show quiz for recent content
  const showQuizForRecentContent = async () => {
    if (!user) return;
    
    try {
      // Get recently viewed content from database
      const { data: recentlyViewed, error } = await supabase.rpc('get_recently_viewed_content', {
        p_user_id: user.id,
        p_limit: nextQuizAt
      });
      
      if (error || !recentlyViewed || recentlyViewed.length === 0) return;
      
      // Filter to only content types that have quizzes (articles, papers, books - not insights)
      const quizEligibleContent = recentlyViewed.filter(content => 
        ['article', 'paper', 'book'].includes(content.content_type)
      );
      
      if (quizEligibleContent.length === 0) return;
      
      // Randomly select one piece of recently viewed content to quiz on
      const randomViewedContent = quizEligibleContent[Math.floor(Math.random() * Math.min(5, quizEligibleContent.length))];
      
      // Get quiz question for this content
      const quiz = await getQuizForContent({
        id: randomViewedContent.content_id,
        type: randomViewedContent.content_type,
        title: randomViewedContent.content_title || 'Recently viewed content'
      } as FeedItem);
      
      if (quiz) {
        setQuizQuestion(quiz);
        setQuizVisible(true);
        setFeedLocked(true);
      }
    } catch (error) {
      console.error('Error showing quiz for recent content:', error);
    }
  };

  // Handle viewable items change - now with view tracking and quiz injection logic
  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const newIndex = viewableItems[0].index;
      const oldIndex = currentArticleIndex;
      setCurrentArticleIndex(newIndex);
      
      // Record view for the current item
      const currentItem = articles[newIndex];
      if (currentItem && ['article', 'paper', 'book', 'insight'].includes(currentItem.type)) {
        recordContentView(currentItem);
        
        // Mark content as viewed in feed algorithm for cache invalidation
        if (feedAlgorithmRef.current) {
          feedAlgorithmRef.current.markContentAsViewed(currentItem.id, currentItem.type);
        }
        
        // Track content engagement
        trackContentEngagement?.(
          currentItem.type,
          currentItem.id.toString(),
          'view',
          {
            content_title: 'title' in currentItem ? currentItem.title : 'Insight',
            scroll_position: newIndex,
            total_content_count: articles.length
          }
        );
      }
      
      // Count scrolls (only when moving forward)
      if (newIndex > oldIndex) {
        const newScrollCount = scrollCount + 1;
        setScrollCount(newScrollCount);
        
        // Track scroll activity
        trackScroll?.(Math.round((newIndex / Math.max(articles.length - 1, 1)) * 100));
        
        // Track scroll interaction
        trackInteraction?.('scroll', {
          from_index: oldIndex,
          to_index: newIndex,
          scroll_direction: 'forward',
          total_scrolls: newScrollCount,
          content_type: currentItem?.type
        });
        
        // Check if it's time to show a quiz - MUST have at least 8 scrolls AND viewed content
        if (newScrollCount >= Math.max(8, nextQuizAt) && 
            newScrollCount >= 8 && 
            !feedLocked && 
            !quizVisible &&
            viewedContent.size >= 5) { // Ensure we have at least 5 viewed pieces of content
          showQuizForRecentContent();
        }
      }
      
      // Trigger infinite scroll earlier for smoother experience (when 2-3 items remain)
      if (newIndex >= 2 && newIndex >= articles.length - 3) {
        loadMoreArticles();
      }
    }
  }, [articles, currentArticleIndex, scrollCount, nextQuizAt, feedLocked, quizVisible, loadMoreArticles, recordContentView, viewedContent.size]);

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
    setArticles((prev) => prev.map(article => article.id === commentsArticleId ? { ...article, comments_count: count } : article));
  }, [commentsArticleId]);

  // Track user interactions for the algorithm
  const handleUserInteraction = useCallback((articleId: number, action: 'like' | 'save' | 'unlike' | 'unsave') => {
    if (feedAlgorithmRef.current) {
      feedAlgorithmRef.current.updateUserInteraction(articleId, action);
    }

    // Find the article to get its type and other details
    const article = articles.find(a => a.id === articleId);
    if (article) {
      // Track content engagement
      trackContentEngagement?.(
        article.type,
        articleId.toString(),
        action,
        {
          content_title: 'title' in article ? article.title : 'Insight',
          current_position: currentArticleIndex,
          total_scrolls: scrollCount
        }
      );

      // Track interaction
      trackInteraction?.(action, {
        content_id: articleId,
        content_type: article.type,
        engagement_type: action
      });
    }
  }, [articles, currentArticleIndex, scrollCount, trackContentEngagement, trackInteraction]);

  // Memoized render item function - now with conditional rendering
  const renderItem = useCallback(({ item, index }: { item: FeedItem; index: number }) => {
    switch (item.type) {
      case 'insight':
        return (
          <InsightCard
            insight={item as Insight}
          />
        );
      case 'article':
        return (
          <ArticleCard
            article={item as Article}
            isActive={index === currentArticleIndex}
            onOpenComments={handleOpenComments}
            onUserInteraction={handleUserInteraction}
          />
        );
      case 'paper':
        return (
          <PaperCard
            paper={item as Paper}
            isActive={index === currentArticleIndex}
            onOpenComments={handleOpenComments}
            onUserInteraction={handleUserInteraction}
          />
        );
      case 'book':
        return (
          <BookCard
            book={item as Book}
            isActive={index === currentArticleIndex}
            onOpenComments={handleOpenComments}
            onUserInteraction={handleUserInteraction}
          />
        );
      default:
        return null;
    }
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
        scrollEnabled={!feedLocked} // Lock scrolling when quiz is active
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
            enabled={!feedLocked} // Disable refresh when feed is locked
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
      <QuizCard 
        visible={quizVisible} 
        onClose={() => {
          setQuizVisible(false);
          setFeedLocked(false);
          // Reset quiz timing for next quiz
          setScrollCount(0);
          setNextQuizAt(Math.floor(Math.random() * 5) + 10);
        }} 
        question={quizQuestion} 
      />
      {/* CommentsModal will be rendered here, controlled by commentsArticleId */}
      <CommentsModal
        videoId={commentsArticleId}
        visible={!!commentsArticleId}
        onClose={handleCloseComments}
        onCommentsCountChange={handleCommentsCountChange}
        contentType={
          commentsArticleId 
            ? (articles.find(article => article.id === commentsArticleId)?.type as 'article' | 'paper' | 'book') || 'article'
            : undefined
        }
      />
    </>
  );
};

// Static styles removed - now using dynamic theme-based styles