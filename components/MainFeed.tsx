import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, Dimensions, StyleSheet } from 'react-native';
import { VideoCard } from './VideoCard';
import type { Video } from '../types';

interface MainFeedProps {
  industries: string[]; 
}

const sampleVideos: Video[] = [
  {
    id: 1,
    type: 'research',
    title: 'Advancements in AI Ethics: A 2024 Overview',
    source: 'Tech Ethics Quarterly',
    industry: 'STEM',
    thumbnail: 'https://picsum.photos/seed/feed1/720/1280',
    likes: 2453,
    saves: 982,
    comments: 156,
  },
  {
    id: 2,
    type: 'book',
    title: "Understanding Behavioral Economics: Nudge Theory",
    source: 'Economic Insights Journal',
    industry: 'Finance',
    thumbnail: 'https://picsum.photos/seed/feed2/720/1280',
    likes: 1872,
    saves: 1243,
    comments: 89,
  },
  {
    id: 3,
    type: 'news',
    title: "Global Health Initiatives: Successes and Challenges",
    source: 'World Health Review',
    industry: 'Healthcare',
    thumbnail: 'https://picsum.photos/seed/feed3/720/1280',
    likes: 3241,
    saves: 1567,
    comments: 203,
  },
  {
    id: 4,
    type: 'research',
    title: 'The Future of Quantum Entanglement Applications',
    source: 'Physics Today',
    industry: 'STEM',
    thumbnail: 'https://picsum.photos/seed/feed4/720/1280',
    likes: 4510,
    saves: 2100,
    comments: 350,
  },
   {
    id: 5,
    type: 'news',
    title: 'EdTech Innovations Transforming Higher Education',
    source: 'Learning Technology Magazine',
    industry: 'Education',
    thumbnail: 'https://picsum.photos/seed/feed5/720/1280',
    likes: 1280,
    saves: 600,
    comments: 77,
  },
];

const { height: screenHeight } = Dimensions.get('window');

export const MainFeed: React.FC<MainFeedProps> = ({ industries }) => {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [videos, setVideos] = useState<Video[]>([]); 
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      const filteredVideos = industries.length > 0 
        ? sampleVideos.filter(v => industries.some(ind => v.industry.toLowerCase() === ind.toLowerCase()))
        : sampleVideos;
      setVideos(filteredVideos);
      setIsLoading(false);
      setCurrentVideoIndex(0); // Reset index when videos change
    }, 500);
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
