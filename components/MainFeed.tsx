import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, FlatList, ActivityIndicator, Dimensions, StyleSheet } from 'react-native';
import { VideoCard } from './VideoCard';
import type { Video } from '../types';
import { supabase } from '../lib/supabase'; // Adjust the import based on your project structure
import { industryIdToName } from '../lib/industryMap';
import { CommentsModal } from './CommentsModal';

interface MainFeedProps {
  industries: string[]; 
  initialReelId?: number;
}

const { height: screenHeight } = Dimensions.get('window');

export const MainFeed: React.FC<MainFeedProps> = ({ industries, initialReelId }) => {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [videos, setVideos] = useState<Video[]>([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [commentsVideoId, setCommentsVideoId] = useState<number | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const [hasScrolledToInitial, setHasScrolledToInitial] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    // Fetch videos from Supabase
    async function fetchVideos() {
      let query = supabase
        .from('reels')
        .select('id, type, title, caption, source_url, industry:industry_id, video_url, likes:likes_count, saves:saves_count, comments:comments_count, content');
      if (industries.length > 0) {
        // Convert industries to numbers for correct Supabase query
        const industryIds = industries.map((id) => typeof id === 'string' ? parseInt(id, 10) : id).filter((id) => !isNaN(id));
        query = query.in('industry_id', industryIds);
      }
      const { data, error } = await query;
      if (error) {
        setVideos([]);
      } else {
        // Map industry_id to industry name for display and map source_url to source
        const mapped = (data || []).map((v) => ({
          ...v,
          industry: industryIdToName[v.industry] || v.industry,
          source: v.source_url,
          video_url: v.video_url,
          content: v.content, // new field
        }));
        setVideos(mapped);
      }
      setIsLoading(false);
      setCurrentVideoIndex(0);
    }
    fetchVideos();
  }, [industries]);

  useEffect(() => {
    if (initialReelId && videos.length > 0) {
      const idx = videos.findIndex((v) => v.id === initialReelId);
      if (idx !== -1) setCurrentVideoIndex(idx);
    }
  }, [initialReelId, videos]);

  // Imperatively scroll to the correct index after videos are loaded
  useEffect(() => {
    if (
      initialReelId &&
      videos.length > 0 &&
      !hasScrolledToInitial
    ) {
      const idx = videos.findIndex((v) => v.id === initialReelId);
      if (idx !== -1 && flatListRef.current) {
        flatListRef.current.scrollToIndex({ index: idx, animated: false });
        setHasScrolledToInitial(true);
      }
    }
  }, [initialReelId, videos, hasScrolledToInitial]);

  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentVideoIndex(viewableItems[0].index);
    }
  }, []);

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50 // Item is considered viewable when 50% visible
  };

  const handleOpenComments = (videoId: number) => {
    setCommentsVideoId(videoId);
  };

  const handleCloseComments = () => {
    setCommentsVideoId(null);
  };

  // Update comment count in real time
  const handleCommentsCountChange = (count: number) => {
    if (commentsVideoId == null) return;
    setVideos((prev) => prev.map(v => v.id === commentsVideoId ? { ...v, comments: count } : v));
  };

  const renderItem = ({ item, index }: { item: Video; index: number }) => (
    <View style={{ height: screenHeight }}>
      <VideoCard
        video={item}
        isActive={index === currentVideoIndex}
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

  if (videos.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No videos available for the selected industries. Please update your preferences in Onboarding or Profile.</Text>
      </View>
    );
  }
  
  return (
    <>
      <FlatList
        ref={flatListRef}
        data={videos}
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
        accessibilityHint="Scroll vertically to watch videos"
        initialScrollIndex={currentVideoIndex}
      />
      {/* CommentsModal will be rendered here, controlled by commentsVideoId */}
      <CommentsModal
        videoId={commentsVideoId}
        visible={!!commentsVideoId}
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
