import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, Dimensions, StyleSheet, Linking, Image, Platform, ScrollView } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { FontAwesome } from '@expo/vector-icons';
import type { Video as VideoType } from '../types';
import { StaticVisual } from './StaticVisual';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const { height: screenHeight } = Dimensions.get('window');


interface VideoCardProps {
  video: VideoType;
  isActive: boolean;
  onOpenComments?: (videoId: number) => void;
  onUserInteraction?: (articleId: number, action: 'like' | 'save' | 'unlike' | 'unsave') => void;
}

// Memoize helper functions to prevent recreation
const getTypeIcon = React.memo((type: string) => {
  const iconProps = { size: 16, color: 'white', style: { marginRight: 4 } };
  switch (type) {
    case 'paper':
      return <MaterialCommunityIcons name="microscope" {...iconProps} />;
    case 'book':
      return <Feather name="book-open" {...iconProps} />;
    case 'article':
      return <MaterialCommunityIcons name="newspaper" {...iconProps} />;
    default:
      return null;
  }
});

const getSiteName = (url: string): string => {
  try {
    const { hostname } = new URL(url);
    // Remove www. if present
    return hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

const formatTime = (seconds: number): string => {
  if (!isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const VideoCard: React.FC<VideoCardProps> = React.memo(({ video, isActive, onOpenComments, onUserInteraction }) => {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [likes, setLikes] = useState(video.likes);
  const [hasLiked, setHasLiked] = useState(false);
  const [saves, setSaves] = useState(video.saves);
  const [hasSaved, setHasSaved] = useState(false);
  const [views, setViews] = useState(video.views);
  const [hasViewed, setHasViewed] = useState(false);
  const [initialStateLoaded, setInitialStateLoaded] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Memoize expensive computations
  const shouldCreatePlayer = useMemo(() => !!video.video_url, [video.video_url]);
  
  // Memoize toggle function to prevent recreation
  const toggleExpanded = useCallback(() => {
    setExpanded(!expanded);
  }, [expanded]);

  // Only create player for videos that actually have video_url
  const player = useVideoPlayer(
    shouldCreatePlayer && signedUrl ? { uri: signedUrl } : null, // Only pass URI if we should have a player AND have signed URL
    (player) => {
      if (player && signedUrl && shouldCreatePlayer) {
        player.loop = true;
        player.volume = 1.0;
        player.muted = false;
        if (isActive) {
          player.play();
        } else {
          player.pause();
        }
      }
    }
  );

  // Ensure video plays/pauses when isActive changes
  useEffect(() => {
    if (player && shouldCreatePlayer) {
      if (isActive) {
        player.play();
      } else {
        player.pause();
      }
    }
  }, [isActive, player, shouldCreatePlayer]);

  // Listen for time updates - memoized handlers
  const handleTimeUpdate = useCallback((payload: { currentTime: number }) => {
    setCurrentTime(payload.currentTime);
  }, []);

  const handleSourceLoad = useCallback((payload: { duration: number }) => {
    setDuration(payload.duration);
  }, []);

  const handleStatusChange = useCallback((status: any) => {
    // Status change handler
  }, []);

  // Listen for time updates
  useEffect(() => {
    if (!player || !shouldCreatePlayer) {
      return;
    }
    // Set timeUpdateEventInterval for very frequent updates (smooth progress)
    player.timeUpdateEventInterval = 0.01;
    
    player.addListener('timeUpdate', handleTimeUpdate);
    player.addListener('sourceLoad', handleSourceLoad);
    player.addListener('statusChange', handleStatusChange);
    
    // Set initial duration if available
    if (player.duration) {
      setDuration(player.duration);
    }
    return () => {
      player.removeListener('timeUpdate', handleTimeUpdate);
      player.removeListener('sourceLoad', handleSourceLoad);
      player.removeListener('statusChange', handleStatusChange);
    };
  }, [player, shouldCreatePlayer, handleTimeUpdate, handleSourceLoad, handleStatusChange]);

  // Memoize the initial like/save/view check to prevent unnecessary re-runs
  const checkInitialState = useCallback(async () => {
    if (!user) return;
    
    try {
      // Run all queries in parallel for better performance
      const [likeResult, saveResult, viewResult] = await Promise.all([
        supabase
          .from('article_likes')
          .select('user_id, article_id')
          .eq('user_id', user.id)
          .eq('article_id', video.id)
          .maybeSingle(),
        supabase
          .from('article_saves')
          .select('user_id, article_id')
          .eq('user_id', user.id)
          .eq('article_id', video.id)
          .maybeSingle(),
        supabase
          .from('article_views')
          .select('user_id, article_id')
          .eq('user_id', user.id)
          .eq('article_id', video.id)
          .maybeSingle()
      ]);

      setHasLiked(!!likeResult.data);
      setHasSaved(!!saveResult.data);
      setHasViewed(!!viewResult.data);
      setInitialStateLoaded(true);
    } catch (error) {
      console.error('Error checking initial like/save/view state:', error);
      setInitialStateLoaded(true); // Still set to true even on error to avoid blocking
    }
  }, [user?.id, video.id]);

  // Reset state when video changes
  useEffect(() => {
    setInitialStateLoaded(false);
    setLikes(video.likes);
    setSaves(video.saves);
    setViews(video.views);
    setHasLiked(false);
    setHasSaved(false);
    setHasViewed(false);
  }, [video.id, video.likes, video.saves, video.views]);

  // Check if user has already liked/saved this post on mount
  useEffect(() => {
    if (user && !initialStateLoaded) {
      checkInitialState();
    }
  }, [user, initialStateLoaded, checkInitialState]);

  // Track view when post becomes active (visible)
  const trackView = useCallback(async () => {
    if (!user || hasViewed) return;
    
    try {
      const { data, error } = await supabase.rpc('increment_article_view_count', {
        article_id_param: video.id,
        user_id_param: user.id
      });
      
      if (!error && data) {
        setHasViewed(true);
        setViews(prev => prev + 1);
        // Notify parent component about the view interaction
        onUserInteraction?.(video.id, 'view' as any);
      }
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  }, [user, hasViewed, video.id, onUserInteraction]);

  // Track view when post becomes active
  useEffect(() => {
    if (isActive && user && !hasViewed && initialStateLoaded) {
      // Add a small delay to ensure the user actually sees the content
      const timer = setTimeout(() => {
        trackView();
      }, 1000); // 1 second delay
      
      return () => clearTimeout(timer);
    }
  }, [isActive, user, hasViewed, initialStateLoaded, trackView]);

  // Memoized interaction handlers
  const savePost = useCallback(async () => {
    if (!user) return;

    // Always check the database before saving to prevent race conditions
    const { data: saveData, error: checkError } = await supabase
      .from('article_saves')
      .select('user_id, article_id')
      .eq('user_id', user.id)
      .eq('article_id', video.id)
      .maybeSingle();

    if (checkError) return;
    
    if (saveData) {
      setHasSaved(true);
      return;
    }
    
    setHasSaved(true);
    setSaves((prev) => prev + 1);
    
    // Add entry to article_saves table
    const { error: insertError } = await supabase
      .from('article_saves')
      .insert({ user_id: user.id, article_id: video.id });

    if (insertError) {
      setHasSaved(false);
      setSaves((prev) => prev - 1);
      return;
    }
    
    // Update saves count in articles table
    const newSavesCount = saves + 1; // Stale state can be an issue here
    const { error: updateError } = await supabase
      .from('articles')
      .update({ saves_count: newSavesCount })
      .eq('id', video.id);

    if (updateError) {
      setSaves((prev) => prev - 1);
      setHasSaved(false);
    } else {
      // Notify parent component about the save interaction
      onUserInteraction?.(video.id, 'save');
    }
  }, [user, video.id, saves, onUserInteraction]);

  const unsavePost = useCallback(async () => {
    if (!user) return;
    
    // Always check the database before unsaving
    const { data: saveData, error: checkError } = await supabase
      .from('article_saves')
      .select('user_id, article_id')
      .eq('user_id', user.id)
      .eq('article_id', video.id)
      .maybeSingle();

    if (checkError) return;

    if (!saveData) {
      setHasSaved(false);
      return;
    }
    
    setHasSaved(false);
    setSaves((prev) => Math.max(prev - 1, 0));
    
    // Remove entry from article_saves table
    const { error: deleteError } = await supabase
      .from('article_saves')
      .delete()
      .eq('user_id', user.id)
      .eq('article_id', video.id);

    if (deleteError) {
      setHasSaved(true);
      setSaves((prev) => prev + 1);
      return;
    }
    
    // Decrement saves count in articles table
    const newSavesCount = Math.max(saves - 1, 0); // Stale state can be an issue here
    const { error: updateError } = await supabase
      .from('articles')
      .update({ saves_count: newSavesCount })
      .eq('id', video.id);

    if (updateError) {
      setSaves((prev) => prev + 1);
      setHasSaved(true);
    } else {
      // Notify parent component about the unsave interaction
      onUserInteraction?.(video.id, 'unsave');
    }
  }, [user, video.id, saves, onUserInteraction]);

  // Get signed URL with proper cleanup and memoization
  useEffect(() => {
    let isMounted = true;
    const getSignedUrl = async () => {
      if (video.video_url && shouldCreatePlayer) {
        try {
          const { data, error } = await supabase.storage
            .from('videos')
            .createSignedUrl(video.video_url, 3600); // 1 hour expiry
          
          if (isMounted) {
            if (data && data.signedUrl) {
              setSignedUrl(data.signedUrl);
            } else {
              setSignedUrl(null);
            }
          }
        } catch (err) {
          if (isMounted) {
            setSignedUrl(null);
          }
        }
      } else {
        setSignedUrl(null);
      }
    };
    getSignedUrl();
    return () => { 
      isMounted = false; 
    };
  }, [video.video_url, shouldCreatePlayer]);

  const likePost = useCallback(async () => {
    if (!user) return;
    
    // Always check the database before liking to prevent race conditions
    const { data: likeData, error: checkError } = await supabase
      .from('article_likes')
      .select('user_id, article_id')
      .eq('user_id', user.id)
      .eq('article_id', video.id)
      .maybeSingle();

    if (checkError) return;
    
    if (likeData) {
      setHasLiked(true);
      return;
    }

    setHasLiked(true);
    setLikes((prev) => prev + 1);

    // Add entry to article_likes table
    const { error: insertError } = await supabase
      .from('article_likes')
      .insert({ user_id: user.id, article_id: video.id });

    if (insertError) {
      setHasLiked(false);
      setLikes((prev) => prev - 1);
      return;
    }

    // Update likes count in articles table
    const newLikesCount = likes + 1; // Stale state can be an issue here
    const { error: updateError } = await supabase
      .from('articles')
      .update({ likes_count: newLikesCount })
      .eq('id', video.id);

    if (updateError) {
      setLikes((prev) => prev - 1);
      setHasLiked(false);
    } else {
      // Notify parent component about the like interaction
      onUserInteraction?.(video.id, 'like');
    }
  }, [user, video.id, likes, onUserInteraction]);

  const unlikePost = useCallback(async () => {
    if (!user) return;

    // Always check the database before unliking
    const { data: likeData, error: checkError } = await supabase
      .from('article_likes')
      .select('user_id, article_id')
      .eq('user_id', user.id)
      .eq('article_id', video.id)
      .maybeSingle();
    
    if (checkError) return;

    if (!likeData) {
      setHasLiked(false);
      return;
    }

    setHasLiked(false);
    setLikes((prev) => Math.max(prev - 1, 0));
    
    // Remove entry from article_likes table
    const { error: deleteError } = await supabase
      .from('article_likes')
      .delete()
      .eq('user_id', user.id)
      .eq('article_id', video.id);

    if (deleteError) {
      setHasLiked(true);
      setLikes((prev) => prev + 1);
      return;
    }

    // Decrement likes count in articles table
    const newLikesCount = Math.max(likes - 1, 0); // Stale state can be an issue here
    const { error: updateError } = await supabase
      .from('articles')
      .update({ likes_count: newLikesCount })
      .eq('id', video.id);

    if (updateError) {
      setLikes((prev) => prev + 1);
      setHasLiked(true);
    } else {
      // Notify parent component about the unlike interaction
      onUserInteraction?.(video.id, 'unlike');
    }
  }, [user, video.id, likes, onUserInteraction]);

  // Memoize handlers to prevent recreation
  const handleLikePress = useCallback(() => {
    hasLiked ? unlikePost() : likePost();
  }, [hasLiked, likePost, unlikePost]);

  const handleSavePress = useCallback(() => {
    hasSaved ? unsavePost() : savePost();
  }, [hasSaved, savePost, unsavePost]);

  const handleCommentsPress = useCallback(() => {
    onOpenComments?.(video.id);
  }, [onOpenComments, video.id]);

  const handleReadMorePress = useCallback(() => {
    if (video.source) {
      Linking.openURL(video.source);
    }
  }, [video.source]);

  // Dynamic styles that respect theme
  const dynamicStyles = StyleSheet.create({
    root: {
      backgroundColor: colors.background,
    },
    staticCardContainerV3: {
      backgroundColor: colors.card,
      borderRadius: 0,
      paddingTop: 56,
      paddingBottom: 40,
      paddingHorizontal: 24,
      marginHorizontal: 0,
      marginTop: -32,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.18,
      shadowRadius: 16,
      elevation: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    staticCardTitleV3: {
      color: colors.text,
      fontSize: 22,
      fontWeight: 'bold',
      paddingVertical: 6,
      alignSelf: 'flex-start',
      marginBottom: 14,
    },
    staticCardSynopsisV3: {
      color: colors.text,
      fontSize: 17,
      marginBottom: 14,
      textAlign: 'left',
      lineHeight: 22,
    },
    staticCardOwnerV3: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '600',
      marginRight: 8,
    },
    staticAuthorsTextV3: {
      color: colors.text,
      fontSize: 14,
      marginLeft: 10,
    },
    actionBtnIconCircleV3: {
      backgroundColor: colors.surface,
      padding: 10,
      borderRadius: 999,
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
      borderWidth: 1,
      borderColor: colors.border,
    },
    scrollableContentContainer: {
      paddingBottom: 16,
    },
    authorTextStatic: {
      color: '#3b82f6',
      fontSize: 14,
      fontWeight: '500',
    },
    authorPillStatic: {
      backgroundColor: colors.surface,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      marginRight: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    metaDot: {
      height: 4,
      width: 4,
      borderRadius: 2,
      backgroundColor: colors.textTertiary,
      marginHorizontal: 8,
    },
    industryPillV3: {
      backgroundColor: colors.primary,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 999,
    },
    industryPillTextV3: {
      color: colors.surface,
      fontSize: 14,
      fontWeight: '600',
    },
  });

  // Memoize expensive computations for static content
  const staticContentData = useMemo(() => ({
    synopsis: video.content || '',
    title: video.title || '',
    source: video.source || '',
    topSafePadding: Platform.OS === 'ios' ? 32 : 20, // Reduced from 44/24 for more consistent spacing
    siteName: getSiteName(video.source || ''),
    progressPercentage: duration > 0 ? (currentTime / duration) * 100 : 0
  }), [video.content, video.title, video.source, currentTime, duration]);

  // Memoize the rendered authors to prevent recreation
  const renderedAuthors = useMemo(() => {
    if (!video.authors || video.authors.length === 0) return null;
    
    return video.authors.map((author, index) => (
              <View key={index} style={video.video_url ? styles.authorPill : dynamicStyles.authorPillStatic}>
        <Text style={video.video_url ? styles.authorText : dynamicStyles.authorTextStatic}>{author}</Text>
      </View>
    ));
  }, [video.authors, video.video_url]);

  if (video.video_url && signedUrl) {
    return (
      <View style={[{ height: screenHeight }, styles.root]}>
        {/* Video Player */}
        <VideoView
          player={player}
          style={styles.bgImage}
          contentFit="cover"
          nativeControls={false}
        />
        <View style={styles.gradientOverlay} />
        <View style={styles.videoContentContainer}>
          {/* Top Bar */}
          <View style={styles.topBarRow}>
            <View style={styles.topBarPill}>
              <Text style={styles.topBarPillText}>For You</Text>
            </View>
            <View style={styles.topBarPill}>
              {getTypeIcon(video.type)}
              <Text style={styles.topBarPillText}>{String(video.type).charAt(0).toUpperCase() + String(video.type).slice(1)}</Text>
            </View>
          </View>
          {/* Bottom Content */}
          <View style={styles.bottomContent}>
            <View style={styles.titleBlock}>
              <Text style={styles.title}>{video.title}</Text>
              {/* Authors horizontal scroll view */}
              {renderedAuthors && (
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.authorsContainer}
                  contentContainerStyle={styles.authorsContent}
                >
                  {renderedAuthors}
                </ScrollView>
              )}
              <Text style={styles.caption}>{video.caption}</Text>
              <View style={styles.metaRow}>
                <Text style={styles.metaSourceSite}>{staticContentData.siteName}</Text>
                <View style={dynamicStyles.metaDot} />
                <View style={styles.industryPill}>
                  <Text style={styles.industryPillText}>{video.industry}</Text>
                </View>
              </View>
            </View>
            {/* Progress Bar - Real */}
            <View style={[styles.progressBarBg, { height: 4, justifyContent: 'center' }]}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { width: `${staticContentData.progressPercentage}%` }
                ]} 
              />
            </View>
            {/* Time labels */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ color: '#fff', fontSize: 12 }}>{formatTime(currentTime)}</Text>
              <Text style={{ color: '#fff', fontSize: 12 }}>{formatTime(duration)}</Text>
            </View>
            <View style={styles.actionRow}>
              <View style={styles.actionBtnGroup}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  accessibilityLabel={`Like video, ${likes} likes`}
                  accessibilityRole="button"
                  onPress={handleLikePress}
                >
                  <View style={styles.actionBtnIconCircle}>
                    <FontAwesome name={hasLiked ? 'heart' : 'heart-o'} size={22} color={hasLiked ? '#3b82f6' : 'white'} />
                  </View>
                  <Text style={styles.actionBtnCount}>{likes}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtn}
                  accessibilityLabel={`Save video, ${saves} saves`}
                  accessibilityRole="button"
                  onPress={handleSavePress}
                >
                  <View style={styles.actionBtnIconCircle}>
                    <FontAwesome name={hasSaved ? 'bookmark' : 'bookmark-o'} size={22} color={hasSaved ? '#3b82f6' : 'white'} />
                  </View>
                  <Text style={styles.actionBtnCount}>{saves}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.actionBtn} 
                  accessibilityLabel={`Comment on video, ${video.comments} comments`} 
                  accessibilityRole="button" 
                  onPress={handleCommentsPress}
                >
                  <View style={styles.actionBtnIconCircle}>
                    <Feather name="message-circle" size={22} color="white" />
                  </View>
                  <Text style={styles.actionBtnCount}>{video.comments}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.actionBtn} 
                  accessibilityLabel={`Views, ${views} views`} 
                  accessibilityRole="button" 
                  disabled={true}
                >
                  <View style={styles.actionBtnIconCircle}>
                    <Feather name="eye" size={22} color="white" />
                  </View>
                  <Text style={styles.actionBtnCount}>{views}</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity 
                style={styles.readMoreBtn} 
                accessibilityLabel="Read more about this video" 
                accessibilityRole="button" 
                onPress={handleReadMorePress}
              >
                <Text style={styles.readMoreBtnText}>Read More</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  } else if (video.video_url && !signedUrl) {
    return (
      <View style={[{ height: screenHeight, justifyContent: 'center', alignItems: 'center' }, dynamicStyles.root]}>
        <Text style={{ color: colors.text }}>Loading video...</Text>
      </View>
    );
  } else {
    // Render static content for non-video types, with expandable/collapsible synopsis on text press
    return (
      <View style={[{ height: screenHeight }, dynamicStyles.root]}>
        <View style={styles.staticContentContainer}>
          {/* Only show visual when not expanded to maintain smooth scrolling */}
          {!expanded && (
            <View style={styles.visualWrapper}>
              <StaticVisual industry={video.industry} postId={video.id} />
            </View>
          )}
          <View style={[dynamicStyles.staticCardContainerV3, expanded && { flex: 1, justifyContent: 'flex-start' }]}> 
            {/* Meta row (source and topic) always at the top with safe area padding */}
            <View style={{ paddingTop: staticContentData.topSafePadding, paddingBottom: 4 }}>
              <View style={styles.staticMetaRowV3}>
                <Text style={dynamicStyles.staticCardOwnerV3} numberOfLines={1}>{staticContentData.siteName}</Text>
                <View style={dynamicStyles.metaDot} />
                <View style={dynamicStyles.industryPillV3}>
                  <Text style={dynamicStyles.industryPillTextV3} numberOfLines={1}>
                    {video.industry === 'Finance & Economics' ? 'Finance' : video.industry}
                  </Text>
                </View>
                <View style={dynamicStyles.metaDot} />
                <View style={styles.viewCountMeta}>
                  <Feather name="eye" size={14} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.viewCountText}>{views}</Text>
                </View>
              </View>
            </View>
            {/* Title below meta row - tappable to expand/collapse */}
            <TouchableOpacity activeOpacity={0.8} onPress={toggleExpanded}>
              <Text 
                style={[
                  dynamicStyles.staticCardTitleV3,
                  // Adjust marginBottom when no authors to maintain consistent spacing
                  !renderedAuthors && { marginBottom: 8 }
                ]}
                numberOfLines={expanded ? undefined : 2}
                ellipsizeMode="tail"
              >
                {staticContentData.title}
              </Text>
            </TouchableOpacity>
            {/* Authors horizontal scroll view */}
            {renderedAuthors && (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.authorsContainerStatic}
                contentContainerStyle={styles.authorsContent}
              >
                {renderedAuthors}
              </ScrollView>
            )}
            {/* Conditional content rendering: ScrollView only when expanded */}
            {expanded ? (
              <View style={[styles.scrollableContentContainer, { flex: 1 }]}>
                <ScrollView 
                  showsVerticalScrollIndicator={true}
                  style={{ flex: 1 }}
                  nestedScrollEnabled={true}
                >
                  <TouchableOpacity activeOpacity={0.8} onPress={toggleExpanded}>
                    <Text style={dynamicStyles.staticCardSynopsisV3}>
                      {staticContentData.synopsis}
                    </Text>
                  </TouchableOpacity>
                  <View style={{ height: 24 }} />
                </ScrollView>
              </View>
            ) : (
              <View style={dynamicStyles.scrollableContentContainer}>
                <TouchableOpacity activeOpacity={0.8} onPress={toggleExpanded}>
                  <Text
                    style={dynamicStyles.staticCardSynopsisV3}
                    numberOfLines={renderedAuthors ? 4 : 6} // Show more lines when no authors
                    ellipsizeMode="tail"
                  >
                    {staticContentData.synopsis}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            {/* Like/comment/save row always at the bottom */}
            <View style={[
              styles.staticActionsRowV3,
              expanded ? styles.staticActionsRowExpanded : styles.staticActionsRowCollapsed
            ]}>
              <View style={styles.actionBtnGroup}>
                <TouchableOpacity 
                  style={styles.actionBtn} 
                  accessibilityLabel={`Like post, ${likes} likes`} 
                  accessibilityRole="button"  
                  onPress={handleLikePress}
                >
                  <View style={dynamicStyles.actionBtnIconCircleV3}>
                    <FontAwesome name={hasLiked ? 'heart' : 'heart-o'} size={22} color={colors.primary} />
                  </View>
                  <Text style={[styles.actionBtnCountV3, { color: colors.primary }]}>{likes}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtn}
                  accessibilityLabel={`Save post, ${saves} saves`}
                  accessibilityRole="button"
                  onPress={handleSavePress}
                >
                  <View style={dynamicStyles.actionBtnIconCircleV3}>
                    <FontAwesome name={hasSaved ? 'bookmark' : 'bookmark-o'} size={22} color={colors.primary} />
                  </View>
                  <Text style={[styles.actionBtnCountV3, { color: colors.primary }]}>{saves}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.actionBtn} 
                  accessibilityLabel={`Comment on post, ${video.comments} comments`} 
                  accessibilityRole="button" 
                  onPress={handleCommentsPress}
                >
                  <View style={dynamicStyles.actionBtnIconCircleV3}>
                    <Feather name="message-circle" size={22} color={colors.primary} />
                  </View>
                  <Text style={[styles.actionBtnCountV3, { color: colors.primary }]}>{video.comments}</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity 
                style={[styles.readMoreBtnV3, { backgroundColor: colors.primary }]} 
                accessibilityLabel="Read more about this post" 
                accessibilityRole="button" 
                onPress={handleReadMorePress}
              >
                <Text style={styles.readMoreBtnTextV3}>Read More</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  }
}, (prevProps, nextProps) => {
  // Custom comparison function for React.memo
  // Only re-render if critical props actually changed
  return (
    prevProps.video.id === nextProps.video.id &&
    prevProps.isActive === nextProps.isActive &&
    prevProps.video.likes === nextProps.video.likes &&
    prevProps.video.saves === nextProps.video.saves &&
    prevProps.video.comments === nextProps.video.comments &&
    prevProps.video.views === nextProps.video.views &&
    prevProps.onOpenComments === nextProps.onOpenComments &&
    prevProps.onUserInteraction === nextProps.onUserInteraction
  );
});

VideoCard.displayName = 'VideoCard';

const styles = StyleSheet.create({
  root: {
    backgroundColor: '#000',
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  videoContentContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: 16,
  },
  staticContentContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: 0,
    margin: 0,
  },
  topBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 48,
  },
  topBarPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  topBarPillText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  bottomContent: {
    paddingBottom: 45, // Increased from 25 to raise action row above bottom nav
    paddingHorizontal: 0, // ensure no extra horizontal padding
  },
  titleBlock: {
    marginBottom: 8,
    paddingHorizontal: 0, // ensure no extra horizontal padding
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  caption: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 15,
    marginTop: 4,
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  metaSourceSite: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '500',
    marginRight: 8,
    textTransform: 'capitalize',
  },
  metaDot: {
    height: 4,
    width: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.8)',
    marginHorizontal: 8,
  },
  industryPill: {
    backgroundColor: 'rgba(59,130,246,0.8)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  industryPillText: {
    color: '#fff',
    fontSize: 14,
  },
  progressBarBg: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 999,
    height: 4,
    marginBottom: 16,
  },
  progressBarFill: {
    backgroundColor: '#fff',
    height: 4,
    borderRadius: 999,
    width: '75%',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionBtnGroup: {
    flexDirection: 'row',
    gap: 16,
  },
  actionBtn: {
    alignItems: 'center',
    marginRight: 16,
  },
  actionBtnIconCircle: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnCount: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
  },
  readMoreBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center',
  },
  readMoreBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  // Add new styles for static content card v3 (stunning visual design)
  staticImageWrapper: {
    width: '100%',
    aspectRatio: 1.5,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    marginBottom: -40,
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  staticImage: {
    width: '100%',
    height: '100%',
  },
  staticCardContainerV3: {
    backgroundColor: '#18181b',
    borderRadius: 0,
    paddingTop: 56,
    paddingBottom: 40, // Increased from 28 to ensure proper spacing above navbar
    paddingHorizontal: 24,
    marginHorizontal: 0,
    marginTop: -32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  staticCardTitleV3: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginBottom: 14,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  staticCardSynopsisV3: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 17,
    marginBottom: 14,
    textAlign: 'left',
    lineHeight: 22,
  },
  staticMetaRowV3: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6, // Reduced from 10 for more consistent spacing
    flexWrap: 'nowrap',
    overflow: 'hidden',
  },
  staticCardOwnerV3: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginRight: 8,
    flexShrink: 1,
    maxWidth: '40%',
  },
  industryPillV3: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    marginLeft: 8,
    flexShrink: 1,
    maxWidth: '30%',
  },
  industryPillTextV3: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  staticAuthorsRowV3: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    marginTop: 2,
  },
  authorAvatarV3: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  authorAvatarTextV3: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  staticAuthorsTextV3: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 10,
  },
  staticActionsRowV3: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  staticActionsRowCollapsed: {
    marginBottom: 50, // Increased from 32 to raise action row above bottom nav
    paddingBottom: 8,
  },
  staticActionsRowExpanded: {
    marginBottom: 50, // Increased to match collapsed state for consistent clearance above nav
    paddingBottom: 4,
  },
  actionBtnIconCircleV3: {
    backgroundColor: '#23232b',
    padding: 10,
    borderRadius: 999,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  actionBtnCountV3: {
    color: '#3b82f6',
    fontSize: 13,
    textAlign: 'center',
  },
  readMoreBtnV3: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 2,
  },
  readMoreBtnTextV3: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Authors styles
  authorsContainer: {
    marginTop: 8,
    marginBottom: 8,
    maxHeight: 32,
  },
  authorsContent: {
    paddingRight: 16,
  },
  authorPill: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginRight: 8,
  },
  authorText: {
    color: '#3b82f6',
    fontSize: 13,
    fontWeight: '500',
  },
  // Static content specific author styles
  authorsContainerStatic: {
    marginTop: 8,
    marginBottom: 12,
    maxHeight: 32,
  },
  authorPillStatic: {
    backgroundColor: 'rgba(59,130,246,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginRight: 8,
  },
  authorTextStatic: {
    color: '#3b82f6',
    fontSize: 13,
    fontWeight: '500',
  },
  // Scrollable content container
  scrollableContentContainer: {
    marginBottom: 16,
  },
  // Visual wrapper styles
  visualWrapper: {
    minHeight: 200, // Ensure minimum height to prevent gaps
  },
  visualWrapperExpanded: {
    height: 120, // Smaller height when expanded
    minHeight: 120,
  },
  // View count meta styles
  viewCountMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    flexShrink: 0,
    minWidth: 'auto',
  },
  viewCountText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 3,
  },
});
