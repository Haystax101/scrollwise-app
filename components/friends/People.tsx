import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Alert,
  Image
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { FriendsService } from '../../lib/friendsService';
import { ShareService } from '../../lib/shareService';
import { UserDetailModal } from '../profile/UserDetailModal';
import { profileImageService } from '../../services/profileImageService';
import { FeedbackBoardModal } from '../feedback/FeedbackBoardModal';
import { NotificationService } from '../../lib/notificationService';
import type { FriendProfile, LeaderboardEntry, FriendSuggestion, FriendsListItem } from '../../types/friends';

export function People() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FriendProfile[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [suggestions, setSuggestions] = useState<FriendSuggestion[]>([]);
  const [friends, setFriends] = useState<FriendsListItem[]>([]);
  const [, setLoading] = useState(true);
  const [requestsCount, setRequestsCount] = useState(0);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [addedUsers, setAddedUsers] = useState<Set<string>>(new Set());
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  // Subscribe to notification updates
  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = NotificationService.subscribeToNotifications(
      user.id,
      (count) => setUnreadNotifications(count)
    );

    return () => {
      unsubscribe();
    };
  }, [user?.id]);

  const loadData = async () => {
    try {
      // console.log('🔍 PEOPLE: Starting loadData...');
      setLoading(true);

      // Load leaderboard data
      // console.log('🔍 PEOPLE: Loading leaderboard...');
      const leaderboardData = await FriendsService.getFriendsLeaderboard();
      // console.log('🔍 PEOPLE: Leaderboard data:', leaderboardData.global_with_friends_highlighted.slice(0, 3));
      setLeaderboard(leaderboardData.global_with_friends_highlighted.slice(0, 3));

      // Load friend suggestions (show 6 by default - updated from 3)
      // console.log('🔍 PEOPLE: Loading friend suggestions...');
      const suggestionsData = await FriendsService.getFriendSuggestions(6);
      // console.log('🔍 PEOPLE: Suggestions data:', suggestionsData);
      setSuggestions(suggestionsData);

      // Load friends
      // console.log('🔍 PEOPLE: Loading friends...');
      const friendsData = await FriendsService.getFriends();
      // console.log('🔍 PEOPLE: Friends data:', friendsData.slice(0, 6));
      setFriends(friendsData.slice(0, 6));

      // Load friend requests count
      // console.log('🔍 PEOPLE: Loading friend requests...');
      const requests = await FriendsService.getFriendRequests();
      // console.log('🔍 PEOPLE: Requests count:', requests.incoming.length);
      setRequestsCount(requests.incoming.length);

    } catch (error) {
      console.error('🚨 People page error loading data:', error);
      if (error instanceof Error) {
        console.error('🚨 Error details:', error.message, error.stack);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      try {
        const results = await FriendsService.searchUsers(query, 10);
        setSearchResults(results);
      } catch (error) {
        console.error('Error searching users:', error);
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleInvite = async () => {
    try {
      await ShareService.shareAppInvitation();
    } catch (error) {
      Alert.alert('Error', 'Failed to share invitation');
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

  const handleSendFriendRequest = async (userId: string) => {
    try {
      await FriendsService.sendFriendRequest(userId);
      Alert.alert('Success', 'Friend request sent!');

      // Add to added users set
      setAddedUsers(prev => new Set(prev).add(userId));

      // Remove the suggestion from the list immediately
      setSuggestions(prev => prev.filter(suggestion => suggestion.suggested_user_id !== userId));
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to send request');
    }
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
    },
    headerButtons: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    feedbackButton: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    feedbackButtonText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    iconButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.border + '20',
      justifyContent: 'center',
      alignItems: 'center',
    },
    badge: {
      position: 'absolute',
      top: -2,
      right: -2,
      backgroundColor: colors.primary,
      borderRadius: 8,
      minWidth: 16,
      height: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
    badgeText: {
      color: 'white',
      fontSize: 10,
      fontWeight: '600',
    },
    searchContainer: {
      margin: 16,
      marginBottom: 24,
    },
    searchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.border + '20',
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 12,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: colors.text,
    },
    searchResults: {
      marginTop: 12,
    },
    searchResult: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      backgroundColor: colors.background,
      borderRadius: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.border,
      marginRight: 12,
    },
    resultInfo: {
      flex: 1,
    },
    resultName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    resultMeta: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    addButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
    },
    addButtonText: {
      color: 'white',
      fontSize: 14,
      fontWeight: '600',
    },
    addButtonAdded: {
      backgroundColor: colors.border,
    },
    addButtonAddedText: {
      color: colors.textSecondary,
    },
    section: {
      marginBottom: 32,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
    },
    seeAllButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    seeAllText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },
    leaderboardCompact: {
      paddingHorizontal: 16,
    },
    leaderboardItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: colors.background,
      borderRadius: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    rank: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textSecondary,
      width: 30,
    },
    leaderboardAvatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.border,
      marginRight: 12,
    },
    leaderboardInfo: {
      flex: 1,
    },
    leaderboardName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    points: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.primary,
    },
    currentUserItem: {
      backgroundColor: colors.primary + '10',
      borderWidth: 1,
      borderColor: colors.primary + '30',
    },
    currentUserRank: {
      color: colors.primary,
      fontWeight: '700',
    },
    currentUserName: {
      color: colors.primary,
      fontWeight: '700',
    },
    currentUserPoints: {
      color: colors.primary,
      fontWeight: '700',
    },
    suggestionsScroll: {
      paddingLeft: 16,
    },
    suggestionCard: {
      width: 120,
      marginRight: 12,
      alignItems: 'center',
      padding: 12,
      backgroundColor: colors.background,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    suggestionAvatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.border,
      marginBottom: 8,
      alignSelf: 'center',
    },
    suggestionName: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 6,
    },
    suggestionReason: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 8,
    },
    suggestionButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    suggestionButtonText: {
      color: 'white',
      fontSize: 12,
      fontWeight: '600',
    },
    suggestionButtonAdded: {
      backgroundColor: colors.border,
    },
    suggestionButtonAddedText: {
      color: colors.textSecondary,
    },
    friendsGrid: {
      paddingHorizontal: 16,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    friendCard: {
      width: '48%',
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      backgroundColor: colors.background,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    friendAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.border,
      marginRight: 8,
    },
    friendName: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
    },
    emptyState: {
      width: '100%',
      alignItems: 'center',
      paddingVertical: 40,
      paddingHorizontal: 20,
    },
    emptyStateTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    emptyStateSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 20,
      textAlign: 'center',
    },
    inviteButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 12,
    },
    inviteButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
  });

  // Temporarily remove console.log to test
  // console.log('🔍 PEOPLE RENDER: Starting render with:', {
  //   searchResults: searchResults.length,
  //   leaderboard: leaderboard.length,
  //   suggestions: suggestions.length,
  //   friends: friends.length,
  //   requestsCount
  // });

  const renderLeaderboard = () => {
    return leaderboard.map((entry, index) => {
      // console.log('🔍 PEOPLE RENDER: Leaderboard entry:', entry);
      const isCurrentUser = entry.user_id === user?.id;
      // console.log('🏆 Leaderboard entry:', {
      //   user_id: entry.user_id,
      //   full_name: entry.full_name,
      //   avatar_url: entry.avatar_url,
      //   avatar_url_type: typeof entry.avatar_url,
      //   avatar_url_length: entry.avatar_url?.length,
      //   isCurrentUser,
      //   shouldUseDefault: !(entry.avatar_url && entry.avatar_url.trim() && entry.avatar_url !== 'null' && entry.avatar_url !== 'undefined')
      // });
      return (
        <TouchableOpacity
          key={entry.user_id}
          style={[
            dynamicStyles.leaderboardItem,
            isCurrentUser && dynamicStyles.currentUserItem
          ]}
          onPress={() => handleUserPress(entry.user_id)}
          disabled={isCurrentUser}
          activeOpacity={isCurrentUser ? 1 : 0.7}
        >
          <Text style={[
            dynamicStyles.rank,
            isCurrentUser && dynamicStyles.currentUserRank
          ]}>
            #{index + 1}
          </Text>
          <Image
            source={
              (entry.avatar_url && entry.avatar_url.trim() && entry.avatar_url !== 'null' && entry.avatar_url !== 'undefined')
                ? { uri: profileImageService.getProfileImageUrl(entry.avatar_url) }
                : require('../../assets/profileIconDefault.png')
            }
            style={dynamicStyles.leaderboardAvatar}
            defaultSource={require('../../assets/profileIconDefault.png')}
            onError={() => console.log('🖼️ Avatar failed to load for:', entry.full_name)}
          />
          <View style={dynamicStyles.leaderboardInfo}>
            <Text style={[
              dynamicStyles.leaderboardName,
              isCurrentUser && dynamicStyles.currentUserName
            ]}>
              {`${entry.full_name || 'Unknown'}${isCurrentUser ? ' (you)' : ''}`}
            </Text>
          </View>
          <Text style={[
            dynamicStyles.points,
            isCurrentUser && dynamicStyles.currentUserPoints
          ]}>
            {entry.total_voltz_earned || 0}⚡
          </Text>
        </TouchableOpacity>
      );
    });
  };

  const renderSuggestions = () => {
    return suggestions.map((suggestion) => {
      // console.log('🔍 PEOPLE RENDER: Suggestion:', suggestion);
      const hasBeenAdded = addedUsers.has(suggestion.suggested_user_id);
      return (
        <View key={suggestion.id} style={dynamicStyles.suggestionCard}>
          <TouchableOpacity
            onPress={() => handleUserPress(suggestion.suggested_user_id)}
            activeOpacity={0.7}
          >
            <Image
              source={
                suggestion.avatar_url
                  ? { uri: profileImageService.getProfileImageUrl(suggestion.avatar_url) }
                  : require('../../assets/profileIconDefault.png')
              }
              style={dynamicStyles.suggestionAvatar}
            />
            <Text style={dynamicStyles.suggestionName} numberOfLines={1}>
              {suggestion.full_name || 'Unknown'}
            </Text>
            <Text style={dynamicStyles.suggestionReason} numberOfLines={2}>
              {suggestion.suggestion_reasons?.[0] || 'Suggested for you'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              dynamicStyles.suggestionButton,
              hasBeenAdded && dynamicStyles.suggestionButtonAdded
            ]}
            onPress={() => handleSendFriendRequest(suggestion.suggested_user_id)}
            disabled={hasBeenAdded}
          >
            <Text style={[
              dynamicStyles.suggestionButtonText,
              hasBeenAdded && dynamicStyles.suggestionButtonAddedText
            ]}>
              {hasBeenAdded ? 'Added' : 'Add'}
            </Text>
          </TouchableOpacity>
        </View>
      );
    });
  };

  const renderFriends = () => {
    return friends.map((friendItem) => {
      // console.log('🔍 PEOPLE RENDER: Friend item:', friendItem);
      return (
        <TouchableOpacity
          key={friendItem.id}
          style={dynamicStyles.friendCard}
          onPress={() => handleUserPress(friendItem.friend.id)}
          activeOpacity={0.7}
        >
          <Image
            source={
              friendItem.friend.avatar_url
                ? { uri: profileImageService.getProfileImageUrl(friendItem.friend.avatar_url) }
                : require('../../assets/profileIconDefault.png')
            }
            style={dynamicStyles.friendAvatar}
          />
          <Text style={dynamicStyles.friendName} numberOfLines={1}>
            {friendItem.friend.full_name || 'Unknown'}
          </Text>
        </TouchableOpacity>
      );
    });
  };

  return (
    <SafeAreaView style={dynamicStyles.container}>
      {/* Header */}
      <View style={dynamicStyles.header}>
        <Text style={dynamicStyles.headerTitle}>People</Text>
        <View style={dynamicStyles.headerButtons}>
          <TouchableOpacity
            style={[dynamicStyles.feedbackButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowFeedbackModal(true)}
          >
            <Text style={dynamicStyles.feedbackButtonText}>FEEDBACK</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={dynamicStyles.iconButton}
            onPress={() => router.push('/inbox')}
          >
            <Feather name="mail" size={20} color={colors.text} />
            {unreadNotifications > 0 && (
              <View style={dynamicStyles.badge}>
                <Text style={dynamicStyles.badgeText}>
                  {unreadNotifications > 99 ? '99+' : unreadNotifications}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Search */}
        <View style={dynamicStyles.searchContainer}>
          <View style={dynamicStyles.searchBox}>
            <Feather name="search" size={20} color={colors.textSecondary} />
            <TextInput
              style={dynamicStyles.searchInput}
              placeholder="Search for people"
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={handleSearch}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>

          {searchResults.length > 0 && (
            <View style={dynamicStyles.searchResults}>
              {searchResults.map((person) => {
                const hasBeenAdded = addedUsers.has(person.id);
                return (
                  <View key={person.id} style={dynamicStyles.searchResult}>
                    <TouchableOpacity
                      onPress={() => handleUserPress(person.id)}
                      activeOpacity={0.7}
                      style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
                    >
                      <Image
                        source={
                          person.avatar_url
                            ? { uri: profileImageService.getProfileImageUrl(person.avatar_url) }
                            : require('../../assets/profileIconDefault.png')
                        }
                        style={dynamicStyles.avatar}
                      />
                      <View style={dynamicStyles.resultInfo}>
                        <Text style={dynamicStyles.resultName}>
                          {person.full_name || 'Unknown'}
                        </Text>
                        <Text style={dynamicStyles.resultMeta}>
                          {person.friends_count || 0} friends
                        </Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        dynamicStyles.addButton,
                        hasBeenAdded && dynamicStyles.addButtonAdded
                      ]}
                      onPress={() => handleSendFriendRequest(person.id)}
                      disabled={hasBeenAdded}
                    >
                      <Text style={[
                        dynamicStyles.addButtonText,
                        hasBeenAdded && dynamicStyles.addButtonAddedText
                      ]}>
                        {hasBeenAdded ? 'Added' : 'Add'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Leaderboard */}
        <View style={dynamicStyles.section}>
          <View style={dynamicStyles.sectionHeader}>
            <Text style={dynamicStyles.sectionTitle}>Leaderboard</Text>
            <TouchableOpacity
              style={dynamicStyles.seeAllButton}
              onPress={() => router.push('/leaderboard')}
            >
              <Text style={dynamicStyles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>
          <View style={dynamicStyles.leaderboardCompact}>
            {leaderboard.length > 0 ? (
              renderLeaderboard()
            ) : (
              <View style={dynamicStyles.emptyState}>
                <Text style={dynamicStyles.emptyStateTitle}>No leaderboard data</Text>
                <Text style={dynamicStyles.emptyStateSubtitle}>Check back later for updates</Text>
              </View>
            )}
          </View>
        </View>

        {/* People Like You */}
        <View style={dynamicStyles.section}>
          <View style={dynamicStyles.sectionHeader}>
            <Text style={dynamicStyles.sectionTitle}>People Like You</Text>
            <TouchableOpacity
              style={dynamicStyles.seeAllButton}
              onPress={() => router.push('/suggestions')}
            >
              <Text style={dynamicStyles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={dynamicStyles.suggestionsScroll}
          >
            {suggestions.length > 0 ? (
              renderSuggestions()
            ) : (
              <View style={dynamicStyles.emptyState}>
                <Text style={dynamicStyles.emptyStateTitle}>No suggestions available</Text>
                <Text style={dynamicStyles.emptyStateSubtitle}>We'll suggest people based on your activity</Text>
              </View>
            )}
          </ScrollView>
        </View>

        {/* Your Team */}
        <View style={dynamicStyles.section}>
          <View style={dynamicStyles.sectionHeader}>
            <Text style={dynamicStyles.sectionTitle}>Your Team</Text>
            <TouchableOpacity
              style={dynamicStyles.seeAllButton}
              onPress={() => router.push('/friends')}
            >
              <Text style={dynamicStyles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>
          <View style={dynamicStyles.friendsGrid}>
            {friends.length > 0 ? (
              renderFriends()
            ) : (
              <View style={dynamicStyles.emptyState}>
                <Text style={dynamicStyles.emptyStateTitle}>No friends yet</Text>
                <Text style={dynamicStyles.emptyStateSubtitle}>Start connecting with people you know!</Text>
                <TouchableOpacity
                  style={dynamicStyles.inviteButton}
                  onPress={handleInvite}
                >
                  <Text style={dynamicStyles.inviteButtonText}>Invite Friends</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* User Detail Modal */}
      {selectedUserId && (
        <UserDetailModal
          visible={showUserModal}
          onClose={handleCloseUserModal}
          userId={selectedUserId}
          currentUserId={user?.id}
        />
      )}

      {/* Feedback Board Modal */}
      <FeedbackBoardModal
        visible={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
      />
    </SafeAreaView>
  );
}