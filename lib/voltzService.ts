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

  // Get user's total XP (for level display)
  async getTotalXP(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('get_total_xp', {
        p_user_id: userId
      });

      if (error) {
        console.error('Error fetching total XP:', error);
        return 0;
      }

      return data || 0;
    } catch (error) {
      console.error('Exception fetching total XP:', error);
      return 0;
    }
  },

  // Spend voltz for supercharging an insight
  async spendVoltz(userId: string, amount: number, insightId: string): Promise<boolean> {
    try {
      // Use a Supabase RPC function for atomic transaction
      const { error } = await supabase.rpc('spend_voltz', {
        p_user_id: userId,
        p_amount: amount,
        p_insight_id: insightId,
        p_reason: 'insight_supercharge'
      });

      if (error) {
        console.error('Error spending voltz:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Exception spending voltz:', error);
      return false;
    }
  },

  // Earn voltz/XP (adds to both spendable voltz and total XP)
  async earnVoltzXP(userId: string, amount: number, reason: string, insightId?: string, actorId?: string): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('earn_voltz_xp', {
        p_user_id: userId,
        p_amount: amount,
        p_reason: reason,
        p_insight_id: insightId || null,
        p_actor_id: actorId || userId
      });

      if (error) {
        console.error('Error earning voltz/XP:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Exception earning voltz/XP:', error);
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