// Examples of how to integrate onboarding completion tracking throughout the app

import { onboardingService, ONBOARDING_STEPS } from '../services/onboardingService';

/**
 * Example 1: In MainFeed.tsx - Track when user explores and engages
 */
export const trackExploreEngage = async (userId: string) => {
  // Track when user scrolls through feed and interacts
  // Could be triggered after user views X number of posts or spends X time in feed
  const result = await onboardingService.completeExploreEngage(userId, {
    interactions_count: 5 // example metadata
  });
  
  if (result && !result.was_already_completed) {
    console.log('🎉 User completed explore & engage step!');
    // Show celebration animation or toast
  }
};

/**
 * Example 2: In Profile editing - Track profile completion
 */
export const trackProfileCompletion = async (userId: string, completionPercentage: number) => {
  // Track when user fills out significant portions of their profile
  if (completionPercentage >= 70) { // Example threshold
    const result = await onboardingService.completeProfile(userId, {
      completion_percentage: completionPercentage
    });
    
    if (result && !result.was_already_completed) {
      console.log('🎉 User completed profile step!');
    }
  }
};

/**
 * Example 3: In like/comment/save handlers - Track conversation joining
 */
export const trackConversationJoining = async (userId: string, action: 'like' | 'comment' | 'save', targetId: string) => {
  const result = await onboardingService.joinConversation(userId, {
    action,
    target: targetId
  });
  
  if (result && !result.was_already_completed) {
    console.log('🎉 User joined the conversation!');
  }
};

/**
 * Example 4: In insight publishing - Track knowledge sharing
 */
export const trackKnowledgeSharing = async (userId: string, insightId: string) => {
  const result = await onboardingService.shareKnowledge(userId, {
    insight_id: insightId,
    content_type: 'insight'
  });
  
  if (result && !result.was_already_completed) {
    console.log('🎉 User shared their first knowledge!');
  }
};

/**
 * Example 5: Integration in InsightCard.tsx for like button
 */
export const handleLikeWithOnboarding = async (insightId: string, userId: string) => {
  // Normal like functionality
  // ... existing like logic ...
  
  // Track onboarding progress
  await trackConversationJoining(userId, 'like', insightId);
};

/**
 * Example 6: Integration in InsightsPublisher.tsx
 */
export const handlePublishInsightWithOnboarding = async (content: string, userId: string) => {
  try {
    // Normal publishing logic
    // const publishResult = await publishInsight(content, userId);
    
    // Track onboarding progress
    // await trackKnowledgeSharing(userId, publishResult.id);
    
    console.log('Insight published and onboarding tracked!');
  } catch (error) {
    console.error('Error publishing insight:', error);
  }
};

/**
 * Example 7: Check onboarding status for conditional UI
 */
export const getOnboardingStatus = async (userId: string) => {
  const progress = await onboardingService.getProgress(userId);
  
  if (progress) {
    return {
      shouldShowProgressCard: !progress.is_completed && progress.completed_steps > 0,
      shouldShowWelcomePrompts: progress.completed_steps === 0,
      shouldShowCelebration: progress.is_completed,
      nextStep: getNextIncompleteStep(progress)
    };
  }
  
  return null;
};

const getNextIncompleteStep = (progress: any) => {
  const allSteps = [
    ONBOARDING_STEPS.EXPLORE_ENGAGE,
    ONBOARDING_STEPS.COMPLETE_PROFILE,
    ONBOARDING_STEPS.JOIN_CONVERSATION,
    ONBOARDING_STEPS.SHARE_KNOWLEDGE
  ];
  
  return allSteps.find(step => !progress.steps_completed.includes(step));
};

/**
 * Example 8: Integration in NewProfile.tsx
 */
export const addOnboardingToProfile = `
// In NewProfile.tsx, add this import:
import { OnboardingProgressCard } from '../onboarding/OnboardingProgressCard';

// In the component JSX, add this after LevelProgressCard:
{progress && !progress.is_completed && (
  <OnboardingProgressCard 
    userId={currentUser.id}
    onStepPress={(step) => {
      // Handle step press - could navigate to relevant screen
      console.log('User wants to complete step:', step);
    }}
  />
)}
`;