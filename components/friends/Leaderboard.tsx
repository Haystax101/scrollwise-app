import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { FriendsService } from '../../lib/friendsService';
import { UserDetailModal } from '../profile/UserDetailModal';
import { profileImageService } from '../../services/profileImageService';
import type { LeaderboardEntry } from '../../types/friends';

export function Leaderboard() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'friends' | 'global'>('global');
  const [globalLeaderboard, setGlobalLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [friendsLeaderboard, setFriendsLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState({ global: 0, among_friends: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);

  useEffect(() => {
    if (user) {
      loadLeaderboard();
    }
  }, [user]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const data = await FriendsService.getFriendsLeaderboard();
      setGlobalLeaderboard(data.global_with_friends_highlighted);
      setFriendsLeaderboard(data.friends_only);
      setUserRank(data.user_rank);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
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

  const currentLeaderboard = activeTab === 'global' ? globalLeaderboard : friendsLeaderboard;
  const currentUserRank = activeTab === 'global' ? userRank.global : userRank.among_friends;

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.border + '20',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      flex: 1,
    },
    tabs: {
      flexDirection: 'row',
      margin: 16,
      backgroundColor: colors.border + '20',
      borderRadius: 12,
      padding: 4,
    },
    tab: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignItems: 'center',
    },
    activeTab: {
      backgroundColor: colors.primary,
    },
    tabText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    activeTabText: {
      color: 'white',
    },
    userRankCard: {
      margin: 16,
      marginTop: 0,
      padding: 16,
      backgroundColor: colors.primary + '10',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    userRankTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    userRankText: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.primary,
    },
    leaderboard: {
      flex: 1,
      paddingHorizontal: 16,
    },
    leaderboardItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 16,
      backgroundColor: colors.background,
      borderRadius: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
      minHeight: 80,
    },
    currentUserItem: {
      backgroundColor: colors.primary + '10',
      borderColor: colors.primary,
    },
    rank: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.textSecondary,
      width: 40,
    },
    currentUserRank: {
      color: colors.primary,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.border,
      marginRight: 16,
    },
    userInfo: {
      flex: 1,
    },
    userName: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },
    tagline: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 2,
      fontStyle: 'italic',
    },
    userMeta: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    points: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.primary,
    },
    pointsContainer: {
      alignItems: 'flex-end',
    },
    friendBadge: {
      backgroundColor: colors.accent,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
      marginTop: 4,
    },
    friendBadgeText: {
      color: 'white',
      fontSize: 10,
      fontWeight: '600',
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    emptyIcon: {
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    emptySubtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
    },
  });

  return (
    <SafeAreaView style={dynamicStyles.container}>
      {/* Header */}
      <View style={dynamicStyles.header}>
        <TouchableOpacity
          style={dynamicStyles.backButton}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={dynamicStyles.headerTitle}>Leaderboard</Text>
      </View>

      {/* Tabs */}
      <View style={dynamicStyles.tabs}>
        <TouchableOpacity
          style={[dynamicStyles.tab, activeTab === 'global' && dynamicStyles.activeTab]}
          onPress={() => setActiveTab('global')}
        >
          <Text style={[dynamicStyles.tabText, activeTab === 'global' && dynamicStyles.activeTabText]}>
            Global
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[dynamicStyles.tab, activeTab === 'friends' && dynamicStyles.activeTab]}
          onPress={() => setActiveTab('friends')}
        >
          <Text style={[dynamicStyles.tabText, activeTab === 'friends' && dynamicStyles.activeTabText]}>
            Friends
          </Text>
        </TouchableOpacity>
      </View>

      {/* User Rank */}
      {currentUserRank > 0 && (
        <View style={dynamicStyles.userRankCard}>
          <Text style={dynamicStyles.userRankTitle}>Your Rank</Text>
          <Text style={dynamicStyles.userRankText}>
            #{currentUserRank} {activeTab === 'global' ? 'globally' : 'among friends'}
          </Text>
        </View>
      )}

      {/* Leaderboard */}
      {loading ? (
        <View style={dynamicStyles.emptyState}>
          <Text style={dynamicStyles.emptyTitle}>Loading...</Text>
        </View>
      ) : currentLeaderboard.length === 0 ? (
        <View style={dynamicStyles.emptyState}>
          <Feather name="users" size={48} color={colors.textSecondary} style={dynamicStyles.emptyIcon} />
          <Text style={dynamicStyles.emptyTitle}>
            {activeTab === 'global' ? 'No Rankings Available' : 'No Friends Yet'}
          </Text>
          <Text style={dynamicStyles.emptySubtitle}>
            {activeTab === 'global'
              ? 'Leaderboard data is currently unavailable.'
              : 'Add some friends to see how you rank among them!'
            }
          </Text>
        </View>
      ) : (
        <ScrollView
          style={dynamicStyles.leaderboard}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {currentLeaderboard.map((entry, index) => {
            const isCurrentUser = entry.user_id === user?.id;
            const isFriend = entry.is_friend && activeTab === 'global';

            return (
              <TouchableOpacity
                key={entry.user_id}
                style={[
                  dynamicStyles.leaderboardItem,
                  isCurrentUser && dynamicStyles.currentUserItem
                ]}
                onPress={() => handleUserPress(entry.user_id)}
                disabled={isCurrentUser} // Don't allow tapping own entry
                activeOpacity={isCurrentUser ? 1 : 0.7}
              >
                <Text style={[
                  dynamicStyles.rank,
                  isCurrentUser && dynamicStyles.currentUserRank
                ]}>
                  #{entry.rank || index + 1} {/* Added # prefix for consistency */}
                </Text>
                <Image
                  source={
                    (entry.avatar_url && entry.avatar_url.trim() && entry.avatar_url !== 'null' && entry.avatar_url !== 'undefined')
                      ? { uri: profileImageService.getProfileImageUrl(entry.avatar_url) }
                      : require('../../assets/profileIconDefault.png')
                  }
                  style={dynamicStyles.avatar}
                  defaultSource={require('../../assets/profileIconDefault.png')}
                />
                <View style={dynamicStyles.userInfo}>
                  <Text style={dynamicStyles.userName}>
                    {entry.full_name}
                  </Text>
                  {/* Display tagline if available */}
                  {entry.tagline && (
                    <Text style={dynamicStyles.tagline} numberOfLines={2} ellipsizeMode="tail">
                      {entry.tagline}
                    </Text>
                  )}
                </View>
                <View style={dynamicStyles.pointsContainer}>
                  <Text style={dynamicStyles.points}>
                    {entry.total_voltz_earned}⚡
                  </Text>
                  {isFriend && !isCurrentUser && (
                    <View style={dynamicStyles.friendBadge}>
                      <Text style={dynamicStyles.friendBadgeText}>Friend</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* User Detail Modal */}
      {selectedUserId && (
        <UserDetailModal
          visible={showUserModal}
          onClose={handleCloseUserModal}
          userId={selectedUserId}
          currentUserId={user?.id}
        />
      )}
    </SafeAreaView>
  );
}