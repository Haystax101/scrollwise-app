import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

interface IndustriesContextType {
  industries: number[]; // Changed from string[] to number[]
  refreshIndustries: () => Promise<void>;
}

const IndustriesContext = createContext<IndustriesContextType>({
  industries: [],
  refreshIndustries: async () => {},
});

export const IndustriesProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [industries, setIndustries] = useState<number[]>([]); // Changed from string[] to number[]

  const fetchIndustries = async () => {
    console.log('🏭 IndustriesContext: Fetching user industries...');
    console.log('👤 IndustriesContext: Current user:', user);
    
    if (user) {
      const { data, error } = await supabase
        .from('profiles')
        .select('interests')
        .eq('id', user.id)
        .single();
      
      console.log('📊 IndustriesContext: Profile data:', data);
      console.log('❌ IndustriesContext: Profile error:', error);
      
      if (data && data.interests) {
        console.log('✅ IndustriesContext: User interests found:', data.interests);
        // Ensure the interests are numbers
        const industryIds = Array.isArray(data.interests) ? data.interests : [];
        setIndustries(industryIds);
      } else {
        console.log('⚠️ IndustriesContext: No interests found, setting empty array');
        setIndustries([]);
      }
    } else {
      console.log('⚠️ IndustriesContext: No user, setting empty array');
      setIndustries([]);
    }
  };

  useEffect(() => {
    fetchIndustries();
    // eslint-disable-next-line
  }, [user]);

  return (
    <IndustriesContext.Provider value={{ industries, refreshIndustries: fetchIndustries }}>
      {children}
    </IndustriesContext.Provider>
  );
};

export const useIndustries = () => useContext(IndustriesContext);
