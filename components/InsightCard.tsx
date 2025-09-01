import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Dimensions, Modal, ScrollView } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Feather, Ionicons } from '@expo/vector-icons';
import type { Insight } from '../types';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { CommentsModal } from './CommentsModal';
import { formatNumber } from '../lib/utils';
import { profileImageService } from '../services/profileImageService';

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

interface UserProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  total_voltz_earned: number;
  level: number;
  email: string;
  created_at: string;
  industries: string[];
  education: string;
  experience: string;
  goals: string;
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
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [commentLiked, setCommentLiked] = useState(false);
  const [commentLikes, setCommentLikes] = useState(0);

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
      shadowRadius: 8,
      elevation: 4,
      maxHeight: screenHeight * 0.85, // Constrain height to fit in feed container
      justifyContent: 'center', // Center content vertically
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
    if (likeRow) setHasLiked(true);
    
    const { data: saveRow } = await supabase
      .from('insight_saves')
      .select('user_id')
      .eq('user_id', user.id)
      .eq('insight_id', insight.id)
      .maybeSingle();
    if (saveRow) setHasSaved(true);
    
    // Check if this insight is supercharged
    try {
      const { data: superchargeRow } = await supabase
        .from('insights')
        .select('supercharged')
        .eq('id', insight.id)
        .maybeSingle();
        if (superchargeRow?.supercharged) setIsSupercharged(true);
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
        .order('likes_count', { ascending: false })
        .order('created_at', { ascending: false })
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
            name: (data.profiles as any)?.full_name || 'Anonymous',
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
    if (!user) return;
    const adding = !hasSaved;
    setHasSaved(adding);
    setSaves(prev => adding ? prev + 1 : Math.max(0, prev - 1));
    if (adding) {
      await supabase.from('insight_saves').insert({ user_id: user.id, insight_id: insight.id });
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
        // best-effort
      }
    } else {
      await supabase.from('insight_saves').delete().match({ user_id: user.id, insight_id: insight.id });
    }
    const { count } = await supabase.from('insight_saves').select('*', { count: 'exact', head: true }).eq('insight_id', insight.id);
    if (typeof count === 'number') setSaves(count);
    await supabase.from('insights').update({ saves_count: count ?? 0 }).eq('id', insight.id);
  }, [user, hasSaved, insight.id]);



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

  const fetchUserProfile = async (userId: string) => {
    try {
      // Fetch basic profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, total_voltz_earned, level, email, created_at')
        .eq('id', userId)
        .single();

      if (profileError || !profileData) {
        console.error('Error fetching user profile:', profileError);
        return;
      }

      // Fetch user industries
      const { data: industriesData } = await supabase
        .from('user_industries')
        .select('industries (name)')
        .eq('user_id', userId);

      // Fetch education data
      const { data: educationData } = await supabase
        .from('user_education')
        .select('universities (name), degrees (name), stage')
        .eq('user_id', userId)
        .maybeSingle();

      // Fetch experience data
      const { data: experienceData } = await supabase
        .from('user_experiences')
        .select('companies (name), experience_level, description')
        .eq('user_id', userId)
        .maybeSingle();

      // Fetch goals data
      const { data: goalsData } = await supabase
        .from('user_goals')
        .select('goal, timeframe')
        .eq('user_id', userId)
        .maybeSingle();

      const industries = industriesData?.map((i: any) => i.industries.name) || [];
      const education = educationData 
        ? `${educationData.universities?.name || ''} - ${educationData.degrees?.name || ''} (${educationData.stage || ''})`.replace(/^- |  - $/, '').trim()
        : '';
      const experience = experienceData
        ? `${experienceData.companies?.name || ''} (${experienceData.experience_level || ''})${experienceData.description ? ` - ${experienceData.description}` : ''}`.replace(/^- |  - $/, '').trim()
        : '';
      const goals = goalsData
        ? `${goalsData.goal || ''} (${goalsData.timeframe || ''})`.replace(/^- |  - $/, '').trim()
        : '';

      const userProfile: UserProfile = {
        ...profileData,
        industries,
        education,
        experience,
        goals
      };

      setSelectedUser(userProfile);
      setUserModalVisible(true);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  return (
    <View style={dynamicStyles.wrapper}>
      <View style={dynamicStyles.container}>
        {/* User Header */}
        <TouchableOpacity style={dynamicStyles.userHeader} onPress={() => authorId && fetchUserProfile(authorId)}>
          <Image source={{ uri: profileImageService.getProfileImageUrl(insight.author.avatar) }} style={dynamicStyles.avatar} />
          <View style={dynamicStyles.userInfo}>
            <View style={dynamicStyles.headerRow}>
              <View style={dynamicStyles.textContainer}>
                <Text style={dynamicStyles.name}>{insight.author.name}</Text>
                <Text style={dynamicStyles.role}>
                  {insight.author.role} at {insight.author.company}
                </Text>
                {insight.created_at && (
                  <View style={dynamicStyles.timestampContainer}>
                    <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
                    <Text style={dynamicStyles.timestamp}>{formatTimestamp(insight.created_at)}</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity onPress={() => authorId && fetchUserProfile(authorId)} style={dynamicStyles.moreButton}>
                <Ionicons name="ellipsis-horizontal" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>

        {/* Content */}
        <View style={dynamicStyles.contentSection}>
          <Text style={dynamicStyles.contentText}>{insight.content}</Text>
        </View>

        {/* Engagement Bar */}
        <View style={dynamicStyles.engagementSection}>
          <View style={dynamicStyles.topRow}>
            <View style={dynamicStyles.viewsContainer}>
              <Ionicons name="eye-outline" size={16} color={colors.textSecondary} />
              <Text style={dynamicStyles.viewsText}>{formatNumber(views)} views</Text>
            </View>
            {isSupercharged && (<View style={[dynamicStyles.superchargeButton, isSupercharged && dynamicStyles.superchargedButton]}>
              <Ionicons name="flash" size={16} color="#FDE047" />
              <Text style={dynamicStyles.superchargeText}>
                Supercharged
              </Text>
            </View>)}
            
          </View>
          
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
          </View>
        </View>

        {/* Top Comment Display */}
        {topComment && (
          <View style={dynamicStyles.commentSection}>
            <View style={dynamicStyles.commentDisplay}>
              <View style={dynamicStyles.commentHeader}>
                <Image
                  source={{ uri: topComment.user?.photo || 'https://via.placeholder.com/32' }}
                  style={dynamicStyles.commentAvatar}
                />
                <View style={dynamicStyles.commentContent}>
                  <View style={dynamicStyles.commentUserRow}>
                    <Text style={dynamicStyles.commentUserName}>{topComment.user?.name || 'Anonymous'}</Text>
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

      {/* User Profile Modal */}
      <Modal
        visible={userModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setUserModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ 
            backgroundColor: colors.card, 
            margin: 20, 
            borderRadius: 16, 
            padding: 20, 
            maxHeight: '80%',
            width: '90%'
          }}>
            {selectedUser && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={{ alignItems: 'center', marginBottom: 20 }}>
                  <Image 
                    source={{ uri: profileImageService.getProfileImageUrl(selectedUser.avatar_url) }} 
                    style={{ width: 80, height: 80, borderRadius: 40, marginBottom: 12 }}
                  />
                  <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text, marginBottom: 4 }}>
                    {selectedUser.full_name}
                  </Text>
                  <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>
                    Level {selectedUser.level} • {selectedUser.total_voltz_earned} Voltz
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                    Joined {new Date(selectedUser.created_at).toLocaleDateString()}
                  </Text>
                </View>

                {/* Profile Details */}
                {selectedUser.industries.length > 0 && (
                  <View style={{ marginBottom: 16 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 8 }}>
                      Industries
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                      {selectedUser.industries.map((industry, index) => (
                        <View key={index} style={{ 
                          backgroundColor: colors.primary + '20', 
                          paddingHorizontal: 12, 
                          paddingVertical: 4, 
                          borderRadius: 16, 
                          marginRight: 8, 
                          marginBottom: 4 
                        }}>
                          <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '600' }}>{industry}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {selectedUser.education && (
                  <View style={{ marginBottom: 16 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 8 }}>
                      Education
                    </Text>
                    <Text style={{ color: colors.textSecondary }}>{selectedUser.education}</Text>
                  </View>
                )}

                {selectedUser.experience && (
                  <View style={{ marginBottom: 16 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 8 }}>
                      Experience
                    </Text>
                    <Text style={{ color: colors.textSecondary }}>{selectedUser.experience}</Text>
                  </View>
                )}

                {selectedUser.goals && (
                  <View style={{ marginBottom: 16 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 8 }}>
                      Goals
                    </Text>
                    <Text style={{ color: colors.textSecondary }}>{selectedUser.goals}</Text>
                  </View>
                )}

                {/* Close Button */}
                <TouchableOpacity 
                  style={{ 
                    backgroundColor: colors.primary, 
                    borderRadius: 8, 
                    paddingVertical: 12, 
                    alignItems: 'center',
                    marginTop: 16 
                  }}
                  onPress={() => setUserModalVisible(false)}
                >
                  <Text style={{ color: 'white', fontWeight: '600' }}>Close</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

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
    </View>
  );
};

export default InsightCard; 