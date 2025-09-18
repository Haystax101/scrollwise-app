import { useAuth } from '../context/AuthContext';
import { Vault } from '../components/Vault';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function VaultScreen() {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/onboarding');
    }
  }, [user, loading]);
  if (loading || !user) return null;
  return <Vault />;
}
