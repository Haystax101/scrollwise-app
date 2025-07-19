import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { SignUp } from '../components/SignUp';
import { useEffect } from 'react';

export default function SignUpScreen() {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && user) {
      router.replace('/feed');
    }
  }, [user, loading]);
  if (loading || user) return null;
  return <SignUp onSignUp={() => router.replace('/sign-in')} onSwitchToSignIn={() => router.replace('/sign-in')} />;
}
