import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { profileImageService } from '../../services/profileImageService';

const { width } = Dimensions.get('window');

interface PodiumProps {
    users: any[]; // Top 3 users
    currentUserId?: string;
}

export const Podium: React.FC<PodiumProps> = ({ users, currentUserId }) => {
    const { colors } = useTheme();
    const router = useRouter();

    if (users.length === 0) return null;

    const first = users[0];
    const second = users[1];
    const third = users[2];

    const renderPodiumStep = (user: any, rank: number) => {
        if (!user) return null;

        const isFirst = rank === 1;
        const isSecond = rank === 2;
        const isThird = rank === 3;

        let height = 120; // Default (3rd)
        let color = '#CD7F32'; // Bronze
        let label = '3rd';

        if (isFirst) {
            height = 160;
            color = '#EAB308'; // Gold
            label = '1st';
        } else if (isSecond) {
            height = 140;
            color = '#C0C0C0'; // Silver
            label = '2nd';
        }

        const isCurrentUser = user.id === currentUserId;

        return (
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => router.push({ pathname: '/user-profile', params: { userId: user.id } })}
                style={[styles.stepContainer, { height: height + 80 }]}
            >
                {/* Avatar Group */}
                <View style={styles.avatarContainer}>
                    <View style={[styles.avatarRing, { borderColor: color }]}>
                        <Image
                            source={profileImageService.getProfileImageUrl(user.avatar_url)
                                ? { uri: profileImageService.getProfileImageUrl(user.avatar_url)! }
                                : require('../../assets/profileIconDefault.png')}
                            style={styles.avatar}
                        />
                    </View>
                    <View style={[styles.rankBadge, { backgroundColor: color }]}>
                        <Text style={styles.rankText}>{rank}</Text>
                    </View>
                </View>

                {/* Name & Voltz */}
                <View style={styles.infoContainer}>
                    <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{user.full_name}</Text>
                    <Text style={[styles.voltz, { color: colors.primary }]}>{user.total_voltz_earned} V</Text>
                    {user.current_streak > 0 && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                            <Feather name="zap" size={10} color="#F43F5E" />
                            <Text style={{ color: '#F43F5E', fontSize: 10, fontWeight: 'bold', marginLeft: 2 }}>
                                {user.current_streak}
                            </Text>
                        </View>
                    )}
                </View>

                {/* The Pedestal */}
                <LinearGradient
                    colors={[color, 'rgba(0,0,0,0.8)']}
                    style={[styles.pedestal, { height: height, opacity: 0.3 }]}
                />
                {/* Glass overlay on pedestal */}
                <BlurView intensity={20} tint="dark" style={[styles.pedestalGlass, { height: height }]} >
                    {isCurrentUser && <Text style={{ color: 'white', fontSize: 10, marginTop: 10 }}>YOU</Text>}
                </BlurView>

            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            {/* 2nd Place */}
            <View style={styles.column}>
                {renderPodiumStep(second, 2)}
            </View>

            {/* 1st Place */}
            <View style={[styles.column, { zIndex: 10, marginBottom: 20 }]}>
                {renderPodiumStep(first, 1)}
            </View>

            {/* 3rd Place */}
            <View style={styles.column}>
                {renderPodiumStep(third, 3)}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-end',
        paddingHorizontal: 20,
        height: 320,
        marginBottom: 20,
    },
    column: {
        alignItems: 'center',
        justifyContent: 'flex-end',
        width: width / 3.5,
    },
    stepContainer: {
        alignItems: 'center',
        justifyContent: 'flex-end',
        width: '100%',
    },
    avatarContainer: {
        marginBottom: 5,
        alignItems: 'center',
        position: 'relative',
    },
    avatarRing: {
        borderWidth: 3,
        borderRadius: 40,
        padding: 2,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
    },
    rankBadge: {
        position: 'absolute',
        bottom: -5,
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'white',
    },
    rankText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    infoContainer: {
        alignItems: 'center',
        marginBottom: 10,
    },
    name: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 2,
        textAlign: 'center',
    },
    voltz: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    pedestal: {
        width: '100%',
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        position: 'absolute',
        bottom: 0,
    },
    pedestalGlass: {
        width: '100%',
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        alignItems: 'center',
    }
});
