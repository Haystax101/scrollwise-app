import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Image,
    Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { profileImageService } from '../../services/profileImageService';
import { UGCArchiveGrid } from './UGCArchiveGrid';
import { NetworkModal } from './NetworkModal';

interface UserProfile {
    id: string;
    full_name: string;
    avatar_url?: string | null;
    tagline?: string | null;
    total_voltz_earned: number;
    level: number;
    // Stats
    followers_count: number;
    following_count: number;
    streak?: number;
    // Industries
    industries?: Array<{ id: string; name: string; stage: string }>;
    // Profile passions
    passionate_about?: string | null;
    working_on?: string | null;
    // Connection info
    is_following?: boolean;
}

interface UserDetailContentProps {
    userId: string;
    currentUserId?: string;
    onClose: () => void;
}

export const UserDetailContent: React.FC<UserDetailContentProps> = ({
    userId,
    currentUserId,
    onClose,
}) => {
    const { colors } = useTheme();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isBlocked, setIsBlocked] = useState(false);
    const [blockLoading, setBlockLoading] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);
    const [showNetworkModal, setShowNetworkModal] = useState(false);
    const [networkModalTab, setNetworkModalTab] = useState<'followers' | 'following'>('followers');

    useEffect(() => {
        if (userId) {
            fetchUserProfile();
        }
    }, [userId]);

    const fetchUserProfile = async () => {
        setLoading(true);
        setError(null);

        try {
            // console.log('UserDetailContent: Fetching profile for user:', userId);

            // Fetch basic profile info
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url, tagline, total_voltz_earned, level')
                .eq('id', userId)
                .single();

            if (profileError) {
                console.error('UserDetailContent: Error fetching profile:', profileError);
                throw profileError;
            }

            // Fetch industries
            const { data: industriesData } = await supabase
                .from('user_industries')
                .select('industries(id, name), stage')
                .eq('user_id', userId);

            const industries = industriesData?.map((ui: any) => ({
                id: ui.industries.id,
                name: ui.industries.name,
                stage: ui.stage
            })) || [];

            // Fetch profile passions
            const { data: passionsData } = await supabase
                .from('profile_passions')
                .select('passionate_about, working_on')
                .eq('user_id', userId)
                .maybeSingle();

            // Check follow status if current user is provided
            let isFollowing = false;

            if (currentUserId && currentUserId !== userId) {
                const { data: followData } = await supabase
                    .from('follows')
                    .select('follower_id') // We only care if a record exists
                    .match({ follower_id: currentUserId, following_id: userId })
                    .maybeSingle();

                if (followData) {
                    isFollowing = true;
                }

                // Check if user is blocked
                const { data: blockData } = await supabase.rpc('is_user_blocked', {
                    p_user_id: userId
                });
                setIsBlocked(blockData || false);
            }

            // Fetch stats (followers/following)
            const { data: statsData } = await supabase.rpc('get_follow_counts', {
                target_user_id: userId
            });

            // Calculate streak
            const userStreak = 0; // Default for now

            const completeProfile: UserProfile = {
                id: profileData.id,
                full_name: profileData.full_name,
                avatar_url: profileData.avatar_url,
                tagline: profileData.tagline,
                total_voltz_earned: profileData.total_voltz_earned || 0,
                level: profileData.level || 1,
                followers_count: statsData?.followers || 0,
                following_count: statsData?.following || 0,
                streak: userStreak,
                industries,
                passionate_about: passionsData?.passionate_about,
                working_on: passionsData?.working_on,
                is_following: isFollowing,
            };

            setProfile(completeProfile);

        } catch (error) {
            console.error('UserDetailContent: Error fetching user profile:', error);
            setError('Failed to load profile information');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleFollow = async () => {
        if (!currentUserId || !profile || followLoading) return;
        setFollowLoading(true);

        try {
            if (profile.is_following) {
                // Unfollow
                const { error } = await supabase
                    .from('follows')
                    .delete()
                    .match({ follower_id: currentUserId, following_id: profile.id });

                if (error) throw error;

                setProfile(prev => prev ? { ...prev, is_following: false, followers_count: Math.max(0, prev.followers_count - 1) } : null);
            } else {
                // Follow
                const { error } = await supabase
                    .from('follows')
                    .insert({ follower_id: currentUserId, following_id: profile.id });

                if (error) throw error;

                setProfile(prev => prev ? { ...prev, is_following: true, followers_count: prev.followers_count + 1 } : null);
            }
        } catch (error) {
            console.error('Error toggling follow:', error);
            Alert.alert('Error', 'Failed to update follow status');
        } finally {
            setFollowLoading(false);
        }
    };


    const handleBlockToggle = async () => {
        if (!currentUserId || !profile) return;

        const confirmMessage = isBlocked
            ? `Are you sure you want to unblock ${profile.full_name}? You will see their content in your feed again.`
            : `Are you sure you want to block ${profile.full_name}? You will no longer see their content in your feed.`;

        Alert.alert(
            isBlocked ? 'Unblock User' : 'Block User',
            confirmMessage,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: isBlocked ? 'Unblock' : 'Block',
                    style: isBlocked ? 'default' : 'destructive',
                    onPress: async () => {
                        setBlockLoading(true);
                        try {
                            const { data, error } = await supabase.rpc('toggle_user_block', {
                                p_blocked_id: profile.id
                            });

                            if (error) throw error;

                            if (data?.success) {
                                setIsBlocked(data.is_blocked);
                                Alert.alert(
                                    'Success',
                                    data.is_blocked
                                        ? `${profile.full_name} has been blocked. You will no longer see their content.`
                                        : `${profile.full_name} has been unblocked.`
                                );
                            } else {
                                throw new Error(data?.error || 'Failed to update block status');
                            }
                        } catch (error) {
                            console.error('Error toggling block:', error);
                            Alert.alert('Error', 'Failed to update block status. Please try again.');
                        } finally {
                            setBlockLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 60,
            paddingHorizontal: 20,
            paddingBottom: 20,
            zIndex: 10,
        },
        title: {
            fontSize: 18,
            fontWeight: '600',
            color: colors.text,
            fontFamily: 'Montserrat_600SemiBold',
        },
        closeButton: {
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.card,
            justifyContent: 'center',
            alignItems: 'center',
        },
        actionButton: {
            width: 40, // consistent spacing
        },
        content: {
            flex: 1,
        },
        loadingContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
        },
        errorContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 20,
        },
        errorText: {
            color: colors.textSecondary,
            marginBottom: 16,
            textAlign: 'center',
        },
        retryButton: {
            backgroundColor: colors.primary,
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 8,
        },
        retryButtonText: {
            color: 'white',
            fontWeight: '600',
        },

        // Identity Section (Matches SocialProfileHeader)
        identitySection: {
            paddingHorizontal: 24,
            marginBottom: 24,
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
            borderColor: colors.primary,
            backgroundColor: colors.surface,
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
            color: colors.text,
        },
        socialStatLabel: {
            fontSize: 12,
            fontWeight: '500',
            textAlign: 'center',
            color: colors.textSecondary,
        },
        bioContainer: {
            marginBottom: 8,
        },
        name: {
            fontSize: 22, // Slightly larger
            fontWeight: 'bold',
            fontFamily: 'Montserrat_700Bold',
            marginBottom: 4,
            color: colors.text,
        },
        tagline: {
            fontSize: 14,
            lineHeight: 20,
            color: colors.textSecondary,
            fontStyle: 'italic',
        },

        // Action Buttons Row (Connect / Block)
        actionRow: {
            flexDirection: 'row',
            gap: 12,
            marginTop: 16,
        },
        primaryActionButton: {
            flex: 1,
            backgroundColor: colors.primary,
            paddingVertical: 10,
            borderRadius: 20, // Rounded pill style
            alignItems: 'center',
            justifyContent: 'center',
        },
        primaryActionButtonOutline: {
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: colors.text,
        },
        primaryActionText: {
            color: 'white',
            fontWeight: '600',
            fontSize: 14,
        },
        secondaryActionButton: {
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.card,
            alignItems: 'center',
            justifyContent: 'center',
        },

        // Stats Grid
        statsGrid: {
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 24,
            paddingVertical: 16,
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: colors.border,
            marginHorizontal: 20,
            marginBottom: 24,
            backgroundColor: colors.card + '40', // Slight tint
            borderRadius: 12,
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
            color: colors.textSecondary,
        },
        statDivider: {
            width: 1,
            height: 24,
            backgroundColor: colors.border,
        },

        // Content Sections
        scrollContent: {
            paddingBottom: 60,
        },
        section: {
            backgroundColor: colors.surface,
            marginHorizontal: 20,
            marginVertical: 8,
            borderRadius: 16,
            padding: 20,
        },
        sectionTitle: {
            fontSize: 16,
            fontWeight: '600',
            color: colors.text,
            marginBottom: 12,
            fontFamily: 'Montserrat_600SemiBold',
        },
        sectionContent: {
            fontSize: 14,
            color: colors.text,
            lineHeight: 22,
        },
        industriesContainer: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            marginTop: 4,
        },
        industryTag: {
            backgroundColor: colors.card,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 16,
            marginRight: 8,
            marginBottom: 8,
            borderWidth: 1,
            borderColor: colors.border,
        },
        industryText: {
            fontSize: 12,
            color: colors.primary,
            fontWeight: '500',
        },

        // Grid Section
        gridSection: {
            marginTop: 24,
        }
    });

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                    <Feather name="x" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Profile</Text>
                <View style={styles.actionButton} />
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : error ? (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={fetchUserProfile}>
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : profile ? (
                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    <View style={styles.scrollContent}>
                        {/* Identity Section - Instagram Style Split */}
                        <View style={styles.identitySection}>
                            <View style={styles.profileTopContainer}>
                                {/* Avatar (Left) */}
                                <View style={styles.avatarWrapper}>
                                    <Image
                                        source={
                                            profile.avatar_url
                                                ? { uri: profileImageService.getProfileImageUrl(profile.avatar_url) }
                                                : require('../../assets/profileIconDefault.png')
                                        }
                                        style={styles.avatar}
                                    />
                                </View>

                                {/* Stats (Right) */}
                                <View style={styles.socialStatsContainer}>
                                    <TouchableOpacity
                                        style={styles.statGroup}
                                        onPress={() => {
                                            setNetworkModalTab('followers');
                                            setShowNetworkModal(true);
                                        }}
                                    >
                                        <Text style={styles.socialStatValue}>{profile.followers_count}</Text>
                                        <Text style={styles.socialStatLabel}>Followers</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.statGroup}
                                        onPress={() => {
                                            setNetworkModalTab('following');
                                            setShowNetworkModal(true);
                                        }}
                                    >
                                        <Text style={styles.socialStatValue}>{profile.following_count}</Text>
                                        <Text style={styles.socialStatLabel}>Following</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Name & Bio */}
                            <View style={styles.bioContainer}>
                                <Text style={styles.name}>{profile.full_name}</Text>
                                {profile.tagline && (
                                    <Text style={styles.tagline}>{profile.tagline}</Text>
                                )}
                            </View>

                            {/* Actions Row */}
                            {currentUserId && currentUserId !== profile.id && (
                                <View style={styles.actionRow}>
                                    <TouchableOpacity
                                        style={[
                                            styles.primaryActionButton,
                                            profile.is_following && styles.primaryActionButtonOutline
                                        ]}
                                        onPress={handleToggleFollow}
                                        disabled={followLoading}
                                    >
                                        {followLoading ? (
                                            <ActivityIndicator size="small" color={profile.is_following ? colors.text : 'white'} />
                                        ) : (
                                            <Text style={[
                                                styles.primaryActionText,
                                                profile.is_following && { color: colors.text }
                                            ]}>
                                                {profile.is_following ? 'Following' : 'Follow'}
                                            </Text>
                                        )}
                                    </TouchableOpacity>

                                    {/* Block Button (Small Icon) */}
                                    <TouchableOpacity
                                        style={[
                                            styles.secondaryActionButton,
                                            isBlocked && { borderColor: '#dc2626', backgroundColor: '#dc2626' + '10' }
                                        ]}
                                        onPress={handleBlockToggle}
                                        disabled={blockLoading}
                                    >
                                        {blockLoading ? (
                                            <ActivityIndicator size="small" color={colors.text} />
                                        ) : (
                                            <Feather
                                                name={isBlocked ? 'user-check' : 'slash'}
                                                size={20}
                                                color={isBlocked ? '#dc2626' : colors.text}
                                            />
                                        )}
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>

                        {/* Gamification Stats Grid */}
                        <View style={styles.statsGrid}>
                            <View style={styles.statItem}>
                                <Text style={[styles.statValue, { color: colors.text }]}>{profile.level}</Text>
                                <Text style={styles.statLabel}>Level</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Text style={[styles.statValue, { color: '#EAB308' }]}>{profile.total_voltz_earned}</Text>
                                <Text style={styles.statLabel}>Voltz</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Text style={[styles.statValue, { color: '#F43F5E' }]}>{profile.streak || 0}</Text>
                                <Text style={styles.statLabel}>Streak</Text>
                            </View>
                        </View>

                        {/* Industries */}
                        {profile.industries && profile.industries.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Industry Interests</Text>
                                <View style={styles.industriesContainer}>
                                    {profile.industries.map((industry, index) => (
                                        <View key={index} style={styles.industryTag}>
                                            <Text style={styles.industryText}>{industry.name}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* What they're passionate about */}
                        {profile.passionate_about && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>What they're passionate about</Text>
                                <Text style={styles.sectionContent}>{profile.passionate_about}</Text>
                            </View>
                        )}

                        {/* What they're working on */}
                        {profile.working_on && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>What they're working on</Text>
                                <Text style={styles.sectionContent}>{profile.working_on}</Text>
                            </View>
                        )}

                        {/* User Content Grid */}
                        <View style={styles.gridSection}>
                            <UGCArchiveGrid userId={userId} />
                        </View>
                    </View>
                </ScrollView>
            ) : null}
            {/* Network Modal */}
            <NetworkModal
                visible={showNetworkModal}
                onClose={() => setShowNetworkModal(false)}
                userId={userId}
                initialTab={networkModalTab}
            />
        </View>
    );
};
