import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { formatNumber } from '../../lib/utils';

interface InsightsStats {
  postsCount: number;
  totalLikes: number;
  totalComments: number;
  voltzEarned: number;
}

interface InsightsStatsOverviewProps {
  stats: InsightsStats;
  loading?: boolean;
  onAnalyticsToggle?: () => void;
  showAnalytics?: boolean;
}

export const InsightsStatsOverview: React.FC<InsightsStatsOverviewProps> = ({
  stats,
  loading = false,
  onAnalyticsToggle,
  showAnalytics = false
}) => {
  const { colors, isDark } = useTheme();

 

  const statItems = [
    {
      icon: 'book-open',
      label: 'Posts',
      value: loading ? '...' : stats.postsCount.toString(),
      color: '#EAB308', // Yellow
    },
    {
      icon: 'heart',
      label: 'Likes',
      value: loading ? '...' : formatNumber(stats.totalLikes),
      color: '#EF4444', // Red
    },
    {
      icon: 'message-circle',
      label: 'Comments',
      value: loading ? '...' : formatNumber(stats.totalComments),
      color: '#3B82F6', // Blue
    },
    {
      icon: 'zap',
      label: 'Voltz Points Earnt',
      value: loading ? '...' : formatNumber(stats.voltzEarned),
      color: '#8B5CF6', // Purple
    },
  ];

  const styles = StyleSheet.create({
    container: {
      backgroundColor: isDark ? colors.surface : colors.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 24,
      borderWidth: isDark ? 1 : 0,
      borderColor: isDark ? colors.border : 'transparent',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
    },
    analyticsButton: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    analyticsText: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '500',
      marginRight: 4,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -6,
    },
    statCard: {
      width: '50%',
      paddingHorizontal: 6,
      marginBottom: 12,
    },
    statContent: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? colors.border : colors.surface,
      padding: 12,
      borderRadius: 12,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    iconContainer: {
      padding: 8,
      borderRadius: 25,
      marginRight: 12,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.3,
      shadowRadius: 3,
      elevation: 4,
    },
    statTextContainer: {
      flex: 1,
    },
    statValue: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 2,
    },
    statLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 14,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Supercharged Stats</Text>
        {onAnalyticsToggle && (
          <TouchableOpacity style={styles.analyticsButton} onPress={onAnalyticsToggle}>
            <Text style={styles.analyticsText}>
              {showAnalytics ? 'Hide Analytics' : 'See Analytics'}
            </Text>
            <Feather 
              name={showAnalytics ? 'chevron-up' : 'chevron-down'} 
              size={16} 
              color={colors.primary} 
            />
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.statsGrid}>
        {statItems.map((item, index) => (
          <View key={index} style={styles.statCard}>
            <View style={styles.statContent}>
              <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
                <Feather 
                  name={item.icon as any} 
                  size={20} 
                  color="white"
                />
              </View>
              <View style={styles.statTextContainer}>
                <Text style={styles.statValue}>{item.value}</Text>
                <Text style={styles.statLabel}>{item.label}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};