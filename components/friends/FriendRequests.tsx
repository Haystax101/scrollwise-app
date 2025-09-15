import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  RefreshControl,
  SectionList
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import type { FriendRequest } from '../../types/friends';

interface FriendRequestsProps {
  incomingRequests: FriendRequest[];
  outgoingRequests: FriendRequest[];
  loading: boolean;
  onAcceptRequest: (friendshipId: string) => void;
  onDeclineRequest: (friendshipId: string) => void;
  onCancelRequest: (friendshipId: string) => void;
  onRefresh: () => Promise<void>;
  refreshing: boolean;
}

export const FriendRequests: React.FC<FriendRequestsProps> = ({
  incomingRequests,
  outgoingRequests,
  loading,
  onAcceptRequest,
  onDeclineRequest,
  onCancelRequest,
  onRefresh,
  refreshing
}) => {
  const { colors } = useTheme();
  const [processingRequests, setProcessingRequests] = useState<Set<string>>(new Set());

  const handleAccept = async (friendshipId: string) => {
    setProcessingRequests(prev => new Set(prev).add(friendshipId));
    try {
      await onAcceptRequest(friendshipId);
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(friendshipId);
        return newSet;
      });
    }
  };

  const handleDecline = async (friendshipId: string) => {
    setProcessingRequests(prev => new Set(prev).add(friendshipId));
    try {
      await onDeclineRequest(friendshipId);
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(friendshipId);
        return newSet;
      });
    }
  };

  const handleCancel = async (friendshipId: string) => {
    setProcessingRequests(prev => new Set(prev).add(friendshipId));
    try {
      await onCancelRequest(friendshipId);
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(friendshipId);
        return newSet;
      });
    }
  };

  const renderIncomingRequest = ({ item }: { item: FriendRequest }) => {
    const isProcessing = processingRequests.has(item.id);

    return (
      <View style={[styles.requestCard, { borderColor: colors.border }]}>
        <View style={styles.requestInfo}>
          <Image
            source={{ uri: item.requester.avatar_url || 'https://via.placeholder.com/40' }}
            style={styles.avatar}
          />
          <View style={styles.requestDetails}>
            <Text style={[styles.requesterName, { color: colors.text }]}>
              {item.requester.full_name}
            </Text>
            {item.mutual_friends_count > 0 && (
              <Text style={[styles.mutualFriends, { color: colors.textSecondary }]}>
                {item.mutual_friends_count} mutual friends
              </Text>
            )}
            <Text style={[styles.requestTime, { color: colors.textSecondary }]}>
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>
        <View style={styles.requestActions}>
          <TouchableOpacity
            style={[styles.acceptButton, { backgroundColor: colors.primary }]}
            onPress={() => handleAccept(item.id)}
            disabled={isProcessing}
          >
            <Feather name="check" size={16} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.declineButton, { borderColor: colors.border }]}
            onPress={() => handleDecline(item.id)}
            disabled={isProcessing}
          >
            <Feather name="x" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderOutgoingRequest = ({ item }: { item: FriendRequest }) => {
    const isProcessing = processingRequests.has(item.id);

    return (
      <View style={[styles.requestCard, { borderColor: colors.border }]}>
        <View style={styles.requestInfo}>
          <Image
            source={{ uri: item.addressee.avatar_url || 'https://via.placeholder.com/40' }}
            style={styles.avatar}
          />
          <View style={styles.requestDetails}>
            <Text style={[styles.requesterName, { color: colors.text }]}>
              {item.addressee.full_name}
            </Text>
            <Text style={[styles.requestStatus, { color: colors.textSecondary }]}>
              Request sent
            </Text>
            <Text style={[styles.requestTime, { color: colors.textSecondary }]}>
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.cancelButton, { borderColor: colors.border }]}
          onPress={() => handleCancel(item.id)}
          disabled={isProcessing}
        >
          <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>
            Cancel
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderSectionHeader = ({ section }: { section: { title: string } }) => (
    <Text style={[styles.sectionHeader, { color: colors.text }]}>
      {section.title}
    </Text>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Feather name="inbox" size={48} color={colors.textSecondary} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No Friend Requests</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        When you send or receive friend requests, they'll appear here.
      </Text>
    </View>
  );

  const sections = [];

  if (incomingRequests.length > 0) {
    sections.push({
      title: `Incoming Requests (${incomingRequests.length})`,
      data: incomingRequests,
      renderItem: renderIncomingRequest
    });
  }

  if (outgoingRequests.length > 0) {
    sections.push({
      title: `Sent Requests (${outgoingRequests.length})`,
      data: outgoingRequests,
      renderItem: renderOutgoingRequest
    });
  }

  if (loading && sections.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading requests...
        </Text>
      </View>
    );
  }

  if (sections.length === 0) {
    return renderEmptyState();
  }

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      renderSectionHeader={renderSectionHeader}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 8,
  },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  requestInfo: {
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
  requestDetails: {
    flex: 1,
  },
  requesterName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  mutualFriends: {
    fontSize: 12,
    marginBottom: 2,
  },
  requestStatus: {
    fontSize: 12,
    marginBottom: 2,
  },
  requestTime: {
    fontSize: 12,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  declineButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 12,
    fontWeight: '500',
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