import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Dimensions } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Feather } from '@expo/vector-icons';
import type { Insight } from '../types';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { CommentsModal } from './CommentsModal';

const { height: screenHeight } = Dimensions.get('window');

interface InsightCardProps {
  insight: Insight;
}

const InsightCard: React.FC<InsightCardProps> = ({ insight }) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [showDetails, setShowDetails] = useState(false);
  const [likes, setLikes] = useState(insight.likes_count || 0);
  const [saves, setSaves] = useState(insight.saves_count || 0);
  const [comments, setComments] = useState(insight.comments_count || 0);
  const [hasLiked, setHasLiked] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [authorId, setAuthorId] = useState<string | null>(null);

  const dynamicStyles = StyleSheet.create({
    wrapper: {
      height: screenHeight,
    },
    container: { 
      flex: 1, 
      justifyContent: 'center', 
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      margin: 16,
      borderWidth: 1,
      borderColor: colors.border,
      paddingBottom: 120 
    },
    // Twitter-like header styles
    tweetHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    tweetAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      marginRight: 12,
    },
    tweetHeaderText: {
      flex: 1,
      paddingTop: 2,
    },
    tweetNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 2,
    },
    tweetAuthorName: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginRight: 8,
    },
    tweetHandle: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '400',
    },
    tweetDetails: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    moreButton: {
      padding: 4,
      marginLeft: 8,
    },
    // Content styles
    tweetContent: {
      marginLeft: 60, // Align with text content
      marginBottom: 16,
    },
    tweetText: {
      fontSize: 16,
      color: colors.text,
      lineHeight: 24,
      letterSpacing: 0.2,
    },
    // Action styles
    tweetActions: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      marginLeft: 60, // Align with content
    },
    tweetActionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 8,
    },
    tweetActionText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginLeft: 8,
      fontWeight: '500',
    },
    // Expandable details (kept from original)
    expandedDetails: { 
      backgroundColor: colors.surface, 
      borderRadius: 12, 
      padding: 12, 
      width: '100%', 
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
  }, [user, insight.id]);

  useEffect(() => {
    initializeFlags();
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
  }, [initializeFlags]);

  const toggleLike = useCallback(async () => {
    if (!user) return;
    const adding = !hasLiked;
    setHasLiked(adding);
    setLikes(prev => adding ? prev + 1 : Math.max(0, prev - 1));
    if (adding) {
      await supabase.from('insight_likes').insert({ user_id: user.id, insight_id: insight.id });
      // Grant XP to author for like (idempotent via DB)
      try {
        const ensuredAuthorId = authorId || (await supabase.from('insights').select('author_id').eq('id', insight.id).maybeSingle()).data?.author_id;
        if (ensuredAuthorId) {
          await supabase.rpc('grant_xp_for_insight_interaction', {
            p_insight_id: insight.id,
            p_author_id: ensuredAuthorId,
            p_actor_id: user.id,
            p_reason: 'insight_like',
          });
        }
      } catch (e) {
        // best-effort; idempotent and safe to skip on error
      }
    } else {
      await supabase.from('insight_likes').delete().match({ user_id: user.id, insight_id: insight.id });
    }
    const { count } = await supabase.from('insight_likes').select('*', { count: 'exact', head: true }).eq('insight_id', insight.id);
    if (typeof count === 'number') setLikes(count);
    await supabase.from('insights').update({ likes_count: count ?? 0 }).eq('id', insight.id);
  }, [user, hasLiked, insight.id]);

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

  return (
    <View style={dynamicStyles.wrapper}>
      <View style={dynamicStyles.container}>
        {/* Twitter-like header */}
        <View style={dynamicStyles.tweetHeader}>
          <Image source={{ uri: insight.author.avatar }} style={dynamicStyles.tweetAvatar} />
          <View style={dynamicStyles.tweetHeaderText}>
            <View style={dynamicStyles.tweetNameRow}>
              <Text style={dynamicStyles.tweetAuthorName}>{insight.author.name}</Text>
              <Text style={dynamicStyles.tweetHandle}>@{insight.author.name.toLowerCase().replace(/\s+/g, '')}</Text>
            </View>
            {details ? <Text style={dynamicStyles.tweetDetails}>{details}</Text> : null}
          </View>
          <TouchableOpacity onPress={() => setShowDetails(!showDetails)} style={dynamicStyles.moreButton}>
            <Feather name="more-horizontal" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Tweet content */}
        <View style={dynamicStyles.tweetContent}>
          <Text style={dynamicStyles.tweetText}>{insight.content}</Text>
        </View>

        {/* Actions row */}
        <View style={dynamicStyles.tweetActions}>
          <TouchableOpacity style={dynamicStyles.tweetActionBtn} onPress={toggleLike}>
            <Feather name={hasLiked ? 'heart' : 'heart'} size={20} color={hasLiked ? '#e91e63' : colors.textSecondary} />
            <Text style={[dynamicStyles.tweetActionText, hasLiked && { color: '#e91e63' }]}>{likes}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={dynamicStyles.tweetActionBtn} onPress={() => setCommentsOpen(true)}>
            <Feather name="message-circle" size={20} color={colors.textSecondary} />
            <Text style={dynamicStyles.tweetActionText}>{comments}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={dynamicStyles.tweetActionBtn} onPress={toggleSave}>
            <Feather name="bookmark" size={20} color={hasSaved ? colors.accent : colors.textSecondary} />
            <Text style={[dynamicStyles.tweetActionText, hasSaved && { color: colors.accent }]}>{saves}</Text>
          </TouchableOpacity>
        </View>

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

      <CommentsModal
        videoId={insight.id}
        visible={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        onCommentsCountChange={(count) => setComments(count)}
        contentType="insight"
      />
    </View>
  );
};

export default InsightCard; 