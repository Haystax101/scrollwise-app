import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { FeedbackVoteButton } from './FeedbackVoteButton';
import type { Feedback } from '../../types/feedback';

interface FeedbackItemProps {
  feedback: Feedback;
  userUpvoted: boolean;
  userDownvoted: boolean;
  onUpvote: (feedbackId: string) => void;
  onDownvote: (feedbackId: string) => void;
  onPress: () => void;
}

export const FeedbackItem: React.FC<FeedbackItemProps> = ({
  feedback,
  userUpvoted,
  userDownvoted,
  onUpvote,
  onDownvote,
  onPress
}) => {
  const { colors } = useTheme();

  const getStatusColor = () => {
    const isDark = colors.background === '#000000' || colors.background === '#0a0a0a';
    switch (feedback.status) {
      case 'under_review':
        return isDark ? '#ffcc00' : '#ffa726';
      case 'in_progress':
        return isDark ? '#4a9eff' : '#2196f3';
      case 'completed':
        return isDark ? '#4caf50' : '#66bb6a';
      case 'declined':
        return isDark ? '#f44336' : '#ef5350';
      case 'planned':
        return isDark ? '#9c27b0' : '#ab47bc';
      default:
        return colors.textSecondary;
    }
  };

  const getStatusLabel = () => {
    switch (feedback.status) {
      case 'under_review':
        return 'Under Review';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'declined':
        return 'Declined';
      case 'planned':
        return 'Planned';
      default:
        return feedback.status;
    }
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      backgroundColor: colors.card || colors.surface,
      borderRadius: 12,
      padding: 16,
      marginHorizontal: 20,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    header: {
      marginBottom: 12,
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 8,
    },
    body: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.textSecondary,
      marginBottom: 12,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
    },
    leftFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    voteButtons: {
      flexDirection: 'row',
      gap: 8,
    },
    author: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    avatar: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.border,
    },
    authorName: {
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 6,
      alignSelf: 'flex-start',
    },
    statusText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#000000',
    },
  });

  return (
    <TouchableOpacity
      style={dynamicStyles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={dynamicStyles.header}>
        <Text style={dynamicStyles.title}>{feedback.title}</Text>
        <Text style={dynamicStyles.body} numberOfLines={3}>
          {feedback.body}
        </Text>
      </View>

      <View style={dynamicStyles.footer}>
        <View style={dynamicStyles.leftFooter}>
          <View style={dynamicStyles.voteButtons}>
            <FeedbackVoteButton
              voteType="up"
              count={feedback.upvotes_count}
              userVoted={userUpvoted}
              onPress={(e) => {
                e?.stopPropagation?.();
                onUpvote(feedback.id);
              }}
            />
            <FeedbackVoteButton
              voteType="down"
              count={feedback.downvotes_count}
              userVoted={userDownvoted}
              onPress={(e) => {
                e?.stopPropagation?.();
                onDownvote(feedback.id);
              }}
            />
          </View>

        </View>

        <View style={[dynamicStyles.statusBadge, { backgroundColor: getStatusColor() }]}>
          <Text style={dynamicStyles.statusText}>{getStatusLabel()}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};
