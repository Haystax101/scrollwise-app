import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { profileImageService } from '../../services/profileImageService';
import { BlurView } from 'expo-blur';

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
        let gradientColors = ['rgba(205, 127, 50, 0.4)', 'rgba(205, 127, 50, 0.1)'] as const; // Bronze Gradient
        // removed unused label

        if (isFirst) {
            height = 160;
            color = colors.gold; // Use Theme Gold
            gradientColors = ['rgba(255, 215, 0, 0.4)', 'rgba(255, 215, 0, 0.1)'] as const; // Gold Gradient
        } else if (isSecond) {
            height = 140;
            color = '#E0E0E0'; // Platinum/Silver
            gradientColors = ['rgba(224, 224, 224, 0.4)', 'rgba(224, 224, 224, 0.1)'] as const; // Silver Gradient
        }

        const isCurrentUser = user.id === currentUserId;

        return (
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => router.push({ pathname: '/user-profile', params: { userId: user.id } })}
                style={[styles.stepContainer, { height: height + 80 }]} // Total height = Pedestal + Avatar space
            >
                {/* Avatar Group - Floats Above */}
                <View style={[styles.avatarContainer, { height: 80, justifyContent: 'flex-end', zIndex: 100 }]}>
                    <View style={[styles.avatarRing, {
                        borderColor: color,
                        shadowColor: color,
                        shadowOpacity: 0.8,
                        shadowRadius: 15,
                        shadowOffset: { width: 0, height: 0 },
                        backgroundColor: '#1a1a1a'
                    }]}>
                        {/* ... image ... */}
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
                </View >

                {/* The Pedestal - Glassmorphic with Info Inside */}
                <BlurView
                    intensity={80}
                    tint="systemMaterialDark"
                    style={[styles.pedestal, { height: height }]}
                >
                    <LinearGradient
                        colors={gradientColors}
                        start={{ x: 0.5, y: 0 }}
                        end={{ x: 0.5, y: 0.8 }}
                        style={StyleSheet.absoluteFill}
                    />

                    {/* Border highlight for top edge */}
                    <LinearGradient
                        colors={[color, 'transparent']}
                        start={{ x: 0.5, y: 0 }}
                        end={{ x: 0.5, y: 1 }}
                        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1.5, opacity: 0.8 }}
                    />

                    {/* Info Inside Glass */}
                    <View style={styles.infoContent}>
                        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{user.full_name}</Text>
                        <Text style={[styles.voltz, { color: color }]}>{user.total_voltz_earned} V</Text>
                        {user.current_streak > 0 && (
                            <View style={styles.streakBadge}>
                                <Feather name="zap" size={10} color="#F43F5E" />
                                <Text style={styles.streakText}>
                                    {user.current_streak}
                                </Text>
                            </View>
                        )}
                        {isCurrentUser && <Text style={styles.youIndicator}>YOU</Text>}
                    </View>
                </BlurView >

            </TouchableOpacity >
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
        justifyContent: 'flex-start', // Start from top
        width: '100%',
        position: 'relative',
    },
    avatarContainer: {
        marginBottom: -35, // Overlap into the glass
        alignItems: 'center',
        position: 'relative',
        zIndex: 50,
        elevation: 50,
    },
    avatarRing: {
        borderWidth: 3,
        borderRadius: 40,
        padding: 4, // More breathing room
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
    },
    rankBadge: {
        position: 'absolute',
        bottom: -5,
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#1E1E1E',
        zIndex: 51,
    },
    rankText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
        fontFamily: 'Oswald_700Bold',
    },
    pedestal: {
        width: '100%',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        position: 'absolute',
        bottom: 0,
        overflow: 'hidden',
        justifyContent: 'flex-start', // Align content to top
        paddingTop: 35, // Space for the avatar overhang
        alignItems: 'center',
    },
    infoContent: {
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: 4,
    },
    name: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 2,
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    voltz: {
        fontSize: 13,
        fontWeight: 'bold',
        fontFamily: 'Oswald_700Bold',
        marginBottom: 2,
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    streakBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(244, 63, 94, 0.15)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        marginTop: 2,
    },
    streakText: {
        color: '#F43F5E',
        fontSize: 10,
        fontWeight: 'bold',
        marginLeft: 2,
    },
    youIndicator: {
        color: 'white',
        fontSize: 10,
        marginTop: 6,
        textAlign: 'center',
        fontWeight: 'bold',
        opacity: 0.8,
    }
});
