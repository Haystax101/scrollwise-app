import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FriendsService } from '../lib/friendsService';
import { ShareService } from '../lib/shareService';
import type { FriendsListItem, FriendSearchFilters } from '../types/friends';

export default function FriendsPage() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();

  const [friends, setFriends] = useState<FriendsListItem[]>([]);
  const [filteredFriends, setFilteredFriends] = useState<FriendsListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'recent' | 'mutual_friends'>('recent');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadFriends();
    }
  }, [user, sortBy]);

  useEffect(() => {
    filterFriends();
  }, [friends, searchQuery]);

  const loadFriends = async () => {
    try {
      setLoading(true);
      const filters: FriendSearchFilters = {
        sort_by: sortBy,
        sort_order: sortBy === 'name' ? 'asc' : 'desc'
      };
      const friendsData = await FriendsService.getFriends(undefined, filters);
      setFriends(friendsData);
    } catch (error) {
      console.error('Error loading friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterFriends = () => {
    if (!searchQuery.trim()) {
      setFilteredFriends(friends);
      return;
    }

    const filtered = friends.filter(friendItem =>
      friendItem.friend.full_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredFriends(filtered);
  };

  const handleRemoveFriend = async (friendshipId: string, friendName: string) => {
    Alert.alert(
      'Remove Friend',
      `Are you sure you want to remove ${friendName} from your friends?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await FriendsService.removeFriend(friendshipId);
              await loadFriends();
              Alert.alert('Success', `${friendName} has been removed from your friends.`);
            } catch (error) {
              Alert.alert('Error', 'Failed to remove friend');
            }
          }
        }
      ]
    );
  };

  const handleInvite = async () => {
    try {
      await ShareService.shareAppInvitation();
    } catch (error) {
      Alert.alert('Error', 'Failed to share invitation');
    }
  };

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
    controls: {
      padding: 16,
      gap: 12,
    },
    searchContainer: {
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
    sortContainer: {
      flexDirection: 'row',
      gap: 8,
    },
    sortButton: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
    },
    activeSortButton: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    sortButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
    },
    activeSortButtonText: {
      color: 'white',
    },
    friendsCount: {
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
    friendsCountText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    friendsList: {
      flex: 1,
      paddingHorizontal: 16,
    },
    friendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      backgroundColor: colors.background,
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.border,
      marginRight: 16,
    },
    friendInfo: {
      flex: 1,
    },
    friendName: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    friendMeta: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    connectionStrength: {
      fontSize: 12,
      color: colors.accent,
      fontWeight: '500',
    },
    actionsContainer: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.border + '20',
      justifyContent: 'center',
      alignItems: 'center',
    },
    removeButton: {
      backgroundColor: colors.error + '20',
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
      marginBottom: 24,
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

  const sortOptions = [
    { key: 'recent', label: 'Recent' },
    { key: 'name', label: 'Name' },
    { key: 'mutual_friends', label: 'Mutual' }
  ];

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
        <Text style={dynamicStyles.headerTitle}>Your Team</Text>
      </View>

      {/* Controls */}
      <View style={dynamicStyles.controls}>
        {/* Search */}
        <View style={dynamicStyles.searchContainer}>
          <Feather name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={dynamicStyles.searchInput}
            placeholder="Search friends..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="words"
            autoCorrect={false}
          />
          {searchQuery.length > 0 ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Feather name="x" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Sort */}
        <View style={dynamicStyles.sortContainer}>
          {sortOptions.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                dynamicStyles.sortButton,
                sortBy === option.key ? dynamicStyles.activeSortButton : null
              ]}
              onPress={() => setSortBy(option.key as any)}
            >
              <Text style={[
                dynamicStyles.sortButtonText,
                sortBy === option.key ? dynamicStyles.activeSortButtonText : null
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Friends Count */}
      <View style={dynamicStyles.friendsCount}>
        <Text style={dynamicStyles.friendsCountText}>
          {filteredFriends.length} friend{filteredFriends.length !== 1 ? 's' : ''}
          {searchQuery ? <Text> found for "{searchQuery}"</Text> : null}
        </Text>
      </View>

      {/* Friends List */}
      {loading ? (
        <View style={dynamicStyles.emptyState}>
          <Text style={dynamicStyles.emptyTitle}>Loading...</Text>
        </View>
      ) : filteredFriends.length === 0 ? (
        <View style={dynamicStyles.emptyState}>
          <Feather
            name={searchQuery ? "search" : "users"}
            size={48}
            color={colors.textSecondary}
            style={dynamicStyles.emptyIcon}
          />
          <Text style={dynamicStyles.emptyTitle}>
            {searchQuery ? 'No Friends Found' : 'No Friends Yet'}
          </Text>
          <Text style={dynamicStyles.emptySubtitle}>
            {searchQuery
              ? `No friends found matching "${searchQuery}". Try a different search term.`
              : 'Start building your professional network by adding friends!'
            }
          </Text>
          {!searchQuery ? (
            <TouchableOpacity
              style={dynamicStyles.inviteButton}
              onPress={handleInvite}
            >
              <Text style={dynamicStyles.inviteButtonText}>Invite Friends</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : (
        <ScrollView
          style={dynamicStyles.friendsList}
          showsVerticalScrollIndicator={false}
        >
          {filteredFriends.map((friendItem) => (
            <View key={friendItem.id} style={dynamicStyles.friendItem}>
              <View style={dynamicStyles.avatar} />
              <View style={dynamicStyles.friendInfo}>
                <Text style={dynamicStyles.friendName}>
                  {friendItem.friend.full_name}
                </Text>
                <Text style={dynamicStyles.friendMeta}>
                  {friendItem.friend.friends_count || 0} friends
                  {friendItem.mutual_friends_count > 0 ? (
                    <Text> • {friendItem.mutual_friends_count} mutual</Text>
                  ) : null}
                </Text>
                {friendItem.connection_strength ? (
                  <Text style={dynamicStyles.connectionStrength}>
                    Connection: {Math.round(friendItem.connection_strength * 100)}% strength
                  </Text>
                ) : null}
              </View>
              <View style={dynamicStyles.actionsContainer}>
                <TouchableOpacity
                  style={[dynamicStyles.actionButton, dynamicStyles.removeButton]}
                  onPress={() => handleRemoveFriend(friendItem.friendship_id, friendItem.friend.full_name)}
                >
                  <Feather name="user-minus" size={18} color={colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}