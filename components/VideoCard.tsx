import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Dimensions, StyleSheet, Linking, Image, Platform, ScrollView } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { FontAwesome } from '@expo/vector-icons';
import type { Video as VideoType } from '../types';
import { StaticVisual } from './StaticVisual';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const { height: windowHeight } = Dimensions.get('window');
// Height of the bottom navbar (Header) in px, must match styles.navRow height in Header.tsx
const NAVBAR_HEIGHT = 84;
const screenHeight = windowHeight - NAVBAR_HEIGHT;


interface VideoCardProps {
  video: VideoType;
  isActive: boolean;
  onOpenComments?: (videoId: number) => void;
}


export const VideoCard: React.FC<VideoCardProps> = ({ video, isActive, onOpenComments }) => {
  const { user } = useAuth();
  const [likes, setLikes] = useState(video.likes);
  const [hasLiked, setHasLiked] = useState(false);
  const [saves, setSaves] = useState(video.saves);
  const [hasSaved, setHasSaved] = useState(false);
  const [expanded, setExpanded] = React.useState(false);

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Only create player for videos that actually have video_url
  const shouldCreatePlayer = !!video.video_url;

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

  // Listen for time updates
  useEffect(() => {
    if (!player || !shouldCreatePlayer) {
      return;
    }
    // Set timeUpdateEventInterval for very frequent updates (smooth progress)
    player.timeUpdateEventInterval = 0.01;
    const onTimeUpdate = (payload: { currentTime: number }) => {
      setCurrentTime(payload.currentTime);
    };
    const onSourceLoad = (payload: { duration: number }) => {
      setDuration(payload.duration);
    };
    const onStatusChange = (status: any) => {
      // Status change handler
    };
    
    player.addListener('timeUpdate', onTimeUpdate);
    player.addListener('sourceLoad', onSourceLoad);
    player.addListener('statusChange', onStatusChange);
    
    // Set initial duration if available
    if (player.duration) {
      setDuration(player.duration);
    }
    return () => {
      player.removeListener('timeUpdate', onTimeUpdate);
      player.removeListener('sourceLoad', onSourceLoad);
      player.removeListener('statusChange', onStatusChange);
    };
  }, [player, shouldCreatePlayer]);

  // Check if user has already liked/saved this post on mount
  React.useEffect(() => {
    const checkLikedAndSaved = async () => {
      if (!user) return;
      // Like check
      const { data: likeData } = await supabase
        .from('article_likes')
        .select('user_id, article_id')
        .eq('user_id', user.id)
        .eq('article_id', video.id)
        .maybeSingle();
      setHasLiked(!!likeData);
      // Save check
      const { data: saveData } = await supabase
        .from('article_saves')
        .select('user_id, article_id')
        .eq('user_id', user.id)
        .eq('article_id', video.id)
        .maybeSingle();
      setHasSaved(!!saveData);
    };
    checkLikedAndSaved();
  }, [user, video.id]);

  // Save/Unsave logic
  const savePost = async () => {
    if (!user) {
      return;
    }

    // Always check the database before saving to prevent race conditions
    const { data: saveData, error: checkError } = await supabase
      .from('article_saves')
      .select('user_id, article_id')
      .eq('user_id', user.id)
      .eq('article_id', video.id)
      .maybeSingle();

    if (checkError) {
        return;
    }
    
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
    }
  };

  const unsavePost = async () => {
    if (!user) {
      return;
    }
    
    // Always check the database before unsaving
    const { data: saveData, error: checkError } = await supabase
      .from('article_saves')
      .select('user_id, article_id')
      .eq('user_id', user.id)
      .eq('article_id', video.id)
      .maybeSingle();

    if (checkError) {
        return;
    }

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
    }
  };

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

  const likePost = async () => {
    if (!user) {
      return;
    }
    
    // Always check the database before liking to prevent race conditions
    const { data: likeData, error: checkError } = await supabase
      .from('article_likes')
      .select('user_id, article_id')
      .eq('user_id', user.id)
      .eq('article_id', video.id)
      .maybeSingle();

    if (checkError) {
        return;
    }
    
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
    }
  };

  const unlikePost = async () => {
    if (!user) {
      return;
    }

    // Always check the database before unliking
    const { data: likeData, error: checkError } = await supabase
      .from('article_likes')
      .select('user_id, article_id')
      .eq('user_id', user.id)
      .eq('article_id', video.id)
      .maybeSingle();
    
    if (checkError) {
        return;
    }

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
    }
  }

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
              {video.authors && video.authors.length > 0 && (
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.authorsContainer}
                  contentContainerStyle={styles.authorsContent}
                >
                  {video.authors.map((author, index) => (
                    <View key={index} style={styles.authorPill}>
                      <Text style={styles.authorText}>{author}</Text>
                    </View>
                  ))}
                </ScrollView>
              )}
              <Text style={styles.caption}>{video.caption}</Text>
              <View style={styles.metaRow}>
                <Text style={styles.metaSourceSite}>{getSiteName(video.source)}</Text>
                <View style={styles.metaDot} />
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
                  { width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }
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
                  onPress={hasLiked ? unlikePost : likePost}
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
                  onPress={hasSaved ? unsavePost : savePost}
                >
                  <View style={styles.actionBtnIconCircle}>
                    <FontAwesome name={hasSaved ? 'bookmark' : 'bookmark-o'} size={22} color={hasSaved ? '#3b82f6' : 'white'} />
                  </View>
                  <Text style={styles.actionBtnCount}>{saves}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} accessibilityLabel={`Comment on video, ${video.comments} comments`} accessibilityRole="button" onPress={() => onOpenComments && onOpenComments(video.id)}>
                  <View style={styles.actionBtnIconCircle}>
                    <Feather name="message-circle" size={22} color="white" />
                  </View>
                  <Text style={styles.actionBtnCount}>{video.comments}</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.readMoreBtn} accessibilityLabel="Read more about this video" accessibilityRole="button" onPress={() => video.source && Linking.openURL(video.source)}>
                <Text style={styles.readMoreBtnText}>Read More</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  } else if (video.video_url && !signedUrl) {
    return (
      <View style={[{ height: screenHeight, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }, styles.root]}>
        <Text style={{ color: '#fff' }}>Loading video...</Text>
      </View>
    );
  } else {
    // Render static content for non-video types, with expandable/collapsible synopsis on text press
    // Render static content for non-video types, with expandable/collapsible synopsis on text press
    const synopsis = video.content || '';
    const title = video.title || '';
    const source = video.source || '';
    // Add safe area padding for notch
    const topSafePadding = Platform.OS === 'ios' ? 44 : 24;
    return (
      <View style={[{ height: screenHeight, backgroundColor: '#101014' }, styles.root]}>
        <View style={styles.staticContentContainer}>
          {/* Only show visual when not expanded to maintain smooth scrolling */}
          {!expanded && (() => {
            return (
              <View style={styles.visualWrapper}>
                <StaticVisual industry={video.industry} postId={video.id} />
              </View>
            );
          })()}
          <View style={[styles.staticCardContainerV3, expanded && { flex: 1, justifyContent: 'flex-start' }]}> 
            {/* Meta row (source and topic) always at the top with safe area padding */}
            <View style={{ paddingTop: topSafePadding, paddingBottom: 8 }}>
              <View style={styles.staticMetaRowV3}>
                <Text style={styles.staticCardOwnerV3}>{getSiteName(source)}</Text>
                <View style={styles.metaDot} />
                <View style={styles.industryPillV3}>
                  <Text style={styles.industryPillTextV3}>{video.industry}</Text>
                </View>
              </View>
            </View>
            {/* Title below meta row - tappable to expand/collapse */}
            <TouchableOpacity activeOpacity={0.8} onPress={toggleExpanded}>
              <Text 
                style={styles.staticCardTitleV3}
                numberOfLines={expanded ? undefined : 2}
                ellipsizeMode="tail"
              >
                {title}
              </Text>
            </TouchableOpacity>
            {/* Authors horizontal scroll view */}
            {video.authors && video.authors.length > 0 && (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.authorsContainerStatic}
                contentContainerStyle={styles.authorsContent}
              >
                {video.authors.map((author: string, index: number) => (
                  <View key={index} style={styles.authorPillStatic}>
                    <Text style={styles.authorTextStatic}>{author}</Text>
                  </View>
                ))}
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
                    <Text style={styles.staticCardSynopsisV3}>
                      {synopsis}
                    </Text>
                  </TouchableOpacity>
                  <View style={{ height: 24 }} />
                </ScrollView>
              </View>
            ) : (
              <View style={styles.scrollableContentContainer}>
                <TouchableOpacity activeOpacity={0.8} onPress={toggleExpanded}>
                  <Text
                    style={styles.staticCardSynopsisV3}
                    numberOfLines={4}
                    ellipsizeMode="tail"
                  >
                    {synopsis}
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
                <TouchableOpacity style={styles.actionBtn} accessibilityLabel={`Like post, ${likes} likes`} accessibilityRole="button"  onPress={hasLiked ? unlikePost : likePost}>
                  <View style={styles.actionBtnIconCircleV3}>
                    <FontAwesome name={hasLiked ? 'heart' : 'heart-o'} size={22} color={hasLiked ? '#3b82f6' : '#3b82f6'} />
                  </View>
                  <Text style={styles.actionBtnCountV3}>{likes}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtn}
                  accessibilityLabel={`Save post, ${saves} saves`}
                  accessibilityRole="button"
                  onPress={hasSaved ? unsavePost : savePost}
                >
                  <View style={styles.actionBtnIconCircleV3}>
                    <FontAwesome name={hasSaved ? 'bookmark' : 'bookmark-o'} size={22} color={hasSaved ? '#3b82f6' : '#3b82f6'} />
                  </View>
                  <Text style={styles.actionBtnCountV3}>{saves}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} accessibilityLabel={`Comment on post, ${video.comments} comments`} accessibilityRole="button" onPress={() => onOpenComments && onOpenComments(video.id)}>
                  <View style={styles.actionBtnIconCircleV3}>
                    <Feather name="message-circle" size={22} color="#3b82f6" />
                  </View>
                  <Text style={styles.actionBtnCountV3}>{video.comments}</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.readMoreBtnV3} accessibilityLabel="Read more about this post" accessibilityRole="button" onPress={() => video.source && Linking.openURL(video.source)}>
                <Text style={styles.readMoreBtnTextV3}>Read More</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  }
};

function getTypeIcon(type: string) {
  const iconProps = { size: 16, color: 'white', style: { marginRight: 4 } };
  switch (type) {
    case 'research':
      return <MaterialCommunityIcons name="microscope" {...iconProps} />;
    case 'book':
      return <Feather name="book-open" {...iconProps} />;
    case 'news':
      return <MaterialCommunityIcons name="newspaper" {...iconProps} />;
    default:
      return null;
  }
}

function getSiteName(url: string) {
  try {
    const { hostname } = new URL(url);
    // Remove www. if present
    return hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function formatTime(seconds: number) {
  if (!isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

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
    paddingBottom: 25,
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
    marginBottom: 10,
  },
  staticCardOwnerV3: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginRight: 8,
  },
  industryPillV3: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    marginLeft: 8,
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
    marginBottom: 32, // Generous bottom spacing for collapsed state
    paddingBottom: 8,
  },
  staticActionsRowExpanded: {
    marginBottom: 16, // Reduced bottom spacing for expanded state
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
    color: '#fff',
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
});
