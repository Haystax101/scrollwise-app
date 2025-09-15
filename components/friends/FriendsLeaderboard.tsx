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
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import type { FriendsLeaderboard, LeaderboardEntry } from '../../types/friends';

interface FriendsLeaderboardComponentProps {
  leaderboard: FriendsLeaderboard | null;
  loading: boolean;
  onRefresh: () => Promise<void>;
  refreshing: boolean;
}

export const FriendsLeaderboardComponent: React.FC<FriendsLeaderboardComponentProps> = ({
  leaderboard,
  loading,
  onRefresh,
  refreshing
}) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [showFriendsOnly, setShowFriendsOnly] = useState(false);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <MaterialCommunityIcons name="trophy" size={20} color="#FFD700" />;
      case 2:
        return <MaterialCommunityIcons name="medal" size={20} color="#C0C0C0" />;
      case 3:
        return <MaterialCommunityIcons name="medal" size={20} color="#CD7F32" />;
      default:
        return (
          <View style={[styles.rankNumber, { backgroundColor: colors.background }]}>
            <Text style={[styles.rankText, { color: colors.textSecondary }]}>
              {rank}
            </Text>
          </View>
        );
    }
  };

  const renderLeaderboardEntry = ({ item }: { item: LeaderboardEntry }) => {
    const isCurrentUser = item.user_id === user?.id;
    const isFriend = item.is_friend;

    return (
      <View
        style={[
          styles.entryCard,
          {
            borderColor: colors.border,
            backgroundColor: isCurrentUser ? colors.primary + '10' : 'transparent'
          }
        ]}
      >
        <View style={styles.rankContainer}>
          {getRankIcon(item.rank)}
        </View>

        <Image
          source={{ uri: item.avatar_url || 'https://via.placeholder.com/40' }}
          style={styles.avatar}
        />

        <View style={styles.entryInfo}>
          <View style={styles.nameContainer}>
            <Text style={[styles.entryName, { color: colors.text }]}>
              {item.full_name}
              {isCurrentUser && (
                <Text style={[styles.youLabel, { color: colors.primary }]}> (You)</Text>
              )}
            </Text>
            {isFriend && (
              <Feather name="users" size={14} color={colors.primary} />
            )}
          </View>
          <Text style={[styles.entryVoltz, { color: colors.textSecondary }]}>
            {item.total_voltz_earned.toLocaleString()} voltz
          </Text>
        </View>

        <View style={styles.entryActions}>
          {isFriend && !isCurrentUser && (
            <TouchableOpacity style={styles.messageButton}>
              <Feather name="message-circle" size={16} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderHeader = () => {
    if (!leaderboard) return null;

    return (
      <View style={styles.header}>
        {/* Toggle buttons */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              !showFriendsOnly && styles.activeToggleButton,
              !showFriendsOnly && { backgroundColor: colors.primary }
            ]}
            onPress={() => setShowFriendsOnly(false)}
          >
            <Text
              style={[
                styles.toggleButtonText,
                !showFriendsOnly && styles.activeToggleButtonText,
                !showFriendsOnly && { color: 'white' },
                showFriendsOnly && { color: colors.textSecondary }
              ]}
            >
              Global
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              showFriendsOnly && styles.activeToggleButton,
              showFriendsOnly && { backgroundColor: colors.primary }
            ]}
            onPress={() => setShowFriendsOnly(true)}
          >
            <Text
              style={[
                styles.toggleButtonText,
                showFriendsOnly && styles.activeToggleButtonText,
                showFriendsOnly && { color: 'white' },
                !showFriendsOnly && { color: colors.textSecondary }
              ]}
            >
              Friends
            </Text>
          </TouchableOpacity>
        </View>

        {/* User's rank info */}
        <View style={[styles.userRankCard, { backgroundColor: colors.primary + '10', borderColor: colors.primary }]}>
          <View style={styles.userRankInfo}>
            <Text style={[styles.userRankTitle, { color: colors.text }]}>Your Rank</Text>
            <View style={styles.userRankStats}>
              <View style={styles.userRankStat}>
                <Text style={[styles.userRankNumber, { color: colors.primary }]}>
                  #{leaderboard.user_rank.global || 'Unranked'}
                </Text>
                <Text style={[styles.userRankLabel, { color: colors.textSecondary }]}>
                  Global
                </Text>
              </View>
              {leaderboard.user_rank.among_friends > 0 && (
                <View style={styles.userRankStat}>
                  <Text style={[styles.userRankNumber, { color: colors.primary }]}>
                    #{leaderboard.user_rank.among_friends}
                  </Text>
                  <Text style={[styles.userRankLabel, { color: colors.textSecondary }]}>
                    Among Friends
                  </Text>
                </View>
              )}
            </View>
          </View>
          <Feather name="trophy" size={24} color={colors.primary} />
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Feather name="award" size={48} color={colors.textSecondary} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        {showFriendsOnly ? 'No Friends on Leaderboard' : 'Leaderboard Unavailable'}
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        {showFriendsOnly
          ? 'Add some friends to see how you compare!'
          : 'The leaderboard will show top performers by voltz earned.'
        }
      </Text>
    </View>
  );

  if (loading && !leaderboard) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading leaderboard...
        </Text>
      </View>
    );
  }

  const data = showFriendsOnly
    ? leaderboard?.friends_only || []
    : leaderboard?.global_with_friends_highlighted || [];

  return (
    <FlatList
      data={data}
      renderItem={renderLeaderboardEntry}
      keyExtractor={(item) => item.user_id}
      ListHeaderComponent={renderHeader}
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
  header: {
    marginBottom: 20,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeToggleButton: {
    // backgroundColor applied dynamically
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  activeToggleButtonText: {
    // color applied dynamically
  },
  userRankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  userRankInfo: {
    flex: 1,
  },
  userRankTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  userRankStats: {
    flexDirection: 'row',
    gap: 24,
  },
  userRankStat: {
    alignItems: 'center',
  },
  userRankNumber: {
    fontSize: 18,
    fontWeight: '700',
  },
  userRankLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  rankContainer: {
    width: 30,
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  rankText: {
    fontSize: 12,
    fontWeight: '600',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  entryInfo: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  entryName: {
    fontSize: 16,
    fontWeight: '600',
  },
  youLabel: {
    fontWeight: '500',
  },
  entryVoltz: {
    fontSize: 14,
  },
  entryActions: {
    flexDirection: 'row',
    gap: 8,
  },
  messageButton: {
    padding: 8,
    borderRadius: 8,
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