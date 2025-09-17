import React, { useState, useEffect } from 'react';
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
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FriendsService } from '../lib/friendsService';
import { ShareService } from '../lib/shareService';
import type { FriendProfile, LeaderboardEntry, FriendSuggestion, FriendsListItem } from '../types/friends';

export default function PeoplePage() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FriendProfile[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [suggestions, setSuggestions] = useState<FriendSuggestion[]>([]);
  const [friends, setFriends] = useState<FriendsListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestsCount, setRequestsCount] = useState(0);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load leaderboard data
      const leaderboardData = await FriendsService.getFriendsLeaderboard();
      setLeaderboard(leaderboardData.global_with_friends_highlighted.slice(0, 3));

      // Load friend suggestions (show 3 by default)
      console.log('🎯 People page: Loading friend suggestions...');
      const suggestionsData = await FriendsService.getFriendSuggestions(3);
      console.log('🎯 People page: Received suggestions:', suggestionsData.length);
      console.log('🎯 People page: First suggestion:', suggestionsData[0]);
      setSuggestions(suggestionsData);

      // Load friends
      const friendsData = await FriendsService.getFriends();
      setFriends(friendsData.slice(0, 6));

      // Load friend requests count
      const requests = await FriendsService.getFriendRequests();
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

  const handleSendFriendRequest = async (userId: string) => {
    try {
      await FriendsService.sendFriendRequest(userId);
      Alert.alert('Success', 'Friend request sent!');

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

  return (
    <SafeAreaView style={dynamicStyles.container}>
      {/* Header */}
      <View style={dynamicStyles.header}>
        <Text style={dynamicStyles.headerTitle}>People</Text>
        <View style={dynamicStyles.headerButtons}>
          <TouchableOpacity
            style={dynamicStyles.iconButton}
            onPress={() => router.push('/friend-requests')}
          >
            <Feather name="user-plus" size={20} color={colors.text} />
            {requestsCount > 0 && (
              <View style={dynamicStyles.badge}>
                <Text style={dynamicStyles.badgeText}>{requestsCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
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
              {searchResults.map((person) => (
                <View key={person.id} style={dynamicStyles.searchResult}>
                  <View style={dynamicStyles.avatar} />
                  <View style={dynamicStyles.resultInfo}>
                    <Text style={dynamicStyles.resultName}>{person.full_name}</Text>
                    <Text style={dynamicStyles.resultMeta}>{person.friends_count} friends</Text>
                  </View>
                  <TouchableOpacity
                    style={dynamicStyles.addButton}
                    onPress={() => handleSendFriendRequest(person.id)}
                  >
                    <Text style={dynamicStyles.addButtonText}>Add</Text>
                  </TouchableOpacity>
                </View>
              ))}
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
            {leaderboard.map((entry, index) => {
              const isCurrentUser = entry.user_id === user?.id;
              return (
                <View
                  key={entry.user_id}
                  style={[
                    dynamicStyles.leaderboardItem,
                    isCurrentUser && dynamicStyles.currentUserItem
                  ]}
                >
                  <Text style={[
                    dynamicStyles.rank,
                    isCurrentUser && dynamicStyles.currentUserRank
                  ]}>
                    {index + 1}
                  </Text>
                  <View style={dynamicStyles.leaderboardAvatar} />
                  <View style={dynamicStyles.leaderboardInfo}>
                    <Text style={[
                      dynamicStyles.leaderboardName,
                      isCurrentUser && dynamicStyles.currentUserName
                    ]}>
                      {entry.full_name}{isCurrentUser ? ' (you)' : ''}
                    </Text>
                  </View>
                  <Text style={[
                    dynamicStyles.points,
                    isCurrentUser && dynamicStyles.currentUserPoints
                  ]}>
                    {entry.total_voltz_earned}⚡
                  </Text>
                </View>
              );
            })}
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
            {suggestions.map((suggestion) => (
              <View key={suggestion.id} style={dynamicStyles.suggestionCard}>
                <Image
                  source={suggestion.avatar_url ? { uri: suggestion.avatar_url } : require('../assets/profileIconDefault.png')}
                  style={dynamicStyles.suggestionAvatar}
                />
                <Text style={dynamicStyles.suggestionName} numberOfLines={1}>
                  {suggestion.full_name}
                </Text>
                <Text style={dynamicStyles.suggestionReason} numberOfLines={2}>
                  {suggestion.suggestion_reasons?.[0] || 'Suggested for you'}
                </Text>
                <TouchableOpacity
                  style={dynamicStyles.suggestionButton}
                  onPress={() => handleSendFriendRequest(suggestion.suggested_user_id)}
                >
                  <Text style={dynamicStyles.suggestionButtonText}>Add</Text>
                </TouchableOpacity>
              </View>
            ))}
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
              friends.map((friendItem) => (
                <View key={friendItem.id} style={dynamicStyles.friendCard}>
                  <View style={dynamicStyles.friendAvatar} />
                  <Text style={dynamicStyles.friendName} numberOfLines={1}>
                    {friendItem.friend.full_name}
                  </Text>
                </View>
              ))
            ) : (
              <View style={dynamicStyles.emptyState}>
                <Text style={dynamicStyles.emptyStateTitle}>No team members yet</Text>
                <Text style={dynamicStyles.emptyStateSubtitle}>
                  Invite friends to join your team and start learning together!
                </Text>
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
    </SafeAreaView>
  );
}