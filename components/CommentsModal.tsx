import React, { useEffect, useRef, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Animated, KeyboardAvoidingView, Platform, TextInput, FlatList, TouchableWithoutFeedback, Keyboard, Dimensions } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FontAwesome } from '@expo/vector-icons';

interface CommentsModalProps {
  videoId: number | null;
  visible: boolean;
  onClose: () => void;
  onCommentsCountChange?: (count: number) => void;
}

interface Comment {
  id: number;
  user_id: string;
  article_id: number;
  content: string;
  created_at: string;
  author_name?: string;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;

export const CommentsModal: React.FC<CommentsModalProps> = ({ videoId, visible, onClose, onCommentsCountChange }) => {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const textInputRef = useRef<TextInput>(null);

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
      .from('comments')
      .select('id, user_id, article_id, content, created_at')
      .eq('article_id', videoId)
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
    const { error, data } = await supabase
      .from('comments')
      .insert({ user_id: user.id, article_id: videoId, content: input.trim() })
      .select('id, user_id, article_id, content, created_at')
      .single();
    if (!error && data) {
      const newComment = {
        ...data,
        author_name: 'You',
      };
      setComments((prev) => [newComment, ...prev]);
      setInput('');
      onCommentsCountChange && onCommentsCountChange(comments.length + 1);
      // Update comments_count in articles table
      await supabase.from('articles').update({ comments_count: comments.length + 1 }).eq('id', videoId);
    }
    setSubmitting(false);
  };

  // Delete comment
  const handleDeleteComment = async (commentId: number) => {
    if (!user || !videoId) return;
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', user.id);
    if (!error) {
      const newCount = Math.max(comments.length - 1, 0);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      onCommentsCountChange && onCommentsCountChange(newCount);
      // Update comments_count in reels table
      await supabase.from('articles').update({ comments_count: newCount }).eq('id', videoId);
    }
  };

  // Handle backdrop press - dismiss keyboard first, then modal
  const handleBackdropPress = () => {
    if (keyboardHeight > 0) {
      // If keyboard is open, just dismiss it
      textInputRef.current?.blur();
      Keyboard.dismiss();
    } else {
      // If keyboard is already closed, close the modal
      onClose();
    }
  };

  // Render comment item
  const renderItem = ({ item }: { item: Comment }) => {
    const isOwnComment = user && item.user_id === user.id;
    // Format date as 'Apr 27, 2024'
    const dateStr = item.created_at ? new Date(item.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '';
    return (
      <View style={dynamicStyles.commentRow}>
        <View style={dynamicStyles.commentContent}>
          <Text style={dynamicStyles.commentAuthor}>{isOwnComment ? 'You' : (item.author_name || 'Unknown')}</Text>
          <Text style={dynamicStyles.commentText}>{item.content}</Text>
          <Text style={dynamicStyles.commentMeta}>{dateStr}</Text>
        </View>
        {isOwnComment && (
          <TouchableOpacity onPress={() => handleDeleteComment(item.id)} accessibilityLabel="Delete comment" accessibilityRole="button">
            <FontAwesome name="trash" size={18} color="#ef4444" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const dynamicStyles = StyleSheet.create({
    modalContent: {
      position: 'absolute',
      bottom: keyboardHeight,
      left: 0,
      right: 0,
      height: SCREEN_HEIGHT * 0.6,
      maxHeight: SCREEN_HEIGHT - keyboardHeight - 50, // Leave some space at top
      backgroundColor: colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 1000,
      zIndex: 1000,
    },
    sheetContent: {
      flex: 1,
      paddingHorizontal: 20,
      paddingBottom: 20,
      paddingTop: 0,
    },
    handleArea: {
      paddingVertical: 16,
      alignItems: 'center',
    },
    handleBar: {
      width: 40,
      height: 4,
      backgroundColor: colors.textTertiary,
      borderRadius: 2,
    },
    sheetTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 16,
      textAlign: 'center',
    },
    noCommentsText: {
      textAlign: 'center',
      color: colors.textSecondary,
      marginTop: 40,
      fontSize: 16,
    },
    commentRow: {
      flexDirection: 'row',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    commentContent: {
      flex: 1,
      marginRight: 12,
    },
    commentAuthor: {
      fontWeight: '600',
      color: '#3b82f6',
      marginBottom: 4,
    },
    commentText: {
      color: colors.text,
      lineHeight: 20,
      marginBottom: 4,
    },
    commentMeta: {
      fontSize: 12,
      color: colors.textTertiary,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    input: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: 25,
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.inputBackground,
      color: colors.inputText,
      marginRight: 12,
    },
    sendBtn: {
      padding: 8,
    },
  });

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <View style={styles.backdrop}>
          {/* Themed overlay specifically for keyboard area */}
          {keyboardHeight > 0 && (
            <View style={[
              styles.keyboardOverlay,
              {
                bottom: 0,
                height: keyboardHeight,
                backgroundColor: colors.background === '#ffffff' || colors.background === '#fff' ? '#ffffff' : '#000000',
              }
            ]} />
          )}
          <TouchableWithoutFeedback onPress={() => {
            // If keyboard is open and user taps modal content, dismiss keyboard
            if (keyboardHeight > 0) {
              textInputRef.current?.blur();
              Keyboard.dismiss();
            }
          }}>
            <Animated.View style={[dynamicStyles.modalContent, { transform: [{ translateY: slideAnim }] }]}> 
              <TouchableOpacity 
                style={dynamicStyles.handleArea} 
                onPress={handleBackdropPress}
                activeOpacity={1}
              >
                <View style={dynamicStyles.handleBar} />
              </TouchableOpacity>
              <View style={dynamicStyles.sheetContent}>
                <Text style={dynamicStyles.sheetTitle}>Comments</Text>
                {loading ? (
                  <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
                ) : comments.length === 0 ? (
                  <Text style={dynamicStyles.noCommentsText}>No comments yet. Be the first to comment!</Text>
                ) : (
                  <FlatList
                    data={comments}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingBottom: 16 }}
                    style={{ flex: 1 }}
                  />
                )}
                <View style={dynamicStyles.inputRow}>
                  <TextInput
                    ref={textInputRef}
                    style={dynamicStyles.input}
                    value={input}
                    onChangeText={setInput}
                    placeholder="Add a comment..."
                    placeholderTextColor={colors.inputPlaceholder}
                    editable={!submitting}
                    onSubmitEditing={handleAddComment}
                    returnKeyType="send"
                    autoCorrect={false}
                    autoCapitalize="none"
                    spellCheck={false}
                    textContentType="none"
                    clearButtonMode="never"
                    keyboardAppearance={colors.background === '#000000' ? 'dark' : 'light'}
                  />
                  <TouchableOpacity
                    style={dynamicStyles.sendBtn}
                    onPress={handleAddComment}
                    disabled={submitting || !input.trim()}
                    accessibilityLabel="Send comment"
                    accessibilityRole="button"
                  >
                    <FontAwesome name="send" size={20} color={submitting || !input.trim() ? colors.textTertiary : colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  keyboardOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 999,
  },
  modalContent: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '70%',
    backgroundColor: '#18181b',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    zIndex: 1000,
    elevation: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  sheetContent: {
    flex: 1,
    padding: 16,
    backgroundColor: '#18181b',
  },
  handleBar: {
    width: 60,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#3b82f6',
    alignSelf: 'center',
    marginBottom: 12,
    marginTop: 4,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  noCommentsText: {
    color: '#888',
    textAlign: 'center',
    marginTop: 32,
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#23232b',
  },
  commentContent: {
    flex: 1,
    marginRight: 12,
  },
  commentText: {
    color: '#fff',
    fontSize: 15,
  },
  commentAuthor: {
    color: '#3b82f6',
    fontWeight: 'bold',
    fontSize: 13,
    marginBottom: 2,
  },
  commentMeta: {
    color: '#888',
    fontSize: 11,
    marginTop: 2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: '#23232b',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: 'transparent',
  },
  sendBtn: {
    marginLeft: 8,
    padding: 6,
  },
}); 