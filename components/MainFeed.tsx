import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, Dimensions, StyleSheet } from 'react-native';
import { VideoCard } from './VideoCard';
import type { Video } from '../types';
import { supabase } from '../lib/supabase'; // Adjust the import based on your project structure
import { industryIdToName } from '../lib/industryMap';

interface MainFeedProps {
  industries: string[]; 
}

const { height: screenHeight } = Dimensions.get('window');

export const MainFeed: React.FC<MainFeedProps> = ({ industries }) => {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [videos, setVideos] = useState<Video[]>([]); 
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    // Fetch videos from Supabase
    async function fetchVideos() {
      let query = supabase
        .from('reels')
        .select('id, type, title, caption, source_url, industry:industry_id, thumbnail:thumbnail_url, video_url, likes:likes_count, saves:saves_count, comments:comments_count');
      if (industries.length > 0) {
        query = query.in('industry_id', industries);
      }
      const { data, error } = await query;
      if (error) {
        setVideos([]);
      } else {
        // Debug: log the video_url for each video
        console.log('Fetched videos:', data?.map(v => ({ id: v.id, video_url: v.video_url })));
        // Map industry_id to industry name for display and map source_url to source
        const mapped = (data || []).map((v) => ({
          ...v,
          industry: industryIdToName[v.industry] || v.industry,
          source: v.source_url,
          video_url: v.video_url,
        }));
        setVideos(mapped);
      }
      setIsLoading(false);
      setCurrentVideoIndex(0);
    }
    fetchVideos();
  }, [industries]);

  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentVideoIndex(viewableItems[0].index);
    }
  }, []);

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50 // Item is considered viewable when 50% visible
  };

  const renderItem = ({ item, index }: { item: Video; index: number }) => (
    <View style={{ height: screenHeight }}>
      <VideoCard
        video={item}
        isActive={index === currentVideoIndex}
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
    <FlatList
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
    />
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
