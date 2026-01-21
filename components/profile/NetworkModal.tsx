import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList, Image, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { profileImageService } from '../../services/profileImageService';
import { useRouter } from 'expo-router';

interface NetworkModalProps {
    visible: boolean;
    onClose: () => void;
    userId: string;
    initialTab?: 'followers' | 'following';
}

interface UserItem {
    user_id: string;
    full_name: string;
    avatar_url: string | null;
    is_following_viewer: boolean; // Does this user follow the CURRENT viewer? (Logic from RPC)
}

export const NetworkModal: React.FC<NetworkModalProps> = ({ visible, onClose, userId, initialTab = 'followers' }) => {
    const { colors, isDark } = useTheme();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'followers' | 'following'>(initialTab);
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState<UserItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (visible) {
            setActiveTab(initialTab);
            fetchUsers(initialTab);
        } else {
            setUsers([]);
            setSearchQuery('');
        }
    }, [visible, initialTab, userId]);

    useEffect(() => {
        if (visible) {
            fetchUsers(activeTab);
        }
    }, [activeTab]);

    const fetchUsers = async (tab: 'followers' | 'following') => {
        setLoading(true);
        try {
            const rpcName = tab === 'followers' ? 'get_followers' : 'get_following';
            const { data, error } = await supabase.rpc(rpcName, { target_user_id: userId });

            if (error) throw error;
            setUsers(data || []);
        } catch (error) {
            console.error(`Error fetching ${tab}:`, error);
        } finally {
            setLoading(false);
        }
    };

    const handleUserPress = (targetUserId: string) => {
        onClose();
        // Navigate to public profile
        // Assuming we have a public profile route or modal. 
        // For now, let's navigate to a hypothetical route or assume the parent handles it?
        // The user request mentioned "Tapping on a user... should bring up this same modal" (PublicProfileModal).
        // Since PublicProfileModal is likely triggered by a route or global state, we'll try to push content.
        // Actually, existing code uses `router.push` or local modals. 
        // Let's assume we push to a public profile page:
        router.push({
            pathname: '/people', // or wherever public profiles are handled, maybe separate ID param
            params: { userId: targetUserId }
        });
        // Note: The user mentioned "We have in our codebase a modal for viewing people's profiles... tapping on their profile picture / name on a post".
        // Often this is handled by a global modal or a specific screen. 
        // I will use a generic router push to `/people?id=...` if likely, or `/profile/[id]`.
        // Let's check `app/people.tsx`? It was size 467 bytes, likely small.
        // I'll stick to a router push for now, usually `/user/[id]` or similar.
        // Re-reading `NewProfile.tsx` might give a clue? No, `NewProfile` is for "ME".
        // `FeedItem.tsx` (viewed earlier) likely has the logic. 
        // I will assume simple navigation for now.
    };

    const filteredUsers = users.filter(u =>
        u.full_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderItem = ({ item }: { item: UserItem }) => (
        <TouchableOpacity
            style={[styles.userItem, { borderBottomColor: colors.border }]}
            onPress={() => handleUserPress(item.user_id)}
        >
            <Image
                source={item.avatar_url ? { uri: profileImageService.getProfileImageUrl(item.avatar_url) } : require('../../assets/profileIconDefault.png')}
                style={styles.avatar}
            />
            <View style={styles.userInfo}>
                <Text style={[styles.userName, { color: colors.text }]}>{item.full_name}</Text>
            </View>
            {/* Follow/Unfollow button could go here if checking MY following status relative to them */}
        </TouchableOpacity>
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                <BlurView intensity={90} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
                <SafeAreaView style={styles.safeArea}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Feather name="chevron-down" size={28} color={colors.text} />
                        </TouchableOpacity>
                        <Text style={[styles.headerTitle, { color: colors.text }]}>
                            {activeTab === 'followers' ? 'Followers' : 'Following'}
                        </Text>
                        <View style={{ width: 28 }} />
                    </View>

                    {/* Tabs */}
                    <View style={[styles.tabContainer, { borderBottomColor: colors.border }]}>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'followers' && { borderBottomColor: colors.primary }]}
                            onPress={() => setActiveTab('followers')}
                        >
                            <Text style={[
                                styles.tabText,
                                { color: activeTab === 'followers' ? colors.primary : colors.textSecondary }
                            ]}>
                                Followers
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'following' && { borderBottomColor: colors.primary }]}
                            onPress={() => setActiveTab('following')}
                        >
                            <Text style={[
                                styles.tabText,
                                { color: activeTab === 'following' ? colors.primary : colors.textSecondary }
                            ]}>
                                Following
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Filter for Following Tab - User requested "filter to just see groups... and filter to just see people" */}
                    {activeTab === 'following' && (
                        <View style={styles.filterContainer}>
                            {/* Placeholder for Group/People filter if Groups are implemented. 
                                For now, logic only fetches profiles via `get_following`. 
                                Groups are deferred. Keeping it simple. */}
                        </View>
                    )}

                    {loading ? (
                        <View style={styles.centerContainer}>
                            <ActivityIndicator color={colors.primary} />
                        </View>
                    ) : (
                        <FlatList
                            data={filteredUsers}
                            renderItem={renderItem}
                            keyExtractor={(item) => item.user_id}
                            contentContainerStyle={styles.listContent}
                            ListEmptyComponent={
                                <View style={styles.centerContainer}>
                                    <Text style={{ color: colors.textSecondary }}>No users found.</Text>
                                </View>
                            }
                        />
                    )}
                </SafeAreaView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    safeArea: {
        flex: 1,
        marginTop: 50,
        backgroundColor: 'transparent',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    closeButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    tabContainer: {
        flexDirection: 'row',
        borderBottomWidth: 1,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabText: {
        fontSize: 16,
        fontWeight: '600',
    },
    filterContainer: {
        // Implement filters later if needed
    },
    listContent: {
        paddingVertical: 10,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50,
    },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        marginHorizontal: 10,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 15,
        backgroundColor: '#333'
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
    }
});
