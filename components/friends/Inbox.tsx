import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Alert,
  RefreshControl,
  LayoutAnimation,
  Platform,
  UIManager
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { FriendsService } from '../../lib/friendsService';
import { NotificationService } from '../../lib/notificationService';
import { UserDetailModal } from '../profile/UserDetailModal';
import { profileImageService } from '../../services/profileImageService';
import type { FriendRequest, Notification } from '../../types/friends';

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

interface NotificationItem {
  id: string;
  type: 'like' | 'comment' | 'friend_request';
  source_user_id: string;
  source_user: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
  message: string;
  is_read: boolean;
  created_at: string;
  content_type?: string;
  content_id?: string;
}

export function Inbox({ showHeader = true }: { showHeader?: boolean }) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();

  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [requestsExpanded, setRequestsExpanded] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load friend requests
      const requests = await FriendsService.getFriendRequests();
      setReceivedRequests(requests.incoming);

      // Load real notifications
      const notificationsData = await NotificationService.getNotifications(user!.id, 50);
      setNotifications(notificationsData as NotificationItem[]);

      // Mark notifications as read implicitly when loading? 
      // User requested "single inbox". Often "Activity" tabs auto-mark read.
      // Let's do it if we are viewing it.
      if (notificationsData && notificationsData.length > 0) {
        NotificationService.markAllAsRead(user!.id).catch(console.error);
      }

    } catch (error) {
      console.error('Error loading inbox data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await FriendsService.acceptFriendRequest(requestId);
      Alert.alert('Success', 'Request accepted!');
      loadData();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to accept request');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await FriendsService.declineFriendRequest(requestId);
      loadData();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to reject request');
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

  const toggleRequests = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setRequestsExpanded(!requestsExpanded);
  };

  const getCleanMessage = (notification: NotificationItem) => {
    const name = notification.source_user.full_name;
    const msg = notification.message;
    if (msg.startsWith(name)) {
      return msg.slice(name.length).trim();
    }
    return msg;
  };

  const handleNotificationPress = (notification: NotificationItem) => {
    // If friend request or no specific content, go to profile
    if (notification.type === 'friend_request' || !notification.content_id) {
      // Use replace if we are already in a modal stack? 
      // But Activity Tab is a main tab, so we push the profile modal.
      router.push({
        pathname: '/user-profile',
        params: { userId: notification.source_user_id }
      });
      return;
    }

    // Determine content type param
    // Notification types: insight, article, paper, book, timelapse (custom?)
    // Our DB schema says content_type is text.
    // UGCArchiveGrid uses: 'timelapse', 'insight', 'article', 'paper', 'book', 'video'

    // We navigate to the FEED/Home tab with params to show the viewer
    router.push({
      pathname: '/(tabs)/',
      params: {
        contentType: notification.content_type || 'insight', // Fallback
        contentId: notification.content_id,
        animationDirection: 'left',
        showBackButton: 'true',
        backTo: 'activity' // Or just let them back naturally
      }
    });

    // Alternatively, if we wanted to open the profile modal THEN the content?
    // No, user wanted "navigate to its respective place".
    // Since we are on a Tab page, we can just push to another Tab (which replaces the view) or push a Modal.
    // The feed viewer logic (in index.tsx) handles these params to show a modal viewer.
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays}d ago`;
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths}mo ago`;
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
    content: {
      flex: 1,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
      marginTop: 24,
      paddingHorizontal: 16,
    },
    // Requests Header Row
    requestsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      backgroundColor: colors.surface,
      borderBottomWidth: requestsExpanded ? 1 : 0, // Separator when expanded
      borderBottomColor: colors.border,
      // If separate section:
      marginBottom: requestsExpanded ? 0 : 8,
    },
    requestsTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    requestsTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginRight: 8,
    },
    requestsBadge: {
      backgroundColor: colors.primary,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 12,
    },
    requestsBadgeText: {
      color: 'white',
      fontSize: 12,
      fontWeight: 'bold',
    },
    requestsList: {
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },

    // Request Item
    requestItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border + '40',
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.border,
      marginRight: 12,
    },
    requestInfo: {
      flex: 1,
    },
    requestName: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },
    requestMessage: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    requestActions: {
      flexDirection: 'row',
      gap: 8,
      marginLeft: 8,
    },
    acceptButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
    },
    rejectButton: {
      backgroundColor: colors.border,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
    },
    actionButtonText: {
      fontSize: 13,
      fontWeight: '600',
      color: 'white',
    },
    rejectButtonText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text,
    },

    // Notification Item
    notificationItem: {
      flexDirection: 'row',
      alignItems: 'center', // Center vertically for cleaner look
      paddingVertical: 16,
      paddingHorizontal: 16,
      backgroundColor: colors.background, // Transparent/background
      borderBottomWidth: 1,
      borderBottomColor: colors.border + '40',
    },
    unreadNotification: {
      backgroundColor: colors.primary + '05', // Very subtle tint
    },
    notificationIcon: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      backgroundColor: colors.card,
      borderRadius: 10,
      width: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.background, // Match container bg
    },
    notificationAvatarContainer: {
      marginRight: 14,
      position: 'relative',
    },
    notificationAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
    },
    notificationContent: {
      flex: 1,
    },
    notificationText: {
      fontSize: 15, // Slightly bigger
      color: colors.text,
      marginBottom: 4,
      lineHeight: 20,
    },
    notificationTime: {
      fontSize: 12,
      color: colors.textSecondary,
    },

    // Empty state
    emptyState: {
      padding: 40,
      alignItems: 'center',
    },
    emptyText: {
      color: colors.textSecondary,
      fontSize: 16,
      textAlign: 'center',
      marginTop: 16,
    }
  });

  return (
    <SafeAreaView style={dynamicStyles.container}>
      {/* Header */}
      {showHeader && (
        <View style={dynamicStyles.header}>
          <TouchableOpacity
            style={dynamicStyles.backButton}
            onPress={() => router.back()}
          >
            <Feather name="arrow-left" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={dynamicStyles.headerTitle}>Activity</Text>
        </View>
      )}

      <ScrollView
        style={dynamicStyles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Friend/Follow Requests Section */}
        {receivedRequests.length > 0 && (
          <View>
            <TouchableOpacity
              style={dynamicStyles.requestsHeader}
              onPress={toggleRequests}
              activeOpacity={0.7}
            >
              <View style={dynamicStyles.requestsTitleContainer}>
                <Text style={dynamicStyles.requestsTitle}>Follow Requests</Text>
                <View style={dynamicStyles.requestsBadge}>
                  <Text style={dynamicStyles.requestsBadgeText}>{receivedRequests.length}</Text>
                </View>
              </View>
              <Feather
                name={requestsExpanded ? "chevron-up" : "chevron-down"}
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            {requestsExpanded && (
              <View style={dynamicStyles.requestsList}>
                {receivedRequests.map((request) => (
                  <View key={request.id} style={dynamicStyles.requestItem}>
                    <TouchableOpacity
                      onPress={() => handleUserPress(request.requester.id)}
                    >
                      <Image
                        source={
                          request.requester?.avatar_url
                            ? { uri: profileImageService.getProfileImageUrl(request.requester.avatar_url) }
                            : require('../../assets/profileIconDefault.png')
                        }
                        style={dynamicStyles.avatar}
                      />
                    </TouchableOpacity>
                    <View style={dynamicStyles.requestInfo}>
                      <Text style={dynamicStyles.requestName}>
                        {request.requester?.full_name}
                      </Text>
                      <Text style={dynamicStyles.requestMessage}>
                        Requested to follow you
                      </Text>
                    </View>
                    <View style={dynamicStyles.requestActions}>
                      <TouchableOpacity
                        style={dynamicStyles.acceptButton}
                        onPress={() => handleAcceptRequest(request.id)}
                      >
                        <Text style={dynamicStyles.actionButtonText}>Confirm</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={dynamicStyles.rejectButton}
                        onPress={() => handleRejectRequest(request.id)}
                      >
                        <Feather name="x" size={16} color={colors.text} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Notifications List */}
        <View>
          {/* If no notifications but requests exist, don't show empty state for whole page */}
          {notifications.length === 0 ? (
            <View style={dynamicStyles.emptyState}>
              {receivedRequests.length === 0 && (
                <>
                  <Feather name="activity" size={48} color={colors.textSecondary} />
                  <Text style={dynamicStyles.emptyText}>No recent activity</Text>
                </>
              )}
            </View>
          ) : (
            notifications.map((notification) => (
              <TouchableOpacity
                key={notification.id}
                style={[
                  dynamicStyles.notificationItem,
                  !notification.is_read && dynamicStyles.unreadNotification
                ]}
                onPress={() => handleNotificationPress(notification)}
                activeOpacity={0.7}
              >
                <View style={dynamicStyles.notificationAvatarContainer}>
                  {/* Avatar */}
                  <Image
                    source={
                      notification.source_user?.avatar_url
                        ? { uri: profileImageService.getProfileImageUrl(notification.source_user.avatar_url) }
                        : require('../../assets/profileIconDefault.png')
                    }
                    style={dynamicStyles.notificationAvatar}
                  />
                  {/* Icon Badge */}
                  <View style={dynamicStyles.notificationIcon}>
                    <Feather
                      name={notification.type === 'like' ? 'heart' : 'message-circle'}
                      size={10}
                      color={colors.primary}
                    />
                  </View>
                </View>

                <View style={dynamicStyles.notificationContent}>
                  <Text style={dynamicStyles.notificationText}>
                    <Text style={{ fontWeight: '600' }}>{notification.source_user.full_name}</Text>
                    {' '}
                    {getCleanMessage(notification)}
                  </Text>
                  <Text style={dynamicStyles.notificationTime}>
                    {formatTimeAgo(notification.created_at)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
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
    </SafeAreaView>
  );
}