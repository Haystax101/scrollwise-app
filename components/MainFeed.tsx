import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, FlatList, ActivityIndicator, Dimensions, StyleSheet } from 'react-native';
import { VideoCard } from './VideoCard';
import type { Article } from '../types';
import { supabase } from '../lib/supabase'; // Adjust the import based on your project structure
import { industryIdToName } from '../lib/industryMap';
import { CommentsModal } from './CommentsModal';

interface MainFeedProps {
  industries: string[]; 
  initialArticleId?: number;
}

const { height: screenHeight } = Dimensions.get('window');

export const MainFeed: React.FC<MainFeedProps> = ({ industries, initialArticleId }) => {
  const [currentArticleIndex, setCurrentArticleIndex] = useState(0);
  const [articles, setArticles] = useState<Article[]>([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [commentsArticleId, setCommentsArticleId] = useState<number | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const [hasScrolledToInitial, setHasScrolledToInitial] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    // Fetch articles from Supabase
    async function fetchArticles() {
      console.log('🔍 MainFeed: Starting article fetch...');
      console.log('📊 MainFeed: User selected industries:', industries);
      
      // First, let's check if there are ANY articles in the database
      const { data: allArticles, error: countError } = await supabase
        .from('articles')
        .select('id, industry_id')
        .limit(5);
      
      console.log('🗃️ MainFeed: Total articles in database (sample):', allArticles);
      console.log('❌ MainFeed: Count error:', countError);
      
      let query = supabase
        .from('articles')
        .select('id, type, title, content, authors, link, industry_id, likes_count, saves_count, comments_count')
        .limit(10);
      
      if (industries.length > 0) {
        // Convert industries to numbers for correct Supabase query
        const industryIds = industries.map((id) => typeof id === 'string' ? parseInt(id, 10) : id).filter((id) => !isNaN(id));
        console.log('🏭 MainFeed: Converted industry IDs for query:', industryIds);
        query = query.in('industry_id', industryIds);
      } else {
        console.log('⚠️ MainFeed: No industries selected, fetching all articles');
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('❌ MainFeed: Error fetching articles:', error);
        setArticles([]);
      } else {
        console.log('✅ MainFeed: Raw data from Supabase:', data);
        console.log('📝 MainFeed: Number of articles fetched:', data?.length || 0);
        
        // Map industry_id to industry name for display and map link to source
        const mapped = (data || []).map((article) => ({
          ...article,
          industry: industryIdToName[article.industry_id] || `Industry ${article.industry_id}`,
          source: article.link, // Use 'link' column from database
          caption: '', // No caption column in articles table, set to empty
          video_url: null, // No video_url column in articles table  
          content: article.content,
          authors: article.authors || [], // Ensure authors is always an array
          likes: article.likes_count || 0,
          saves: article.saves_count || 0,
          comments: article.comments_count || 0,
        }));
        
        console.log('🔄 MainFeed: Mapped articles:', mapped);
        setArticles(mapped);
      }
      setIsLoading(false);
      setCurrentArticleIndex(0);
    }
    fetchArticles();
  }, [industries]);

  useEffect(() => {
    if (initialArticleId && articles.length > 0) {
      const idx = articles.findIndex((article) => article.id === initialArticleId);
      if (idx !== -1) setCurrentArticleIndex(idx);
    }
  }, [initialArticleId, articles]);

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

  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentArticleIndex(viewableItems[0].index);
    }
  }, []);

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50 // Item is considered viewable when 50% visible
  };

  const handleOpenComments = (articleId: number) => {
    setCommentsArticleId(articleId);
  };

  const handleCloseComments = () => {
    setCommentsArticleId(null);
  };

  // Update comment count in real time
  const handleCommentsCountChange = (count: number) => {
    if (commentsArticleId == null) return;
    setArticles((prev) => prev.map(article => article.id === commentsArticleId ? { ...article, comments: count } : article));
  };

  const renderItem = ({ item, index }: { item: Article; index: number }) => (
    <View style={{ height: screenHeight }}>
      <VideoCard
        video={item}
        isActive={index === currentArticleIndex}
        onOpenComments={handleOpenComments}
      />
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="white" />
      </View>
    );
  }

  if (articles.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No articles available for the selected industries. Please update your preferences in Onboarding or Profile.</Text>
      </View>
    );
  }
  
  return (
    <>
      <FlatList
        ref={flatListRef}
        data={articles}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        pagingEnabled // This creates the reel effect
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_data, index) => (
          {length: screenHeight, offset: screenHeight * index, index}
        )}
        style={styles.list}
        accessibilityHint="Scroll vertically to read articles"
        initialScrollIndex={currentArticleIndex}
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
});
