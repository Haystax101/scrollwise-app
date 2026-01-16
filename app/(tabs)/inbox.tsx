import { useAuth } from '../../context/AuthContext';
import { Inbox } from '../../components/friends/Inbox';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function InboxPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.replace('/onboarding');
        }
    }, [user, loading]);

    if (loading || !user) return null;

    return <Inbox />;
}
