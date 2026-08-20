import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { AchievementService, EnhancedAchievement } from '../../services/achievementService';
import { getAchievementColors } from '../../utils/achievementColors';
import { AchievementModal } from './AchievementModal';

interface AchievementsBeltProps {
  userId: string;
  loading?: boolean;
  onSeeAll?: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// iPad detection using the same logic as other components
const isTablet = Platform.OS === 'ios' && Math.min(screenWidth, screenHeight) >= 768;

const CARD_MARGIN = 12;
const CONTAINER_PADDING = 40; // 20px on each side
const AVAILABLE_WIDTH = screenWidth - CONTAINER_PADDING;

// Show 4 cards on iPad, 2 on phone
const CARDS_PER_ROW = isTablet ? 4 : 2;
const TOTAL_MARGINS = CARD_MARGIN * (CARDS_PER_ROW - 1);
const CARD_WIDTH = (AVAILABLE_WIDTH - TOTAL_MARGINS) / CARDS_PER_ROW;

export const AchievementsBelt: React.FC<AchievementsBeltProps> = ({
  userId,
  loading = false,
  onSeeAll
}) => {
  const { colors, isDark } = useTheme();
  const [achievements, setAchievements] = useState<EnhancedAchievement[]>([]);
  const [isLoading, setIsLoading] = useState(loading);
  const [selectedAchievement, setSelectedAchievement] = useState<EnhancedAchievement | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Only load achievements if we have a valid userId
    if (userId && userId.trim() !== '') {
      loadAchievements();
    } else {
      console.warn('AchievementsBelt: Skipping achievement load - no valid userId provided');
    }
  }, [userId]);

  const loadAchievements = async () => {
    // Validate userId before making API calls
    if (!userId || userId.trim() === '') {
      console.error('AchievementsBelt: Cannot load achievements - invalid userId:', userId);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      console.log('AchievementsBelt: Loading achievements for user:', userId);
      const enhancedAchievements = await AchievementService.getAllAchievementsWithProgress(userId);
      setAchievements(enhancedAchievements);
    } catch (error) {
      console.error('AchievementsBelt: Error loading achievements:', error);
    } finally {
      setIsLoading(false);
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

  const handleSeeAll = () => {
    console.log('AchievementsBelt: See All button pressed - navigate to dedicated achievements page');
    onSeeAll?.();
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
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 24,
      marginHorizontal: 20,
      borderWidth: isDark ? 0 : 1,
      borderColor: isDark ? 'transparent' : colors.border,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    seeAllButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    seeAllText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.primary,
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
      width: CARD_WIDTH,
      height: CARD_WIDTH,
      borderRadius: 16,
      padding: 16,
      marginRight: CARD_MARGIN,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
    },
    achievementCardEarned: {
      borderStyle: 'solid',
    },
    achievementCardUnearned: {
      borderStyle: 'dashed',
      opacity: 0.6,
    },
    iconContainer: {
      width: 56,
      height: 56,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    achievementTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
      lineHeight: 18,
    },
    achievementTitleUnearned: {
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

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIcon}>
              <Feather name="award" size={20} color={colors.primary} />
            </View>
            <Text style={styles.title}>Achievements</Text>
          </View>
          <TouchableOpacity style={styles.seeAllButton} onPress={handleSeeAll}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
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
          <View style={styles.headerLeft}>
            <View style={styles.headerIcon}>
              <Feather name="award" size={20} color={colors.primary} />
            </View>
            <Text style={styles.title}>Achievements</Text>
          </View>
          <TouchableOpacity style={styles.seeAllButton} onPress={handleSeeAll}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Feather name="award" size={32} color={colors.textTertiary} />
          </View>
          <Text style={styles.emptyText}>No achievements available!</Text>
          <Text style={styles.emptySubtext}>
            Check back later for new achievements to unlock
          </Text>
        </View>
      </View>
    );
  }

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIcon}>
              <Feather name="award" size={20} color={colors.primary} />
            </View>
            <Text style={styles.title}>Achievements</Text>
          </View>
          <TouchableOpacity style={styles.seeAllButton} onPress={handleSeeAll}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          style={styles.scrollContainer}
        >
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
                    borderColor: isEarned ? colorScheme.border : colors.textTertiary,
                    backgroundColor: isEarned ? 
                      (isDark ? colorScheme.primary + '20' : colorScheme.background) : 
                      colors.surface,
                  }
                ]}
                onPress={() => handleAchievementPress(achievement)}
              >
                <View style={[
                  styles.iconContainer, 
                  { 
                    backgroundColor: isEarned ? colorScheme.primary : colors.textTertiary 
                  }
                ]}>
                  <Feather 
                    name={getIconName(achievement.icon_name)} 
                    size={28} 
                    color="white" 
                  />
                </View>
                <Text style={[
                  styles.achievementTitle,
                  !isEarned && styles.achievementTitleUnearned
                ]}>
                  {achievement.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <AchievementModal
        visible={showModal}
        achievement={selectedAchievement}
        onClose={handleModalClose}
      />
    </>
  );
};