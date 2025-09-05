import { supabase } from './supabase';

export interface VoltzTransaction {
  user_id: string;
  amount: number;
  transaction_type: 'earned' | 'spent';
  reason: string;
  insight_id?: string;
  created_at?: string;
}

export const voltzService = {
  // Get user's current spendable voltz balance
  async getVoltzBalance(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('get_spendable_voltz', {
        p_user_id: userId
      });

      if (error) {
        console.error('Error fetching spendable voltz:', error);
        return 0;
      }

      return data || 0;
    } catch (error) {
      console.error('Exception fetching spendable voltz:', error);
      return 0;
    }
  },

  // Get user's total Voltz earned (for level display)
  async getTotalVoltzEarned(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('total_voltz_earned')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching total Voltz earned:', error);
        return 0;
      }

      return data?.total_voltz_earned || 0;
    } catch (error) {
      console.error('Exception fetching total Voltz earned:', error);
      return 0;
    }
  },

  // Get user's complete Voltz stats
  async getVoltzStats(userId: string): Promise<{
    totalVoltzEarned: number;
    spendableVoltz: number;
    level: number;
    levelProgress: number;
    voltzToNextLevel: number;
    voltzForCurrentLevel: number;
    voltzForNextLevel: number;
    isLevelled: boolean;
  }> {
    try {
      const { data, error } = await supabase.rpc('get_user_voltz_stats', {
        p_user_id: userId
      });

      if (error) {
        console.error('Error fetching Voltz stats:', error);
        return {
          totalVoltzEarned: 0,
          spendableVoltz: 0,
          level: 1,
          levelProgress: 0,
          voltzToNextLevel: 20,
          voltzForCurrentLevel: 0,
          voltzForNextLevel: 20,
          isLevelled: false
        };
      }

      // The function returns a single row, so data is an array with one element
      const stats = Array.isArray(data) ? data[0] : data;

      return {
        totalVoltzEarned: stats?.total_voltz_earned || 0,
        spendableVoltz: stats?.spendable_voltz || 0,
        level: stats?.level || 1,
        levelProgress: stats?.level_progress || 0,
        voltzToNextLevel: stats?.voltz_to_next_level || 20,
        voltzForCurrentLevel: stats?.voltz_for_current_level || 0,
        voltzForNextLevel: stats?.voltz_for_next_level || 20,
        isLevelled: stats?.is_levelled || false
      };
    } catch (error) {
      console.error('Exception fetching Voltz stats:', error);
      return {
        totalVoltzEarned: 0,
        spendableVoltz: 0,
        level: 1,
        levelProgress: 0,
        voltzToNextLevel: 20,
        voltzForCurrentLevel: 0,
        voltzForNextLevel: 20,
        isLevelled: false
      };
    }
  },

  // Reset the level-up flag after showing the animation
  async resetLevelUpFlag(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('reset_level_up_flag', {
        p_user_id: userId
      });

      if (error) {
        console.error('Error resetting level-up flag:', error);
        return false;
      }

      console.log('✅ Level-up flag reset for user:', userId);
      return true;
    } catch (error) {
      console.error('Exception resetting level-up flag:', error);
      return false;
    }
  },

  // Spend voltz for supercharging an insight
  async spendVoltz(userId: string, amount: number, reason: string, subjectType?: string, subjectId?: string): Promise<boolean> {
    try {
      // Use the new unified Voltz management function
      const { error } = await supabase.rpc('update_user_voltz', {
        p_user_id: userId,
        p_amount: amount,
        p_transaction_type: 'spent',
        p_reason: reason,
        p_subject_type: subjectType || null,
        p_subject_id: subjectId || null,
        p_actor_id: userId
      });

      if (error) {
        console.error('Error spending voltz:', error);
        return false;
      }

      // If supercharging an insight, update the insights table
      if (reason.includes('supercharg') && subjectId && subjectType === 'insight') {
        const { error: updateError } = await supabase
          .from('insights')
          .update({ 
            supercharged: true,
            voltz_spent: amount 
          })
          .eq('id', subjectId);

        if (updateError) {
          console.error('Error updating insight supercharge status:', updateError);
          // Don't fail the entire transaction - voltz was still spent correctly
        } else {
          console.log(`Successfully updated insight ${subjectId} with ${amount} voltz spent`);
        }
      }

      return true;
    } catch (error) {
      console.error('Exception spending voltz:', error);
      return false;
    }
  },

  // Earn voltz (adds to both spendable voltz and total voltz earned)
  async earnVoltz(userId: string, amount: number, reason: string, subjectType?: string, subjectId?: string, actorId?: string): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('update_user_voltz', {
        p_user_id: userId,
        p_amount: amount,
        p_transaction_type: 'earned',
        p_reason: reason,
        p_subject_type: subjectType || null,
        p_subject_id: subjectId || null,
        p_actor_id: actorId || userId
      });

      if (error) {
        console.error('Error earning voltz:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Exception earning voltz:', error);
      return false;
    }
  },

  // Get user's transaction history from XP ledger (both earned and spent)
  async getTransactionHistory(userId: string, limit: number = 10): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('xp_ledger')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching transaction history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Exception fetching transaction history:', error);
      return [];
    }
  },
};