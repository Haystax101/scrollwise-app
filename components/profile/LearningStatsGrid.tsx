import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

interface LearningStats {
  currentStreak: number;
  totalInteractions: number;
  contentEngaged: number;
}

interface LearningStatsGridProps {
  stats: LearningStats;
  loading?: boolean;
}

export const LearningStatsGrid: React.FC<LearningStatsGridProps> = ({
  stats,
  loading = false
}) => {
  const { colors, isDark } = useTheme();

  const statItems = [
    {
      icon: 'trending-up',
      label: 'Streak',
      value: loading ? '...' : `${stats.currentStreak} ${stats.currentStreak === 1 ? 'day' : 'days'}`,
      color: '#F97316', // Orange/Fire color
    },
    {
      icon: 'message-circle',
      label: 'Interactions',
      value: loading ? '...' : stats.totalInteractions.toString(),
      color: '#10B981', // Green
    },
    {
      icon: 'play-circle',
      label: 'Content Engaged',
      value: loading ? '...' : stats.contentEngaged.toString(),
      color: '#3B82F6', // Blue
    },
  ];

  const styles = StyleSheet.create({
    container: {
      backgroundColor: isDark ? colors.surface : colors.card,
      padding: 20,
      borderRadius: 16,
      marginBottom: 24,
      borderWidth: isDark ? 1 : 0,
      borderColor: isDark ? colors.border : 'transparent',
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 16,
    },
    statsGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    statItem: {
      alignItems: 'center',
      flex: 1,
      minHeight: 100, // Fixed minimum height for all pills
      justifyContent: 'space-between', // Distribute content evenly
    },
    iconContainer: {
      width: 50,
      height: 50,
      borderRadius: 25,
      marginBottom: 8,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
    },
    statValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 16,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Learning Activity</Text>
      <View style={styles.statsGrid}>
        {statItems.map((item, index) => (
          <View key={index} style={styles.statItem}>
            <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
              <Feather 
                name={item.icon as any} 
                size={20} 
                color="white" 
              />
            </View>
            <Text style={styles.statValue}>{item.value}</Text>
            <Text style={styles.statLabel}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};