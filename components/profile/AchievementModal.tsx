import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  TouchableWithoutFeedback,
  Animated,
  Dimensions 
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { EnhancedAchievement, AchievementService } from '../../services/achievementService';
import { getAchievementColors } from '../../utils/achievementColors';

interface AchievementModalProps {
  visible: boolean;
  achievement: EnhancedAchievement | null;
  onClose: () => void;
  isNewlyEarned?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');

export const AchievementModal: React.FC<AchievementModalProps> = ({
  visible,
  achievement,
  onClose,
  isNewlyEarned = false
}) => {
  const { colors, isDark } = useTheme();

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

  const formatEarnedDate = (dateString: string) => {
    return AchievementService.formatEarnedDate(dateString);
  };

  const getRequirementText = (achievement: EnhancedAchievement): string => {
    const { criteria } = achievement;
    const { action, target, percentage, minimum_quizzes } = criteria;

    switch (action) {
      case 'first_insight':
        return 'Publish your first insight to unlock this achievement';
      case 'insights_published':
        return `Publish ${target} insights to unlock this achievement`;
      case 'first_like_given':
        return 'Give your first like to unlock this achievement';
      case 'likes_given':
        return `Give ${target} likes to unlock this achievement`;
      case 'first_like_received':
        return 'Receive your first like to unlock this achievement';
      case 'total_likes_received':
        return `Receive ${target} likes to unlock this achievement`;
      case 'first_comment':
        return 'Write your first comment to unlock this achievement';
      case 'comments_made':
        return `Write ${target} comments to unlock this achievement`;
      case 'first_quiz':
        return 'Complete your first quiz to unlock this achievement';
      case 'quizzes_completed':
        return `Complete ${target} quizzes to unlock this achievement`;
      case 'quiz_accuracy':
        return `Complete ${minimum_quizzes} quizzes with ${percentage}% accuracy to unlock`;
      case 'login_streak':
        return `Maintain a ${target}-day login streak to unlock this achievement`;
      case 'profile_completion':
        return `Complete ${percentage}% of your profile to unlock this achievement`;
      case 'first_share':
        return 'Share your first piece of content to unlock this achievement';
      case 'multi_platform_share':
        return `Share content on ${target} different platforms to unlock`;
      case 'profile_shares':
        return `Share your profile ${target} times to unlock this achievement`;
      case 'first_invite':
        return 'Send your first invite to unlock this achievement';
      case 'successful_invites':
        return `Have ${target} successful invites to unlock this achievement`;
      case 'viral_content':
        return `Get ${target} likes on a single post to unlock this achievement`;
      case 'first_supercharge':
        return 'Supercharge your first post to unlock this achievement';
      case 'leaderboard_position':
        return `Reach position ${target} on the leaderboard to unlock`;
      default:
        return 'Complete the required actions to unlock this achievement';
    }
  };

  if (!achievement) return null;

  const colorScheme = getAchievementColors(achievement.category);
  const isEarned = achievement.isEarned;

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      padding: 32,
      marginHorizontal: 24,
      maxWidth: screenWidth * 0.85,
      width: '100%',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: isEarned ? colorScheme.border : colors.border,
      opacity: isEarned ? 1 : 0.8,
    },
    closeButton: {
      position: 'absolute',
      top: 16,
      right: 16,
      padding: 8,
      borderRadius: 20,
      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    },
    newAchievementBadge: {
      backgroundColor: colorScheme.primary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      marginBottom: 20,
    },
    newAchievementText: {
      color: 'white',
      fontSize: 14,
      fontWeight: '600',
      textAlign: 'center',
    },
    iconContainer: {
      width: 100,
      height: 100,
      borderRadius: 24,
      backgroundColor: isEarned ? colorScheme.primary : colors.textTertiary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 24,
      opacity: isEarned ? 1 : 0.5,
    },
    achievementTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: isEarned ? colors.text : colors.textSecondary,
      textAlign: 'center',
      marginBottom: 12,
    },
    achievementDescription: {
      fontSize: 16,
      color: isEarned ? colors.textSecondary : colors.textTertiary,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 20,
    },
    requirementText: {
      fontSize: 16,
      color: colors.textTertiary,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 20,
      fontStyle: 'italic',
    },
    rewardContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(234, 179, 8, 0.1)' : '#FEF3C7',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 12,
      marginBottom: 16,
    },
    rewardText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#EAB308',
      marginLeft: 8,
    },
    earnedDateContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
    },
    earnedDateText: {
      fontSize: 14,
      color: colors.textTertiary,
      marginLeft: 6,
    },
    rarityBadge: {
      position: 'absolute',
      top: -8,
      right: -8,
      backgroundColor: AchievementService.getRarityColor(achievement.rarity),
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    rarityText: {
      color: 'white',
      fontSize: 12,
      fontWeight: '600',
      textTransform: 'capitalize',
    },
    progressContainer: {
      width: '100%',
      marginTop: 16,
    },
    progressLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 8,
    },
    progressBar: {
      height: 8,
      backgroundColor: colors.border,
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: colorScheme.primary,
      borderRadius: 4,
    },
    progressText: {
      fontSize: 12,
      color: colors.textTertiary,
      textAlign: 'center',
      marginTop: 4,
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <Animated.View style={styles.modalContainer}>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Feather name="x" size={20} color={colors.textSecondary} />
              </TouchableOpacity>

              {isNewlyEarned && (
                <View style={styles.newAchievementBadge}>
                  <Text style={styles.newAchievementText}>
                    🎉 NEW ACHIEVEMENT UNLOCKED!
                  </Text>
                </View>
              )}

              <View style={styles.iconContainer}>
                <View style={styles.rarityBadge}>
                  <Text style={styles.rarityText}>{achievement.rarity}</Text>
                </View>
                <Feather 
                  name={getIconName(achievement.icon_name)} 
                  size={48} 
                  color="white" 
                />
              </View>

              <Text style={styles.achievementTitle}>
                {achievement.name}
              </Text>

              <Text style={styles.achievementDescription}>
                {achievement.description}
              </Text>

              {!isEarned && (
                <Text style={styles.requirementText}>
                  {getRequirementText(achievement)}
                </Text>
              )}

              <View style={styles.rewardContainer}>
                <Feather name="zap" size={20} color="#EAB308" />
                <Text style={styles.rewardText}>
                  {achievement.voltz_reward} Voltz Reward
                </Text>
              </View>

              {isEarned && achievement.earnedAt && (
                <View style={styles.earnedDateContainer}>
                  <Feather name="calendar" size={16} color={colors.textTertiary} />
                  <Text style={styles.earnedDateText}>
                    Earned {formatEarnedDate(achievement.earnedAt)}
                  </Text>
                </View>
              )}

              {!isEarned && achievement.progress && (
                <View style={styles.progressContainer}>
                  <Text style={styles.progressLabel}>
                    Progress: {achievement.progress.current} / {achievement.progress.target}
                  </Text>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { width: `${achievement.progress.percentage}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {achievement.progress.percentage}% Complete
                  </Text>
                </View>
              )}
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};