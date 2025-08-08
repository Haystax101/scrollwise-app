import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, TextInput, ActivityIndicator, Animated, Dimensions, Keyboard, Platform, StyleSheet, Pressable } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';

interface Comment {
  id: number;
  user_id: string;
  content: string;
  created_at: string;
  author_name?: string;
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

export const CommentsModal: React.FC<CommentsModalProps> = ({ 
  videoId, 
  visible, 
  onClose, 
  onCommentsCountChange, 
  contentType = 'article' 
}) => {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
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

  // Fetch comments
  const fetchComments = async () => {
    const vid = stableVideoIdRef.current ?? videoId;
    if (!vid) return;
    setLoading(true);
    const tableCfg = stableTableInfoRef.current;
    const { data, error } = await supabase
      .from(tableCfg.commentTable)
      .select(`id, user_id, ${tableCfg.idField}, content, created_at`)
      .eq(tableCfg.idField, vid)
      .order('created_at', { ascending: false });
    if (error) {
      setComments([]);
      onCommentsCountChange && onCommentsCountChange(0);
    } else {
      // Map author name - for now just show "User" for all non-current users
      const mapped = (data || []).map((c: any) => ({
        ...c,
        author_name: c.user_id === user?.id ? 'You' : 'User',
      }));
      setComments(mapped);
      onCommentsCountChange && onCommentsCountChange(mapped.length);
    }
    setLoading(false);
  };

  // Add comment
  const handleAddComment = async () => {
    if (!user || !input.trim() || !videoId) return;
    setSubmitting(true);
    
    const insertData = { 
      user_id: user.id, 
      [tableInfo.idField]: videoId, 
      content: input.trim() 
    };
    
    const { error, data } = await supabase
      .from(tableInfo.commentTable)
      .insert(insertData)
      .select(`id, user_id, ${tableInfo.idField}, content, created_at`)
      .single();
      
    if (!error && data) {
      const newComment = {
        ...data,
        author_name: 'You',
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
    setSubmitting(false);
  };

  // Delete comment with detailed logging (helps diagnose RLS issues)
  const handleDeleteComment = async (commentId: number) => {
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

  // Render comment item with swipe-to-delete for own comments
  const renderItem = useCallback(({ item }: { item: Comment }) => {
    const isOwner = user && item.user_id === user.id;
    const content = (
      <View style={dynamicStyles.commentRow}>
        <View style={dynamicStyles.commentContent}>
          <Text style={dynamicStyles.commentAuthor}>{item.author_name}</Text>
          <Text style={dynamicStyles.commentText}>{item.content}</Text>
          <Text style={dynamicStyles.commentMeta}>{new Date(item.created_at).toLocaleString()}</Text>
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
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderItem}
              style={dynamicStyles.commentsList}
              showsVerticalScrollIndicator={false}
            />
          )}

          <View style={dynamicStyles.inputContainer}>
            <TextInput
              ref={textInputRef}
              style={dynamicStyles.textInput}
              value={input}
              onChangeText={setInput}
              placeholder="Add a comment..."
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