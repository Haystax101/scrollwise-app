import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { profileImageService } from '../../services/profileImageService';

interface UserProfile {
  id: string;
  full_name: string;
  avatar_url?: string | null;
  tagline?: string | null;
  total_voltz_earned: number;
  level: number;
  // Career goal
  career_goal?: string | null;
  career_timeframe?: string | null;
  career_companies?: string[];
  // Industries
  industries?: Array<{ id: string; name: string; stage: string }>;
  // Profile passions
  passionate_about?: string | null;
  working_on?: string | null;
  // Connection info
  is_friend?: boolean;
  friend_request_sent?: boolean;
  friend_request_received?: boolean;
}

interface UserDetailModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  currentUserId?: string; // For friendship status checks
}

export const UserDetailModal: React.FC<UserDetailModalProps> = ({
  visible,
  onClose,
  userId,
  currentUserId,
}) => {
  const { colors, isDark } = useTheme();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible && userId) {
      fetchUserProfile();
    }
  }, [visible, userId]);

  const fetchUserProfile = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔍 UserDetailModal: Fetching profile for user:', userId);

      // Fetch basic profile info
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, tagline, total_voltz_earned, level')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('❌ UserDetailModal: Error fetching profile:', profileError);
        throw profileError;
      }

      // Fetch career goal
      const { data: careerData } = await supabase
        .from('user_goals')
        .select('goal, timeframe')
        .eq('user_id', userId)
        .eq('goal_type', 'career')
        .maybeSingle();

      // Fetch career goal companies
      let careerCompanies: string[] = [];
      if (careerData) {
        const { data: companiesData } = await supabase
          .from('user_goal_companies')
          .select('companies(name)')
          .eq('user_id', userId);

        careerCompanies = companiesData?.map((c: any) => c.companies?.name).filter(Boolean) || [];
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

      // Check friendship status if current user is provided
      let friendshipInfo = {
        is_friend: false,
        friend_request_sent: false,
        friend_request_received: false,
      };

      if (currentUserId && currentUserId !== userId) {
        const { data: friendshipData } = await supabase
          .from('friendships')
          .select('status, requester_id, addressee_id')
          .or(`and(requester_id.eq.${currentUserId},addressee_id.eq.${userId}),and(requester_id.eq.${userId},addressee_id.eq.${currentUserId})`)
          .maybeSingle();

        if (friendshipData) {
          if (friendshipData.status === 'accepted') {
            friendshipInfo.is_friend = true;
          } else if (friendshipData.status === 'pending') {
            if (friendshipData.requester_id === currentUserId) {
              friendshipInfo.friend_request_sent = true;
            } else {
              friendshipInfo.friend_request_received = true;
            }
          }
        }
      }

      const completeProfile: UserProfile = {
        id: profileData.id,
        full_name: profileData.full_name,
        avatar_url: profileData.avatar_url,
        tagline: profileData.tagline,
        total_voltz_earned: profileData.total_voltz_earned || 0,
        level: profileData.level || 1,
        career_goal: careerData?.goal,
        career_timeframe: careerData?.timeframe,
        career_companies: careerCompanies,
        industries,
        passionate_about: passionsData?.passionate_about,
        working_on: passionsData?.working_on,
        ...friendshipInfo,
      };

      console.log('✅ UserDetailModal: Profile fetched successfully:', {
        name: completeProfile.full_name,
        hasTagline: !!completeProfile.tagline,
        hasCareerGoal: !!completeProfile.career_goal,
        industriesCount: industries.length,
        voltz: completeProfile.total_voltz_earned,
        level: completeProfile.level,
      });

      setProfile(completeProfile);

    } catch (error) {
      console.error('❌ UserDetailModal: Error fetching user profile:', error);
      setError('Failed to load profile information');
    } finally {
      setLoading(false);
    }
  };

  const handleSendFriendRequest = async () => {
    if (!currentUserId || !profile) return;

    try {
      const { error } = await supabase
        .from('friendships')
        .insert({
          requester_id: currentUserId,
          addressee_id: profile.id,
          status: 'pending',
        });

      if (error) throw error;

      // Update local state
      setProfile(prev => prev ? {
        ...prev,
        friend_request_sent: true,
        friend_request_received: false,
      } : prev);

      console.log('✅ Friend request sent successfully');
    } catch (error) {
      console.error('❌ Error sending friend request:', error);
    }
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
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      flex: 1,
      textAlign: 'center',
      marginHorizontal: 40,
    },
    closeButton: {
      padding: 8,
    },
    actionButton: {
      padding: 8,
    },
    content: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 40,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    errorText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 16,
    },
    retryButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 8,
    },
    retryButtonText: {
      color: 'white',
      fontSize: 14,
      fontWeight: '600',
    },
    profileHeader: {
      alignItems: 'center',
      paddingVertical: 24,
      paddingHorizontal: 20,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.surface,
      marginBottom: 12,
    },
    name: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 4,
    },
    tagline: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      fontStyle: 'italic',
      marginBottom: 12,
      paddingHorizontal: 20,
    },
    levelBadge: {
      backgroundColor: '#EAB308',
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      marginBottom: 16,
    },
    levelText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#000000',
      marginLeft: 4,
    },
    connectButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 8,
    },
    connectButtonDisabled: {
      backgroundColor: colors.surface,
    },
    connectButtonText: {
      color: 'white',
      fontSize: 14,
      fontWeight: '600',
      textAlign: 'center',
    },
    connectButtonTextDisabled: {
      color: colors.textSecondary,
    },
    scrollContent: {
      paddingBottom: 40,
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
    },
    sectionContent: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
    },
    industriesContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 8,
    },
    industryTag: {
      backgroundColor: isDark ? colors.border : colors.surface,
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
    companiesContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 8,
    },
    companyTag: {
      backgroundColor: isDark ? colors.border : colors.surface,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 16,
      marginRight: 8,
      marginBottom: 4,
    },
    companyText: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: '500',
    },
    voltzText: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.primary,
    },
  });

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
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
              {/* Profile Header */}
              <View style={styles.profileHeader}>
                <Image
                  source={
                    profile.avatar_url
                      ? { uri: profileImageService.getProfileImageUrl(profile.avatar_url) }
                      : require('../../assets/profileIconDefault.png')
                  }
                  style={styles.avatar}
                />
                <Text style={styles.name}>{profile.full_name}</Text>
                {profile.tagline && (
                  <Text style={styles.tagline}>{profile.tagline}</Text>
                )}
                <View style={styles.levelBadge}>
                  <Feather name="zap" size={16} color="#000000" />
                  <Text style={styles.levelText}>Level {profile.level}</Text>
                </View>

                {/* Connection Button */}
                {currentUserId && currentUserId !== profile.id && (
                  <TouchableOpacity
                    style={[
                      styles.connectButton,
                      (profile.is_friend || profile.friend_request_sent || profile.friend_request_received) &&
                      styles.connectButtonDisabled
                    ]}
                    onPress={handleSendFriendRequest}
                    disabled={profile.is_friend || profile.friend_request_sent || profile.friend_request_received}
                  >
                    <Text style={[
                      styles.connectButtonText,
                      (profile.is_friend || profile.friend_request_sent || profile.friend_request_received) &&
                      styles.connectButtonTextDisabled
                    ]}>
                      {profile.is_friend ? 'Connected' :
                       profile.friend_request_sent ? 'Request Sent' :
                       profile.friend_request_received ? 'Request Received' :
                       'Connect'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Voltz */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Total Voltz Earned</Text>
                <Text style={styles.voltzText}>{profile.total_voltz_earned.toLocaleString()}</Text>
              </View>

              {/* Career Goal */}
              {profile.career_goal && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Career Goal</Text>
                  <Text style={styles.sectionContent}>
                    {profile.career_goal}
                    {profile.career_timeframe && ` • ${profile.career_timeframe}`}
                  </Text>
                  {profile.career_companies && profile.career_companies.length > 0 && (
                    <View style={styles.companiesContainer}>
                      {profile.career_companies.map((company, index) => (
                        <View key={index} style={styles.companyTag}>
                          <Text style={styles.companyText}>{company}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}

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
            </View>
          </ScrollView>
        ) : null}
      </View>
    </Modal>
  );
};