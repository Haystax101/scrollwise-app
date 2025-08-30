import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons, Ionicons, FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

interface LearningStats {
  currentStreak: number;
  totalInteractions: number;
  achievementsCount: number;
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
      iconFamily: 'MaterialIcons',
      icon: 'local-fire-department',
      label: 'Day Streak',
      value: loading ? '...' : stats.currentStreak.toString(),
      color: '#F97316', // Orange/Fire color
    },
    {
      iconFamily: 'FontAwesome',
      icon: 'trophy',
      label: 'Achievements',
      value: loading ? '...' : stats.achievementsCount.toString(),
      color: '#EAB308', // Gold color for achievements
    },
    {
      iconFamily: 'Ionicons',
      icon: 'people',
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
      marginBottom: 8,
      textAlign: 'center',
    },
    statsGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginHorizontal: -4,
    },
    statItem: {
      backgroundColor: colors.surface,
      alignItems: 'center',
      flex: 1,
      minHeight: 120,
      justifyContent: 'space-between',
      borderRadius: 16,
      padding: 16,
      marginHorizontal: 4,
      borderWidth: isDark ? 0 : 1,
      borderColor: isDark ? 'transparent' : colors.border,
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
      color: colors.text,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 14,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Progress</Text>
      <View style={styles.statsGrid}>
        {statItems.map((item, index) => {
          const IconComponent = item.iconFamily === 'MaterialIcons' ? MaterialIcons : 
                              item.iconFamily === 'FontAwesome' ? FontAwesome : Ionicons;
          
          return (
            <View key={index} style={styles.statItem}>
              <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
                <IconComponent 
                  name={item.icon as any} 
                  size={20} 
                  color="white" 
                />
              </View>
              <Text style={styles.statValue}>{item.value}</Text>
              <Text style={styles.statLabel}>{item.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};