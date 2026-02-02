import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
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
        // removed unused isThird

        let height = 120; // Default (3rd)
        let color = '#CD7F32'; // Bronze
        // removed unused label

        if (isFirst) {
            height = 160;
            color = colors.gold; // Use Theme Gold
        } else if (isSecond) {
            height = 140;
            color = '#E0E0E0'; // Platinum/Silver
        }

        const isCurrentUser = user.id === currentUserId;

        return (
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => router.push({ pathname: '/user-profile', params: { userId: user.id } })}
                style={[styles.stepContainer, { height: height + 90 }]} // Increased height for spacing
            >
                {/* Avatar Group */}
                <View style={styles.avatarContainer}>
                    <View style={[styles.avatarRing, { borderColor: color, shadowColor: color, shadowOpacity: 0.5, shadowRadius: 10 }]}>
                        <Image
                            source={profileImageService.getProfileImageUrl(user.avatar_url)
                                ? { uri: profileImageService.getProfileImageUrl(user.avatar_url)! }
                                : require('../../assets/profileIconDefault.png')}
                            style={styles.avatar}
                        />
                    </View>
                    <View style={[styles.rankBadge, { backgroundColor: color }]}>
                        <Text style={[styles.rankText, { color: isFirst ? 'black' : 'white' }]}>{rank}</Text>
                    </View>
                </View>

                {/* Name & Voltz */}
                <View style={styles.infoContainer}>
                    <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{user.full_name}</Text>
                    <Text style={[styles.voltz, { color: color }]}>{user.total_voltz_earned} V</Text>
                    {user.current_streak > 0 && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2, backgroundColor: 'rgba(244, 63, 94, 0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 }}>
                            <Feather name="zap" size={10} color="#F43F5E" />
                            <Text style={{ color: '#F43F5E', fontSize: 10, fontWeight: 'bold', marginLeft: 2 }}>
                                {user.current_streak}
                            </Text>
                        </View>
                    )}
                </View>

                {/* The Pedestal - Glassmorphic */}
                <View style={[styles.pedestal, { height: height, backgroundColor: colors.glassBg, borderColor: color }]}>
                    <LinearGradient
                        colors={[color + '40', 'transparent']} // Fade from color to transparent
                        style={StyleSheet.absoluteFill}
                    />
                    {isCurrentUser && <Text style={{ color: 'white', fontSize: 10, marginTop: 10, textAlign: 'center', fontWeight: 'bold' }}>YOU</Text>}
                </View>

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
        fontSize: 12, // Slightly Larger
        fontWeight: 'bold',
        fontFamily: 'Oswald_700Bold',
    },
    pedestal: {
        width: '100%',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        position: 'absolute',
        bottom: 0,
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderRightWidth: 1,
        overflow: 'hidden',
    },
    // Removed pedestalGlass
});
