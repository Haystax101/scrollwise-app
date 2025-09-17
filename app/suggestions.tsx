import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Image
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FriendsService } from '../lib/friendsService';
import type { FriendSuggestion } from '../types/friends';

export default function SuggestionsPage() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();

  const [suggestions, setSuggestions] = useState<FriendSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingUsers, setProcessingUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      loadSuggestions();
    }
  }, [user]);

  const loadSuggestions = async () => {
    try {
      setLoading(true);
      console.log('📄 Suggestions page: Loading suggestions...');
      const suggestionsData = await FriendsService.getFriendSuggestions(20);
      console.log('📄 Suggestions page: Received suggestions:', suggestionsData.length);
      console.log('📄 Suggestions page: First suggestion:', suggestionsData[0]);
      console.log('📄 Suggestions page: All suggestion user IDs:', suggestionsData.map(s => s.suggested_user_id));
      setSuggestions(suggestionsData);
    } catch (error) {
      console.error('Error loading suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendFriendRequest = async (userId: string, userName: string) => {
    setProcessingUsers(prev => new Set(prev).add(userId));
    try {
      console.log('📄 Suggestions: Sending friend request to user:', userId);
      await FriendsService.sendFriendRequest(userId);
      console.log('📄 Suggestions: Friend request sent successfully');
      Alert.alert('Success', `Friend request sent to ${userName}!`);

      // Remove from current suggestions immediately
      setSuggestions(prev => prev.filter(s => s.suggested_user_id !== userId));

      // Reload suggestions to ensure database-level filtering works
      console.log('📄 Suggestions: Reloading suggestions to ensure filtering works');
      setTimeout(() => {
        loadSuggestions();
      }, 1000); // Small delay to ensure database update is complete

    } catch (error) {
      console.error('📄 Suggestions: Error sending friend request:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to send request');
    } finally {
      setProcessingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const handleDismissSuggestion = async (suggestionId: string) => {
    try {
      await FriendsService.dismissFriendSuggestion(suggestionId);
      setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
    } catch (error) {
      Alert.alert('Error', 'Failed to dismiss suggestion');
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
    subtitle: {
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    subtitleText: {
      fontSize: 16,
      color: colors.textSecondary,
      lineHeight: 22,
    },
    suggestionsList: {
      flex: 1,
      paddingHorizontal: 16,
      paddingBottom: 100, // Extra margin for navbar
    },
    suggestionCard: {
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
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.border,
      marginRight: 16,
    },
    suggestionInfo: {
      flex: 1,
    },
    suggestionName: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    suggestionScore: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    reasonsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4,
    },
    reasonChip: {
      backgroundColor: colors.primary + '20',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
    },
    reasonText: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: '500',
    },
    actionsContainer: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
      minWidth: 60,
      alignItems: 'center',
    },
    addButton: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    dismissButton: {
      backgroundColor: colors.background,
      borderColor: colors.border,
    },
    actionButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    addButtonText: {
      color: 'white',
    },
    dismissButtonText: {
      color: colors.textSecondary,
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
    refreshButton: {
      marginTop: 16,
      backgroundColor: colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 8,
    },
    refreshButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
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
        <Text style={dynamicStyles.headerTitle}>People Like You</Text>
      </View>

      {/* Subtitle */}
      <View style={dynamicStyles.subtitle}>
        <Text style={dynamicStyles.subtitleText}>
          Discover professionals who share your interests and industry background.
        </Text>
      </View>

      {/* Suggestions */}
      {loading ? (
        <View style={dynamicStyles.emptyState}>
          <Text style={dynamicStyles.emptyTitle}>Loading suggestions...</Text>
        </View>
      ) : suggestions.length === 0 ? (
        <View style={dynamicStyles.emptyState}>
          <Feather
            name="user-plus"
            size={48}
            color={colors.textSecondary}
            style={dynamicStyles.emptyIcon}
          />
          <Text style={dynamicStyles.emptyTitle}>No Suggestions Available</Text>
          <Text style={dynamicStyles.emptySubtitle}>
            We couldn't find any new people to suggest at the moment.
            Check back later or try connecting with colleagues in your industry.
          </Text>
          <TouchableOpacity
            style={dynamicStyles.refreshButton}
            onPress={loadSuggestions}
          >
            <Text style={dynamicStyles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={dynamicStyles.suggestionsList}
          showsVerticalScrollIndicator={false}
        >
          {suggestions.map((suggestion) => {
            const isProcessing = processingUsers.has(suggestion.suggested_user_id);

            return (
              <View key={suggestion.id} style={dynamicStyles.suggestionCard}>
                <Image
                  source={suggestion.avatar_url ? { uri: suggestion.avatar_url } : require('../assets/profileIconDefault.png')}
                  style={dynamicStyles.avatar}
                />
                <View style={dynamicStyles.suggestionInfo}>
                  <Text style={dynamicStyles.suggestionName}>
                    {suggestion.full_name}
                  </Text>
                  <Text style={dynamicStyles.suggestionScore}>
                    {suggestion.mutual_friends_count > 0 &&
                      `${suggestion.mutual_friends_count} mutual friend${suggestion.mutual_friends_count > 1 ? 's' : ''}`
                    }
                  </Text>
                  <View style={dynamicStyles.reasonsContainer}>
                    {suggestion.suggestion_reasons?.map((reason, index) => {
                      console.log('📄 Suggestions: Raw reason:', reason);

                      // Ensure we show count format for shared industries
                      let displayReason = reason;

                      // Check if this is an old format with specific industry names
                      if (typeof reason === 'string' && reason.includes(' shared industr')) {
                        // Already in correct format
                        displayReason = reason;
                      } else if (typeof reason === 'string' && (reason.includes('Technology') || reason.includes('Healthcare') || reason.includes(','))) {
                        // Old format with specific industry names - extract count
                        const parts = reason.split(',').map(part => part.trim()).filter(part => part.length > 0);
                        const count = parts.length;
                        displayReason = count === 1 ? '1 shared industry' : `${count} shared industries`;
                        console.log('📄 Suggestions: Converted reason from', reason, 'to', displayReason);
                      }

                      return (
                        <View key={index} style={dynamicStyles.reasonChip}>
                          <Text style={dynamicStyles.reasonText}>{displayReason}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
                <View style={dynamicStyles.actionsContainer}>
                  <TouchableOpacity
                    style={[dynamicStyles.actionButton, dynamicStyles.addButton]}
                    onPress={() => handleSendFriendRequest(suggestion.suggested_user_id, suggestion.full_name)}
                    disabled={isProcessing}
                  >
                    <Text style={[dynamicStyles.actionButtonText, dynamicStyles.addButtonText]}>
                      {isProcessing ? 'Sending...' : 'Add'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[dynamicStyles.actionButton, dynamicStyles.dismissButton]}
                    onPress={() => handleDismissSuggestion(suggestion.id)}
                  >
                    <Text style={[dynamicStyles.actionButtonText, dynamicStyles.dismissButtonText]}>
                      Pass
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}