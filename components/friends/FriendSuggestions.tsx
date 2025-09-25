import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  RefreshControl
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { UserDetailModal } from '../profile/UserDetailModal';
import type { FriendSuggestion } from '../../types/friends';

interface FriendSuggestionsProps {
  suggestions: FriendSuggestion[];
  loading: boolean;
  onSendRequest: (userId: string) => void;
  onDismiss: (suggestionId: string) => void;
  onRefresh: () => Promise<void>;
  refreshing: boolean;
}

export const FriendSuggestions: React.FC<FriendSuggestionsProps> = ({
  suggestions,
  loading,
  onSendRequest,
  onDismiss,
  onRefresh,
  refreshing
}) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [processingUsers, setProcessingUsers] = useState<Set<string>>(new Set());
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);

  const handleSendRequest = async (userId: string, suggestionId: string) => {
    setProcessingUsers(prev => new Set(prev).add(userId));
    try {
      await onSendRequest(userId);
      onDismiss(suggestionId); // Remove from suggestions after sending request
    } finally {
      setProcessingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const handleUserPress = (userId: string) => {
    setSelectedUserId(userId);
    setShowUserModal(true);
  };

  const handleCloseUserModal = () => {
    setSelectedUserId(null);
    setShowUserModal(false);
  };

  const renderSuggestion = ({ item }: { item: FriendSuggestion }) => {
    const isProcessing = processingUsers.has(item.suggested_user_id);

    return (
      <View style={[styles.suggestionCard, { borderColor: colors.border }]}>
        <TouchableOpacity
          style={styles.suggestionInfo}
          onPress={() => handleUserPress(item.suggested_user_id)}
          activeOpacity={0.7}
        >
          <Image
            source={{ uri: item.avatar_url || 'https://via.placeholder.com/50' }}
            style={styles.avatar}
          />
          <View style={styles.suggestionDetails}>
            <Text style={[styles.suggestionName, { color: colors.text }]}>
              {item.full_name}
            </Text>

            {/* Suggestion reasons */}
            <View style={styles.reasonsContainer}>
              {item.mutual_friends_count > 0 && (
                <View style={[styles.reasonChip, { backgroundColor: colors.primary + '20' }]}>
                  <Feather name="users" size={12} color={colors.primary} />
                  <Text style={[styles.reasonText, { color: colors.primary }]}>
                    {item.mutual_friends_count} mutual
                  </Text>
                </View>
              )}

              {item.same_industry && (
                <View style={[styles.reasonChip, { backgroundColor: colors.accent + '20' }]}>
                  <Feather name="briefcase" size={12} color={colors.accent} />
                  <Text style={[styles.reasonText, { color: colors.accent }]}>
                    Same industry
                  </Text>
                </View>
              )}
            </View>

            {/* Suggestion score visualization */}
            <View style={styles.scoreContainer}>
              <View style={styles.scoreBar}>
                <View
                  style={[
                    styles.scoreProgress,
                    {
                      backgroundColor: colors.primary,
                      width: `${item.suggestion_score * 100}%`
                    }
                  ]}
                />
              </View>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.suggestionActions}>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => handleSendRequest(item.suggested_user_id, item.id)}
            disabled={isProcessing}
          >
            <Feather name="user-plus" size={16} color="white" />
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dismissButton, { borderColor: colors.border }]}
            onPress={() => onDismiss(item.id)}
            disabled={isProcessing}
          >
            <Feather name="x" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Feather name="user-check" size={48} color={colors.textSecondary} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No Suggestions</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        We'll suggest people you might know based on mutual connections and shared interests.
      </Text>
      <TouchableOpacity
        style={[styles.refreshButton, { backgroundColor: colors.primary }]}
        onPress={onRefresh}
      >
        <Text style={styles.refreshButtonText}>Refresh Suggestions</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && suggestions.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Finding suggestions...
        </Text>
      </View>
    );
  }

  return (
    <>
      <FlatList
        data={suggestions}
        renderItem={renderSuggestion}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      {/* User Detail Modal */}
      {selectedUserId && (
        <UserDetailModal
          visible={showUserModal}
          onClose={handleCloseUserModal}
          userId={selectedUserId}
          currentUserId={user?.id}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  suggestionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  suggestionDetails: {
    flex: 1,
  },
  suggestionName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  reasonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  reasonChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  reasonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scoreBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#E5E5E5',
    borderRadius: 2,
    overflow: 'hidden',
  },
  scoreProgress: {
    height: '100%',
    borderRadius: 2,
  },
  scoreText: {
    fontSize: 12,
    fontWeight: '500',
    minWidth: 60,
  },
  suggestionActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  dismissButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  refreshButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
});