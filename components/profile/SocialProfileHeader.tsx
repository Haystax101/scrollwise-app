import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

interface SocialProfileHeaderProps {
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
    bio?: string | null;
    links?: any;
    onEditBio?: () => void;
}

export const SocialProfileHeader: React.FC<SocialProfileHeaderProps> = ({
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
    onShareProfile,
    bio,
    links,
    onEditBio
}) => {
    const { colors } = useTheme();


    const renderSocialLinks = () => {
        if (!links || !Array.isArray(links)) return null;
        return (
            <View style={styles.linksRow}>
                {links.map((link: any, index: number) => (
                    <TouchableOpacity
                        key={index}
                        onPress={() => {
                            if (link.url) {
                                // Linking.openURL(link.url); // Requires Linking import, skipping for now or adding if simple
                                console.log('Open link:', link.url);
                            }
                        }}
                        style={styles.linkButton}
                    >
                        <Feather name="link" size={14} color={colors.primary} />
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

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

            {/* Identity Section - Centered & Glassmorphic */}
            <View style={styles.identitySection}>
                <View style={styles.avatarContainer}>
                    <TouchableOpacity onPress={onEditAvatar} style={styles.avatarWrapper}>
                        <Image
                            source={avatarUrl ? { uri: avatarUrl } : require('../../assets/profileIconDefault.png')}
                            style={[styles.avatar, { borderColor: colors.gold }]}
                        />
                        <View style={[styles.editBadge, { backgroundColor: colors.card }]}>
                            <Feather name="camera" size={12} color={colors.text} />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Name & Bio */}
                <View style={styles.bioContainer}>
                    <Text style={[styles.name, { color: colors.text }]}>{fullName}</Text>

                    {/* Tagline */}
                    {tagline ? (
                        <TouchableOpacity onPress={onEditTagline}>
                            <Text style={[styles.tagline, { color: colors.textSecondary }]}>{tagline}</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity onPress={onEditTagline}>
                            <Text style={[styles.tagline, { color: colors.gold }]}>+ Add Tagline</Text>
                        </TouchableOpacity>
                    )}

                    {/* Follow Counts - Small & Subtle below tagline */}
                    <View style={styles.followRow}>
                        <TouchableOpacity onPress={() => onOpenNetwork('followers')}>
                            <Text style={[styles.followText, { color: colors.textSecondary }]}>
                                <Text style={{ color: colors.text, fontWeight: '700' }}>{followersCount}</Text> Followers
                            </Text>
                        </TouchableOpacity>
                        <Text style={{ color: colors.textSecondary }}>•</Text>
                        <TouchableOpacity onPress={() => onOpenNetwork('following')}>
                            <Text style={[styles.followText, { color: colors.textSecondary }]}>
                                <Text style={{ color: colors.text, fontWeight: '700' }}>{followingCount}</Text> Following
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Bio (New) */}
                    {bio ? (
                        <TouchableOpacity onPress={onEditBio}>
                            <Text style={[styles.bioText, { color: colors.text }]} numberOfLines={4}>
                                {bio}
                            </Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity onPress={onEditBio} style={{ marginTop: 8 }}>
                            <Text style={{ color: colors.gold, fontSize: 13 }}>+ Add Bio</Text>
                        </TouchableOpacity>
                    )}

                    {/* Links (New) */}
                    {renderSocialLinks()}

                    <View style={styles.bioActionsRow}>
                        <TouchableOpacity onPress={onEditIndustries}>
                            <Text style={{ color: colors.gold, fontSize: 13, fontWeight: '600' }}>Edit Industries</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={onShareProfile} style={styles.shareIconSmall}>
                            <Feather name="share" size={16} color={colors.text} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Stats Grid (Glass Cards) */}
            <View style={styles.statsGrid}>
                {/* Level Card */}
                <View style={[styles.glassStatCard, { backgroundColor: colors.glassBg, borderColor: colors.glassBorder }]}>
                    <Text style={[styles.statValue, { color: colors.text }]}>{level}</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>LEVEL</Text>
                </View>

                {/* Voltz Card - Highlighted */}
                <View style={[styles.glassStatCard, { backgroundColor: colors.glassBgStrong, borderColor: colors.gold }]}>
                    <Text style={[styles.statValue, { color: colors.gold }]}>{voltz}</Text>
                    <Text style={[styles.statLabel, { color: colors.gold }]}>VOLTZ</Text>
                </View>

                {/* Streak Card */}
                <View style={[styles.glassStatCard, { backgroundColor: colors.glassBg, borderColor: colors.glassBorder }]}>
                    <Text style={[styles.statValue, { color: colors.text }]}>{streak}</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>STREAK</Text>
                </View>
            </View>

            {/* Command Center Actions - Neon Button */}
            <View style={styles.actionRow}>
                <TouchableOpacity
                    style={[
                        styles.clockInButton,
                        {
                            shadowColor: isClockedIn ? colors.primary : colors.gold,
                            borderColor: isClockedIn ? colors.primary : colors.gold
                        }
                    ]}
                    onPress={isClockedIn ? undefined : onClockIn}
                    disabled={isClockedIn}
                >
                    <LinearGradient
                        colors={isClockedIn
                            ? [colors.card, colors.card] // Muted when done
                            : [colors.glassBg, 'rgba(253, 178, 2, 0.15)'] // Subtle gold gradient when active
                        }
                        style={StyleSheet.absoluteFill}
                    />
                    <Feather name={isClockedIn ? "check-circle" : "clock"} size={20} color={isClockedIn ? colors.textSecondary : colors.gold} />
                    <Text style={[
                        styles.clockInText,
                        { color: isClockedIn ? colors.textSecondary : colors.gold }
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
    // Updated Styles
    identitySection: {
        marginTop: 0,
        paddingHorizontal: 24,
        alignItems: 'center', // Centered Layout
    },
    avatarContainer: {
        marginBottom: 16,
        alignItems: 'center',
    },
    avatarWrapper: {
        position: 'relative',
        // Centered by parent
    },
    avatar: {
        width: 100, // Slightly Larger
        height: 100,
        borderRadius: 50,
        borderWidth: 3, // Thicker Gold Ring
    },
    editBadge: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    bioContainer: {
        marginBottom: 16,
        alignItems: 'center', // Center text
        width: '100%',
    },
    name: {
        fontSize: 22, // Larger Name
        fontWeight: 'bold',
        fontFamily: 'Montserrat_700Bold',
        marginBottom: 4,
        textAlign: 'center',
    },
    tagline: {
        fontSize: 14,
        lineHeight: 20,
        textAlign: 'center',
        marginBottom: 8,
    },
    followRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    followText: {
        fontSize: 14,
    },
    bioText: {
        fontSize: 14,
        lineHeight: 22,
        marginTop: 4,
        textAlign: 'center',
        fontFamily: 'Montserrat_400Regular',
    },

    // Stats Grid - Glass Cards
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'center', // Center the cards
        alignItems: 'stretch',
        marginTop: 8,
        gap: 12, // Space between cards
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    glassStatCard: {
        flex: 1,
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        // Glass effect simulated by bg color + border
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        fontFamily: 'Oswald_700Bold',
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },

    // Action Row
    actionRow: {
        paddingHorizontal: 40,
        marginBottom: 10,
    },
    clockInButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 56,
        borderRadius: 28,
        gap: 10,
        borderWidth: 1,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 15, // Neon Glow
        elevation: 5,
        overflow: 'hidden', // For gradient
    },
    clockInText: {
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: 'Montserrat_600SemiBold',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },

    // Misc
    bioActionsRow: {
        marginTop: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
    },
    shareIconSmall: {
        padding: 4,
    },
    linksRow: {
        flexDirection: 'row',
        marginTop: 12,
        flexWrap: 'wrap',
        gap: 8,
        justifyContent: 'center',
    },
    linkButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    }
});
