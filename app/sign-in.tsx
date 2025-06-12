import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { SignIn } from '../components/SignIn';
import { useEffect } from 'react';

export default function SignInScreen() {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && user) {
      router.replace('/feed');
    }
  }, [user, loading]);
  if (loading || user) return null;
  return <SignIn onSignIn={() => {}} onSwitchToSignUp={() => router.replace('/sign-up')} />;
}
