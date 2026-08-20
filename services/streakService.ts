import { supabase } from '../lib/supabase';

export interface StreakInfo {
  current_streak: number;
  longest_streak: number;
  target_days: number;
  last_activity_date: string | null;
  days_until_reset: number;
  is_active_today: boolean;
}

export const streakService = {
  /**
   * Initialize user streak during onboarding
   */
  async initializeStreak(userId: string, targetDays: number = 30): Promise<boolean> {
    if (!userId || userId.trim() === '') {
      console.log('streakService.initializeStreak: Invalid userId provided:', userId);
      return false;
    }

    try {
      console.log('Initializing streak for user:', { userId, targetDays });

      const { error } = await supabase.rpc('setup_user_learning_streak', {
        user_id_param: userId,
        target_days_param: targetDays
      });

      if (error) {
        console.error('Error initializing streak:', error);
        return false;
      }

      console.log('Streak initialized successfully');
      return true;
    } catch (error) {
      console.error('Unexpected error initializing streak:', error);
      return false;
    }
  },

  /**
   * Log daily app activity (called on app launch/significant interactions)
   */
  async logDailyActivity(
    userId: string,
    activityTypes: string[] = ['app_open']
  ): Promise<boolean> {
    if (!userId || userId.trim() === '') {
      console.log('streakService.logDailyActivity: Invalid userId provided:', userId);
      return false;
    }

    try {
      console.log('Logging daily activity:', { userId, activityTypes });

      const { error } = await supabase.rpc('log_daily_activity', {
        user_id_param: userId,
        activity_types_param: activityTypes
      });

      if (error) {
        console.error('Error logging daily activity:', error);
        return false;
      }

      console.log('Daily activity logged successfully');
      return true;
    } catch (error) {
      console.error('Unexpected error logging activity:', error);
      return false;
    }
  },

  /**
   * Get current streak information for display
   */
  async getStreakInfo(userId: string): Promise<StreakInfo | null> {
    if (!userId || userId.trim() === '') {
      console.log('streakService.getStreakInfo: Invalid userId provided:', userId);
      return null;
    }

    try {
      console.log('Getting streak info for user:', userId);

      const { data, error } = await supabase.rpc('get_user_streak_info', {
        user_id_param: userId
      });

      if (error) {
        console.error('Error getting streak info:', error);
        return null;
      }

      if (!data || data.length === 0) {
        console.log('No streak data found, returning defaults');
        return {
          current_streak: 1,
          longest_streak: 1,
          target_days: 30,
          last_activity_date: null,
          days_until_reset: 1,
          is_active_today: false
        };
      }

      const streakInfo = data[0];
      console.log('Streak info retrieved:', streakInfo);
      return streakInfo;
    } catch (error) {
      console.error('Unexpected error getting streak info:', error);
      return null;
    }
  },

  /**
   * Check if user has been active today (GMT timezone)
   */
  async checkTodayActivity(userId: string): Promise<boolean> {
    try {
      const today = new Date().toISOString().split('T')[0]; // GMT date
      console.log('Checking activity for date:', today);

      const { data, error } = await supabase
        .from('user_daily_activities')
        .select('id')
        .eq('user_id', userId)
        .eq('activity_date', today)
        .maybeSingle();

      if (error) {
        console.error('Error checking today activity:', error);
        return false;
      }

      const hasActivity = !!data;
      console.log('Today activity check result:', hasActivity);
      return hasActivity;
    } catch (error) {
      console.error('Unexpected error checking today activity:', error);
      return false;
    }
  },

  /**
   * Update streak target (user can change their goal)
   */
  async updateStreakTarget(userId: string, newTarget: number): Promise<boolean> {
    try {
      console.log('Updating streak target:', { userId, newTarget });

      const { error } = await supabase
        .from('user_streaks')
        .update({
          target_days: newTarget,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('streak_type', 'daily_learning')
        .eq('is_active', true);

      if (error) {
        console.error('Error updating streak target:', error);
        return false;
      }

      console.log('Streak target updated successfully');
      return true;
    } catch (error) {
      console.error('Unexpected error updating streak target:', error);
      return false;
    }
  },

  /**
   * Get streak history for analytics/display
   */
  async getStreakHistory(userId: string, days: number = 30): Promise<any[]> {
    try {
      console.log('Getting streak history:', { userId, days });

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);

      const { data, error } = await supabase
        .from('user_daily_activities')
        .select('activity_date, activity_types, total_minutes_active, interactions_count')
        .eq('user_id', userId)
        .gte('activity_date', startDate.toISOString().split('T')[0])
        .lte('activity_date', endDate.toISOString().split('T')[0])
        .order('activity_date', { ascending: true });

      if (error) {
        console.error('Error getting streak history:', error);
        return [];
      }

      console.log('Streak history retrieved:', data?.length, 'days');
      return data || [];
    } catch (error) {
      console.error('Unexpected error getting streak history:', error);
      return [];
    }
  },

  /**
   * Log specific learning activity (called when user completes content)
   */
  async logLearningActivity(
    userId: string,
    contentType: 'article' | 'paper' | 'book' | 'insight' | 'quiz' = 'article',
    additionalTypes: string[] = []
  ): Promise<boolean> {
    const activityTypes = ['learning_activity', contentType, ...additionalTypes];
    return this.logDailyActivity(userId, activityTypes);
  },

  /**
   * Check if streak is at risk (user hasn't been active today and it's past a certain time)
   */
  isStreakAtRisk(streakInfo: StreakInfo | null): boolean {
    if (!streakInfo) return false;

    const now = new Date();
    const currentHour = now.getUTCHours(); // Use UTC for consistency

    // Consider streak at risk after 6 PM GMT if no activity today
    return !streakInfo.is_active_today && currentHour >= 18;
  },

  /**
   * Get motivational message based on streak status
   */
  getStreakMessage(streakInfo: StreakInfo | null): string {
    if (!streakInfo) return "Start your learning streak today!";

    const { current_streak, target_days, is_active_today } = streakInfo;

    if (is_active_today) {
      if (current_streak === 1) {
        return "Great start! Keep the momentum going.";
      } else if (current_streak < 7) {
        return `${current_streak} days strong! You're building a habit.`;
      } else if (current_streak < 30) {
        return `Amazing ${current_streak}-day streak! You're on fire! 🔥`;
      } else {
        return `Incredible ${current_streak}-day streak! You're a learning machine! 🚀`;
      }
    } else {
      if (this.isStreakAtRisk(streakInfo)) {
        return `Don't break your ${current_streak}-day streak! Learn something new today.`;
      } else {
        return `Continue your ${current_streak}-day streak with some learning today.`;
      }
    }
  },

  /**
   * Calculate progress towards target
   */
  getTargetProgress(streakInfo: StreakInfo | null): number {
    if (!streakInfo) return 0;
    return Math.min((streakInfo.current_streak / streakInfo.target_days) * 100, 100);
  }
};