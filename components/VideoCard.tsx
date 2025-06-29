import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Dimensions, StyleSheet, Linking, Image, Platform } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
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
}


export const VideoCard: React.FC<VideoCardProps> = ({ video, isActive }) => {
  const { user } = useAuth();
  const [likes, setLikes] = useState(video.likes);
  const [hasLiked, setHasLiked] = useState(false);
  const [expanded, setExpanded] = React.useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  const player = useVideoPlayer(
    signedUrl ? { uri: signedUrl } : null, // Pass null when no URL
    (player) => {
      if (player && signedUrl) {
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

  // Check if user has already liked this post on mount
  React.useEffect(() => {
    const checkLiked = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('reel_likes')
        .select('user_id, reel_id')
        .eq('user_id', user.id)
        .eq('reel_id', video.id)
        .maybeSingle();
      setHasLiked(!!data);
    };
    checkLiked();
  }, [user, video.id]);

  useEffect(() => {
    let isMounted = true;
    const getSignedUrl = async () => {
      if (video.video_url) {
        console.log('[VideoCard] Requesting signed URL for:', video.video_url);
        const { data, error } = await supabase.storage
          .from('videos')
          .createSignedUrl(video.video_url, 3600); // 1 hour expiry
        if (isMounted) {
          if (data && data.signedUrl) {
            console.log('[VideoCard] Received signed URL:', data.signedUrl);
            setSignedUrl(data.signedUrl);
          } else {
            setSignedUrl(null);
            console.log('[VideoCard] Error generating signed URL:', error);
          }
        }
      } else {
        setSignedUrl(null);
        console.log('[VideoCard] No video_url provided for video:', video);
      }
    };
    getSignedUrl();
    return () => { isMounted = false; };
  }, [video.video_url]);

  const likePost = async () => {
    if (!user) return;
    // Always check the database before liking
    const { data: likeData } = await supabase
      .from('reel_likes')
      .select('user_id, reel_id')
      .eq('user_id', user.id)
      .eq('reel_id', video.id)
      .maybeSingle();
    if (likeData) {
      setHasLiked(true);
      return;
    }
    setHasLiked(true);
    setLikes((prev) => prev + 1);
    // Add entry to reel_likes table
    const { error: insertError } = await supabase
      .from('reel_likes')
      .insert({ user_id: user.id, reel_id: video.id });
    if (insertError) {
      setHasLiked(false);
      setLikes((prev) => prev - 1);
      return;
    }
    // Update likes count in reels table
    const { error: updateError } = await supabase
      .from('reels')
      .update({ likes_count: likes + 1 })
      .eq('id', video.id);
    if (updateError) {
      setLikes((prev) => prev - 1);
      setHasLiked(false);
    }
  };

  const unlikePost = async () => {
    if (!user) return;
    // Always check the database before unliking
    const { data: likeData } = await supabase
      .from('reel_likes')
      .select('user_id, reel_id')
      .eq('user_id', user.id)
      .eq('reel_id', video.id)
      .maybeSingle();
    if (!likeData) {
      setHasLiked(false);
      return;
    }
    setHasLiked(false);
    setLikes((prev) => Math.max(prev - 1, 0));
    // Remove entry from reel_likes table
    const { error: deleteError } = await supabase
      .from('reel_likes')
      .delete()
      .eq('user_id', user.id)
      .eq('reel_id', video.id);
    if (deleteError) {
      setHasLiked(true);
      setLikes((prev) => prev + 1);
      console.error('Error removing like entry:', deleteError);
      return;
    }
    // Decrement likes count in reels table
    const { error: updateError } = await supabase
      .from('reels')
      .update({ likes_count: Math.max(likes - 1, 0) })
      .eq('id', video.id);
    if (updateError) {
      setLikes((prev) => prev + 1);
      setHasLiked(true);
      console.error('Error updating likes count: ', updateError);
    }
  }

  if (video.video_url && signedUrl) {
    console.log('[VideoCard] Rendering video with signed URL:', signedUrl);
    // Create a player instance for this video
    

    return (
      <View style={[{ height: screenHeight }, styles.root]}>
        {/* Video Player */}
        <VideoView
          player={player}
          style={styles.bgImage}
          contentFit="cover"
          nativeControls={false}
          allowsFullscreen={false}
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
              <Text style={styles.caption}>{video.caption}</Text>
              <View style={styles.metaRow}>
                <Text style={styles.metaSourceSite}>{getSiteName(video.source)}</Text>
                <View style={styles.metaDot} />
                <View style={styles.industryPill}>
                  <Text style={styles.industryPillText}>{video.industry}</Text>
                </View>
              </View>
            </View>
            {/* Progress Bar - Placeholder */}
            <View style={styles.progressBarBg}>
              <View style={styles.progressBarFill} />
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
                    <Feather name="heart" size={22} color={hasLiked ? '#3b82f6' : 'white'} />
                  </View>
                  <Text style={styles.actionBtnCount}>{likes}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} accessibilityLabel={`Save video, ${video.saves} saves`} accessibilityRole="button">
                  <View style={styles.actionBtnIconCircle}>
                    <Feather name="bookmark" size={22} color="white" />
                  </View>
                  <Text style={styles.actionBtnCount}>{video.saves}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} accessibilityLabel={`Comment on video, ${video.comments} comments`} accessibilityRole="button">
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
    console.log('[VideoCard] Waiting for signed URL for:', video.video_url);
    // Show loading or error state if signedUrl is not ready
    return (
      <View style={[{ height: screenHeight, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }, styles.root]}>
        <Text style={{ color: '#fff' }}>Loading video...</Text>
      </View>
    );
  } else {
    console.log('[VideoCard] No video_url, rendering static content for video:', video);
    // Render static content for non-video types, with expandable/collapsible synopsis on text press
    const synopsis = Array.isArray(video.content) ? video.content[1] : '';
    const title = Array.isArray(video.content) ? video.content[0] : '';
    const source = Array.isArray(video.content) ? video.content[2] : '';
    // Add safe area padding for notch
    const topSafePadding = Platform.OS === 'ios' ? 44 : 24;
    return (
      <View style={[{ height: screenHeight, backgroundColor: '#101014' }, styles.root]}>
        <View style={styles.staticContentContainer}>
          {/* Only show the visual if not expanded */}
          {!expanded && <StaticVisual industry={video.industry} postId={video.id} />}
          <View style={[styles.staticCardContainerV3, expanded && { flex: 1, justifyContent: 'flex-start' }]}> 
            {/* Meta row (source and topic) always at the top with safe area padding */}
            <View style={{ paddingTop: topSafePadding, paddingBottom: 8 }}>
              <View style={styles.staticMetaRowV3}>
                <Text style={styles.staticCardOwnerV3}>{source}</Text>
                <View style={styles.metaDot} />
                <View style={styles.industryPillV3}>
                  <Text style={styles.industryPillTextV3}>{video.industry}</Text>
                </View>
              </View>
            </View>
            {/* Title below meta row */}
            <Text style={styles.staticCardTitleV3}>{title}</Text>
            {/* Body text, press to expand/collapse */}
            <TouchableOpacity activeOpacity={0.8} onPress={() => setExpanded(!expanded)}>
              <Text
                style={styles.staticCardSynopsisV3}
                numberOfLines={expanded ? undefined : 4}
                ellipsizeMode="tail"
              >
                {synopsis}
              </Text>
            </TouchableOpacity>
            {/* Gap after body text in expanded view */}
            {expanded && <View style={{ height: 24, flexShrink: 0 }} />}
            {/* Spacer to push actions to bottom in expanded view */}
            {expanded && <View style={{ flex: 1 }} />}
            {/* Like/comment/save row always at the bottom */}
            <View style={styles.staticActionsRowV3}>
              <View style={styles.actionBtnGroup}>
                <TouchableOpacity style={styles.actionBtn} accessibilityLabel={`Like post, ${likes} likes`} accessibilityRole="button"  onPress={hasLiked ? unlikePost : likePost}>
                  <View style={styles.actionBtnIconCircleV3}>
                    <Feather name="heart" size={22} color={hasLiked ? '#3b82f6' : '#3b82f6'} />
                  </View>
                  <Text style={styles.actionBtnCountV3}>{likes}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} accessibilityLabel={`Save post, ${video.saves} saves`} accessibilityRole="button">
                  <View style={styles.actionBtnIconCircleV3}>
                    <Feather name="bookmark" size={22} color="#3b82f6" />
                  </View>
                  <Text style={styles.actionBtnCountV3}>{video.saves}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} accessibilityLabel={`Comment on post, ${video.comments} comments`} accessibilityRole="button">
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
    padding: 10,
    borderRadius: 999,
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
    paddingBottom: 28,
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
  actionBtnIconCircleV3: {
    backgroundColor: '#23232b',
    padding: 12,
    borderRadius: 999,
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
});
