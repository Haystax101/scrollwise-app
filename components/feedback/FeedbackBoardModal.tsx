import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Modal,
  RefreshControl,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { FeedbackFilters } from './FeedbackFilters';
import { FeedbackItem } from './FeedbackItem';
import { CreateFeedbackModal } from './CreateFeedbackModal';
import { FeedbackDetailModal } from './FeedbackDetailModal';
import type { Feedback, SortOption } from '../../types/feedback';

interface FeedbackBoardModalProps {
  visible: boolean;
  onClose: () => void;
}

export const FeedbackBoardModal: React.FC<FeedbackBoardModalProps> = ({
  visible,
  onClose
}) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('top');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);

  // User votes state
  const [userUpvotes, setUserUpvotes] = useState<Set<string>>(new Set());
  const [userDownvotes, setUserDownvotes] = useState<Set<string>>(new Set());

  // Fetch feedback and user votes
  const fetchFeedback = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Determine sort order
      const orderColumn = sortBy === 'top' ? 'upvotes_count' : 'created_at';
      const orderAscending = sortBy === 'oldest';

      // Fetch feedback with author profiles
      const { data: feedbackData, error: feedbackError } = await supabase
        .from('feedback')
        .select(`
          *,
          profiles:user_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .order(orderColumn, { ascending: orderAscending });

      if (feedbackError) throw feedbackError;

      setFeedback(feedbackData || []);

      // Fetch user's upvotes
      const { data: upvotesData, error: upvotesError } = await supabase
        .from('user_feedback_upvotes')
        .select('feedback_id')
        .eq('user_id', user.id);

      if (upvotesError) throw upvotesError;

      setUserUpvotes(new Set(upvotesData?.map(v => v.feedback_id) || []));

      // Fetch user's downvotes
      const { data: downvotesData, error: downvotesError } = await supabase
        .from('user_feedback_downvotes')
        .select('feedback_id')
        .eq('user_id', user.id);

      if (downvotesError) throw downvotesError;

      setUserDownvotes(new Set(downvotesData?.map(v => v.feedback_id) || []));

    } catch (error) {
      console.error('Error fetching feedback:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, sortBy]);

  // Load feedback when modal opens or sort changes
  useEffect(() => {
    if (visible) {
      fetchFeedback();
    }
  }, [visible, sortBy, fetchFeedback]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchFeedback();
  }, [fetchFeedback]);

  // Filter and sort feedback
  const filteredFeedback = useMemo(() => {
    if (!searchQuery.trim()) return feedback;

    const query = searchQuery.toLowerCase();
    return feedback.filter(
      item =>
        item.title.toLowerCase().includes(query) ||
        item.body.toLowerCase().includes(query)
    );
  }, [feedback, searchQuery]);

  // Handle upvote
  const handleUpvote = useCallback(async (feedbackId: string) => {
    if (!user) return;

    const wasUpvoted = userUpvotes.has(feedbackId);
    const wasDownvoted = userDownvotes.has(feedbackId);

    // Optimistic update
    const newUpvotes = new Set(userUpvotes);
    const newDownvotes = new Set(userDownvotes);

    setFeedback(prev => prev.map(item => {
      if (item.id !== feedbackId) return item;

      let upvotesChange = 0;
      let downvotesChange = 0;

      if (wasUpvoted) {
        // Un-upvote
        newUpvotes.delete(feedbackId);
        upvotesChange = -1;
      } else {
        // Upvote (and remove downvote if exists)
        newUpvotes.add(feedbackId);
        upvotesChange = 1;
        if (wasDownvoted) {
          newDownvotes.delete(feedbackId);
          downvotesChange = -1;
        }
      }

      return {
        ...item,
        upvotes_count: item.upvotes_count + upvotesChange,
        downvotes_count: item.downvotes_count + downvotesChange,
      };
    }));

    setUserUpvotes(newUpvotes);
    setUserDownvotes(newDownvotes);

    try {
      if (wasDownvoted) {
        // Remove downvote first
        await supabase
          .from('user_feedback_downvotes')
          .delete()
          .eq('user_id', user.id)
          .eq('feedback_id', feedbackId);
      }

      if (wasUpvoted) {
        // Remove upvote
        await supabase
          .from('user_feedback_upvotes')
          .delete()
          .eq('user_id', user.id)
          .eq('feedback_id', feedbackId);
      } else {
        // Add upvote
        await supabase
          .from('user_feedback_upvotes')
          .insert({ user_id: user.id, feedback_id: feedbackId });
      }
    } catch (error) {
      console.error('Error toggling upvote:', error);
      // Revert optimistic update
      fetchFeedback();
    }
  }, [user, userUpvotes, userDownvotes, fetchFeedback]);

  // Handle downvote
  const handleDownvote = useCallback(async (feedbackId: string) => {
    if (!user) return;

    const wasUpvoted = userUpvotes.has(feedbackId);
    const wasDownvoted = userDownvotes.has(feedbackId);

    // Optimistic update
    const newUpvotes = new Set(userUpvotes);
    const newDownvotes = new Set(userDownvotes);

    setFeedback(prev => prev.map(item => {
      if (item.id !== feedbackId) return item;

      let upvotesChange = 0;
      let downvotesChange = 0;

      if (wasDownvoted) {
        // Un-downvote
        newDownvotes.delete(feedbackId);
        downvotesChange = -1;
      } else {
        // Downvote (and remove upvote if exists)
        newDownvotes.add(feedbackId);
        downvotesChange = 1;
        if (wasUpvoted) {
          newUpvotes.delete(feedbackId);
          upvotesChange = -1;
        }
      }

      return {
        ...item,
        upvotes_count: item.upvotes_count + upvotesChange,
        downvotes_count: item.downvotes_count + downvotesChange,
      };
    }));

    setUserUpvotes(newUpvotes);
    setUserDownvotes(newDownvotes);

    try {
      if (wasUpvoted) {
        // Remove upvote first
        await supabase
          .from('user_feedback_upvotes')
          .delete()
          .eq('user_id', user.id)
          .eq('feedback_id', feedbackId);
      }

      if (wasDownvoted) {
        // Remove downvote
        await supabase
          .from('user_feedback_downvotes')
          .delete()
          .eq('user_id', user.id)
          .eq('feedback_id', feedbackId);
      } else {
        // Add downvote
        await supabase
          .from('user_feedback_downvotes')
          .insert({ user_id: user.id, feedback_id: feedbackId });
      }
    } catch (error) {
      console.error('Error toggling downvote:', error);
      // Revert optimistic update
      fetchFeedback();
    }
  }, [user, userUpvotes, userDownvotes, fetchFeedback]);

  // Handle opening detail modal
  const handleFeedbackPress = useCallback((item: Feedback) => {
    setSelectedFeedback(item);
    setShowDetailModal(true);
  }, []);

  // Handle detail modal vote actions
  const handleDetailUpvote = useCallback(() => {
    if (selectedFeedback) {
      handleUpvote(selectedFeedback.id);
      // Update selected feedback to reflect the change
      setSelectedFeedback(prev => {
        if (!prev) return prev;
        const wasUpvoted = userUpvotes.has(prev.id);
        const wasDownvoted = userDownvotes.has(prev.id);
        return {
          ...prev,
          upvotes_count: prev.upvotes_count + (wasUpvoted ? -1 : 1),
          downvotes_count: wasDownvoted ? prev.downvotes_count - 1 : prev.downvotes_count,
        };
      });
    }
  }, [selectedFeedback, handleUpvote, userUpvotes, userDownvotes]);

  const handleDetailDownvote = useCallback(() => {
    if (selectedFeedback) {
      handleDownvote(selectedFeedback.id);
      // Update selected feedback to reflect the change
      setSelectedFeedback(prev => {
        if (!prev) return prev;
        const wasUpvoted = userUpvotes.has(prev.id);
        const wasDownvoted = userDownvotes.has(prev.id);
        return {
          ...prev,
          upvotes_count: wasUpvoted ? prev.upvotes_count - 1 : prev.upvotes_count,
          downvotes_count: prev.downvotes_count + (wasDownvoted ? -1 : 1),
        };
      });
    }
  }, [selectedFeedback, handleDownvote, userUpvotes, userDownvotes]);

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: insets.top + 16,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
    },
    closeButton: {
      padding: 8,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
    },
    emptyIcon: {
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    emptyText: {
      fontSize: 15,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
    },
    fab: {
      position: 'absolute',
      bottom: insets.bottom + 20,
      right: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 5,
    },
    listContent: {
      paddingTop: 12,
      paddingBottom: insets.bottom + 100,
    },
  });

  const renderItem = useCallback(
    ({ item }: { item: Feedback }) => (
      <FeedbackItem
        feedback={item}
        userUpvoted={userUpvotes.has(item.id)}
        userDownvoted={userDownvotes.has(item.id)}
        onUpvote={handleUpvote}
        onDownvote={handleDownvote}
        onPress={() => handleFeedbackPress(item)}
      />
    ),
    [userUpvotes, userDownvotes, handleUpvote, handleDownvote, handleFeedbackPress]
  );

  const renderEmpty = () => {
    if (loading) return null;

    return (
      <View style={dynamicStyles.emptyContainer}>
        <Feather
          name="message-circle"
          size={64}
          color={colors.textSecondary}
          style={dynamicStyles.emptyIcon}
        />
        <Text style={dynamicStyles.emptyTitle}>
          {searchQuery ? 'No Results Found' : 'No Feedback Yet'}
        </Text>
        <Text style={dynamicStyles.emptyText}>
          {searchQuery
            ? 'Try adjusting your search or filters'
            : 'Be the first to share your thoughts and help us improve!'}
        </Text>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={dynamicStyles.container}>
        <View style={dynamicStyles.header}>
          <Text style={dynamicStyles.headerTitle}>Feedback</Text>
          <TouchableOpacity style={dynamicStyles.closeButton} onPress={onClose}>
            <Feather name="x" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <FeedbackFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />

        {loading ? (
          <View style={dynamicStyles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={filteredFeedback}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={dynamicStyles.listContent}
            ListEmptyComponent={renderEmpty}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.primary}
              />
            }
          />
        )}

        {/* Create Feedback FAB */}
        <TouchableOpacity
          style={dynamicStyles.fab}
          onPress={() => setShowCreateModal(true)}
        >
          <Feather name="plus" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Create Feedback Modal */}
        <CreateFeedbackModal
          visible={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            fetchFeedback();
          }}
        />

        {/* Detail Modal */}
        <FeedbackDetailModal
          visible={showDetailModal}
          feedback={selectedFeedback}
          userUpvoted={selectedFeedback ? userUpvotes.has(selectedFeedback.id) : false}
          userDownvoted={selectedFeedback ? userDownvotes.has(selectedFeedback.id) : false}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedFeedback(null);
          }}
          onUpvote={handleDetailUpvote}
          onDownvote={handleDetailDownvote}
          onDelete={() => {
            fetchFeedback();
          }}
        />
      </View>
    </Modal>
  );
};
