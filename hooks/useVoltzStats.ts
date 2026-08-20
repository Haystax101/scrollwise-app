import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import * as Haptics from 'expo-haptics';

export interface VoltzStats {
  total_voltz_earned: number;
  spendable_voltz: number;
  level: number;
  level_progress: number;
  voltz_to_next_level: number;
  voltz_for_current_level: number;
  voltz_for_next_level: number;
  is_levelled?: boolean;
}

interface UseVoltzStatsResult {
  stats: VoltzStats | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to fetch and subscribe to real-time voltz/level stats for a user
 * Automatically detects level-ups and triggers haptic feedback
 */
export function useVoltzStats(userId: string | undefined): UseVoltzStatsResult {
  const [stats, setStats] = useState<VoltzStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [previousLevel, setPreviousLevel] = useState<number | null>(null);

  // Function to fetch voltz stats
  const fetchStats = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Call the get_user_voltz_stats function
      const { data, error: rpcError } = await supabase
        .rpc('get_user_voltz_stats', { p_user_id: userId });

      if (rpcError) {
        throw rpcError;
      }

      if (data && data.length > 0) {
        const statsData = data[0] as VoltzStats;

        // Check if user leveled up (compare with previous level)
        if (previousLevel !== null && statsData.level > previousLevel) {
          console.log('Level up detected!', previousLevel, '→', statsData.level);

          // Trigger haptic feedback for level up
          try {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch (hapticError) {
            console.warn('Haptic feedback failed:', hapticError);
          }
        }

        // Update stats and previous level
        setStats(statsData);
        setPreviousLevel(statsData.level);
      }
    } catch (err) {
      console.error('Error fetching voltz stats:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchStats();
  }, [userId]);

  // Set up real-time subscription to profiles table for voltz/level changes
  useEffect(() => {
    if (!userId) return;

    console.log('Setting up voltz stats subscription for user:', userId);

    const subscription = supabase
      .channel(`voltz_stats_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`,
        },
        async (payload) => {
          const oldStats = payload.old as any;
          const newStats = payload.new as any;

          // Check if voltz or level changed
          const voltzChanged =
            oldStats.total_voltz_earned !== newStats.total_voltz_earned ||
            oldStats.spendable_voltz !== newStats.spendable_voltz;

          const levelChanged = oldStats.level !== newStats.level;

          if (voltzChanged || levelChanged) {
            console.log('Voltz/Level changed - refreshing stats');

            // If level changed, trigger haptic feedback immediately
            if (levelChanged && newStats.level > oldStats.level) {
              console.log('Level up detected in real-time!', oldStats.level, '→', newStats.level);

              try {
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              } catch (hapticError) {
                console.warn('Haptic feedback failed:', hapticError);
              }
            }

            // Refresh stats to get updated calculations
            await fetchStats();
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up voltz stats subscription');
      supabase.removeChannel(subscription);
    };
  }, [userId]);

  return {
    stats,
    loading,
    error,
    refresh: fetchStats,
  };
}
