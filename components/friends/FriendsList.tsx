import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import type { FriendsListItem } from '../../types/friends';

interface FriendsListProps {
  friends: FriendsListItem[];
  loading: boolean;
  onRemoveFriend: (friendshipId: string) => void;
  onRefresh: () => Promise<void>;
  refreshing: boolean;
}

export const FriendsList: React.FC<FriendsListProps> = ({
  friends,
  loading,
  onRemoveFriend,
  onRefresh,
  refreshing
}) => {
  const { colors } = useTheme();

  const renderFriend = ({ item }: { item: FriendsListItem }) => (
    <TouchableOpacity style={[styles.friendCard, { borderColor: colors.border }]}>
      <View style={styles.friendInfo}>
        <Image
          source={{ uri: item.friend.avatar_url || 'https://via.placeholder.com/40' }}
          style={styles.avatar}
        />
        <View style={styles.friendDetails}>
          <Text style={[styles.friendName, { color: colors.text }]}>
            {item.friend.full_name}
          </Text>
          {item.mutual_friends_count > 0 && (
            <Text style={[styles.mutualFriends, { color: colors.textSecondary }]}>
              {item.mutual_friends_count} mutual friends
            </Text>
          )}
          <Text style={[styles.friendSince, { color: colors.textSecondary }]}>
            Friends since {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={[styles.actionButton, { borderColor: colors.border }]}
        onPress={() => {
          Alert.alert(
            'Remove Friend',
            `Remove ${item.friend.full_name} from your friends?`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Remove',
                style: 'destructive',
                onPress: () => onRemoveFriend(item.friendship_id)
              }
            ]
          );
        }}
      >
        <Feather name="user-minus" size={16} color={colors.textSecondary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Feather name="users" size={48} color={colors.textSecondary} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No Friends Yet</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        Start building your network by discovering and connecting with people in your industry.
      </Text>
    </View>
  );

  if (loading && friends.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading friends...
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={friends}
      renderItem={renderFriend}
      keyExtractor={(item) => item.friendship_id}
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
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  friendInfo: {
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
  friendDetails: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  mutualFriends: {
    fontSize: 12,
    marginBottom: 2,
  },
  friendSince: {
    fontSize: 12,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
});