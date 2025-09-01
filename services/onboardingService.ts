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

// Define the onboarding steps
export const ONBOARDING_STEPS = {
  EXPLORE_ENGAGE: 'explore_engage',
  COMPLETE_PROFILE: 'complete_profile', 
  JOIN_CONVERSATION: 'join_conversation',
  SHARE_KNOWLEDGE: 'share_knowledge'
} as const;

export type OnboardingStep = typeof ONBOARDING_STEPS[keyof typeof ONBOARDING_STEPS];

export const onboardingService = {
  // Complete a specific onboarding step
  async completeStep(
    userId: string, 
    step: OnboardingStep, 
    metadata: Record<string, any> = {}
  ): Promise<OnboardingStepCompletion | null> {
    try {
      const { data, error } = await supabase.rpc('complete_onboarding_step', {
        user_uuid: userId,
        step_name: step,
        step_metadata: metadata
      });

      if (error) {
        console.error('Error completing onboarding step:', error);
        return null;
      }

      const result = Array.isArray(data) ? data[0] : data;
      return {
        completed_steps: result?.completed_steps || 0,
        total_steps: result?.total_steps || 4,
        completion_percentage: result?.completion_percentage || 0,
        was_already_completed: result?.was_already_completed || false,
        step_completed: result?.step_completed || step
      };
    } catch (error) {
      console.error('Exception completing onboarding step:', error);
      return null;
    }
  },

  // Get user's current onboarding progress
  async getProgress(userId: string): Promise<OnboardingProgress | null> {
    try {
      const { data, error } = await supabase.rpc('get_onboarding_progress', {
        user_uuid: userId
      });

      if (error) {
        console.error('Error fetching onboarding progress:', error);
        return null;
      }

      const result = Array.isArray(data) ? data[0] : data;
      return {
        completed_steps: result?.completed_steps || 0,
        total_steps: result?.total_steps || 4,
        completion_percentage: result?.completion_percentage || 0,
        steps_completed: result?.steps_completed || [],
        is_completed: result?.is_completed || false
      };
    } catch (error) {
      console.error('Exception fetching onboarding progress:', error);
      return null;
    }
  },

  // Check if a specific step is completed
  async isStepCompleted(userId: string, step: OnboardingStep): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('onboarding_progress')
        .select('step_name')
        .eq('user_id', userId)
        .eq('step_name', step)
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

  // Helper functions for specific step completions with contextual metadata
  async completeExploreEngage(userId: string, metadata: { interactions_count?: number } = {}) {
    return this.completeStep(userId, ONBOARDING_STEPS.EXPLORE_ENGAGE, metadata);
  },

  async completeProfile(userId: string, metadata: { completion_percentage?: number } = {}) {
    return this.completeStep(userId, ONBOARDING_STEPS.COMPLETE_PROFILE, metadata);
  },

  async joinConversation(userId: string, metadata: { action?: 'like' | 'comment' | 'save'; target?: string } = {}) {
    return this.completeStep(userId, ONBOARDING_STEPS.JOIN_CONVERSATION, metadata);
  },

  async shareKnowledge(userId: string, metadata: { insight_id?: string; content_type?: string } = {}) {
    return this.completeStep(userId, ONBOARDING_STEPS.SHARE_KNOWLEDGE, metadata);
  },

  // Get step display information
  getStepInfo(step: OnboardingStep) {
    const stepInfo: Record<OnboardingStep, { title: string; description: string; icon: string }> = {
      [ONBOARDING_STEPS.EXPLORE_ENGAGE]: {
        title: 'Explore & Engage',
        description: 'Browse the feed and interact with content',
        icon: 'compass'
      },
      [ONBOARDING_STEPS.COMPLETE_PROFILE]: {
        title: 'Complete Profile', 
        description: 'Fill out your profile information',
        icon: 'user'
      },
      [ONBOARDING_STEPS.JOIN_CONVERSATION]: {
        title: 'Join the Conversation',
        description: 'Like, comment, or save content',
        icon: 'message-circle'
      },
      [ONBOARDING_STEPS.SHARE_KNOWLEDGE]: {
        title: 'Share Knowledge',
        description: 'Publish your first insight',
        icon: 'edit'
      }
    };

    return stepInfo[step];
  }
};