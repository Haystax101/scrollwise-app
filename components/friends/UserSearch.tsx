import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  Alert
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { FriendsService } from '../../lib/friendsService';
import type { FriendProfile, FriendshipInfo } from '../../types/friends';

interface UserSearchProps {
  searchResults: FriendProfile[];
  onSearch: (query: string) => void;
  onSendRequest: (userId: string) => void;
  loading: boolean;
}

export const UserSearch: React.FC<UserSearchProps> = ({
  searchResults,
  onSearch,
  onSendRequest,
  loading
}) => {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [friendshipStatuses, setFriendshipStatuses] = useState<Record<string, FriendshipInfo>>({});
  const [processingUsers, setProcessingUsers] = useState<Set<string>>(new Set());

  // Debounced search
  const handleSearchChange = useCallback(
    debounce((query: string) => {
      onSearch(query);
    }, 300),
    [onSearch]
  );

  const updateSearchQuery = (query: string) => {
    setSearchQuery(query);
    handleSearchChange(query);
  };

  // Check friendship status for each user
  const checkFriendshipStatus = useCallback(async (userId: string) => {
    try {
      const status = await FriendsService.getFriendshipStatus(userId, userId);
      setFriendshipStatuses(prev => ({ ...prev, [userId]: status }));
    } catch (error) {
      console.error('Error checking friendship status:', error);
    }
  }, []);

  const handleSendRequest = async (userId: string) => {
    setProcessingUsers(prev => new Set(prev).add(userId));
    try {
      await onSendRequest(userId);
      // Update friendship status after sending request
      await checkFriendshipStatus(userId);
      Alert.alert('Success', 'Friend request sent!');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to send request');
    } finally {
      setProcessingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const getActionButton = (user: FriendProfile) => {
    const friendshipInfo = friendshipStatuses[user.id];
    const isProcessing = processingUsers.has(user.id);

    if (!friendshipInfo) {
      // Check status when we render
      checkFriendshipStatus(user.id);
      return (
        <TouchableOpacity style={[styles.actionButton, { borderColor: colors.border }]} disabled>
          <Text style={[styles.actionButtonText, { color: colors.textSecondary }]}>
            Loading...
          </Text>
        </TouchableOpacity>
      );
    }

    if (friendshipInfo.status === 'accepted') {
      return (
        <View style={[styles.friendsButton, { backgroundColor: colors.primary + '20' }]}>
          <Feather name="check" size={16} color={colors.primary} />
          <Text style={[styles.friendsButtonText, { color: colors.primary }]}>
            Friends
          </Text>
        </View>
      );
    }

    if (friendshipInfo.status === 'pending') {
      const isPending = friendshipInfo.direction === 'outgoing';
      return (
        <View style={[styles.pendingButton, { backgroundColor: colors.textSecondary + '20' }]}>
          <Feather name="clock" size={16} color={colors.textSecondary} />
          <Text style={[styles.pendingButtonText, { color: colors.textSecondary }]}>
            {isPending ? 'Sent' : 'Pending'}
          </Text>
        </View>
      );
    }

    if (friendshipInfo.status === 'blocked') {
      return (
        <View style={[styles.blockedButton, { backgroundColor: colors.error + '20' }]}>
          <Feather name="slash" size={16} color={colors.error} />
          <Text style={[styles.blockedButtonText, { color: colors.error }]}>
            Blocked
          </Text>
        </View>
      );
    }

    // Can send request
    if (friendshipInfo.can_send_request && !user.allow_friend_requests) {
      return (
        <View style={[styles.disabledButton, { backgroundColor: colors.border }]}>
          <Text style={[styles.disabledButtonText, { color: colors.textSecondary }]}>
            Private
          </Text>
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: colors.primary }]}
        onPress={() => handleSendRequest(user.id)}
        disabled={isProcessing}
      >
        <Feather name="user-plus" size={16} color="white" />
        <Text style={styles.addButtonText}>
          {isProcessing ? 'Sending...' : 'Add'}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderSearchResult = ({ item }: { item: FriendProfile }) => (
    <View style={[styles.resultCard, { borderColor: colors.border }]}>
      <View style={styles.resultInfo}>
        <Image
          source={{ uri: item.avatar_url || 'https://via.placeholder.com/40' }}
          style={styles.avatar}
        />
        <View style={styles.resultDetails}>
          <Text style={[styles.resultName, { color: colors.text }]}>
            {item.full_name}
          </Text>
          <Text style={[styles.resultMeta, { color: colors.textSecondary }]}>
            {item.friends_count} friends
          </Text>
          {!item.discoverable && (
            <Text style={[styles.privateLabel, { color: colors.textSecondary }]}>
              Private profile
            </Text>
          )}
        </View>
      </View>
      {getActionButton(item)}
    </View>
  );

  const renderEmptyState = () => {
    if (!searchQuery) {
      return (
        <View style={styles.emptyState}>
          <Feather name="search" size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Search for People</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Enter a name to find and connect with people in your network.
          </Text>
        </View>
      );
    }

    if (loading) {
      return (
        <View style={styles.emptyState}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Searching...
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Feather name="user-x" size={48} color={colors.textSecondary} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>No Results</Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          No users found matching "{searchQuery}". Try a different search term.
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.border + '40' }]}>
        <Feather name="search" size={20} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search people by name..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={updateSearchQuery}
          autoCapitalize="words"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => updateSearchQuery('')}>
            <Feather name="x" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Results */}
      <FlatList
        data={searchResults}
        renderItem={renderSearchResult}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.resultsContainer}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

// Simple debounce function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    margin: 16,
    borderRadius: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  resultsContainer: {
    padding: 16,
    paddingTop: 0,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  resultInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  resultDetails: {
    flex: 1,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  resultMeta: {
    fontSize: 12,
    marginBottom: 2,
  },
  privateLabel: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
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
  friendsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  friendsButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  pendingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  pendingButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  blockedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  blockedButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  disabledButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  disabledButtonText: {
    fontSize: 14,
    fontWeight: '600',
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
  },
  loadingText: {
    fontSize: 16,
  },
});