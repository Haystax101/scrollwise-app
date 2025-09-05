import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { AchievementService, EnhancedAchievement } from '../../services/achievementService';
import { getAchievementColors } from '../../utils/achievementColors';
import { AchievementModal } from './AchievementModal';

interface AchievementsBeltProps {
  userId: string;
  loading?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');
const CARD_MARGIN = 12;
const CONTAINER_PADDING = 40; // 20px on each side
const AVAILABLE_WIDTH = screenWidth - CONTAINER_PADDING;
const CARD_WIDTH = (AVAILABLE_WIDTH - CARD_MARGIN) / 2; // 2 cards per row with margin

export const AchievementsBelt: React.FC<AchievementsBeltProps> = ({
  userId,
  loading = false
}) => {
  const { colors, isDark } = useTheme();
  const [achievements, setAchievements] = useState<EnhancedAchievement[]>([]);
  const [isLoading, setIsLoading] = useState(loading);
  const [selectedAchievement, setSelectedAchievement] = useState<EnhancedAchievement | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadAchievements();
  }, [userId]);

  const loadAchievements = async () => {
    setIsLoading(true);
    try {
      const enhancedAchievements = await AchievementService.getAllAchievementsWithProgress(userId);
      setAchievements(enhancedAchievements);
    } catch (error) {
      console.error('Error loading achievements:', error);
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