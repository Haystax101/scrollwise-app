import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, TextInput, ActivityIndicator, Animated, Dimensions, Keyboard, Platform, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface Comment {
  id: number;
  user_id: string;
  content: string;
  created_at: string;
  author_name?: string;
}

interface CommentsModalProps {
  videoId: number | null;
  visible: boolean;
  onClose: () => void;
  onCommentsCountChange?: (count: number) => void;
  contentType?: 'article' | 'paper' | 'book'; // Add content type prop
}

// Helper function to get table names based on content type
const getCommentTableInfo = (contentType: 'article' | 'paper' | 'book' = 'article') => {
  switch (contentType) {
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

  // Get table info for current content type
  const tableInfo = getCommentTableInfo(contentType);

  // Animate modal in/out
  useEffect(() => {
    if (visible) {
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
    if (!videoId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from(tableInfo.commentTable)
      .select(`id, user_id, ${tableInfo.idField}, content, created_at`)
      .eq(tableInfo.idField, videoId)
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

  // Delete comment
  const handleDeleteComment = async (commentId: number) => {
    if (!user || !videoId) return;
    const { error } = await supabase
      .from(tableInfo.commentTable)
      .delete()
      .eq('id', commentId)
      .eq('user_id', user.id);
      
    if (!error) {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      onCommentsCountChange && onCommentsCountChange(Math.max(comments.length - 1, 0));
      
      // Update comments_count in content table
      await supabase
        .from(tableInfo.contentTable)
        .update({ comments_count: Math.max(comments.length - 1, 0) })
        .eq('id', videoId);
    }
  };

  // Render comment item
  const renderItem = useCallback(({ item }: { item: Comment }) => (
    <View style={dynamicStyles.commentRow}>
      <View style={dynamicStyles.commentContent}>
        <Text style={dynamicStyles.commentAuthor}>{item.author_name}</Text>
        <Text style={dynamicStyles.commentText}>{item.content}</Text>
        <Text style={dynamicStyles.commentMeta}>{new Date(item.created_at).toLocaleString()}</Text>
      </View>
      {user && item.user_id === user.id && (
        <TouchableOpacity 
          onPress={() => handleDeleteComment(item.id)} 
          accessibilityLabel="Delete comment" 
          accessibilityRole="button"
          style={dynamicStyles.deleteButton}
        >
          <FontAwesome name="trash" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  ), [user, colors.textSecondary]);

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
      maxHeight: SCREEN_HEIGHT * 0.8,
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
      paddingVertical: 12,
      paddingHorizontal: 4,
      alignItems: 'flex-start',
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
    deleteButton: {
      padding: 8,
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
      <View style={dynamicStyles.modalContainer}>
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
      </View>
    </Modal>
  );
}; 