import { supabase } from '../lib/supabase';

export interface OnboardingProgress {
  completed_steps: number;
  total_steps: number;
  completion_percentage: number;
  steps_completed: string[];
  is_completed: boolean;
}

export interface OnboardingStepCompletion {
  completed_steps: number;
  total_steps: number;
  completion_percentage: number;
  was_already_completed: boolean;
  step_completed: string;
}

// Define the onboarding steps mapped to their corresponding achievements
export const ONBOARDING_STEPS = {
  EXPLORE_ENGAGE: 'The Supporter',        // Like your first post
  COMPLETE_PROFILE: 'Profile Perfectionist', // Complete your profile 100%  
  JOIN_CONVERSATION: 'Conversation Starter', // Leave your first comment
  SHARE_KNOWLEDGE: 'First Words'          // Publish your first insight
} as const;

export type OnboardingStep = typeof ONBOARDING_STEPS[keyof typeof ONBOARDING_STEPS];

export const onboardingService = {
  // Get user's current onboarding progress based on achievements
  async getProgress(userId: string): Promise<OnboardingProgress | null> {
    try {
      // Query user achievements to check which onboarding steps are complete
      const { data, error } = await supabase
        .from('user_achievements')
        .select('title')
        .eq('user_id', userId)
        .in('title', Object.values(ONBOARDING_STEPS));

      if (error) {
        console.error('Error fetching onboarding progress:', error);
        return null;
      }

      const completedAchievements = data?.map(a => a.title) || [];
      const completedSteps = completedAchievements.length;
      const totalSteps = 4;
      const completionPercentage = (completedSteps * 100) / totalSteps;

      return {
        completed_steps: completedSteps,
        total_steps: totalSteps,
        completion_percentage: completionPercentage,
        steps_completed: completedAchievements,
        is_completed: completedSteps >= totalSteps
      };
    } catch (error) {
      console.error('Exception fetching onboarding progress:', error);
      return null;
    }
  },

  // Check if a specific step is completed by checking if achievement exists
  async isStepCompleted(userId: string, step: OnboardingStep): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select('title')
        .eq('user_id', userId)
        .eq('title', step)
        .maybeSingle();

      if (error) {
        console.error('Error checking step completion:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Exception checking step completion:', error);
      return false;
    }
  },

  // Check if onboarding is complete and award completion achievement
  async checkAndAwardCompletion(userId: string): Promise<void> {
    try {
      const progress = await this.getProgress(userId);
      
      // If all steps complete, check if completion achievement already awarded
      if (progress?.is_completed) {
        const { data: existingAchievement } = await supabase
          .from('user_achievements')
          .select('id')
          .eq('user_id', userId)
          .eq('achievement_type', 'Onboarding Graduate')
          .maybeSingle();

        // Award completion achievement if not already awarded
        if (!existingAchievement) {
          const { data: achievement } = await supabase
            .from('achievements')
            .select('*')
            .eq('name', 'Onboarding Graduate')
            .maybeSingle();

          if (achievement) {
            await supabase.rpc('award_single_achievement', {
              target_user_id: userId,
              achievement_record: achievement
            });
          }
        }
      }
    } catch (error) {
      console.error('Exception checking onboarding completion:', error);
    }
  },

  // Helper functions to check achievement completion - these are automatic now via existing achievement system

  // Get step display information with specific achievement requirements
  getStepInfo(step: OnboardingStep) {
    const stepInfo: Record<OnboardingStep, { title: string; description: string; icon: string }> = {
      [ONBOARDING_STEPS.EXPLORE_ENGAGE]: {
        title: 'Explore & Engage',
        description: 'Like your first post to show support',
        icon: 'heart'
      },
      [ONBOARDING_STEPS.COMPLETE_PROFILE]: {
        title: 'Complete Profile', 
        description: 'Fill out your profile to 100% completion',
        icon: 'user-check'
      },
      [ONBOARDING_STEPS.JOIN_CONVERSATION]: {
        title: 'Join the Conversation',
        description: 'Leave your first comment on content',
        icon: 'message-circle'
      },
      [ONBOARDING_STEPS.SHARE_KNOWLEDGE]: {
        title: 'Share Knowledge',
        description: 'Publish your first insight to the community',
        icon: 'edit-3'
      }
    };

    return stepInfo[step];
  }
};