# Insight Feed - React Native Implementation Guide

This document outlines the implementation of the Insight Feed UI for React Native Expo apps, based on the existing web component structure. The design features a professional networking-style feed with posts containing user information, content, media, and engagement metrics.

## Design Overview

The feed displays "insights" - professional posts with rich content including:
- User profile information (photo, name, role, company)
- Text content
- Optional media (images/videos)
- Engagement metrics (likes, comments, reposts, views)
- "Supercharge" functionality with Voltz points
- Interactive comment system

## Required Dependencies

```bash
# Core React Native and Expo
expo install expo-image expo-av

# UI and Icons
npm install react-native-vector-icons
# or
expo install @expo/vector-icons

# Optional: For better performance with large lists
npm install react-native-fast-image
```

## Type Definitions

```typescript
// types/InsightTypes.ts
export interface User {
  photo: string;
  name: string;
  industry: string;
  role: string;
  company: string;
}

export interface Comment {
  id: string;
  user: {
    name: string;
    photo: string;
    tagline?: string;
  };
  text: string;
  timestamp: string;
  likes: number;
}

export interface Insight {
  id: string;
  user: User;
  content: string;
  mediaType?: 'image' | 'video';
  media?: string;
  likes: number;
  comments: Comment[];
  reposts: number;
  views: number;
  voltzPoints: number;
  timestamp: string;
}
```

## Core Components

### 1. InsightCard Component

```typescript
// components/InsightCard.tsx
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { UserHeader } from './UserHeader';
import { InsightContent } from './InsightContent';
import { MediaDisplay } from './MediaDisplay';
import { EngagementBar } from './EngagementBar';
import { CommentDisplay } from './CommentDisplay';
import { SupportModal } from './SupportModal';
import { Insight } from '../types/InsightTypes';

interface InsightCardProps {
  insight: Insight;
}

const { width: screenWidth } = Dimensions.get('window');

export const InsightCard: React.FC<InsightCardProps> = ({ insight }) => {
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(insight.likes);

  const handleLike = () => {
    if (isLiked) {
      setLikeCount(prev => prev - 1);
    } else {
      setLikeCount(prev => prev + 1);
    }
    setIsLiked(!isLiked);
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
  };

  return (
    <View style={styles.card}>
      <UserHeader user={insight.user} timestamp={insight.timestamp} />
      <InsightContent content={insight.content} />
      {insight.media && (
        <MediaDisplay type={insight.mediaType} src={insight.media} />
      )}
      <EngagementBar
        likes={likeCount}
        comments={insight.comments.length}
        reposts={insight.reposts}
        views={insight.views}
        isLiked={isLiked}
        isSaved={isSaved}
        onLike={handleLike}
        onSave={handleSave}
        onSupport={() => setShowSupportModal(true)}
      />
      {insight.comments.length > 0 && (
        <CommentDisplay comment={insight.comments[0]} />
      )}
      {showSupportModal && (
        <SupportModal
          initialPoints={insight.voltzPoints}
          onClose={() => setShowSupportModal(false)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
});
```

### 2. UserHeader Component

```typescript
// components/UserHeader.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { User } from '../types/InsightTypes';

interface UserHeaderProps {
  user: User;
  timestamp?: string;
}

export const UserHeader: React.FC<UserHeaderProps> = ({ user, timestamp }) => {
  return (
    <View style={styles.container}>
      <Image
        source={{ uri: user.photo }}
        style={styles.avatar}
        contentFit="cover"
      />
      <View style={styles.userInfo}>
        <View style={styles.headerRow}>
          <View style={styles.textContainer}>
            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.role}>
              {user.role} at {user.company}
            </Text>
            {timestamp && (
              <View style={styles.timestampContainer}>
                <Ionicons name="time-outline" size={12} color="#9CA3AF" />
                <Text style={styles.timestamp}>{timestamp}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity style={styles.moreButton}>
            <Ionicons name="ellipsis-horizontal" size={22} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'flex-start',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  role: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 4,
  },
  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  timestamp: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  moreButton: {
    padding: 4,
  },
});
```

### 3. InsightContent Component

```typescript
// components/InsightContent.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface InsightContentProps {
  content: string;
}

export const InsightContent: React.FC<InsightContentProps> = ({ content }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.content}>{content}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1F2937',
  },
});
```

### 4. MediaDisplay Component

```typescript
// components/MediaDisplay.tsx
import React from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

interface MediaDisplayProps {
  type?: 'image' | 'video';
  src: string;
}

const { width: screenWidth } = Dimensions.get('window');

export const MediaDisplay: React.FC<MediaDisplayProps> = ({ type, src }) => {
  return (
    <View style={styles.container}>
      <Image
        source={{ uri: src }}
        style={styles.media}
        contentFit="cover"
      />
      {type === 'video' && (
        <View style={styles.playButtonOverlay}>
          <TouchableOpacity style={styles.playButton}>
            <Ionicons name="play" size={24} color="white" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: screenWidth - 32, // Account for card margins
    alignSelf: 'center',
    position: 'relative',
  },
  media: {
    width: '100%',
    height: 200,
  },
  playButtonOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 30,
    padding: 12,
  },
});
```

### 5. EngagementBar Component

```typescript
// components/EngagementBar.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface EngagementBarProps {
  likes: number;
  comments: number;
  reposts: number;
  views: number;
  isLiked: boolean;
  isSaved: boolean;
  onLike: () => void;
  onSave: () => void;
  onSupport: () => void;
}

export const EngagementBar: React.FC<EngagementBarProps> = ({
  likes,
  comments,
  reposts,
  views,
  isLiked,
  isSaved,
  onLike,
  onSave,
  onSupport,
}) => {
  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.viewsContainer}>
          <Ionicons name="eye-outline" size={16} color="#6B7280" />
          <Text style={styles.viewsText}>{formatNumber(views)} views</Text>
        </View>
        <TouchableOpacity style={styles.superchargeButton} onPress={onSupport}>
          <Ionicons name="flash" size={16} color="#FDE047" />
          <Text style={styles.superchargeText}>Supercharge</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionButton, isLiked && styles.likedButton]}
          onPress={onLike}
        >
          <Ionicons
            name={isLiked ? "heart" : "heart-outline"}
            size={20}
            color={isLiked ? "#FDE047" : "#000"}
          />
          <Text style={[styles.actionText, isLiked && styles.likedText]}>
            {formatNumber(likes)}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="chatbubble-outline" size={20} color="#000" />
          <Text style={styles.actionText}>{formatNumber(comments)}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="repeat-outline" size={20} color="#000" />
          <Text style={styles.actionText}>{formatNumber(reposts)}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, isSaved && styles.savedButton]}
          onPress={onSave}
        >
          <Ionicons
            name={isSaved ? "bookmark" : "bookmark-outline"}
            size={20}
            color={isSaved ? "#FDE047" : "#000"}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  viewsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewsText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
  },
  superchargeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  superchargeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  actionText: {
    marginLeft: 4,
    fontSize: 16,
    color: '#000',
  },
  likedButton: {
    // Additional styling for liked state if needed
  },
  likedText: {
    color: '#FDE047',
  },
  savedButton: {
    // Additional styling for saved state if needed
  },
});
```

### 6. CommentDisplay Component

```typescript
// components/CommentDisplay.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Comment } from '../types/InsightTypes';

interface CommentDisplayProps {
  comment: Comment;
}

export const CommentDisplay: React.FC<CommentDisplayProps> = ({ comment }) => {
  return (
    <View style={styles.container}>
      <View style={styles.commentSection}>
        <View style={styles.commentHeader}>
          <Image
            source={{ uri: comment.user.photo }}
            style={styles.commentAvatar}
            contentFit="cover"
          />
          <View style={styles.commentContent}>
            <View style={styles.commentUserRow}>
              <Text style={styles.commentUserName}>{comment.user.name}</Text>
              <Text style={styles.commentTimestamp}>{comment.timestamp}</Text>
            </View>
            {comment.user.tagline && (
              <Text style={styles.commentTagline}>{comment.user.tagline}</Text>
            )}
            <Text style={styles.commentText}>{comment.text}</Text>
            <View style={styles.commentActions}>
              <TouchableOpacity style={styles.commentActionButton}>
                <Ionicons name="heart-outline" size={14} color="#000" />
                <Text style={styles.commentActionText}>{comment.likes}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.replyButton}>
                <Text style={styles.replyText}>Reply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
      
      <View style={styles.joinDiscussionSection}>
        <TouchableOpacity style={styles.joinDiscussionButton}>
          <Ionicons name="chatbubble-outline" size={16} color="#000" />
          <Text style={styles.joinDiscussionText}>Join the discussion...</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  commentSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  commentContent: {
    flex: 1,
  },
  commentUserRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  commentUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  commentTimestamp: {
    fontSize: 12,
    color: '#6B7280',
  },
  commentTagline: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  commentText: {
    fontSize: 14,
    color: '#374151',
    marginTop: 4,
    lineHeight: 20,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  commentActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  commentActionText: {
    fontSize: 12,
    marginLeft: 4,
    color: '#000',
  },
  replyButton: {
    marginLeft: 16,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  replyText: {
    fontSize: 12,
    color: '#000',
  },
  joinDiscussionSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F3F4F6',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  joinDiscussionButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinDiscussionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    marginLeft: 8,
  },
});
```

## Feed Implementation

### Main Feed Container

```typescript
// components/InsightFeed.tsx
import React from 'react';
import {
  FlatList,
  View,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { InsightCard } from './InsightCard';
import { Insight } from '../types/InsightTypes';

interface InsightFeedProps {
  insights: Insight[];
  onRefresh?: () => void;
  refreshing?: boolean;
  onEndReached?: () => void;
}

export const InsightFeed: React.FC<InsightFeedProps> = ({
  insights,
  onRefresh,
  refreshing = false,
  onEndReached,
}) => {
  const renderInsight = ({ item }: { item: Insight }) => (
    <InsightCard insight={item} />
  );

  return (
    <FlatList
      data={insights}
      renderItem={renderInsight}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.feedContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        ) : undefined
      }
      onEndReached={onEndReached}
      onEndReachedThreshold={0.1}
    />
  );
};

const styles = StyleSheet.create({
  feedContainer: {
    padding: 16,
    backgroundColor: '#F3F4F6',
  },
});
```

## Usage in Main App

```typescript
// screens/MainFeed.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { InsightFeed } from '../components/InsightFeed';
import { Insight } from '../types/InsightTypes';

export const MainFeedScreen: React.FC = () => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Your data fetching logic here
  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    // Replace with your API call
    // const data = await api.getInsights();
    // setInsights(data);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchInsights();
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    // Load more insights for pagination
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.brandContainer}>
          <Text style={styles.brandText}>
            Super<Text style={styles.brandHighlight}>charged</Text>
          </Text>
        </View>
      </View>
      <Text style={styles.feedTitle}>Published Insights</Text>
      <InsightFeed
        insights={insights}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        onEndReached={handleLoadMore}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  brandContainer: {
    backgroundColor: '#000',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
  },
  brandHighlight: {
    position: 'relative',
  },
  feedTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
    color: '#111827',
  },
});
```

## Performance Optimization

### For Large Lists
```typescript
// Use getItemLayout for better performance with known item heights
const getItemLayout = (data: any, index: number) => ({
  length: ITEM_HEIGHT, // Define your average item height
  offset: ITEM_HEIGHT * index,
  index,
});

// Add to FlatList props
getItemLayout={getItemLayout}
initialNumToRender={10}
maxToRenderPerBatch={5}
windowSize={10}
```

### Image Optimization
```typescript
// Use expo-image with caching
import { Image } from 'expo-image';

// In your MediaDisplay component
<Image
  source={{ uri: src }}
  style={styles.media}
  contentFit="cover"
  cachePolicy="memory-disk"
  transition={200}
/>
```

## Styling Notes

- **Colors**: The design uses a professional color palette with black (#000), grays (#6B7280, #9CA3AF), and yellow accent (#FDE047)
- **Typography**: Clean, readable fonts with appropriate weights (400, 600, 700)
- **Spacing**: Consistent 16px padding/margins with 12px for smaller elements
- **Border Radius**: 12px for cards, 8px for buttons, full radius for avatars
- **Shadows**: Subtle elevation with `shadowOpacity: 0.1` and `elevation: 4`

## Integration Notes

1. **Data Source**: Replace mock data with your API endpoints
2. **Navigation**: Integrate with your existing navigation system
3. **State Management**: Consider using Redux/Zustand for global state
4. **Authentication**: Add user authentication context
5. **Push Notifications**: Implement for new insights/comments
6. **Offline Support**: Consider caching strategies with AsyncStorage

This implementation provides a solid foundation for the Insight Feed that closely matches the original design while being optimized for React Native and mobile interactions.