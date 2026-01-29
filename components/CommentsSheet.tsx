import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity, Keyboard } from 'react-native';
import { BottomSheetModal, BottomSheetFlatList, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';
import { profileImageService } from '../services/profileImageService';
import { Image } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

interface CommentsSheetProps {
  videoId: number | null;
  visible: boolean;
  onClose: () => void;
}

interface Comment {
  id: number;
  user_id: string;
  article_id: number;
  content: string;
  created_at: string;
  user_name?: string;
}

export const CommentsSheet: React.FC<CommentsSheetProps> = ({ videoId, visible, onClose }) => {
  const { user } = useAuth();
  const router = useRouter();
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Open/close sheet imperatively
  useEffect(() => {
    if (visible && videoId) {
      setTimeout(() => {
        bottomSheetRef.current?.present();
        fetchComments();
      }, 0);
    } else {
      bottomSheetRef.current?.dismiss();
    }
    // eslint-disable-next-line
  }, [visible, videoId]);

  // Close callback
  const handleSheetDismiss = useCallback(() => {
    onClose();
  }, [onClose]);

  // Fetch comments
  const fetchComments = async () => {
    if (!videoId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('comments')
      .select(`
        id, user_id, article_id, content, created_at,
        profiles:user_id (full_name, avatar_url)
      `)
      .eq('article_id', videoId)
      .order('created_at', { ascending: false });
    if (error) {
      setComments([]);
    } else {
      setComments(data || []);
    }
    setLoading(false);
  };

  // Add comment
  const handleAddComment = async () => {
    if (!user || !input.trim() || !videoId) return;

    // Dismiss keyboard immediately when send button is pressed
    Keyboard.dismiss();
    setSubmitting(true);
    const { error, data } = await supabase
      .from('comments')
      .insert({ user_id: user.id, article_id: videoId, content: input.trim() })
      .select()
      .single();
    if (!error && data) {
      setComments((prev) => [data, ...prev]);
      setInput('');
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
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      // Update comments_count in articles table
      await supabase.from('articles').update({ comments_count: Math.max(comments.length - 1, 0) }).eq('id', videoId);
    }
  };

  // Render comment item
  const renderItem = ({ item }: { item: any }) => {
    const profile = item.profiles;
    const avatarUrl = profile?.avatar_url
      ? profileImageService.getProfileImageUrl(profile.avatar_url)
      : null;

    return (
      <View style={styles.commentRow}>
        <TouchableOpacity onPress={() => {
          onClose(); // Close sheet
          router.push({ pathname: '/user-profile', params: { userId: item.user_id } });
        }}>
          <Image
            source={avatarUrl ? { uri: avatarUrl } : require('../assets/profileIconDefault.png')}
            style={styles.commentAvatar}
          />
        </TouchableOpacity>

        <View style={styles.commentContent}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={styles.commentAuthor}>{profile?.full_name || 'User'}</Text>
            <Text style={styles.commentMeta}>{new Date(item.created_at).toLocaleDateString()}</Text>
          </View>
          <Text style={styles.commentText}>{item.content}</Text>
        </View>

        {user && item.user_id === user.id && (
          <TouchableOpacity onPress={() => handleDeleteComment(item.id)} style={{ padding: 4 }}>
            <FontAwesome name="trash" size={14} color="#ef4444" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={["60%", "90%"]}
      onDismiss={handleSheetDismiss}
      enablePanDownToClose
      backgroundStyle={{ backgroundColor: '#18181b', zIndex: 9999, elevation: 20 }}
      handleIndicatorStyle={{ backgroundColor: '#3b82f6' }}
    >
      <View style={[styles.sheetContent, { zIndex: 9999, elevation: 20, backgroundColor: '#18181b' }]}>
        <Text style={styles.sheetTitle}>Comments</Text>
        {loading ? (
          <ActivityIndicator color="#3b82f6" style={{ marginTop: 24 }} />
        ) : comments.length === 0 ? (
          <Text style={styles.noCommentsText}>No comments yet. Be the first to comment!</Text>
        ) : (
          <BottomSheetFlatList
            data={comments}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 16 }}
          />
        )}
        <View style={styles.inputRow}>
          <BottomSheetTextInput
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
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  sheetContent: {
    flex: 1,
    padding: 16,
    backgroundColor: '#18181b',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
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
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
    backgroundColor: '#333'
  },
  commentContent: {
    flex: 1,
    marginRight: 12,
  },
  commentAuthor: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
    marginBottom: 2,
  },
  commentText: {
    color: '#ddd',
    fontSize: 14,
  },
  commentMeta: {
    color: '#666',
    fontSize: 10,
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