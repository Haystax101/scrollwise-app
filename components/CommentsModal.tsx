import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, TextInput, ActivityIndicator, Animated, Dimensions, Keyboard, Platform, StyleSheet, Pressable } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  author_name?: string;
  parent_comment_id?: string;
  likes_count?: number;
  reply_count?: number;
  depth_level?: number;
  user_name?: string;
  user_avatar?: string;
  hasLiked?: boolean;
}

interface CommentsModalProps {
  videoId: number | string | null;
  visible: boolean;
  onClose: () => void;
  onCommentsCountChange?: (count: number) => void;
  contentType?: 'article' | 'paper' | 'book' | 'insight';
}

// Helper function to get table names based on content type
const getCommentTableInfo = (contentType: 'article' | 'paper' | 'book' | 'insight' = 'article') => {
  switch (contentType) {
    case 'insight':
      return {
        commentTable: 'insight_comments',
        contentTable: 'insights',
        idField: 'insight_id',
      };
    case 'paper':
      return { 
        commentTable: 'paper_comments', 
        contentTable: 'papers',
        idField: 'paper_id'
      };
    case 'book':
      return { 
        commentTable: 'book_comments', 
        contentTable: 'books',
        idField: 'book_id'
      };
    case 'article':
    default:
      return { 
        commentTable: 'comments', 
        contentTable: 'articles',
        idField: 'article_id'
      };
  }
};

const SCREEN_HEIGHT = Dimensions.get('window').height;

export const CommentsModal: React.FC<CommentsModalProps> = ({ videoId, visible, onClose, onCommentsCountChange, contentType = 'article' }) => {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const textInputRef = useRef<TextInput>(null);
  // Keep stable references for the lifetime of the open modal to avoid drift between renders
  const stableVideoIdRef = useRef<number | string | null>(null);
  const stableTableInfoRef = useRef(getCommentTableInfo(contentType));

  // Get table info for current content type (used for initial mount; stable ref will be used afterward)
  const tableInfo = getCommentTableInfo(contentType);

  // Animate modal in/out
  useEffect(() => {
    if (visible) {
      // Capture stable identifiers for the session of this open modal
      stableVideoIdRef.current = videoId ?? null;
      stableTableInfoRef.current = getCommentTableInfo(contentType);
      console.log('COMMENTS_MODAL_OPEN', { videoId: stableVideoIdRef.current, contentType, tableInfo: stableTableInfoRef.current });
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
      fetchComments();
    } else {
      // Blur input and dismiss keyboard when closing
      textInputRef.current?.blur();
      Keyboard.dismiss();
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
    // eslint-disable-next-line
  }, [visible, videoId]);

  // Keyboard event listeners
  useEffect(() => {
    const keyboardWillShow = (event: any) => {
      setKeyboardHeight(event.endCoordinates.height);
    };

    const keyboardWillHide = () => {
      setKeyboardHeight(0);
    };

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, keyboardWillShow);
    const hideSubscription = Keyboard.addListener(hideEvent, keyboardWillHide);

    return () => {
      showSubscription?.remove();
      hideSubscription?.remove();
    };
  }, []);

  // Fetch comments (threaded for insights, flat for others)
  const fetchComments = async () => {
    const vid = stableVideoIdRef.current ?? videoId;
    if (!vid) return;
    setLoading(true);
    const tableCfg = stableTableInfoRef.current;
    
    try {
      if (contentType === 'insight') {
        // Use threaded comments function for insights
        const { data, error } = await supabase.rpc('get_threaded_comments', {
          p_insight_id: vid,
          p_limit: 100,
          p_offset: 0
        });
        
        if (error) {
          console.error('Error fetching threaded comments:', error);
          setComments([]);
          onCommentsCountChange && onCommentsCountChange(0);
        } else {
          const mapped = await Promise.all((data || []).map(async (c: any) => {
            // Check if current user has liked this comment
            let hasLiked = false;
            if (user) {
              const { data: likeData } = await supabase
                .from('insight_comment_likes')
                .select('user_id')
                .eq('user_id', user.id)
                .eq('comment_id', c.id)
                .maybeSingle();
              hasLiked = !!likeData;
            }
            
            return {
              id: c.id,
              user_id: c.user_id,
              content: c.content,
              created_at: c.created_at,
              parent_comment_id: c.parent_comment_id,
              likes_count: c.likes_count || 0,
              reply_count: c.reply_count || 0,
              depth_level: c.depth_level || 0,
              user_name: c.user_name || 'Anonymous',
              user_avatar: c.user_avatar,
              author_name: c.user_id === user?.id ? 'You' : c.user_name || 'User',
              hasLiked
            };
          }));
          setComments(mapped);
          onCommentsCountChange && onCommentsCountChange(mapped.length);
        }
      } else {
        // Use regular flat comments for other content types
        const { data, error } = await supabase
          .from(tableCfg.commentTable)
          .select(`id, user_id, ${tableCfg.idField}, content, created_at`)
          .eq(tableCfg.idField, vid)
          .order('created_at', { ascending: false });
        
        if (error) {
          setComments([]);
          onCommentsCountChange && onCommentsCountChange(0);
        } else {
          const mapped = (data || []).map((c: any) => ({
            ...c,
            author_name: c.user_id === user?.id ? 'You' : 'User',
            depth_level: 0,
            likes_count: 0,
            reply_count: 0
          }));
          setComments(mapped);
          onCommentsCountChange && onCommentsCountChange(mapped.length);
        }
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      setComments([]);
      onCommentsCountChange && onCommentsCountChange(0);
    }
    setLoading(false);
  };

  // Add comment or reply
  const handleAddComment = async () => {
    if (!user || !input.trim() || !videoId) return;
    setSubmitting(true);
    
    try {
      if (contentType === 'insight' && replyingTo) {
        // Use the SQL function for threaded replies
        let { data, error } = await supabase.rpc('add_comment_reply', {
          p_user_id: user.id,
          p_insight_id: videoId,
          p_parent_comment_id: replyingTo.id,
          p_content: input.trim()
        });
        
        // If the main function fails, try the backup function
        if (error) {
          console.warn('Primary add_comment_reply failed, trying backup function:', error);
          const backupResult = await supabase.rpc('insert_insight_comment', {
            p_insight_id: videoId,
            p_content: input.trim(),
            p_parent_comment_id: replyingTo.id
          });
          data = backupResult.data;
          error = backupResult.error;
        }
        
        if (error) {
          console.error('Error adding reply (both methods failed):', error);
          // Show user-friendly error message
          alert('Failed to add reply. Please check your connection and try again.');
          return;
        }
        
        if (data) {
          // Add the new reply to the comments array instead of full refresh
          // This preserves optimistic like states and is more efficient
          const newReply: Comment = {
            id: data,
            user_id: user.id,
            content: input.trim(),
            created_at: new Date().toISOString(),
            parent_comment_id: replyingTo.id,
            likes_count: 0,
            reply_count: 0,
            depth_level: (replyingTo.depth_level || 0) + 1,
            user_name: 'You',
            author_name: 'You',
            hasLiked: false
          };
          
          // Insert reply after the parent comment in the correct position
          setComments(prev => {
            const parentIndex = prev.findIndex(c => c.id === replyingTo.id);
            if (parentIndex !== -1) {
              // Find the last reply to this parent
              let insertIndex = parentIndex + 1;
              while (insertIndex < prev.length && 
                     prev[insertIndex].parent_comment_id === replyingTo.id) {
                insertIndex++;
              }
              const newComments = [...prev];
              newComments.splice(insertIndex, 0, newReply);
              
              // Update parent's reply count optimistically
              newComments[parentIndex] = {
                ...newComments[parentIndex],
                reply_count: (newComments[parentIndex].reply_count || 0) + 1
              };
              
              return newComments;
            }
            return [...prev, newReply];
          });
          
          setInput('');
          setReplyingTo(null);
          onCommentsCountChange && onCommentsCountChange(comments.length + 1);
        }
      } else {
        // Regular comment (root level or non-insight content)
        const insertData = { 
          user_id: user.id, 
          [tableInfo.idField]: videoId, 
          content: input.trim(),
          ...(contentType === 'insight' ? { depth_level: 0 } : {})
        };
        
        const { error, data } = await supabase
          .from(tableInfo.commentTable)
          .insert(insertData)
          .select(`id, user_id, ${tableInfo.idField}, content, created_at`)
          .single();
          
        if (error) {
          console.error('Error adding comment:', error);
          // Show user-friendly error message
          alert('Failed to add comment. Please check your connection and try again.');
          return;
        }
        
        if (data) {
          const newComment: Comment = {
            id: (data as any).id,
            user_id: (data as any).user_id,
            content: (data as any).content,
            created_at: (data as any).created_at,
            author_name: 'You',
            depth_level: 0,
            likes_count: 0,
            reply_count: 0,
            hasLiked: false
          };
          setComments((prev) => [newComment, ...prev]);
          setInput('');
          onCommentsCountChange && onCommentsCountChange(comments.length + 1);
          
          // Update comments_count in content table
          await supabase
            .from(tableInfo.contentTable)
            .update({ comments_count: comments.length + 1 })
            .eq('id', videoId);
        }
      }

      // If commenting on an insight, grant XP to the insight author (idempotent in DB)
      try {
        if (contentType === 'insight') {
          const { data: insightRow } = await supabase
            .from('insights')
            .select('author_id')
            .eq('id', videoId)
            .maybeSingle();
          const authorId = (insightRow as any)?.author_id;
          if (authorId) {
            await supabase.rpc('grant_xp_for_insight_interaction', {
              p_insight_id: videoId,
              p_author_id: authorId,
              p_actor_id: user.id,
              p_reason: 'insight_comment',
            });
          }
        }
      } catch (e) {
        // best-effort only
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
    setSubmitting(false);
  };

  // Toggle comment like
  const toggleCommentLike = async (comment: Comment) => {
    if (!user || contentType !== 'insight') return;
    
    const wasLiked = comment.hasLiked || false;
    const newLikeCount = wasLiked ? (comment.likes_count || 0) - 1 : (comment.likes_count || 0) + 1;
    
    // Optimistic update
    setComments(prev => prev.map(c => 
      c.id === comment.id 
        ? { ...c, hasLiked: !wasLiked, likes_count: newLikeCount }
        : c
    ));

    try {
      if (wasLiked) {
        // Remove like
        await supabase
          .from('insight_comment_likes')
          .delete()
          .match({ user_id: user.id, comment_id: comment.id });
      } else {
        // Add like
        await supabase
          .from('insight_comment_likes')
          .insert({ user_id: user.id, comment_id: comment.id });
      }
    } catch (error) {
      console.error('Error toggling comment like:', error);
      // Revert optimistic update on error
      setComments(prev => prev.map(c => 
        c.id === comment.id 
          ? { ...c, hasLiked: wasLiked, likes_count: comment.likes_count || 0 }
          : c
      ));
    }
  };

  // Start replying to a comment
  const startReply = (comment: Comment) => {
    setReplyingTo(comment);
    textInputRef.current?.focus();
  };

  // Cancel reply
  const cancelReply = () => {
    setReplyingTo(null);
    setInput('');
  };

  // Delete comment with detailed logging (helps diagnose RLS issues)
  const handleDeleteComment = async (commentId: string) => {
    if (!user) {
      console.warn('DELETE_COMMENT_SKIPPED: Missing user', { userExists: !!user });
      return;
    }

    console.log('DELETE_COMMENT_ATTEMPT', {
      table: stableTableInfoRef.current.commentTable,
      commentId,
      userId: user.id,
      contentType,
      contentTable: stableTableInfoRef.current.contentTable,
      idField: stableTableInfoRef.current.idField,
    });

    try {
      const { error, status } = await supabase
        .from(stableTableInfoRef.current.commentTable)
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) {
        console.error('DELETE_COMMENT_ERROR', {
          table: tableInfo.commentTable,
          commentId,
          userId: user.id,
          status,
          code: (error as any)?.code,
          details: (error as any)?.details,
          hint: (error as any)?.hint,
          message: error.message,
        });
        return;
      }

      console.log('DELETE_COMMENT_SUCCESS', { commentId, userId: user.id, status, table: stableTableInfoRef.current.commentTable });

      setComments((prev) => prev.filter((c) => c.id !== commentId));
      onCommentsCountChange && onCommentsCountChange(Math.max(comments.length - 1, 0));

      const vid = stableVideoIdRef.current ?? videoId;
      if (vid) {
        const { error: updateError, status: updateStatus } = await supabase
          .from(stableTableInfoRef.current.contentTable)
          .update({ comments_count: Math.max(comments.length - 1, 0) })
          .eq('id', vid);

        if (updateError) {
          console.error('UPDATE_COMMENTS_COUNT_ERROR', {
            table: stableTableInfoRef.current.contentTable,
            contentId: vid,
            updateStatus,
            code: (updateError as any)?.code,
            details: (updateError as any)?.details,
            hint: (updateError as any)?.hint,
            message: updateError.message,
          });
        } else {
          console.log('UPDATE_COMMENTS_COUNT_SUCCESS', { table: stableTableInfoRef.current.contentTable, contentId: vid, updateStatus });
        }
      } else {
        console.warn('SKIP_UPDATE_COMMENTS_COUNT_NO_VIDEO_ID', { contentTable: stableTableInfoRef.current.contentTable });
      }
    } catch (e: any) {
      console.error('DELETE_COMMENT_EXCEPTION', {
        table: stableTableInfoRef.current.commentTable,
        commentId,
        userId: user.id,
        error: e?.message || String(e),
      });
    }
  };

  // When adding comments, CommentsModal already updates count locally and DB via existing code.

  // Render right swipe action for delete
  const renderRightActions = (comment: Comment) => {
    const isOwner = user && comment.user_id === user.id;
    if (!isOwner) return <View />;
    return (
      <TouchableOpacity
        onPress={() => handleDeleteComment(comment.id)}
        style={dynamicStyles.rightActionContainer}
        accessibilityLabel="Delete comment"
        accessibilityRole="button"
        activeOpacity={0.8}
      >
        <FontAwesome name="trash" size={18} color="#fff" />
      </TouchableOpacity>
    );
  };

  // Render comment item with threading support and indentation
  const renderItem = useCallback(({ item }: { item: Comment }) => {
    const isOwner = user && item.user_id === user.id;
    const depthLevel = item.depth_level || 0;
    const indentWidth = depthLevel * 20; // 20px per level, max 3 levels = 60px max
    const isInsightComment = contentType === 'insight';
    
    const content = (
      <View style={[
        dynamicStyles.commentRow, 
        { marginLeft: indentWidth },
        ...(depthLevel > 0 ? [dynamicStyles.replyRow] : [])
      ]}>
        <View style={dynamicStyles.commentContent}>
          <View style={dynamicStyles.commentHeader}>
            <Text style={dynamicStyles.commentAuthor}>{item.author_name || item.user_name || 'Anonymous'}</Text>
            <Text style={dynamicStyles.commentMeta}>
              {item.created_at ? new Date(item.created_at).toLocaleString() : 'Unknown date'}
            </Text>
          </View>
          <Text style={dynamicStyles.commentText}>{item.content || 'No content'}</Text>
          
          {/* Action buttons for insight comments */}
          {isInsightComment && (
            <View style={dynamicStyles.commentActions}>
              <TouchableOpacity 
                style={dynamicStyles.commentActionButton}
                onPress={() => toggleCommentLike(item)}
              >
                <FontAwesome 
                  name={item.hasLiked ? "heart" : "heart-o"} 
                  size={12} 
                  color={item.hasLiked ? "#FDE047" : colors.textSecondary} 
                />
                <Text style={[
                  dynamicStyles.commentActionText,
                  ...(item.hasLiked ? [{ color: "#FDE047" }] : [])
                ]}>
                  {item.likes_count || 0}
                </Text>
              </TouchableOpacity>
              
              {depthLevel < 2 && ( // Only allow replies up to 3 levels (0, 1, 2)
                <TouchableOpacity 
                  style={dynamicStyles.commentActionButton}
                  onPress={() => startReply(item)}
                >
                  <FontAwesome name="reply" size={12} color={colors.textSecondary} />
                  <Text style={dynamicStyles.commentActionText}>Reply</Text>
                </TouchableOpacity>
              )}
              
              {item.reply_count && item.reply_count > 0 && (
                <Text style={dynamicStyles.replyCount}>
                  {item.reply_count} {item.reply_count === 1 ? 'reply' : 'replies'}
                </Text>
              )}
            </View>
          )}
        </View>
      </View>
    );

    if (!isOwner) return content;

    return (
      <Swipeable
        renderRightActions={() => renderRightActions(item)}
        friction={2}
        rightThreshold={40}
        overshootRight={false}
      >
        {content}
      </Swipeable>
    );
  }, [user]);

  const dynamicStyles = StyleSheet.create({
    modalContainer: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingTop: 16,
      paddingHorizontal: 16,
      paddingBottom: Math.max(keyboardHeight, 16),
      // Open higher so comments are more readable
      maxHeight: SCREEN_HEIGHT * 0.92,
      minHeight: SCREEN_HEIGHT * 0.7,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    closeButton: {
      padding: 8,
    },
    loadingContainer: {
      padding: 40,
      alignItems: 'center',
    },
    emptyContainer: {
      padding: 40,
      alignItems: 'center',
    },
    emptyText: {
      color: colors.textSecondary,
      fontSize: 16,
    },
    commentsList: {
      flex: 1,
      paddingVertical: 8,
    },
    commentRow: {
      flexDirection: 'row',
      paddingVertical: 10,
      paddingHorizontal: 8,
      alignItems: 'flex-start',
      marginHorizontal: 8,
      marginVertical: 6,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    commentContent: {
      flex: 1,
      marginRight: 8,
    },
    commentAuthor: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
      marginBottom: 4,
    },
    commentText: {
      fontSize: 15,
      color: colors.text,
      lineHeight: 20,
      marginBottom: 4,
    },
    commentMeta: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    commentHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    commentActions: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
      paddingTop: 4,
      borderTopWidth: 0.5,
      borderTopColor: colors.border,
    },
    commentActionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      marginRight: 12,
    },
    commentActionText: {
      fontSize: 12,
      color: colors.textSecondary,
      marginLeft: 4,
    },
    replyRow: {
      borderLeftWidth: 2,
      borderLeftColor: `${colors.primary}40`,
      paddingLeft: 8,
    },
    replyCount: {
      fontSize: 11,
      color: colors.textSecondary,
      fontStyle: 'italic',
      marginLeft: 'auto',
    },
    replyInputHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: `${colors.primary}10`,
      borderRadius: 8,
      marginBottom: 8,
    },
    replyInputText: {
      fontSize: 14,
      color: colors.primary,
      flex: 1,
    },
    cancelReplyButton: {
      padding: 4,
    },
    rightActionContainer: {
      width: 80,
      backgroundColor: '#dc2626',
      justifyContent: 'center',
      alignItems: 'center',
      borderTopRightRadius: 12,
      borderBottomRightRadius: 12,
      marginVertical: 6,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingTop: 16,
      paddingBottom: 8,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    textInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 15,
      color: colors.text,
      backgroundColor: colors.surface,
      marginRight: 12,
      maxHeight: 100,
    },
    sendButton: {
      backgroundColor: colors.primary,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sendButtonDisabled: {
      backgroundColor: colors.border,
    },
  });

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={dynamicStyles.modalContainer}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <Animated.View 
          style={[
            dynamicStyles.modalContent,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={dynamicStyles.header}>
            <Text style={dynamicStyles.title}>Comments</Text>
            <TouchableOpacity 
              onPress={onClose} 
              style={dynamicStyles.closeButton}
              accessibilityLabel="Close comments"
              accessibilityRole="button"
            >
              <FontAwesome name="times" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={dynamicStyles.loadingContainer}>
              <ActivityIndicator color={colors.primary} size="large" />
            </View>
          ) : comments.length === 0 ? (
            <View style={dynamicStyles.emptyContainer}>
              <Text style={dynamicStyles.emptyText}>
                No comments yet. Be the first to comment!
              </Text>
            </View>
          ) : (
            <FlatList
              data={comments}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              style={dynamicStyles.commentsList}
              showsVerticalScrollIndicator={false}
            />
          )}

          {/* Reply indicator */}
          {replyingTo && (
            <View style={dynamicStyles.replyInputHeader}>
              <Text style={dynamicStyles.replyInputText}>
                Replying to {replyingTo.author_name || replyingTo.user_name || 'Anonymous'}
              </Text>
              <TouchableOpacity style={dynamicStyles.cancelReplyButton} onPress={cancelReply}>
                <FontAwesome name="times" size={14} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          )}

          <View style={dynamicStyles.inputContainer}>
            <TextInput
              ref={textInputRef}
              style={dynamicStyles.textInput}
              value={input}
              onChangeText={setInput}
              placeholder={replyingTo ? "Write a reply..." : "Add a comment..."}
              placeholderTextColor={colors.textSecondary}
              editable={!submitting}
              multiline
              onSubmitEditing={handleAddComment}
              returnKeyType="send"
            />
            <TouchableOpacity
              style={[
                dynamicStyles.sendButton,
                (submitting || !input.trim()) && dynamicStyles.sendButtonDisabled
              ]}
              onPress={handleAddComment}
              disabled={submitting || !input.trim()}
              accessibilityLabel="Send comment"
              accessibilityRole="button"
            >
              <FontAwesome 
                name="send" 
                size={16} 
                color={submitting || !input.trim() ? colors.textSecondary : colors.surface} 
              />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}; 