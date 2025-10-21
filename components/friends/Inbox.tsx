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
  RefreshControl
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

export function Inbox() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'received' | 'sent' | 'notifications'>('received');
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);

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
      setSentRequests(requests.outgoing);

      // Load real notifications
      const notificationsData = await NotificationService.getNotifications(user!.id, 50);
      setNotifications(notificationsData as NotificationItem[]);

    } catch (error) {
      console.error('Error loading inbox data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mark all notifications as read when user views the notifications tab
  const markNotificationsAsRead = async () => {
    if (!user?.id) return;

    try {
      await NotificationService.markAllAsRead(user.id);
      // Update local state to reflect read status
      setNotifications(prev => prev.map(notif => ({ ...notif, is_read: true })));
    } catch (error) {
      console.error('Error marking notifications as read:', error);
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
      Alert.alert('Success', 'Friend request accepted!');
      loadData();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to accept request');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await FriendsService.declineFriendRequest(requestId);
      Alert.alert('Request rejected');
      loadData();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to reject request');
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      await FriendsService.cancelFriendRequest(requestId);
      Alert.alert('Request cancelled');
      loadData();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to cancel request');
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
    tabs: {
      flexDirection: 'row',
      margin: 16,
      backgroundColor: colors.border + '20',
      borderRadius: 12,
      padding: 4,
    },
    tab: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    activeTab: {
      backgroundColor: colors.primary,
    },
    tabText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    activeTabText: {
      color: 'white',
    },
    content: {
      flex: 1,
      paddingHorizontal: 16,
    },
    requestItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 16,
      backgroundColor: colors.surface,
      borderRadius: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.border,
      marginRight: 12,
    },
    requestInfo: {
      flex: 1,
    },
    requestName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },
    requestMessage: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    requestTime: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    requestActions: {
      flexDirection: 'row',
      gap: 8,
    },
    acceptButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
    },
    rejectButton: {
      backgroundColor: colors.border,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
    },
    cancelButton: {
      backgroundColor: colors.textSecondary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
    },
    actionButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: 'white',
    },
    rejectButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text,
    },
    notificationItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingVertical: 16,
      paddingHorizontal: 16,
      backgroundColor: colors.surface,
      borderRadius: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    unreadNotification: {
      backgroundColor: colors.primary + '10',
      borderColor: colors.primary + '30',
    },
    notificationIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary + '20',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    notificationContent: {
      flex: 1,
    },
    notificationText: {
      fontSize: 14,
      color: colors.text,
      marginBottom: 4,
    },
    notificationTime: {
      fontSize: 12,
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
  });

  const renderReceivedRequests = () => (
    <ScrollView
      style={dynamicStyles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      {receivedRequests.length === 0 ? (
        <View style={dynamicStyles.emptyState}>
          <Feather name="inbox" size={48} color={colors.textSecondary} style={dynamicStyles.emptyIcon} />
          <Text style={dynamicStyles.emptyTitle}>No pending requests</Text>
          <Text style={dynamicStyles.emptySubtitle}>
            When someone sends you a friend request, it will appear here.
          </Text>
        </View>
      ) : (
        receivedRequests.map((request) => (
          <View key={request.id} style={dynamicStyles.requestItem}>
            <TouchableOpacity
              onPress={() => handleUserPress(request.requester.id)}
              activeOpacity={0.7}
            >
              <Image
                source={
                  request.requester?.avatar_url
                    ? { uri: profileImageService.getProfileImageUrl(request.requester.avatar_url) }
                    : require('../../assets/profileIconDefault.png')
                }
                style={dynamicStyles.avatar}
                defaultSource={require('../../assets/profileIconDefault.png')}
              />
            </TouchableOpacity>
            <View style={dynamicStyles.requestInfo}>
              <TouchableOpacity
                onPress={() => handleUserPress(request.requester.id)}
                activeOpacity={0.7}
              >
                <Text style={dynamicStyles.requestName}>
                  {request.requester?.full_name}
                </Text>
              </TouchableOpacity>
              <Text style={dynamicStyles.requestMessage}>
                Sent you a friend request
              </Text>
              <Text style={dynamicStyles.requestTime}>
                {formatTimeAgo(request.created_at)}
              </Text>
            </View>
            <View style={dynamicStyles.requestActions}>
              <TouchableOpacity
                style={dynamicStyles.acceptButton}
                onPress={() => handleAcceptRequest(request.id)}
              >
                <Text style={dynamicStyles.actionButtonText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={dynamicStyles.rejectButton}
                onPress={() => handleRejectRequest(request.id)}
              >
                <Text style={dynamicStyles.rejectButtonText}>Decline</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );

  const renderSentRequests = () => (
    <ScrollView
      style={dynamicStyles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      {sentRequests.length === 0 ? (
        <View style={dynamicStyles.emptyState}>
          <Feather name="send" size={48} color={colors.textSecondary} style={dynamicStyles.emptyIcon} />
          <Text style={dynamicStyles.emptyTitle}>No sent requests</Text>
          <Text style={dynamicStyles.emptySubtitle}>
            Friend requests you send will appear here while pending.
          </Text>
        </View>
      ) : (
        sentRequests.map((request) => (
          <View key={request.id} style={dynamicStyles.requestItem}>
            <TouchableOpacity
              onPress={() => handleUserPress(request.addressee.id)}
              activeOpacity={0.7}
            >
              <Image
                source={
                  request.addressee?.avatar_url
                    ? { uri: profileImageService.getProfileImageUrl(request.addressee.avatar_url) }
                    : require('../../assets/profileIconDefault.png')
                }
                style={dynamicStyles.avatar}
                defaultSource={require('../../assets/profileIconDefault.png')}
              />
            </TouchableOpacity>
            <View style={dynamicStyles.requestInfo}>
              <TouchableOpacity
                onPress={() => handleUserPress(request.addressee.id)}
                activeOpacity={0.7}
              >
                <Text style={dynamicStyles.requestName}>
                  {request.addressee?.full_name}
                </Text>
              </TouchableOpacity>
              <Text style={dynamicStyles.requestMessage}>
                Friend request sent
              </Text>
              <Text style={dynamicStyles.requestTime}>
                {formatTimeAgo(request.created_at)}
              </Text>
            </View>
            <View style={dynamicStyles.requestActions}>
              <TouchableOpacity
                style={dynamicStyles.cancelButton}
                onPress={() => handleCancelRequest(request.id)}
              >
                <Text style={dynamicStyles.actionButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );

  const renderNotifications = () => (
    <ScrollView
      style={dynamicStyles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      {notifications.length === 0 ? (
        <View style={dynamicStyles.emptyState}>
          <Feather name="bell" size={48} color={colors.textSecondary} style={dynamicStyles.emptyIcon} />
          <Text style={dynamicStyles.emptyTitle}>No notifications</Text>
          <Text style={dynamicStyles.emptySubtitle}>
            You'll be notified when people like or comment on your insights.
          </Text>
        </View>
      ) : (
        notifications.map((notification) => (
          <View
            key={notification.id}
            style={[
              dynamicStyles.notificationItem,
              !notification.is_read && dynamicStyles.unreadNotification
            ]}
          >
            <View style={dynamicStyles.notificationIcon}>
              <Feather
                name={notification.type === 'like' ? 'heart' : 'message-circle'}
                size={16}
                color={colors.primary}
              />
            </View>
            <View style={dynamicStyles.notificationContent}>
              <Text style={dynamicStyles.notificationText}>
                <Text style={{ fontWeight: '600' }}>{notification.source_user.full_name}</Text>
                {' '}
                {notification.message}
              </Text>
              <Text style={dynamicStyles.notificationTime}>
                {formatTimeAgo(notification.created_at)}
              </Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'received':
        return renderReceivedRequests();
      case 'sent':
        return renderSentRequests();
      case 'notifications':
        return renderNotifications();
      default:
        return renderReceivedRequests();
    }
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
        <Text style={dynamicStyles.headerTitle}>Inbox</Text>
      </View>

      {/* Tabs */}
      <View style={dynamicStyles.tabs}>
        <TouchableOpacity
          style={[dynamicStyles.tab, activeTab === 'received' && dynamicStyles.activeTab]}
          onPress={() => setActiveTab('received')}
        >
          <Text style={[dynamicStyles.tabText, activeTab === 'received' && dynamicStyles.activeTabText]}>
            Received
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[dynamicStyles.tab, activeTab === 'sent' && dynamicStyles.activeTab]}
          onPress={() => setActiveTab('sent')}
        >
          <Text style={[dynamicStyles.tabText, activeTab === 'sent' && dynamicStyles.activeTabText]}>
            Sent
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[dynamicStyles.tab, activeTab === 'notifications' && dynamicStyles.activeTab]}
          onPress={() => {
            setActiveTab('notifications');
            markNotificationsAsRead();
          }}
        >
          <Text style={[dynamicStyles.tabText, activeTab === 'notifications' && dynamicStyles.activeTabText]}>
            Activity
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {renderActiveTab()}

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