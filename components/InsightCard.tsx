import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Dimensions, Modal, ScrollView } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Feather, Ionicons } from '@expo/vector-icons';
import type { Insight } from '../types';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { CommentsModal } from './CommentsModal';
import { FlagButton } from './common/FlagButton';
import { UserDetailModal } from './profile/UserDetailModal';
import { formatNumber } from '../lib/utils';
import { profileImageService } from '../services/profileImageService';
const defaultProfileImage = require('../assets/profileIconDefault.png');

const { height: screenHeight } = Dimensions.get('window');

interface Comment {
  id: number;
  user_id: string;
  content: string;
  created_at: string;
  author_name?: string;
  likes_count?: number;
  user?: {
    name: string;
    photo?: string;
    tagline?: string;
  };
}


interface InsightCardProps {
  insight: Insight;
}

const InsightCard: React.FC<InsightCardProps> = ({ insight }) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [showDetails, setShowDetails] = useState(false);
  const [views, setViews] = useState(insight.views_count || 0);
  const [likes, setLikes] = useState(insight.likes_count || 0);
  const [saves, setSaves] = useState(insight.saves_count || 0);
  const [comments, setComments] = useState(insight.comments_count || 0);
  const [hasLiked, setHasLiked] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const [hasViewed, setHasViewed] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [authorId, setAuthorId] = useState<string | null>(null);
  const [topComment, setTopComment] = useState<Comment | null>(null);
  const [isSupercharged, setIsSupercharged] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [commentLiked, setCommentLiked] = useState(false);
  const [commentLikes, setCommentLikes] = useState(0);
  const [isTextTruncated, setIsTextTruncated] = useState(false);
  const [showReadMoreModal, setShowReadMoreModal] = useState(false);

  const dynamicStyles = StyleSheet.create({
    wrapper: {
      height: screenHeight,
      justifyContent: 'center',
    },
    container: {
      backgroundColor: colors.card,
      borderRadius: 12,
      marginHorizontal: 16,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      position: 'relative',
      shadowRadius: 8,
      elevation: 4,
      maxHeight: screenHeight * 0.85, // Constrain height to fit in feed container
      justifyContent: 'center', // Center content vertically
    },
    flagButton: {
      position: 'absolute',
      top: 52, // Increased to avoid iPhone status bar/notch
      right: 12,
      zIndex: 10,
    },
    // User header section
    userHeader: {
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
      color: colors.text,
      marginBottom: 2,
    },
    tagline: {
      fontSize: 14,
      color: colors.textSecondary,
      fontStyle: 'italic',
      marginBottom: 2,
    },
    role: {
      fontSize: 16,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    timestampContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
    },
    timestamp: {
      fontSize: 12,
      color: colors.textSecondary,
      marginLeft: 4,
    },
    moreButton: {
      padding: 4,
    },
    // Content section
    contentSection: {
      paddingHorizontal: 16,
      paddingBottom: 12,
    },
    contentText: {
      fontSize: 16,
      lineHeight: 24,
      color: colors.text,
    },
    // Views section (above separator)
    viewsSection: {
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    // Engagement bar
    engagementSection: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
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
      color: colors.textSecondary,
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
    superchargedButton: {
      backgroundColor: '#333',
      opacity: 0.8,
    },
    superchargeText: {
      color: 'white',
      fontSize: 14,
      fontWeight: '600',
      marginLeft: 4,
    },
    actionRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
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
      color: colors.text,
    },
    // Comment display section
    commentSection: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    commentDisplay: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.surface,
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
      color: colors.text,
    },
    commentTimestamp: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    commentTagline: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    commentText: {
      fontSize: 14,
      color: colors.text,
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
      color: colors.text,
    },
    replyButton: {
      marginLeft: 16,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    replyText: {
      fontSize: 12,
      color: colors.text,
    },
    readMoreButton: {
      marginTop: 8,
      alignSelf: 'flex-start',
    },
    readMoreText: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '600',
    },
    // Read More Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      backgroundColor: colors.card,
      borderRadius: 12,
      marginHorizontal: 20,
      maxHeight: screenHeight * 0.8,
      width: '90%',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 5,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    modalCloseButton: {
      padding: 4,
    },
    modalContent: {
      padding: 16,
    },
    modalScrollContent: {
      paddingBottom: 16,
    },
    modalInsightText: {
      fontSize: 16,
      lineHeight: 24,
      color: colors.text,
    },
    joinDiscussionSection: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    joinDiscussionButton: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.text,
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
      color: colors.text,
      marginLeft: 8,
    },
    // Expandable details (kept from original)
    expandedDetails: { 
      backgroundColor: colors.surface, 
      borderRadius: 12, 
      padding: 12, 
      marginHorizontal: 16,
      marginTop: 12, 
      borderWidth: 1, 
      borderColor: colors.border 
    },
    detailRow: {
      flexDirection: 'row',
      marginBottom: 10,
    },
    detailItem: {
      flex: 1,
      paddingRight: 10,
    },
    detailLabel: {
      fontSize: 14,
      color: colors.accent,
      marginBottom: 2,
    },
    detailValue: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
    },
  });

  const details = useMemo(() => {
    const parts = [insight.author?.industry, insight.author?.company, insight.author?.role].filter(Boolean) as string[];
    return parts.join(' • ');
  }, [insight]);

  const trackView = useCallback(async () => {
    if (!user || hasViewed) return;

    // Optimistic update - update local state immediately
    setHasViewed(true);
    setViews(prev => prev + 1);

    try {
      // Create view record in database (using the extended schema)
      await supabase
        .from('insight_views')
        .insert({
          user_id: user.id,
          insight_id: insight.id
        });

      // Update the insight's view count in database
      const { count } = await supabase
        .from('insight_views')
        .select('*', { count: 'exact', head: true })
        .eq('insight_id', insight.id);

      if (typeof count === 'number') {
        await supabase
          .from('insights')
          .update({ views_count: count })
          .eq('id', insight.id);
      }
    } catch (error) {
      console.error('Error tracking view:', error);
      // Revert optimistic update on error
      setViews(prev => prev - 1);
      setHasViewed(false);
    }
  }, [user, insight.id, hasViewed]);

  const initializeFlags = useCallback(async () => {
    if (!user) return;
    const { data: likeRow } = await supabase
      .from('insight_likes')
      .select('user_id')
      .eq('user_id', user.id)
      .eq('insight_id', insight.id)
      .maybeSingle();
    setHasLiked(!!likeRow);
    
    const { data: saveRow } = await supabase
      .from('insight_saves')
      .select('user_id')
      .eq('user_id', user.id)
      .eq('insight_id', insight.id)
      .maybeSingle();
    setHasSaved(!!saveRow);
    
    // Check if this insight is supercharged
    try {
      const { data: superchargeRow } = await supabase
        .from('insights')
        .select('supercharged')
        .eq('id', insight.id)
        .maybeSingle();
        setIsSupercharged(!!superchargeRow?.supercharged);
    }
    catch (error) {
      console.error('Error checking supercharged status:', error);
      setIsSupercharged(false);
      return;
    }
  }, [user, insight.id]);

  const fetchTopComment = useCallback(async () => {
    if (!insight.id) return;
    try {
      const { data, error } = await supabase
        .from('insight_comments')
        .select(`
          id, 
          user_id, 
          content, 
          created_at,
          likes_count,
          profiles!user_id (
            full_name,
            avatar_url
          )
        `)
        .eq('insight_id', insight.id)
        .order('created_at', { ascending: true }) // Always show the first comment (chronologically)
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        const comment: Comment = {
          id: data.id,
          user_id: data.user_id,
          content: data.content,
          created_at: data.created_at,
          likes_count: data.likes_count || 0,
          user: {
            name: (data.profiles as any)?.full_name || 'User',
            photo: (data.profiles as any)?.avatar_url || undefined,
          }
        };
        setTopComment(comment);
        setCommentLikes(data.likes_count || 0);
        
        // Check if current user has liked this comment
        if (user && data.id) {
          const { data: likeData } = await supabase
            .from('insight_comment_likes')
            .select('user_id')
            .eq('user_id', user.id)
            .eq('comment_id', data.id)
            .maybeSingle();
          setCommentLiked(!!likeData);
        }
      } else {
        setTopComment(null); // Explicitly set to null if no comments found
        setCommentLiked(false);
        setCommentLikes(0);
      }
    } catch (error) {
      console.error('Error fetching top comment:', error);
      setTopComment(null);
    }
  }, [insight.id]);

  useEffect(() => {
    initializeFlags();
    // Always fetch comments on component mount/insight change
    fetchTopComment();
    // Track view optimistically
    trackView();
    // Fetch and cache author_id for XP RPCs
    const fetchAuthorId = async () => {
      try {
        const { data } = await supabase
          .from('insights')
          .select('author_id')
          .eq('id', insight.id)
          .maybeSingle();
        if (data?.author_id) setAuthorId(data.author_id);
      } catch (e) {
        // noop
      }
    };
    fetchAuthorId();
  }, [insight.id, initializeFlags, fetchTopComment, trackView]); // Added insight.id as dependency

  // Sync local counts with prop changes (important for feed updates)
  useEffect(() => {
    setLikes(insight.likes_count || 0);
    setSaves(insight.saves_count || 0);
    setComments(insight.comments_count || 0);
    setViews(insight.views_count || 0);
  }, [insight.likes_count, insight.saves_count, insight.comments_count, insight.views_count]);

  const toggleLike = useCallback(async () => {
    if (!user) return;
    const adding = !hasLiked;
    setHasLiked(adding);
    const originalLikes = likes;
    setLikes(prev => adding ? prev + 1 : Math.max(0, prev - 1));

    try {
      if (adding) {
        const { error } = await supabase.from('insight_likes').insert({ user_id: user.id, insight_id: insight.id });
        if (error) throw error;
      } else {
        const { error } = await supabase.from('insight_likes').delete().match({ user_id: user.id, insight_id: insight.id });
        if (error) throw error;
      }

      const { count, error: countError } = await supabase.from('insight_likes').select('*', { count: 'exact', head: true }).eq('insight_id', insight.id);
      if (countError) throw countError;

      if (typeof count === 'number') {
        setLikes(count);
        await supabase.from('insights').update({ likes_count: count }).eq('id', insight.id);
      }
    } catch (error) {
      console.error(`Error toggling like for insight ${insight.id}:`, error);
      setHasLiked(!adding);
      setLikes(originalLikes);
    }
  }, [user, hasLiked, insight.id, likes]);

  const toggleSave = useCallback(async () => {
    if (!user) {
      console.log('No user - cannot save');
      return;
    }
    
    console.log('toggleSave called:', { 
      adding: !hasSaved, 
      userId: user.id, 
      insightId: insight.id,
      currentSaves: saves
    });
    
    const adding = !hasSaved;
    
    // Optimistic update
    setHasSaved(adding);
    const originalSaves = saves;
    setSaves(prev => adding ? prev + 1 : Math.max(0, prev - 1));
    
    try {
      if (adding) {
        console.log('Attempting to insert save...');
        const { data, error } = await supabase
          .from('insight_saves')
          .insert({ user_id: user.id, insight_id: insight.id });
        
        if (error) {
          console.error('Error inserting save:', error);
          // Revert optimistic update
          setHasSaved(false);
          setSaves(originalSaves);
          return;
        }
        
        console.log('Save inserted successfully:', data);
        
        // Grant XP to author for save (idempotent via DB)
        try {
          const ensuredAuthorId = authorId || (await supabase.from('insights').select('author_id').eq('id', insight.id).maybeSingle()).data?.author_id;
          if (ensuredAuthorId) {
            await supabase.rpc('grant_xp_for_insight_interaction', {
              p_insight_id: insight.id,
              p_author_id: ensuredAuthorId,
              p_actor_id: user.id,
              p_reason: 'insight_save',
            });
          }
        } catch (e) {
          console.log('XP grant failed (non-critical):', e);
        }
      } else {
        console.log('Attempting to delete save...');
        const { error } = await supabase
          .from('insight_saves')
          .delete()
          .match({ user_id: user.id, insight_id: insight.id });
          
        if (error) {
          console.error('Error deleting save:', error);
          // Revert optimistic update
          setHasSaved(true);
          setSaves(originalSaves);
          return;
        }
        
        console.log('Save deleted successfully');
      }
      
      // Update the count from database
      console.log('Fetching updated save count...');
      const { count, error: countError } = await supabase
        .from('insight_saves')
        .select('*', { count: 'exact', head: true })
        .eq('insight_id', insight.id);
        
      if (countError) {
        console.error('Error fetching save count:', countError);
      } else {
        console.log('Save count from DB:', count);
        if (typeof count === 'number') {
          setSaves(count);
          
          // Update the insight's save count in the insights table
          const { error: updateError } = await supabase
            .from('insights')
            .update({ saves_count: count })
            .eq('id', insight.id);
            
          if (updateError) {
            console.error('Error updating insight saves_count:', updateError);
          } else {
            console.log('Updated insight saves_count to:', count);
          }
        }
      }
      
    } catch (error) {
      console.error('Unexpected error in toggleSave:', error);
      // Revert optimistic updates
      setHasSaved(!adding);
      setSaves(originalSaves);
    }
  }, [user, hasSaved, insight.id, saves, authorId]);



  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d`;
    }
  };

  const calculateLevel = (totalVoltz: number): number => {
    // Level thresholds: 100, 300, 600, 1000, 1500, 2100, 2800, 3600, etc.
    // Pattern: each level adds 100 more than the previous gap
    // Level 1: 0-99, Level 2: 100-299, Level 3: 300-599, Level 4: 600-999, Level 5: 1000-1499, etc.
    
    let level = 1;
    let threshold = 100;
    let increment = 200; // starts at 200 for level 3 (300-100=200)
    
    while (totalVoltz >= threshold) {
      level++;
      if (level === 2) {
        threshold += 200; // 100 + 200 = 300
      } else if (level === 3) {
        threshold += 300; // 300 + 300 = 600  
      } else if (level === 4) {
        threshold += 400; // 600 + 400 = 1000
      } else {
        threshold += increment;
        increment += 100; // increment grows by 100 each level
      }
    }
    
    return level;
  };

  const toggleCommentLike = useCallback(async () => {
    if (!user || !topComment) return;
    
    const wasLiked = commentLiked;
    // Optimistic update
    setCommentLiked(!wasLiked);
    setCommentLikes(prev => wasLiked ? prev - 1 : prev + 1);

    try {
      if (wasLiked) {
        // Remove like
        await supabase
          .from('insight_comment_likes')
          .delete()
          .match({ user_id: user.id, comment_id: topComment.id });
      } else {
        // Add like
        await supabase
          .from('insight_comment_likes')
          .insert({ user_id: user.id, comment_id: topComment.id });
      }
    } catch (error) {
      console.error('Error toggling comment like:', error);
      // Revert optimistic update on error
      setCommentLiked(wasLiked);
      setCommentLikes(prev => wasLiked ? prev + 1 : prev - 1);
    }
  }, [user, topComment, commentLiked]);

  const handleUserPress = (userId: string) => {
    setSelectedUserId(userId);
    setUserModalVisible(true);
  };

  const handleCloseUserModal = () => {
    setSelectedUserId(null);
    setUserModalVisible(false);
  };

  return (
    <View style={dynamicStyles.wrapper}>
      <View style={dynamicStyles.container}>
        <FlagButton
          contentId={insight.id}
          contentType="insight"
          size={20}
          style={dynamicStyles.flagButton}
        />
        {/* User Header */}
        <TouchableOpacity style={dynamicStyles.userHeader} onPress={() => authorId && handleUserPress(authorId)}>
          <Image
            source={
              insight.author.avatar
                ? { uri: profileImageService.getProfileImageUrl(insight.author.avatar) }
                : defaultProfileImage
            }
            style={dynamicStyles.avatar}
          />
          <View style={dynamicStyles.userInfo}>
            <View style={dynamicStyles.headerRow}>
              <View style={dynamicStyles.textContainer}>
                <Text style={dynamicStyles.name}>{insight.author.name}</Text>
                {insight.author.tagline && (
                  <Text style={dynamicStyles.tagline}>{insight.author.tagline}</Text>
                )}
                {insight.created_at && (
                  <View style={dynamicStyles.timestampContainer}>
                    <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
                    <Text style={dynamicStyles.timestamp}>{formatTimestamp(insight.created_at)}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Content */}
        <View style={dynamicStyles.contentSection}>
          <Text
            style={dynamicStyles.contentText}
            numberOfLines={14}
            onTextLayout={(e) => {
              const { lines } = e.nativeEvent;
              setIsTextTruncated(lines.length >= 14);
            }}
          >
            {insight.content}
          </Text>
          {isTextTruncated && (
            <TouchableOpacity
              style={dynamicStyles.readMoreButton}
              onPress={() => setShowReadMoreModal(true)}
            >
              <Text style={dynamicStyles.readMoreText}>Read More</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Views Section - Above separator */}
        <View style={dynamicStyles.viewsSection}>
          <View style={dynamicStyles.viewsContainer}>
            <Ionicons name="eye-outline" size={16} color={colors.textSecondary} />
            <Text style={dynamicStyles.viewsText}>{formatNumber(views)} views</Text>
          </View>
        </View>

        {/* Engagement Bar */}
        <View style={dynamicStyles.engagementSection}>
          <View style={dynamicStyles.actionRow}>
            <TouchableOpacity
              style={dynamicStyles.actionButton}
              onPress={toggleLike}
            >
              <Ionicons
                name={hasLiked ? "heart" : "heart-outline"}
                size={20}
                color={hasLiked ? "#FDE047" : colors.text}
              />
              <Text style={[dynamicStyles.actionText, hasLiked && { color: '#FDE047' }]}>
                {formatNumber(likes)}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={dynamicStyles.actionButton} onPress={() => setCommentsOpen(true)}>
              <Ionicons name="chatbubble-outline" size={20} color={colors.text} />
              <Text style={dynamicStyles.actionText}>{formatNumber(comments)}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={dynamicStyles.actionButton}
              onPress={toggleSave}
            >
              <Ionicons
                name={hasSaved ? "bookmark" : "bookmark-outline"}
                size={20}
                color={hasSaved ? "#FDE047" : colors.text}
              />
            </TouchableOpacity>

            {isSupercharged && (
              <View style={[dynamicStyles.superchargeButton, dynamicStyles.superchargedButton]}>
                <Text style={dynamicStyles.superchargeText}>Supercharged</Text>
                <Ionicons name="flash" size={16} color="#FDE047" style={{ marginLeft: 4 }} />
              </View>
            )}
          </View>
        </View>

        {/* Top Comment Display */}
        {topComment && (
          <View style={dynamicStyles.commentSection}>
            <View style={dynamicStyles.commentDisplay}>
              <View style={dynamicStyles.commentHeader}>
                <Image
                  source={
                    topComment.user?.photo
                      ? { uri: profileImageService.getProfileImageUrl(topComment.user.photo) }
                      : defaultProfileImage
                  }
                  style={dynamicStyles.commentAvatar}
                />
                <View style={dynamicStyles.commentContent}>
                  <View style={dynamicStyles.commentUserRow}>
                    <Text style={dynamicStyles.commentUserName}>{topComment.user?.name || 'User'}</Text>
                    <Text style={dynamicStyles.commentTimestamp}>{formatTimestamp(topComment.created_at)}</Text>
                  </View>
                  {topComment.user?.tagline && (
                    <Text style={dynamicStyles.commentTagline}>{topComment.user.tagline}</Text>
                  )}
                  <Text style={dynamicStyles.commentText}>{topComment.content}</Text>
                  <View style={dynamicStyles.commentActions}>
                    <TouchableOpacity style={dynamicStyles.commentActionButton} onPress={toggleCommentLike}>
                      <Ionicons 
                        name={commentLiked ? "heart" : "heart-outline"} 
                        size={14} 
                        color={commentLiked ? "#FDE047" : colors.text} 
                      />
                      <Text style={[dynamicStyles.commentActionText, commentLiked && { color: "#FDE047" }]}>
                        {String(commentLikes || 0)}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={dynamicStyles.replyButton} onPress={() => setCommentsOpen(true)}>
                      <Text style={dynamicStyles.replyText}>Reply</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
            
            <View style={dynamicStyles.joinDiscussionSection}>
              <TouchableOpacity style={dynamicStyles.joinDiscussionButton} onPress={() => setCommentsOpen(true)}>
                <Ionicons name="chatbubble-outline" size={16} color={colors.text} />
                <Text style={dynamicStyles.joinDiscussionText}>Join the discussion...</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* If no comments, still show join discussion button */}
        {!topComment && comments === 0 ? (
          <View style={dynamicStyles.commentSection}>
            <View style={dynamicStyles.joinDiscussionSection}>
              <TouchableOpacity style={dynamicStyles.joinDiscussionButton} onPress={() => setCommentsOpen(true)}>
                <Ionicons name="chatbubble-outline" size={16} color={colors.text} />
                <Text style={dynamicStyles.joinDiscussionText}>Join the discussion...</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* Expandable profile details */}
        {showDetails && (
          <View style={dynamicStyles.expandedDetails}>
            <View style={dynamicStyles.detailRow}>
              {insight.author.industry && (
                <View style={dynamicStyles.detailItem}>
                  <Text style={dynamicStyles.detailLabel}>Industry</Text>
                  <Text style={dynamicStyles.detailValue}>{insight.author.industry}</Text>
                </View>
              )}
              {insight.author.company && (
                <View style={dynamicStyles.detailItem}>
                  <Text style={dynamicStyles.detailLabel}>Company</Text>
                  <Text style={dynamicStyles.detailValue}>{insight.author.company}</Text>
                </View>
              )}
            </View>
            <View style={dynamicStyles.detailRow}>
              {insight.author.role && (
                <View style={dynamicStyles.detailItem}>
                  <Text style={dynamicStyles.detailLabel}>Role</Text>
                  <Text style={dynamicStyles.detailValue}>{insight.author.role}</Text>
                </View>
              )}
              {insight.author.location && (
                <View style={dynamicStyles.detailItem}>
                  <Text style={dynamicStyles.detailLabel}>Location</Text>
                  <Text style={dynamicStyles.detailValue}>{insight.author.location}</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </View>

      {/* User Detail Modal */}
      {selectedUserId && (
        <UserDetailModal
          visible={userModalVisible}
          onClose={handleCloseUserModal}
          userId={selectedUserId}
          currentUserId={user?.id}
        />
      )}

      <CommentsModal
        videoId={insight.id}
        visible={commentsOpen}
        onClose={() => {
          setCommentsOpen(false);
          fetchTopComment(); // Refresh comments when modal closes
        }}
        onCommentsCountChange={(count) => {
          setComments(count);
          // Refresh top comment when count changes
          if (count > 0) {
            fetchTopComment();
          } else {
            setTopComment(null);
          }
        }}
        contentType="insight"
      />

      {/* Read More Modal */}
      <Modal
        visible={showReadMoreModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReadMoreModal(false)}
      >
        <TouchableOpacity
          style={dynamicStyles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowReadMoreModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={dynamicStyles.modalContainer}
          >
            {/* Modal Header */}
            <View style={dynamicStyles.modalHeader}>
              <Text style={dynamicStyles.modalTitle}>Insight</Text>
              <TouchableOpacity
                style={dynamicStyles.modalCloseButton}
                onPress={() => setShowReadMoreModal(false)}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Modal Content with ScrollView */}
            <ScrollView style={dynamicStyles.modalContent} contentContainerStyle={dynamicStyles.modalScrollContent}>
              {/* Author Info */}
              <TouchableOpacity
                style={dynamicStyles.userHeader}
                onPress={() => authorId && handleUserPress(authorId)}
              >
                <Image
                  source={
                    insight.author.avatar
                      ? { uri: profileImageService.getProfileImageUrl(insight.author.avatar) }
                      : defaultProfileImage
                  }
                  style={dynamicStyles.avatar}
                />
                <View style={dynamicStyles.userInfo}>
                  <View style={dynamicStyles.headerRow}>
                    <View style={dynamicStyles.textContainer}>
                      <Text style={dynamicStyles.name}>{insight.author.name}</Text>
                      {insight.author.tagline && (
                        <Text style={dynamicStyles.tagline}>{insight.author.tagline}</Text>
                      )}
                      {insight.created_at && (
                        <View style={dynamicStyles.timestampContainer}>
                          <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
                          <Text style={dynamicStyles.timestamp}>{formatTimestamp(insight.created_at)}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Full Insight Content */}
              <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                <Text style={dynamicStyles.modalInsightText}>{insight.content}</Text>
              </View>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default InsightCard; 