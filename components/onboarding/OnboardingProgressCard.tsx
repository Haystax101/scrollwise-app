import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { onboardingService, OnboardingProgress, ONBOARDING_STEPS } from '../../services/onboardingService';
import { supabase } from '../../lib/supabase';

interface OnboardingProgressCardProps {
  userId: string;
  onStepPress?: (step: string) => void;
}

export const OnboardingProgressCard: React.FC<OnboardingProgressCardProps> = ({
  userId,
  onStepPress
}) => {
  const { colors, isDark } = useTheme();
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const progressData = await onboardingService.getProgress(userId);
        setProgress(progressData);
      } catch (error) {
        console.error('Error fetching onboarding progress:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchProgress();
    }
  }, [userId]);

  // Set up real-time subscriptions for onboarding progress
  useEffect(() => {
    if (!userId) return;

    console.log('Setting up onboarding progress subscriptions for user:', userId);

    const subscription = supabase
      .channel(`onboarding_progress_${userId}`)
      // Subscribe to user_achievements for onboarding step completion
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_achievements',
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          console.log('New achievement earned, updating onboarding progress:', payload.new);

          // Check if the new achievement is one of the onboarding steps
          const achievementTitle = (payload.new as any).title;
          const onboardingAchievements = Object.values(ONBOARDING_STEPS);

          if (onboardingAchievements.includes(achievementTitle)) {
            console.log('Onboarding-related achievement earned:', achievementTitle);

            // Refresh the progress data
            try {
              const updatedProgress = await onboardingService.getProgress(userId);
              setProgress(updatedProgress);
            } catch (error) {
              console.error('Error refreshing onboarding progress:', error);
            }
          }
        }
      )
      // Subscribe to profiles table for profile_completion_percentage changes
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`,
        },
        async (payload) => {
          const oldCompletion = (payload.old as any)?.profile_completion_percentage || 0;
          const newCompletion = (payload.new as any)?.profile_completion_percentage || 0;

          // Only refresh if profile completion percentage changed
          if (newCompletion !== oldCompletion) {
            console.log('Profile completion changed:', oldCompletion, '→', newCompletion);

            // Refresh the progress data
            try {
              const updatedProgress = await onboardingService.getProgress(userId);
              setProgress(updatedProgress);
            } catch (error) {
              console.error('Error refreshing onboarding progress:', error);
            }
          }
        }
      )
      // Subscribe to profile_passions for "passionate_about" and "working_on" field updates
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'profile_passions',
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          console.log('Profile passions updated:', payload);

          // Refresh the progress data
          try {
            const updatedProgress = await onboardingService.getProgress(userId);
            setProgress(updatedProgress);
          } catch (error) {
            console.error('Error refreshing onboarding progress:', error);
          }
        }
      )
      // Subscribe to user_goals for career goal updates
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'user_goals',
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          console.log('User goals updated:', payload);

          // Refresh the progress data
          try {
            const updatedProgress = await onboardingService.getProgress(userId);
            setProgress(updatedProgress);
          } catch (error) {
            console.error('Error refreshing onboarding progress:', error);
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up onboarding progress subscriptions');
      supabase.removeChannel(subscription);
    };
  }, [userId]);

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      padding: 20,
      borderRadius: 16,
      marginBottom: 24,
      marginHorizontal: 20,
      borderWidth: isDark ? 0 : 1,
      borderColor: isDark ? 'transparent' : colors.border,
    },
    header: {
      alignItems: 'center',
      marginBottom: 16,
    },
    headerTop: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    headerIcon: {
      marginRight: 8,
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
    },
    completionBadge: {
      backgroundColor: colors.primary,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    completionText: {
      fontSize: 12,
      fontWeight: '600',
      color: 'white',
    },
    progressContainer: {
      position: 'relative',
      height: 8,
      backgroundColor: isDark ? '#1A202C' : colors.inputBackground,
      borderRadius: 4,
      overflow: 'hidden',
      marginBottom: 16,
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: 4,
    },
    stepsContainer: {
      gap: 12,
    },
    stepRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
    },
    stepIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    stepIconCompleted: {
      backgroundColor: colors.primary,
    },
    stepIconPending: {
      backgroundColor: colors.inputBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    stepContent: {
      flex: 1,
    },
    stepTitle: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 2,
    },
    stepTitleCompleted: {
      color: colors.text,
    },
    stepTitlePending: {
      color: colors.textSecondary,
    },
    stepDescription: {
      fontSize: 12,
      color: colors.textTertiary,
    },
    completedContainer: {
      alignItems: 'center',
      paddingVertical: 24,
    },
    completedIcon: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    completedTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
    },
    completedSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 20,
    },
    collectVoltzButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 20,
      marginTop: 8,
    },
    collectVoltzText: {
      fontSize: 16,
      fontWeight: '600',
      color: 'white',
      textAlign: 'center',
    },
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerIcon}>
              <Feather name="compass" size={18} color={colors.primary} />
            </View>
            <Text style={styles.title}>Getting Started</Text>
          </View>
        </View>
        <Text style={[styles.stepDescription, { textAlign: 'center' }]}>Loading progress...</Text>
      </View>
    );
  }

  // Show initial state for new users with no progress yet
  if (!progress) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerIcon}>
              <Feather name="compass" size={18} color={colors.primary} />
            </View>
            <Text style={styles.title}>Getting Started</Text>
          </View>
          <View style={styles.completionBadge}>
            <Text style={styles.completionText}>0/4</Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={[styles.progressFill, { width: '0%' }]} />
        </View>

        <View style={styles.stepsContainer}>
          {[
            { key: ONBOARDING_STEPS.EXPLORE_ENGAGE, ...onboardingService.getStepInfo(ONBOARDING_STEPS.EXPLORE_ENGAGE) },
            { key: ONBOARDING_STEPS.COMPLETE_PROFILE, ...onboardingService.getStepInfo(ONBOARDING_STEPS.COMPLETE_PROFILE) },
            { key: ONBOARDING_STEPS.JOIN_CONVERSATION, ...onboardingService.getStepInfo(ONBOARDING_STEPS.JOIN_CONVERSATION) },
            { key: ONBOARDING_STEPS.SHARE_KNOWLEDGE, ...onboardingService.getStepInfo(ONBOARDING_STEPS.SHARE_KNOWLEDGE) }
          ].map((step) => (
            <TouchableOpacity
              key={step.key}
              style={styles.stepRow}
              onPress={() => onStepPress?.(step.key)}
              activeOpacity={0.7}
            >
              <View style={[styles.stepIcon, styles.stepIconPending]}>
                <Feather 
                  name={step.icon as any} 
                  size={16} 
                  color={colors.textTertiary} 
                />
              </View>
              
              <View style={styles.stepContent}>
                <Text style={[styles.stepTitle, styles.stepTitlePending]}>
                  {step.title}
                </Text>
                <Text style={styles.stepDescription}>
                  {step.description}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  // If fully completed, show celebration view
  if (progress.is_completed) {
    return (
      <View style={styles.container}>
        <View style={styles.completedContainer}>
          <View style={styles.completedIcon}>
            <Feather name="award" size={32} color="white" />
          </View>
          <Text style={styles.completedTitle}>All Set! 🎉</Text>
          <Text style={styles.completedSubtitle}>
            You've completed all the getting started steps. Welcome to the community!
          </Text>
          <TouchableOpacity style={styles.collectVoltzButton} onPress={() => {
            console.log('🪙 Collect Voltz button pressed - award completion bonus');
            // TODO: Award voltz bonus for completing onboarding
          }}>
            <Text style={styles.collectVoltzText}>Collect Voltz 🪙</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Show progress for incomplete onboarding
  const progressWidth = `${progress.completion_percentage}%`;

  const allSteps = [
    { key: ONBOARDING_STEPS.EXPLORE_ENGAGE, ...onboardingService.getStepInfo(ONBOARDING_STEPS.EXPLORE_ENGAGE) },
    { key: ONBOARDING_STEPS.COMPLETE_PROFILE, ...onboardingService.getStepInfo(ONBOARDING_STEPS.COMPLETE_PROFILE) },
    { key: ONBOARDING_STEPS.JOIN_CONVERSATION, ...onboardingService.getStepInfo(ONBOARDING_STEPS.JOIN_CONVERSATION) },
    { key: ONBOARDING_STEPS.SHARE_KNOWLEDGE, ...onboardingService.getStepInfo(ONBOARDING_STEPS.SHARE_KNOWLEDGE) }
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerIcon}>
            <Feather name="compass" size={18} color={colors.primary} />
          </View>
          <Text style={styles.title}>Getting Started</Text>
        </View>
        <View style={styles.completionBadge}>
          <Text style={styles.completionText}>
            {progress.completed_steps}/{progress.total_steps}
          </Text>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={[styles.progressFill, { width: progressWidth }]} />
      </View>

      <View style={styles.stepsContainer}>
        {allSteps.map((step) => {
          // step.key is now an achievement name, so check if that achievement is in steps_completed
          const isCompleted = progress.steps_completed.includes(step.key);
          
          return (
            <TouchableOpacity
              key={step.key}
              style={styles.stepRow}
              onPress={() => onStepPress?.(step.key)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.stepIcon,
                isCompleted ? styles.stepIconCompleted : styles.stepIconPending
              ]}>
                <Feather 
                  name={isCompleted ? 'check' : step.icon as any} 
                  size={16} 
                  color={isCompleted ? 'white' : colors.textTertiary} 
                />
              </View>
              
              <View style={styles.stepContent}>
                <Text style={[
                  styles.stepTitle,
                  isCompleted ? styles.stepTitleCompleted : styles.stepTitlePending
                ]}>
                  {step.title}
                </Text>
                <Text style={styles.stepDescription}>
                  {step.description}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};