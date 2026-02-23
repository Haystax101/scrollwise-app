import React, { useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
// Import Content specifically, NOT the Modal wrapper
import { UserDetailContent } from '../components/profile/UserDetailContent';
import { useAuth } from '../context/AuthContext';
import { View } from 'react-native';

export default function UserProfileRoute() {
    const params = useLocalSearchParams();
    const router = useRouter();
    const { session } = useAuth();
    const userId = params.userId as string;

    // If no userId, go back immediately
    useEffect(() => {
        if (!userId) {
            router.back();
        }
    }, [userId]);

    if (!userId) return <View style={{ flex: 1, backgroundColor: 'transparent' }} />;

    // Render DIRECTLY without a second Modal. 
    // The Screen itself is already presented as a modal by _layout.tsx
    return (
        <UserDetailContent
            userId={userId}
            currentUserId={session?.user?.id}
            onClose={() => {
                if (router.canGoBack()) {
                    router.back();
                } else {
                    router.replace('/(tabs)/profile');
                }
            }}
        />
    );
}
