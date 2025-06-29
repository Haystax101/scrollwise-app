import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

interface IndustriesContextType {
  industries: string[];
  refreshIndustries: () => Promise<void>;
}

const IndustriesContext = createContext<IndustriesContextType>({
  industries: [],
  refreshIndustries: async () => {},
});

export const IndustriesProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [industries, setIndustries] = useState<string[]>([]);

  const fetchIndustries = async () => {
    if (user) {
      const { data, error } = await supabase
        .from('profiles')
        .select('interests')
        .eq('id', user.id)
        .single();
      if (data && data.interests) {
        setIndustries(data.interests);
      } else {
        setIndustries([]);
      }
    } else {
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
