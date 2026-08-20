import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Dimensions
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { AchievementService, EnhancedAchievement } from '../../services/achievementService';
import { getAchievementColors } from '../../utils/achievementColors';
import { AchievementModal } from './AchievementModal';

const { width: screenWidth } = Dimensions.get('window');
const CARD_MARGIN = 12;
const CONTAINER_PADDING = 40; // 20px on each side
const AVAILABLE_WIDTH = screenWidth - CONTAINER_PADDING;
const CARD_WIDTH = (AVAILABLE_WIDTH - CARD_MARGIN) / 2; // 2 cards per row with margin

interface AllAchievementsPageProps {
  onBack: () => void;
  userId: string;
}

export const AllAchievementsPage: React.FC<AllAchievementsPageProps> = ({
  onBack,
  userId
}) => {
  const { colors, isDark } = useTheme();
  const [achievements, setAchievements] = useState<EnhancedAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAchievement, setSelectedAchievement] = useState<EnhancedAchievement | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadAchievements();
  }, [userId]);

  const loadAchievements = async () => {
    if (!userId || userId.trim() === '') {
      console.error('AllAchievementsPage: Cannot load achievements - invalid userId:', userId);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      console.log('AllAchievementsPage: Loading all achievements for user:', userId);
      const enhancedAchievements = await AchievementService.getAllAchievementsWithProgress(userId);
      setAchievements(enhancedAchievements);
    } catch (error) {
      console.error('AllAchievementsPage: Error loading achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAchievementPress = (achievement: EnhancedAchievement) => {
    setSelectedAchievement(achievement);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedAchievement(null);
  };

  const getIconName = (iconName: string): keyof typeof Feather.glyphMap => {
    const iconMap: Record<string, keyof typeof Feather.glyphMap> = {
      'lightbulb': 'zap',
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
      'check-circle': 'check-circle',
      'book': 'book',
      'message-circle': 'message-circle',
      'thumbs-up': 'thumbs-up',
    };
    return iconMap[iconName] || 'award';
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    backText: {
      fontSize: 16,
      color: colors.primary,
      marginLeft: 4,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
    },
    headerRight: {
      width: 60, // Balance the header
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 20,
    },
    achievementsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      paddingBottom: 100, // Extra padding for bottom navbar
    },
    achievementCard: {
      width: CARD_WIDTH,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      borderWidth: 2,
      alignItems: 'center',
    },
    achievementCardEarned: {
      borderStyle: 'solid',
    },
    achievementCardUnearned: {
      borderStyle: 'dashed',
      opacity: 0.6,
    },
    achievementIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    achievementTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 4,
    },
    achievementTitleUnearned: {
      color: colors.textTertiary,
    },
    achievementDescription: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 16,
      marginBottom: 8,
    },
    achievementDescriptionUnearned: {
      color: colors.textTertiary,
    },
    achievementReward: {
      fontSize: 11,
      color: colors.primary,
      fontWeight: '600',
      textAlign: 'center',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    loadingText: {
      fontSize: 16,
      color: colors.textSecondary,
      marginTop: 16,
      textAlign: 'center',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    emptyIcon: {
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    emptyText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons name="chevron-back" size={24} color={colors.primary} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>All Achievements</Text>

          <View style={styles.headerRight} />
        </View>

        <View style={styles.loadingContainer}>
          <Feather name="award" size={48} color={colors.textTertiary} />
          <Text style={styles.loadingText}>Loading achievements...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!achievements || achievements.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons name="chevron-back" size={24} color={colors.primary} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>All Achievements</Text>

          <View style={styles.headerRight} />
        </View>

        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Feather name="award" size={48} color={colors.textTertiary} />
          </View>
          <Text style={styles.emptyTitle}>No Achievements Yet</Text>
          <Text style={styles.emptyText}>
            Start engaging with content to unlock your first achievements!
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons name="chevron-back" size={24} color={colors.primary} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>All Achievements</Text>

          <View style={styles.headerRight} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.achievementsGrid}>
            {achievements.map((achievement) => {
              const colorScheme = getAchievementColors(achievement.category);
              const isEarned = achievement.isEarned;

              return (
                <TouchableOpacity
                  key={achievement.id}
                  style={[
                    styles.achievementCard,
                    isEarned ? styles.achievementCardEarned : styles.achievementCardUnearned,
                    {
                      borderColor: isEarned ? colorScheme.border : colors.border,
                      backgroundColor: isEarned ?
                        (isDark ? colorScheme.primary + '20' : colorScheme.background) :
                        colors.card,
                    }
                  ]}
                  onPress={() => handleAchievementPress(achievement)}
                >
                  <View style={[
                    styles.achievementIcon,
                    {
                      backgroundColor: isEarned ? colorScheme.primary : colors.textTertiary
                    }
                  ]}>
                    <Feather
                      name={getIconName(achievement.icon_name)}
                      size={24}
                      color="white"
                    />
                  </View>

                  <Text style={[
                    styles.achievementTitle,
                    !isEarned && styles.achievementTitleUnearned
                  ]}>
                    {achievement.name}
                  </Text>

                  <Text style={[
                    styles.achievementDescription,
                    !isEarned && styles.achievementDescriptionUnearned
                  ]}>
                    {achievement.description}
                  </Text>

                  <Text style={styles.achievementReward}>
                    {achievement.voltz_reward > 0 && `${achievement.voltz_reward} Voltz`}
                    {achievement.points_reward > 0 && achievement.voltz_reward > 0 && ' • '}
                    {achievement.points_reward > 0 && `${achievement.points_reward} XP`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Achievement Modal */}
      <AchievementModal
        visible={showModal}
        onClose={handleModalClose}
        achievement={selectedAchievement}
      />
    </>
  );
};