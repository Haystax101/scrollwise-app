import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { formatNumber } from '../../lib/utils';
import { Insight } from '../../types';

interface InsightsCardsListProps {
  insights: Insight[];
  loading?: boolean;
  onInsightPress?: (insight: Insight) => void;
  onEditPress?: (insight: Insight) => void;
  onDeletePress?: (insight: Insight) => void;
}

export const InsightsCardsList: React.FC<InsightsCardsListProps> = ({
  insights,
  loading = false,
  onInsightPress,
  onEditPress,
  onDeletePress
}) => {
  const { colors, isDark } = useTheme();



  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const getReadTime = (content: string): string => {
    const wordsPerMinute = 200;
    const words = content.split(' ').length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min read`;
  };

  const getTruncatedContent = (content: string, maxLength: number = 120): string => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  const getTitle = (content: string, maxLength: number = 50): string => {
    const firstSentence = content.split('.')[0];
    if (firstSentence.length <= maxLength) return firstSentence;
    return content.substring(0, maxLength) + '...';
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
      backgroundColor: isDark ? colors.surface : colors.card,
      borderRadius: 16,
      marginRight: 12,
      overflow: 'hidden',
      width: 280,
      borderWidth: isDark ? 1 : 0,
      borderColor: isDark ? colors.border : 'transparent',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
    },
    cardHeader: {
      position: 'relative',
      height: 120,
      backgroundColor: isDark ? colors.border : colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    placeholderIcon: {
      opacity: 0.3,
    },
    moreButton: {
      position: 'absolute',
      top: 12,
      right: 12,
      backgroundColor: 'rgba(0,0,0,0.5)',
      borderRadius: 20,
      padding: 6,
    },
    cardContent: {
      padding: 16,
    },
    cardMeta: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    publishedDate: {
      fontSize: 12,
      color: colors.textTertiary,
    },
    readTime: {
      fontSize: 12,
      color: colors.textTertiary,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
      lineHeight: 22,
    },
    cardExcerpt: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: 12,
    },
    cardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: isDark ? colors.border : colors.surface,
    },
    metricsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    metric: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 12,
    },
    metricText: {
      fontSize: 12,
      color: colors.textSecondary,
      marginLeft: 4,
    },
    editButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: colors.primary,
    },
    editButtonText: {
      fontSize: 12,
      color: 'white',
      fontWeight: '500',
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
          onPress={() => onInsightPress?.(insight)}
        >
          <View style={styles.cardHeader}>
            <Feather 
              name="edit-3" 
              size={32} 
              color={colors.textTertiary}
              style={styles.placeholderIcon}
            />
            <TouchableOpacity 
              style={styles.moreButton}
              onPress={() => onEditPress?.(insight)}
            >
              <Feather name="more-vertical" size={16} color="white" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.cardContent}>
            <View style={styles.cardMeta}>
              <Text style={styles.publishedDate}>
                {formatDate(insight.created_at)}
              </Text>
              <Text style={styles.readTime}>
                {getReadTime(insight.content)}
              </Text>
            </View>
            
            <Text style={styles.cardTitle}>
              {getTitle(insight.content)}
            </Text>
            
            <Text style={styles.cardExcerpt}>
              {getTruncatedContent(insight.content)}
            </Text>
            
            <View style={styles.cardFooter}>
              <View style={styles.metricsContainer}>
                <View style={styles.metric}>
                  <Feather name="eye" size={12} color={colors.textTertiary} />
                  <Text style={styles.metricText}>
                    {formatNumber(insight.views_count)}
                  </Text>
                </View>
                <View style={styles.metric}>
                  <Feather name="heart" size={12} color={colors.textTertiary} />
                  <Text style={styles.metricText}>
                    {formatNumber(insight.likes_count)}
                  </Text>
                </View>
                <View style={styles.metric}>
                  <Feather name="message-circle" size={12} color={colors.textTertiary} />
                  <Text style={styles.metricText}>
                    {formatNumber(insight.comments_count)}
                  </Text>
                </View>
              </View>
              
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => onEditPress?.(insight)}
              >
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};