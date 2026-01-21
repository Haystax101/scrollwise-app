import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

interface SocialProfileHeaderProps {
    user: any;
    fullName: string;
    avatarUrl?: string | null;
    tagline?: string | null;
    level: number;
    voltz: number;
    streak: number;
    followersCount: number;
    followingCount: number;
    isClockedIn: boolean;
    onClockIn: () => void;
    onSettings: () => void;
    onEditAvatar: () => void;
    onEditTagline: () => void;
    onOpenNetwork: (tab: 'followers' | 'following') => void;
    onEditIndustries: () => void;
    onShareProfile: () => void;
}

export const SocialProfileHeader: React.FC<SocialProfileHeaderProps> = ({
    user,
    fullName,
    avatarUrl,
    tagline,
    level,
    voltz,
    streak,
    followersCount,
    followingCount,
    isClockedIn,
    onClockIn,
    onSettings,
    onEditAvatar,
    onEditTagline,
    onOpenNetwork,
    onEditIndustries,
    onShareProfile
}) => {
    const { colors, theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <View style={styles.container}>
            {/* Background Gradient */}
            <LinearGradient
                colors={[colors.primary + '20', 'transparent']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
            />

            {/* Top Row: Settings Only */}
            <View style={styles.topRow}>
                <View />
                <TouchableOpacity onPress={onSettings} style={[styles.iconButton, { backgroundColor: colors.card }]}>
                    <Feather name="settings" size={20} color={colors.text} />
                </TouchableOpacity>
            </View>

            {/* Identity Section - Instagram Style */}
            <View style={styles.identitySection}>
                <View style={styles.profileTopContainer}>
                    {/* Avatar */}
                    <TouchableOpacity onPress={onEditAvatar} style={styles.avatarWrapper}>
                        <Image
                            source={avatarUrl ? { uri: avatarUrl } : require('../../assets/profileIconDefault.png')}
                            style={[styles.avatar, { borderColor: colors.primary }]}
                        />
                        <View style={[styles.editBadge, { backgroundColor: colors.card }]}>
                            <Feather name="camera" size={12} color={colors.text} />
                        </View>
                    </TouchableOpacity>

                    {/* Stats & Counts */}
                    <View style={styles.socialStatsContainer}>
                        <View style={styles.statGroup}>
                            <TouchableOpacity onPress={() => onOpenNetwork('followers')}>
                                <Text style={[styles.socialStatValue, { color: colors.text }]}>{followersCount}</Text>
                                <Text style={[styles.socialStatLabel, { color: colors.textSecondary }]}>Followers</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.statGroup}>
                            <TouchableOpacity onPress={() => onOpenNetwork('following')}>
                                <Text style={[styles.socialStatValue, { color: colors.text }]}>{followingCount}</Text>
                                <Text style={[styles.socialStatLabel, { color: colors.textSecondary }]}>Following</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Name & Bio */}
                <View style={styles.bioContainer}>
                    <Text style={[styles.name, { color: colors.text }]}>{fullName}</Text>

                    {tagline ? (
                        <TouchableOpacity onPress={onEditTagline}>
                            <Text style={[styles.tagline, { color: colors.textSecondary }]}>{tagline}</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity onPress={onEditTagline}>
                            <Text style={[styles.tagline, { color: colors.primary }]}>+ Add Tagline</Text>
                        </TouchableOpacity>
                    )}

                    <View style={styles.bioActionsRow}>
                        <TouchableOpacity onPress={onEditIndustries}>
                            <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>Edit Industries</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={onShareProfile} style={styles.shareIconSmall}>
                            <Feather name="share" size={16} color={colors.text} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Stats Grid (Gamification) */}
            <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: colors.text }]}>{level}</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Level</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: '#EAB308' }]}>{voltz}</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Voltz</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: '#F43F5E' }]}>{streak}</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Streak</Text>
                </View>
            </View>

            {/* Command Center Actions */}
            <View style={styles.actionRow}>
                <TouchableOpacity
                    style={[
                        styles.clockInButton,
                        { backgroundColor: isClockedIn ? colors.card : colors.primary }
                    ]}
                    onPress={isClockedIn ? undefined : onClockIn}
                    disabled={isClockedIn}
                >
                    <BlurView intensity={20} tint={isDark ? 'light' : 'dark'} style={StyleSheet.absoluteFill} />
                    <Feather name={isClockedIn ? "check-circle" : "clock"} size={20} color={isClockedIn ? colors.text : '#FFF'} />
                    <Text style={[
                        styles.clockInText,
                        { color: isClockedIn ? colors.text : '#FFF' }
                    ]}>
                        {isClockedIn ? "Clocked In" : "Clock In"}
                    </Text>
                </TouchableOpacity>
            </View>

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingTop: 60,
        paddingBottom: 24,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        marginBottom: 0, // UGC Grid starts right after
        overflow: 'hidden',
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 0, // Avatar overlaps slightly or sits below
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Updated Styles
    identitySection: {
        marginTop: 10,
        paddingHorizontal: 24,
    },
    profileTopContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatarWrapper: {
        marginRight: 24,
        position: 'relative',
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 2,
    },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    socialStatsContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    statGroup: {
        alignItems: 'center',
    },
    socialStatValue: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    socialStatLabel: {
        fontSize: 12,
        fontWeight: '500',
        textAlign: 'center',
    },
    bioContainer: {
        marginBottom: 16,
    },
    name: {
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: 'Montserrat_700Bold',
        marginBottom: 4,
    },
    handle: {
        fontSize: 14,
        fontFamily: 'Montserrat_400Regular',
        marginBottom: 8,
    },
    tagline: {
        fontSize: 14,
        lineHeight: 20,
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        gap: 24,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)', // Subtle separator
        marginHorizontal: 20,
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        fontFamily: 'Oswald_700Bold',
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '500',
        textTransform: 'uppercase',
    },
    statDivider: {
        width: 1,
        height: 24,
    },
    actionRow: {
        marginTop: 24,
        paddingHorizontal: 40,
    },
    clockInButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 56,
        borderRadius: 28,
        gap: 12,
        overflow: 'hidden',
    },
    clockInText: {
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: 'Montserrat_600SemiBold',
    },
    bioActionsRow: {
        marginTop: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    shareIconSmall: {
        padding: 8,
    }
});
