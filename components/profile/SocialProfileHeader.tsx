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
    isClockedIn: boolean;
    onClockIn: () => void;
    onSettings: () => void;
    onEditProfile: () => void;
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
    isClockedIn,
    onClockIn,
    onSettings,
    onEditProfile,
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

            {/* Top Row: Settings & Share (Visual Balance) */}
            <View style={styles.topRow}>
                <TouchableOpacity onPress={onSettings} style={[styles.iconButton, { backgroundColor: colors.card }]}>
                    <Feather name="settings" size={20} color={colors.text} />
                </TouchableOpacity>
                <TouchableOpacity onPress={onShareProfile} style={[styles.iconButton, { backgroundColor: colors.card }]}>
                    <Feather name="share" size={20} color={colors.text} />
                </TouchableOpacity>
            </View>

            {/* Main Identity Section */}
            <View style={styles.identitySection}>
                <TouchableOpacity onPress={onEditProfile} style={styles.avatarWrapper}>
                    <Image
                        source={avatarUrl ? { uri: avatarUrl } : require('../../assets/profileIconDefault.png')}
                        style={[styles.avatar, { borderColor: colors.primary }]}
                    />
                    <View style={[styles.editBadge, { backgroundColor: colors.card }]}>
                        <Feather name="camera" size={12} color={colors.text} />
                    </View>
                </TouchableOpacity>

                <Text style={[styles.name, { color: colors.text }]}>{fullName}</Text>
                <Text style={[styles.handle, { color: colors.text + '80' }]}>@{fullName.toLowerCase().replace(/\s+/g, '')}</Text>

                {tagline ? (
                    <Text style={[styles.tagline, { color: colors.textSecondary }]}>{tagline}</Text>
                ) : (
                    <TouchableOpacity onPress={onEditProfile}>
                        <Text style={[styles.tagline, { color: colors.primary }]}>+ Add Tagline</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Stats Grid */}
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
    identitySection: {
        alignItems: 'center',
        marginTop: -10,
    },
    avatarWrapper: {
        marginBottom: 12,
        position: 'relative',
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
    },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent', // adapt
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        fontFamily: 'Montserrat_700Bold',
        marginBottom: 2,
    },
    handle: {
        fontSize: 14,
        fontFamily: 'Montserrat_400Regular',
        marginBottom: 8,
    },
    tagline: {
        fontSize: 14,
        fontStyle: 'italic',
        textAlign: 'center',
        paddingHorizontal: 40,
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 24,
        gap: 24,
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
});
