import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { communityService } from '../../lib/communityService';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

export const CommunityFeed: React.FC = () => {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const { session } = useAuth();
    const router = useRouter();
    const [communities, setCommunities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCommunities();
    }, []);

    const fetchCommunities = async () => {
        if (!session?.user) return;
        try {
            const data = await communityService.getMyCommunities(session.user.id);
            setCommunities(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push(`/community/${item.id}`)}
        >
            <Image
                source={item.avatar_url ? { uri: item.avatar_url } : require('../../assets/groupIconDefault.png')}
                style={styles.avatar}
            />
            <View style={styles.info}>
                <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={1}>
                    {item.description || "No description"}
                </Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={[styles.container, { paddingTop: insets.top + 60, justifyContent: 'center' }]}>
                <ActivityIndicator color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <FlatList
                data={communities}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingTop: insets.top + 70, paddingBottom: 100, paddingHorizontal: 16 }}
                renderItem={renderItem}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                            No communities found.
                        </Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        marginBottom: 12,
        borderRadius: 16,
        borderWidth: 1,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 16,
        backgroundColor: '#eee',
    },
    info: {
        flex: 1,
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    description: {
        fontSize: 14,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 40,
    },
    emptyText: {
        fontSize: 16,
    }
});
