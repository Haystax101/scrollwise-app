import { supabase } from '../lib/supabase';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon_name: string;
  category: 'learning' | 'engagement' | 'streak' | 'milestone' | 'social' | 'skill' | 'completion';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  criteria: Record<string, any>;
  voltz_reward: number;
  is_active: boolean;
  is_secret: boolean;
  unlock_order: number;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id?: string;
  achievement_type: string;
  title: string;
  description?: string;
  icon_name?: string;
  earned_at: string;
  progress_current: number;
  progress_total: number;
  is_featured: boolean;
  notification_sent: boolean;
  unlock_context?: Record<string, any>;
}

export interface EnhancedAchievement {
  id: string;
  name: string;
  description: string;
  icon_name: string;
  category: 'learning' | 'engagement' | 'streak' | 'milestone' | 'social' | 'skill' | 'completion';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  criteria: Record<string, any>;
  voltz_reward: number;
  is_secret: boolean;
  unlock_order: number;
  isEarned: boolean;
  earnedAt?: string;
  userAchievementId?: string;
  progress?: {
    current: number;
    target: number;
    percentage: number;
  };
}

export interface AchievementProgress {
  id: string;
  user_id: string;
  achievement_id: string;
  progress_data: Record<string, any>;
  current_value: number;
  target_value: number;
  last_progress_date: string;
  is_completed: boolean;
}

export class AchievementService {
  // Fetch all available achievements
  static async getAvailableAchievements(): Promise<Achievement[]> {
    try {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('is_active', true)
        .order('unlock_order', { ascending: true });

      if (error) {
        console.error('Error fetching achievements:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Exception fetching achievements:', error);
      return [];
    }
  }

  // Fetch user's earned achievements
  static async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    try {
      // Validate userId parameter
      if (!userId || userId.trim() === '') {
        console.error('❌ Invalid userId provided to getUserAchievements:', userId);
        return [];
      }

      const { data, error } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId)
        .order('earned_at', { ascending: false });

      if (error) {
        console.error('Error fetching user achievements:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Exception fetching user achievements:', error);
      return [];
    }
  }

  // Fetch recent achievements (for notifications)
  static async getRecentAchievements(userId: string, sinceDate?: string): Promise<UserAchievement[]> {
    try {
      let query = supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId)
        .eq('notification_sent', false)
        .order('earned_at', { ascending: false });

      if (sinceDate) {
        query = query.gte('earned_at', sinceDate);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching recent achievements:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Exception fetching recent achievements:', error);
      return [];
    }
  }

  // Mark achievements as notification sent
  static async markNotificationsSent(achievementIds: string[]): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_achievements')
        .update({ notification_sent: true })
        .in('id', achievementIds);

      if (error) {
        console.error('Error marking notifications sent:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Exception marking notifications sent:', error);
      return false;
    }
  }

  // Get achievement progress for specific achievements
  static async getAchievementProgress(userId: string, achievementId?: string): Promise<AchievementProgress[]> {
    try {
      console.log('🔍 getAchievementProgress called with:', { userId, achievementId });
      
      // Validate userId parameter
      if (!userId || userId.trim() === '') {
        console.error('❌ Invalid userId provided to getAchievementProgress:', userId);
        return [];
      }
      
      let query = supabase
        .from('user_achievement_progress')
        .select('*')
        .eq('user_id', userId);

      if (achievementId && achievementId.trim() !== '') {
        console.log('🔍 Adding achievement_id filter:', achievementId);
        query = query.eq('achievement_id', achievementId);
      } else if (achievementId !== undefined) {
        console.warn('⚠️ achievementId provided but is empty/invalid:', JSON.stringify(achievementId));
      }

      console.log('🔍 Executing achievement progress query...');
      const { data, error } = await query;

      if (error) {
        console.error('❌ Database error fetching achievement progress:', error);
        console.error('❌ Query parameters:', { userId, achievementId });
        return [];
      }

      console.log('✅ Successfully fetched achievement progress:', data?.length || 0, 'records');
      return data || [];
    } catch (error) {
      console.error('❌ Exception fetching achievement progress:', error);
      console.error('❌ Parameters:', { userId, achievementId });
      return [];
    }
  }

  // Subscribe to new achievements for real-time notifications
  static subscribeToUserAchievements(userId: string, callback: (achievement: UserAchievement) => void) {
    const subscription = supabase
      .channel(`user_achievements_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_achievements',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('New achievement earned:', payload.new);
          callback(payload.new as UserAchievement);
        }
      )
      .subscribe();

    return subscription;
  }

  // Check if user meets specific achievement criteria (client-side validation)
  static checkAchievementCriteria(
    achievement: Achievement, 
    userStats: Record<string, any>
  ): boolean {
    const { criteria } = achievement;
    const { action, target, percentage, minimum_quizzes } = criteria;

    try {
      switch (action) {
        case 'first_insight':
          return userStats.insights_published >= 1;

        case 'insights_published':
          return userStats.insights_published >= target;

        case 'first_like_given':
          return userStats.likes_given >= 1;

        case 'likes_given':
          return userStats.likes_given >= target;

        case 'first_like_received':
          return userStats.likes_received >= 1;

        case 'total_likes_received':
          return userStats.likes_received >= target;

        case 'first_comment':
          return userStats.comments_made >= 1;

        case 'comments_made':
          return userStats.comments_made >= target;

        case 'first_quiz':
          return userStats.quizzes_completed >= 1;

        case 'quizzes_completed':
          return userStats.quizzes_completed >= target;

        case 'quiz_accuracy':
          return userStats.quizzes_completed >= minimum_quizzes && 
                 userStats.quiz_accuracy_percentage >= percentage;

        case 'login_streak':
          return userStats.current_login_streak >= target;

        case 'profile_completion':
          return userStats.profile_completion_percentage >= percentage;

        case 'first_share':
          return userStats.content_shared >= 1;

        case 'multi_platform_share':
          return userStats.platforms_shared_to >= target;

        case 'profile_shares':
          return userStats.profile_shares >= target;

        case 'first_invite':
          return userStats.invites_sent >= 1;

        case 'successful_invites':
          return userStats.successful_invites >= target;

        case 'viral_content':
          return userStats.max_likes_on_single_post >= target;

        case 'first_supercharge':
          return userStats.posts_supercharged >= 1;

        case 'leaderboard_position':
          return userStats.leaderboard_rank <= target && userStats.leaderboard_rank > 0;

        default:
          console.warn(`Unknown achievement criteria action: ${action}`);
          return false;
      }
    } catch (error) {
      console.error('Error checking achievement criteria:', error);
      return false;
    }
  }

  // Get achievement rarity color
  static getRarityColor(rarity: string): string {
    const colors: Record<string, string> = {
      common: '#9CA3AF', // Gray
      uncommon: '#10B981', // Green
      rare: '#3B82F6', // Blue
      epic: '#8B5CF6', // Purple
      legendary: '#F59E0B', // Gold
    };
    return colors[rarity] || colors.common;
  }

  // Get achievement category color
  static getCategoryColor(category: string): string {
    const colors: Record<string, string> = {
      learning: '#10B981', // Green
      engagement: '#F59E0B', // Yellow
      streak: '#EF4444', // Red
      milestone: '#8B5CF6', // Purple
      social: '#3B82F6', // Blue
      skill: '#06B6D4', // Cyan
      completion: '#10B981', // Green
    };
    return colors[category] || colors.learning;
  }

  // Format achievement earned date
  static formatEarnedDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return 'Today';
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
  }

  // Calculate achievement completion percentage for user
  static calculateCompletionPercentage(
    userAchievements: UserAchievement[], 
    availableAchievements: Achievement[]
  ): number {
    if (availableAchievements.length === 0) return 0;
    return Math.round((userAchievements.length / availableAchievements.length) * 100);
  }

  // Get all achievements with user progress (earned + unearned)
  static async getAllAchievementsWithProgress(userId: string): Promise<EnhancedAchievement[]> {
    try {
      console.log('🚀 Starting getAllAchievementsWithProgress for user:', userId);
      
      // Validate userId parameter
      if (!userId || userId.trim() === '') {
        console.error('❌ Invalid userId provided to getAllAchievementsWithProgress:', userId);
        return [];
      }
      
      // Fetch all available achievements
      console.log('📋 Fetching available achievements...');
      const availableAchievements = await this.getAvailableAchievements();
      console.log('✅ Available achievements fetched:', availableAchievements.length);
      
      // Fetch user's earned achievements
      console.log('🏆 Fetching user achievements...');
      const userAchievements = await this.getUserAchievements(userId);
      console.log('✅ User achievements fetched:', userAchievements.length);
      
      // Fetch user's achievement progress
      console.log('📊 Fetching user achievement progress...');
      const achievementProgress = await this.getAchievementProgress(userId);
      console.log('✅ Achievement progress fetched:', achievementProgress.length);
      
      // Create a map of earned achievements for quick lookup
      console.log('🗺️ Creating earned achievements map...');
      const earnedAchievementMap = new Map<string, UserAchievement>();
      userAchievements.forEach(userAch => {
        if (userAch.achievement_id && userAch.achievement_id.trim() !== '') {
          earnedAchievementMap.set(userAch.achievement_id, userAch);
        } else {
          console.warn('⚠️ Skipping user achievement with invalid achievement_id:', {
            id: userAch.id,
            achievement_id: userAch.achievement_id,
            title: userAch.title
          });
        }
      });
      console.log('✅ Earned achievements map created with', earnedAchievementMap.size, 'valid entries');
      
      // Create a map of progress for quick lookup
      console.log('📈 Creating progress map...');
      const progressMap = new Map<string, AchievementProgress>();
      achievementProgress.forEach(progress => {
        if (progress.achievement_id && progress.achievement_id.trim() !== '') {
          progressMap.set(progress.achievement_id, progress);
        } else {
          console.warn('⚠️ Skipping progress record with invalid achievement_id:', {
            id: progress.id,
            achievement_id: progress.achievement_id,
            user_id: progress.user_id
          });
        }
      });
      console.log('✅ Progress map created with', progressMap.size, 'valid entries');
      
      // Merge data to create enhanced achievements
      const enhancedAchievements: EnhancedAchievement[] = availableAchievements.map(achievement => {
        const userAchievement = earnedAchievementMap.get(achievement.id);
        const progress = progressMap.get(achievement.id);
        
        return {
          id: achievement.id,
          name: achievement.name,
          description: achievement.description,
          icon_name: achievement.icon_name,
          category: achievement.category,
          rarity: achievement.rarity,
          criteria: achievement.criteria,
          voltz_reward: achievement.voltz_reward,
          is_secret: achievement.is_secret,
          unlock_order: achievement.unlock_order,
          isEarned: !!userAchievement,
          earnedAt: userAchievement?.earned_at,
          userAchievementId: userAchievement?.id,
          progress: progress ? {
            current: progress.current_value,
            target: progress.target_value,
            percentage: Math.round((progress.current_value / progress.target_value) * 100)
          } : undefined
        };
      });
      
      // Sort: earned first, then by unlock_order
      return enhancedAchievements.sort((a, b) => {
        if (a.isEarned === b.isEarned) {
          return a.unlock_order - b.unlock_order;
        }
        return a.isEarned ? -1 : 1;
      });
      
    } catch (error) {
      console.error('Exception fetching all achievements with progress:', error);
      return [];
    }
  }

  // Get achievement statistics
  static getAchievementStats(userAchievements: UserAchievement[]) {
    const stats = {
      total: userAchievements.length,
      byCategory: {} as Record<string, number>,
      byRarity: {} as Record<string, number>,
      totalVoltzEarned: 0,
      recentCount: 0, // Last 7 days
    };

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    userAchievements.forEach(achievement => {
      // Count by category
      const category = achievement.achievement_type;
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;

      // Count recent achievements
      const earnedDate = new Date(achievement.earned_at);
      if (earnedDate >= weekAgo) {
        stats.recentCount++;
      }
    });

    return stats;
  }
}