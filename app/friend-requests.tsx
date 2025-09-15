import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FriendsService } from '../lib/friendsService';
import type { FriendRequest } from '../types/friends';

export default function FriendRequestsPage() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing'>('incoming');
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingRequests, setProcessingRequests] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      loadRequests();
    }
  }, [user]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const { incoming, outgoing } = await FriendsService.getFriendRequests();
      setIncomingRequests(incoming);
      setOutgoingRequests(outgoing);
    } catch (error) {
      console.error('Error loading friend requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId: string, requesterName: string) => {
    setProcessingRequests(prev => new Set(prev).add(requestId));
    try {
      await FriendsService.acceptFriendRequest(requestId);
      Alert.alert('Success', `You are now friends with ${requesterName}!`);
      await loadRequests();
    } catch (error) {
      Alert.alert('Error', 'Failed to accept friend request');
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const handleDeclineRequest = async (requestId: string, requesterName: string) => {
    Alert.alert(
      'Decline Request',
      `Are you sure you want to decline ${requesterName}'s friend request?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            setProcessingRequests(prev => new Set(prev).add(requestId));
            try {
              await FriendsService.declineFriendRequest(requestId);
              await loadRequests();
            } catch (error) {
              Alert.alert('Error', 'Failed to decline friend request');
            } finally {
              setProcessingRequests(prev => {
                const newSet = new Set(prev);
                newSet.delete(requestId);
                return newSet;
              });
            }
          }
        }
      ]
    );
  };

  const handleCancelRequest = async (requestId: string, addresseeName: string) => {
    Alert.alert(
      'Cancel Request',
      `Are you sure you want to cancel your friend request to ${addresseeName}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setProcessingRequests(prev => new Set(prev).add(requestId));
            try {
              await FriendsService.cancelFriendRequest(requestId);
              await loadRequests();
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel friend request');
            } finally {
              setProcessingRequests(prev => {
                const newSet = new Set(prev);
                newSet.delete(requestId);
                return newSet;
              });
            }
          }
        }
      ]
    );
  };

  const currentRequests = activeTab === 'incoming' ? incomingRequests : outgoingRequests;

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
    tabBadge: {
      position: 'absolute',
      top: 4,
      right: 8,
      backgroundColor: colors.primary,
      borderRadius: 8,
      minWidth: 16,
      height: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
    tabBadgeActive: {
      backgroundColor: 'white',
    },
    tabBadgeText: {
      color: 'white',
      fontSize: 10,
      fontWeight: '600',
    },
    tabBadgeTextActive: {
      color: colors.primary,
    },
    requestsList: {
      flex: 1,
      paddingHorizontal: 16,
    },
    requestItem: {
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
    requestInfo: {
      flex: 1,
    },
    requestName: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    requestMeta: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    requestDate: {
      fontSize: 12,
      color: colors.textSecondary,
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
      minWidth: 70,
      alignItems: 'center',
    },
    acceptButton: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    declineButton: {
      backgroundColor: colors.background,
      borderColor: colors.border,
    },
    cancelButton: {
      backgroundColor: colors.error + '20',
      borderColor: colors.error,
    },
    actionButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    acceptButtonText: {
      color: 'white',
    },
    declineButtonText: {
      color: colors.textSecondary,
    },
    cancelButtonText: {
      color: colors.error,
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

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
        <Text style={dynamicStyles.headerTitle}>Friend Requests</Text>
      </View>

      {/* Tabs */}
      <View style={dynamicStyles.tabs}>
        <TouchableOpacity
          style={[dynamicStyles.tab, activeTab === 'incoming' && dynamicStyles.activeTab]}
          onPress={() => setActiveTab('incoming')}
        >
          <Text style={[dynamicStyles.tabText, activeTab === 'incoming' && dynamicStyles.activeTabText]}>
            Received
          </Text>
          {incomingRequests.length > 0 && (
            <View style={[
              dynamicStyles.tabBadge,
              activeTab === 'incoming' && dynamicStyles.tabBadgeActive
            ]}>
              <Text style={[
                dynamicStyles.tabBadgeText,
                activeTab === 'incoming' && dynamicStyles.tabBadgeTextActive
              ]}>
                {incomingRequests.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[dynamicStyles.tab, activeTab === 'outgoing' && dynamicStyles.activeTab]}
          onPress={() => setActiveTab('outgoing')}
        >
          <Text style={[dynamicStyles.tabText, activeTab === 'outgoing' && dynamicStyles.activeTabText]}>
            Sent
          </Text>
          {outgoingRequests.length > 0 && (
            <View style={[
              dynamicStyles.tabBadge,
              activeTab === 'outgoing' && dynamicStyles.tabBadgeActive
            ]}>
              <Text style={[
                dynamicStyles.tabBadgeText,
                activeTab === 'outgoing' && dynamicStyles.tabBadgeTextActive
              ]}>
                {outgoingRequests.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Requests List */}
      {loading ? (
        <View style={dynamicStyles.emptyState}>
          <Text style={dynamicStyles.emptyTitle}>Loading...</Text>
        </View>
      ) : currentRequests.length === 0 ? (
        <View style={dynamicStyles.emptyState}>
          <Feather
            name="user-plus"
            size={48}
            color={colors.textSecondary}
            style={dynamicStyles.emptyIcon}
          />
          <Text style={dynamicStyles.emptyTitle}>
            {activeTab === 'incoming' ? 'No Received Requests' : 'No Sent Requests'}
          </Text>
          <Text style={dynamicStyles.emptySubtitle}>
            {activeTab === 'incoming'
              ? "You don't have any pending friend requests at the moment."
              : "You haven't sent any friend requests recently."
            }
          </Text>
        </View>
      ) : (
        <ScrollView
          style={dynamicStyles.requestsList}
          showsVerticalScrollIndicator={false}
        >
          {currentRequests.map((request) => {
            const isProcessing = processingRequests.has(request.id);
            const person = activeTab === 'incoming' ? request.requester : request.addressee;

            return (
              <View key={request.id} style={dynamicStyles.requestItem}>
                <View style={dynamicStyles.avatar} />
                <View style={dynamicStyles.requestInfo}>
                  <Text style={dynamicStyles.requestName}>
                    {person.full_name}
                  </Text>
                  <Text style={dynamicStyles.requestMeta}>
                    {person.friends_count || 0} friends
                    {request.mutual_friends_count > 0 &&
                      ` • ${request.mutual_friends_count} mutual`
                    }
                  </Text>
                  <Text style={dynamicStyles.requestDate}>
                    {formatDate(request.created_at)}
                  </Text>
                </View>
                <View style={dynamicStyles.actionsContainer}>
                  {activeTab === 'incoming' ? (
                    <>
                      <TouchableOpacity
                        style={[dynamicStyles.actionButton, dynamicStyles.acceptButton]}
                        onPress={() => handleAcceptRequest(request.id, person.full_name)}
                        disabled={isProcessing}
                      >
                        <Text style={[dynamicStyles.actionButtonText, dynamicStyles.acceptButtonText]}>
                          {isProcessing ? 'Accepting...' : 'Accept'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[dynamicStyles.actionButton, dynamicStyles.declineButton]}
                        onPress={() => handleDeclineRequest(request.id, person.full_name)}
                        disabled={isProcessing}
                      >
                        <Text style={[dynamicStyles.actionButtonText, dynamicStyles.declineButtonText]}>
                          Decline
                        </Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity
                      style={[dynamicStyles.actionButton, dynamicStyles.cancelButton]}
                      onPress={() => handleCancelRequest(request.id, person.full_name)}
                      disabled={isProcessing}
                    >
                      <Text style={[dynamicStyles.actionButtonText, dynamicStyles.cancelButtonText]}>
                        {isProcessing ? 'Canceling...' : 'Cancel'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}