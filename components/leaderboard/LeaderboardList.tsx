import React from 'react';
import { View, Text, StyleSheet, Image, FlatList, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { profileImageService } from '../../services/profileImageService';
import { useRouter } from 'expo-router';

interface LeaderboardListProps {
    users: any[]; // Users ranked 4+
    currentUserId?: string;
}

import { Feather } from '@expo/vector-icons';
// ... imports

export const LeaderboardList: React.FC<LeaderboardListProps> = ({ users, currentUserId }) => {
    const { colors } = useTheme();
    const router = useRouter();

    const renderItem = ({ item, index }: { item: any; index: number }) => {
        const rank = index + 4; // Start from 4th place
        const isCurrentUser = item.id === currentUserId;

        return (
            <TouchableOpacity
                onPress={() => router.push({ pathname: '/user-profile', params: { userId: item.id } })}
                style={[
                    styles.itemContainer,
                    {
                        backgroundColor: isCurrentUser ? 'rgba(79, 70, 229, 0.2)' : 'rgba(255, 255, 255, 0.08)', // Silvery / Highlighted
                        borderColor: isCurrentUser ? colors.primary : 'rgba(255, 255, 255, 0.1)',
                        borderWidth: 1,
                        borderTopColor: isCurrentUser ? colors.primary : 'rgba(255, 255, 255, 0.3)', // Light source
                        borderTopWidth: 1.5,
                        // shadowColor: '#000',
                        // shadowOpacity: 0.2, // Removed shadow for cleaner glass
                        // shadowRadius: 10,
                    }
                ]}>
                <View style={styles.leftSection}>
                    <Text style={[styles.rank, { color: colors.textSecondary }]}>{rank}</Text>
                    <Image
                        source={profileImageService.getProfileImageUrl(item.avatar_url)
                            ? { uri: profileImageService.getProfileImageUrl(item.avatar_url)! }
                            : require('../../assets/profileIconDefault.png')}
                        style={styles.avatar}
                    />
                    <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text style={[styles.name, { color: colors.text }]}>{item.full_name}</Text>

                        {item.tagline ? (
                            <Text style={[styles.level, { color: colors.textSecondary }]} numberOfLines={1}>
                                {item.tagline}
                            </Text>
                        ) : (
                            <Text style={[styles.level, { color: colors.textSecondary }]}>Lvl {item.level || 1}</Text>
                        )}
                    </View>
                </View>
                <View style={[styles.rightSection, { flex: 0.3 }]}>
                    <Text style={[styles.voltz, { color: colors.primary }]}>{item.total_voltz_earned}</Text>
                    <Text style={[styles.voltzLabel, { color: colors.textSecondary }]}>VOLTZ</Text>

                    {(item.current_streak > 0) && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                            <Feather name="zap" size={10} color="#F43F5E" />
                            <Text style={{ color: '#F43F5E', fontSize: 10, fontWeight: 'bold', marginLeft: 2 }}>
                                {item.current_streak}
                            </Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity >
        );
    };

    return (
        <View style={styles.container}>
            <FlatList
                data={users}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false} // Nested in parent ScrollView
                ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    itemContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 0.7,
    },
    rank: {
        fontSize: 14,
        fontWeight: 'bold',
        width: 30,
        textAlign: 'center',
        marginRight: 10,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    name: {
        fontSize: 14,
        fontWeight: '600',
    },
    level: {
        fontSize: 12,
    },
    rightSection: {
        alignItems: 'flex-end',
    },
    voltz: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    voltzLabel: {
        fontSize: 10,
        fontWeight: '600',
    }
});
