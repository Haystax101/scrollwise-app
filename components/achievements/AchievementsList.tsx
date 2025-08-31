import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { AchievementService, UserAchievement } from '../../services/achievementService';

interface AchievementsListProps {
  userId: string;
  onAchievementPress?: (achievement: UserAchievement) => void;
  showAvailable?: boolean; // Show available achievements too
  maxItems?: number; // Limit number of items shown
  horizontal?: boolean; // Horizontal scroll layout
}

interface AchievementListItem {
  id: string;
  title: string;
  description: string;
  icon_name: string;
  category: string;
  rarity?: string;
  earned_at?: string;
  voltz_reward?: number;
  is_earned: boolean;
  progress_current?: number;
  progress_total?: number;
}

export const AchievementsList: React.FC<AchievementsListProps> = ({
  userId,
  onAchievementPress,
  showAvailable = false,
  maxItems,
  horizontal = false
}) => {
  const { colors } = useTheme();
  const [achievements, setAchievements] = useState<AchievementListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    earned: 0,
    completionPercentage: 0
  });

  useEffect(() => {
    loadAchievements();
  }, [userId, showAvailable]);

  const loadAchievements = async () => {
    try {
      setLoading(true);
      
      const [userAchievements, availableAchievements] = await Promise.all([
        AchievementService.getUserAchievements(userId),
        showAvailable ? AchievementService.getAvailableAchievements() : []
      ]);

      // Create combined list
      const combinedList: AchievementListItem[] = [];
      const earnedIds = new Set(userAchievements.map(a => a.achievement_id).filter(Boolean));

      // Add earned achievements first
      userAchievements.forEach(userAch => {
        combinedList.push({
          id: userAch.id,
          title: userAch.title,
          description: userAch.description || '',
          icon_name: userAch.icon_name || 'award',
          category: userAch.achievement_type,
          earned_at: userAch.earned_at,
          is_earned: true,
          progress_current: userAch.progress_current,
          progress_total: userAch.progress_total
        });
      });

      // Add available but not earned achievements if requested
      if (showAvailable) {
        availableAchievements.forEach(availAch => {
          if (!earnedIds.has(availAch.id) && !availAch.is_secret) {
            combinedList.push({
              id: availAch.id,
              title: availAch.name,
              description: availAch.description,
              icon_name: availAch.icon_name,
              category: availAch.category,
              rarity: availAch.rarity,
              voltz_reward: availAch.voltz_reward,
              is_earned: false
            });
          }
        });
      }

      // Sort: earned first, then by category and rarity
      combinedList.sort((a, b) => {
        if (a.is_earned && !b.is_earned) return -1;
        if (!a.is_earned && b.is_earned) return 1;
        if (a.category !== b.category) return a.category.localeCompare(b.category);
        return 0;
      });

      // Apply max items limit
      const finalList = maxItems ? combinedList.slice(0, maxItems) : combinedList;
      
      setAchievements(finalList);
      setStats({
        total: showAvailable ? availableAchievements.length : userAchievements.length,
        earned: userAchievements.length,
        completionPercentage: AchievementService.calculateCompletionPercentage(
          userAchievements, 
          availableAchievements
        )
      });
    } catch (error) {
      console.error('Error loading achievements:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAchievements();
  };

  const getIconComponent = (iconName: string, size: number, color: string) => {
    // Enhanced icon mapping with multiple icon libraries
    const iconMaps = {
      feather: {
        'share': 'share',
        'users': 'users',
        'user-plus': 'user-plus',
        'link': 'link',
        'globe': 'globe',
        'heart': 'heart',
        'edit-3': 'edit-3',
        'edit': 'edit',
        'message-circle': 'message-circle',
        'zap': 'zap',
        'help-circle': 'help-circle',
        'brain': 'zap',
        'target': 'target',
        'user-check': 'user-check',
        'calendar': 'calendar',
        'calendar-heart': 'calendar',
        'trophy': 'award',
        'award': 'award',
        'check-circle': 'check-circle',
        'graduation-cap': 'award',
      },
      materialCommunity: {
        'heart-multiple': 'cards-heart',
        'message-circle-multiple': 'message-text',
        'heart-circle': 'heart-circle',
      },
      ionicons: {
        'graduation-cap': 'school',
      }
    };

    // Try Feather first
    if (iconName in iconMaps.feather) {
      return (
        <Feather 
          name={iconMaps.feather[iconName as keyof typeof iconMaps.feather] as keyof typeof Feather.glyphMap} 
          size={size} 
          color={color} 
        />
      );
    }

    // Try MaterialCommunityIcons
    if (iconName in iconMaps.materialCommunity) {
      return (
        <MaterialCommunityIcons 
          name={iconMaps.materialCommunity[iconName as keyof typeof iconMaps.materialCommunity] as keyof typeof MaterialCommunityIcons.glyphMap} 
          size={size} 
          color={color} 
        />
      );
    }

    // Try Ionicons
    if (iconName in iconMaps.ionicons) {
      return (
        <Ionicons 
          name={iconMaps.ionicons[iconName as keyof typeof iconMaps.ionicons] as keyof typeof Ionicons.glyphMap} 
          size={size} 
          color={color} 
        />
      );
    }

    return <Feather name="award" size={size} color={color} />;
  };

  const getRarityColor = (rarity?: string) => {
    if (!rarity) return colors.primary;
    
    const rarityColors = {
      common: '#9CA3AF',
      uncommon: '#10B981',
      rare: '#3B82F6',
      epic: '#8B5CF6',
      legendary: '#F59E0B',
    };
    return rarityColors[rarity as keyof typeof rarityColors] || colors.primary;
  };

  const getCategoryColor = (category: string) => {
    const categoryColors = {
      learning: '#10B981',
      engagement: '#F59E0B',
      streak: '#EF4444',
      milestone: '#8B5CF6',
      social: '#3B82F6',
      skill: '#06B6D4',
      completion: '#10B981',
    };
    return categoryColors[category as keyof typeof categoryColors] || colors.primary;
  };

  const renderAchievementItem = ({ item }: { item: AchievementListItem }) => {
    const iconColor = item.is_earned ? 'white' : colors.textTertiary;
    const containerColor = item.is_earned 
      ? getRarityColor(item.rarity) || getCategoryColor(item.category)
      : colors.border;

    return (
      <TouchableOpacity 
        style={[
          styles.achievementCard,
          horizontal && styles.horizontalCard,
          { 
            opacity: item.is_earned ? 1 : 0.6,
            borderColor: item.is_earned ? containerColor : colors.border
          }
        ]}
        onPress={() => onAchievementPress && item.is_earned && onAchievementPress({
          id: item.id,
          user_id: userId,
          achievement_type: item.category,
          title: item.title,
          description: item.description,
          icon_name: item.icon_name,
          earned_at: item.earned_at || '',
          progress_current: item.progress_current || 0,
          progress_total: item.progress_total || 1,
          is_featured: false,
          notification_sent: false
        } as UserAchievement)}
        disabled={!item.is_earned}
      >
        <View style={[styles.iconContainer, { backgroundColor: containerColor }]}>
          {getIconComponent(item.icon_name, 20, iconColor)}
          {!item.is_earned && (
            <View style={styles.lockOverlay}>
              <Feather name="lock" size={12} color={colors.textTertiary} />
            </View>
          )}
        </View>
        
        <View style={styles.contentContainer}>
          <Text style={[styles.title, !item.is_earned && styles.lockedTitle]}>
            {item.title}
          </Text>
          <Text style={[styles.description, !item.is_earned && styles.lockedDescription]}>
            {item.description}
          </Text>
          
          <View style={styles.footer}>
            {item.is_earned ? (
              <Text style={styles.earnedDate}>
                {item.earned_at && AchievementService.formatEarnedDate(item.earned_at)}
              </Text>
            ) : (
              <View style={styles.rewardContainer}>
                <Feather name="zap" size={12} color={colors.primary} />
                <Text style={styles.rewardText}>
                  {item.voltz_reward || 0} voltz
                </Text>
              </View>
            )}
            
            {item.rarity && (
              <View style={[styles.rarityBadge, { backgroundColor: getRarityColor(item.rarity) + '20' }]}>
                <Text style={[styles.rarityText, { color: getRarityColor(item.rarity) }]}>
                  {item.rarity}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
    },
    statsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statsText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginRight: 8,
    },
    achievementCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginHorizontal: horizontal ? 8 : 20,
      marginVertical: 6,
      flexDirection: 'row',
      alignItems: 'flex-start',
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    horizontalCard: {
      marginHorizontal: 8,
      width: 280,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
      position: 'relative',
    },
    lockOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.overlay,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    contentContainer: {
      flex: 1,
    },
    title: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 4,
    },
    lockedTitle: {
      color: colors.textSecondary,
    },
    description: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: 8,
    },
    lockedDescription: {
      color: colors.textTertiary,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    earnedDate: {
      fontSize: 12,
      color: colors.textTertiary,
    },
    rewardContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    rewardText: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: '600',
      marginLeft: 4,
    },
    rarityBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
    },
    rarityText: {
      fontSize: 10,
      fontWeight: 'bold',
      textTransform: 'uppercase',
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
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
    emptyDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.statsText, { marginTop: 16 }]}>Loading achievements...</Text>
      </View>
    );
  }

  if (achievements.length === 0) {
    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIcon}>
          <Feather name="award" size={48} color={colors.textTertiary} />
        </View>
        <Text style={styles.emptyTitle}>
          {showAvailable ? 'No Achievements Available' : 'No Achievements Yet'}
        </Text>
        <Text style={styles.emptyDescription}>
          {showAvailable 
            ? 'Check back later for new achievements to unlock!'
            : 'Start engaging with content to earn your first achievement!'
          }
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {showAvailable && (
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Achievements</Text>
          <View style={styles.statsContainer}>
            <Text style={styles.statsText}>
              {stats.earned}/{stats.total} ({stats.completionPercentage}%)
            </Text>
            <Feather name="award" size={16} color={colors.primary} />
          </View>
        </View>
      )}
      
      <FlatList
        data={achievements}
        renderItem={renderAchievementItem}
        keyExtractor={(item) => item.id}
        horizontal={horizontal}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={!horizontal}
        refreshControl={
          !horizontal ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
            />
          ) : undefined
        }
        contentContainerStyle={
          horizontal ? { paddingHorizontal: 12 } : { paddingVertical: 8 }
        }
      />
    </View>
  );
};