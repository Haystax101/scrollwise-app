import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon_name: string;
  earned_at: string;
}

interface AchievementsBeltProps {
  achievements: Achievement[];
  loading?: boolean;
}

export const AchievementsBelt: React.FC<AchievementsBeltProps> = ({
  achievements,
  loading = false
}) => {
  const { colors, isDark } = useTheme();

  const getIconName = (iconName: string): keyof typeof Feather.glyphMap => {
    const iconMap: Record<string, keyof typeof Feather.glyphMap> = {
      'lightbulb': 'zap', // lightbulb is not valid in feather, use zap instead
      'trophy': 'award',
      'award': 'award',
      'zap': 'zap',
      'target': 'target',
      'star': 'star',
      'heart': 'heart',
      'bookmark': 'bookmark',
      'user': 'user',
      'users': 'users',
      'trending-up': 'trending-up',
      'calendar': 'calendar',
    };
    return iconMap[iconName] || 'award';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: isDark ? colors.surface : colors.card,
      borderRadius: 16,
      padding: 20,
      marginBottom: 24,
      marginHorizontal: 20,
      borderWidth: isDark ? 1 : 0,
      borderColor: isDark ? colors.border : 'transparent',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    headerIcon: {
      marginRight: 8,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
    },
    scrollContainer: {
      marginHorizontal: -20,
      paddingLeft: 20,
    },
    scrollContent: {
      paddingRight: 20,
    },
    achievementCard: {
      backgroundColor: isDark ? colors.surface : colors.card,
      borderRadius: 16,
      padding: 12,
      marginRight: 12,
      alignItems: 'flex-start',
      minWidth: 240,
      borderWidth: isDark ? 1 : 0,
      borderColor: isDark ? colors.border : 'transparent',
    },
    achievementHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
      width: '100%',
    },
    iconContainer: {
      backgroundColor: colors.primary,
      padding: 8,
      borderRadius: 12,
      marginRight: 12,
    },
    achievementContent: {
      flex: 1,
    },
    achievementTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 4,
    },
    achievementDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 18,
      marginBottom: 8,
    },
    achievementDate: {
      fontSize: 12,
      color: colors.textTertiary,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 32,
    },
    emptyIcon: {
      marginBottom: 12,
    },
    emptyText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
    },
    emptySubtext: {
      fontSize: 14,
      color: colors.textTertiary,
      textAlign: 'center',
      marginTop: 4,
    },
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Feather name="award" size={20} color={colors.primary} />
          </View>
          <Text style={styles.title}>Achievements</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Loading achievements...</Text>
        </View>
      </View>
    );
  }

  if (!achievements || achievements.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Feather name="award" size={20} color={colors.primary} />
          </View>
          <Text style={styles.title}>Achievements</Text>
        </View>
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Feather name="award" size={32} color={colors.textTertiary} />
          </View>
          <Text style={styles.emptyText}>No achievements yet!</Text>
          <Text style={styles.emptySubtext}>
            Keep learning and engaging to earn your first achievement
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Feather name="award" size={20} color={colors.primary} />
        </View>
        <Text style={styles.title}>Achievements</Text>
      </View>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollContainer}
      >
        {achievements.map((achievement) => (
          <TouchableOpacity 
            key={achievement.id} 
            style={styles.achievementCard}
          >
            <View style={styles.achievementHeader}>
              <View style={styles.iconContainer}>
                <Feather 
                  name={getIconName(achievement.icon_name)} 
                  size={20} 
                  color="white" 
                />
              </View>
              <View style={styles.achievementContent}>
                <Text style={styles.achievementTitle}>
                  {achievement.title}
                </Text>
                <Text style={styles.achievementDescription}>
                  {achievement.description}
                </Text>
                <Text style={styles.achievementDate}>
                  {formatDate(achievement.earned_at)}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};