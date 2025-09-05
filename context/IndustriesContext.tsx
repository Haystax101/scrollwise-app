import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

// Define the structure of an industry object
export interface Industry {
  id: string; // UUID
  name: string;
}

interface IndustriesContextType {
  industries: Industry[];
  refreshIndustries: () => Promise<void>;
  allIndustries: Industry[]; // To store all available industries
}

const IndustriesContext = createContext<IndustriesContextType>({
  industries: [],
  refreshIndustries: async () => {},
  allIndustries: [],
});

export const IndustriesProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [allIndustries, setAllIndustries] = useState<Industry[]>([]);

  // Fetch all canonical industries once
  const fetchAllIndustries = async () => {
    console.log('🏭 IndustriesContext: Fetching all canonical industries...');
    const { data, error } = await supabase.from('industries').select('id, name');
    if (error) {
      console.error('❌ IndustriesContext: Error fetching all industries:', error);
    } else {
      console.log('✅ IndustriesContext: All industries fetched:', data);
      setAllIndustries(data || []);
    }
  };

  // Fetch the user's selected industries
  const fetchUserIndustries = async () => {
    console.log('🏭 IndustriesContext: Fetching user industries...');
    if (user) {
      console.log('👤 IndustriesContext: Current user:', user.id);
      // First, get the user's industry IDs from user_industries
      const { data: userIndustriesData, error: userIndustriesError } = await supabase
        .from('user_industries')
        .select('industry_id')
        .eq('user_id', user.id);

      if (userIndustriesError) {
        console.error('❌ IndustriesContext: Error fetching user industry links:', userIndustriesError);
        setIndustries([]);
        return;
      }

      if (userIndustriesData && userIndustriesData.length > 0) {
        const industryIds = userIndustriesData.map(link => link.industry_id);
        console.log('✅ IndustriesContext: User industry IDs found:', industryIds);

        // Now, fetch the full industry objects for those IDs
        const { data: industriesData, error: industriesError } = await supabase
          .from('industries')
          .select('id, name')
          .in('id', industryIds);

        if (industriesError) {
          console.error('❌ IndustriesContext: Error fetching industry details:', industriesError);
          setIndustries([]);
        } else {
          console.log('✅ IndustriesContext: User industries details fetched:', industriesData);
          setIndustries(industriesData || []);
        }
      } else {
        console.log('⚠️ IndustriesContext: No user industries found, setting empty array');
        setIndustries([]);
      }
    } else {
      console.log('⚠️ IndustriesContext: No user, setting empty array');
      setIndustries([]);
    }
  };

  useEffect(() => {
    fetchAllIndustries();
    fetchUserIndustries();
    
    // Set up real-time subscription for user industry changes
    if (user?.id) {
      const subscription = supabase
        .channel(`user_industries_${user.id}`)
        .on('postgres_changes', {
          event: '*', // Listen to all changes (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'user_industries',
          filter: `user_id=eq.${user.id}`,
        }, (payload) => {
          console.log('🔄 IndustriesContext: Real-time industry change detected:', payload);
          // Refresh industries when any change is detected
          fetchUserIndustries();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
    // eslint-disable-next-line
  }, [user]);

  const refreshIndustries = async () => {
    await fetchUserIndustries();
  };

  return (
    <IndustriesContext.Provider value={{ industries, allIndustries, refreshIndustries }}>
      {children}
    </IndustriesContext.Provider>
  );
};

export const useIndustries = () => useContext(IndustriesContext);
