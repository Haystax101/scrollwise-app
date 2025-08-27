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
      icon: 'flame',
      label: 'Day Streak',
      value: loading ? '...' : stats.currentStreak.toString(),
      color: '#F97316', // Orange/Fire color
    },
    {
      icon: 'book',
      label: 'Learning Days',
      value: loading ? '...' : stats.contentEngaged.toString(),
      color: '#3B82F6', // Blue
    },
    {
      icon: 'users',
      label: 'Interactions',
      value: loading ? '...' : stats.totalInteractions.toString(),
      color: '#8B5CF6', // Purple
    },
  ];

  const styles = StyleSheet.create({
    container: {
      paddingHorizontal: 20,
      marginBottom: 24,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 16,
      textAlign: 'center',
    },
    statsGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginHorizontal: -4,
    },
    statItem: {
      backgroundColor: isDark ? '#2D3748' : '#374151',
      alignItems: 'center',
      flex: 1,
      minHeight: 120,
      justifyContent: 'space-between',
      borderRadius: 16,
      padding: 16,
      marginHorizontal: 4,
    },
    iconContainer: {
      width: 44,
      height: 44,
      borderRadius: 22,
      marginBottom: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    statValue: {
      fontSize: 28,
      fontWeight: 'bold',
      color: 'white',
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: 'rgba(255, 255, 255, 0.7)',
      textAlign: 'center',
      lineHeight: 16,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Progress</Text>
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