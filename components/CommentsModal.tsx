import React, { useEffect, useRef, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Animated, KeyboardAvoidingView, Platform, TextInput, FlatList, TouchableWithoutFeedback, Keyboard, Dimensions } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
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
  reel_id: number;
  content: string;
  created_at: string;
  author_name?: string;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;

export const CommentsModal: React.FC<CommentsModalProps> = ({ videoId, visible, onClose, onCommentsCountChange }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

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
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
    // eslint-disable-next-line
  }, [visible, videoId]);

  // Fetch comments
  const fetchComments = async () => {
    if (!videoId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('comments')
      .select('id, user_id, reel_id, content, created_at, profiles(full_name)')
      .eq('reel_id', videoId)
      .order('created_at', { ascending: false });
    if (error) {
      setComments([]);
      onCommentsCountChange && onCommentsCountChange(0);
    } else {
      // Map author name from joined profiles
      const mapped = (data || []).map((c: any) => ({
        ...c,
        author_name: c.profiles?.full_name || 'Unknown',
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
      .insert({ user_id: user.id, reel_id: videoId, content: input.trim() })
      .select('id, user_id, reel_id, content, created_at, profiles(full_name)')
      .single();
    if (!error && data) {
      const newComment = {
        ...data,
        author_name: data.profiles?.full_name || 'You',
      };
      setComments((prev) => [newComment, ...prev]);
      setInput('');
      onCommentsCountChange && onCommentsCountChange(comments.length + 1);
      // Update comments_count in reels table
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

  // Dismiss modal on backdrop press
  const handleBackdropPress = () => {
    Keyboard.dismiss();
    onClose();
  };

  // Render comment item
  const renderItem = ({ item }: { item: Comment }) => {
    const isOwnComment = user && item.user_id === user.id;
    // Format date as 'Apr 27, 2024'
    const dateStr = item.created_at ? new Date(item.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '';
    return (
      <View style={styles.commentRow}>
        <View style={styles.commentContent}>
          <Text style={styles.commentAuthor}>{isOwnComment ? 'You' : (item.author_name || 'Unknown')}</Text>
          <Text style={styles.commentText}>{item.content}</Text>
          <Text style={styles.commentMeta}>{dateStr}</Text>
        </View>
        {isOwnComment && (
          <TouchableOpacity onPress={() => handleDeleteComment(item.id)} accessibilityLabel="Delete comment" accessibilityRole="button">
            <FontAwesome name="trash" size={18} color="#ef4444" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>
      <Animated.View style={[styles.modalContent, { transform: [{ translateY: slideAnim }] }]}> 
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <View style={styles.sheetContent}>
            <View style={styles.handleBar} />
            <Text style={styles.sheetTitle}>Comments</Text>
            {loading ? (
              <ActivityIndicator color="#3b82f6" style={{ marginTop: 24 }} />
            ) : comments.length === 0 ? (
              <Text style={styles.noCommentsText}>No comments yet. Be the first to comment!</Text>
            ) : (
              <FlatList
                data={comments}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={{ paddingBottom: 16 }}
                style={{ flex: 1 }}
              />
            )}
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={input}
                onChangeText={setInput}
                placeholder="Add a comment..."
                placeholderTextColor="#888"
                editable={!submitting}
                onSubmitEditing={handleAddComment}
                returnKeyType="send"
              />
              <TouchableOpacity
                style={styles.sendBtn}
                onPress={handleAddComment}
                disabled={submitting || !input.trim()}
                accessibilityLabel="Send comment"
                accessibilityRole="button"
              >
                <FontAwesome name="send" size={20} color={submitting || !input.trim() ? '#888' : '#3b82f6'} />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
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
    zIndex: 1,
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
    zIndex: 2,
    elevation: 20,
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