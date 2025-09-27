import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActionSheetIOS, Platform } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { formatNumber } from '../../lib/utils';
import { Insight } from '../../types';
import { profileImageService } from '../../services/profileImageService';
const defaultProfileImage = require('../../assets/profileIconDefault.png');

interface InsightsCardsListProps {
  insights: Insight[];
  loading?: boolean;
  onInsightPress?: (insight: Insight) => void;
  onDeletePress?: (insight: Insight) => void;
  onEditPress?: (insight: Insight) => void;
}

export const InsightsCardsList: React.FC<InsightsCardsListProps> = ({
  insights,
  loading = false,
  onInsightPress,
  onDeletePress,
  onEditPress
}) => {
  const { colors } = useTheme();

  const showActionSheet = (insight: Insight) => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions({
        options: ['View', 'Edit', 'Delete', 'Cancel'],
        destructiveButtonIndex: 2,
        cancelButtonIndex: 3,
      }, (buttonIndex) => {
        if (buttonIndex === 0) onInsightPress?.(insight);
        if (buttonIndex === 1) onEditPress?.(insight);
        if (buttonIndex === 2) onDeletePress?.(insight);
      });
    } else {
      // For Android, show a simple menu - you could implement a custom modal here
      onInsightPress?.(insight);
    }
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d`;
    }
  };



  const styles = StyleSheet.create({
    container: {
      paddingLeft: 20,
    },
    scrollContent: {
      paddingRight: 20,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 40,
      paddingHorizontal: 20,
    },
    emptyIcon: {
      marginBottom: 16,
    },
    emptyText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 8,
    },
    emptySubtext: {
      fontSize: 14,
      color: colors.textTertiary,
      textAlign: 'center',
    },
    insightCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      marginRight: 16,
      overflow: 'hidden',
      width: 320,
      height: 250,
      borderWidth: 0,
      borderColor: 'transparent',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
      flexDirection: 'column',
    },
    userHeader: {
      flexDirection: 'row',
      padding: 16,
      alignItems: 'flex-start',
    },
    avatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      marginRight: 12,
    },
    userInfo: {
      flex: 1,
    },
    name: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 2,
    },
    timestampContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
    },
    timestamp: {
      fontSize: 12,
      color: colors.textSecondary,
      marginLeft: 4,
    },
    moreButton: {
      position: 'absolute',
      top: 12,
      right: 12,
      backgroundColor: colors.background,
      borderRadius: 16,
      paddingHorizontal: 8,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    contentSection: {
      flex: 1,
      paddingHorizontal: 16,
      paddingTop: 0,
      paddingBottom: 12,
      justifyContent: 'flex-start',
    },
    contentText: {
      fontSize: 16,
      lineHeight: 24,
      color: colors.text,
    },
    viewsSection: {
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    viewsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    viewsText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginLeft: 6,
    },
    engagementSection: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    actionRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingTop: 4,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    actionText: {
      marginLeft: 4,
      fontSize: 16,
      color: colors.text,
    },
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Loading insights...</Text>
        </View>
      </View>
    );
  }

  if (!insights || insights.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Feather name="edit" size={32} color={colors.textTertiary} />
          </View>
          <Text style={styles.emptyText}>No insights yet</Text>
          <Text style={styles.emptySubtext}>
            Share your first insight to get started
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      style={styles.container}
    >
      {insights.map((insight) => (
        <TouchableOpacity
          key={insight.id}
          style={styles.insightCard}
          onPress={() => showActionSheet(insight)}
        >
          <TouchableOpacity
            style={styles.moreButton}
            onPress={(e) => {
              e.stopPropagation();
              showActionSheet(insight);
            }}
          >
            <Feather name="more-horizontal" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          
          {/* User Header */}
          <View style={styles.userHeader}>
            <Image
              source={
                insight.author?.avatar
                  ? { uri: profileImageService.getProfileImageUrl(insight.author.avatar) }
                  : defaultProfileImage
              }
              style={styles.avatar}
            />
            <View style={styles.userInfo}>
              <Text style={styles.name}>{insight.author?.name || 'User'}</Text>
              {insight.created_at && (
                <View style={styles.timestampContainer}>
                  <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
                  <Text style={styles.timestamp}>{formatTimestamp(insight.created_at)}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Content */}
          <View style={styles.contentSection}>
            <Text style={styles.contentText} numberOfLines={4} ellipsizeMode="tail">{insight.content}</Text>
          </View>

          {/* Bottom Section - Views and Engagement */}
          <View>
            {/* Views Section */}
            <View style={styles.viewsSection}>
              <View style={styles.viewsContainer}>
                <Ionicons name="eye-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.viewsText}>{formatNumber(insight.views_count || 0)} views</Text>
              </View>
            </View>

            {/* Engagement Bar */}
            <View style={styles.engagementSection}>
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="heart-outline" size={20} color={colors.text} />
                  <Text style={styles.actionText}>{formatNumber(insight.likes_count || 0)}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="chatbubble-outline" size={20} color={colors.text} />
                  <Text style={styles.actionText}>{formatNumber(insight.comments_count || 0)}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="bookmark-outline" size={20} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};