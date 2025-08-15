import React, { useEffect, useState, useRef, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Image, Modal, Alert } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import { useRouter } from 'expo-router';
import SettingsModal from './SettingsModal';
import { LinearGradient } from 'expo-linear-gradient';
import type { UserData, SavedContentItem } from '../types';

interface LearningStats {
  videosWatched: number;
  postsLiked: number;
  postsSaved: number;
  daysActive: number;
}

interface ProfileProps {
  user: import('../types').User | null;
  navigateTo?: (screen: string) => void;
  signOut?: () => Promise<void>;
}

const defaultUserData: UserData = {
  name: 'Demo User',
  email: 'user@example.com',
  joinDate: 'September 2023',
  interests: ['CS', 'Finance & Economics', 'Maths'],
  stats: {
    videosWatched: 0,
    minutesLearned: 0,
    topicsExplored: 0,
    daysStreak: 0,
  },
  savedContent: [],
};

const defaultLearningStats: LearningStats = {
  videosWatched: 0,
  postsLiked: 0,
  postsSaved: 0,
  daysActive: 0,
};

export const Profile: React.FC<ProfileProps> = ({ user: userProp, navigateTo, signOut }) => {
  const { colors, isDark } = useTheme();
  const [userData, setUserData] = useState<UserData>(defaultUserData);
  const [fullName, setFullName] = useState<string>(defaultUserData.name);
  const [interests, setInterests] = useState<string[]>([]);
  const [learningStats, setLearningStats] = useState<LearningStats>(defaultLearningStats);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);
  const router = useRouter();
  const [userXpDisplay, setUserXpDisplay] = useState<string>('0');
  const [userLevelDisplay, setUserLevelDisplay] = useState<string>('1');
  const [userXp, setUserXp] = useState<number>(0);
  const [userLevel, setUserLevel] = useState<number>(1);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [profileDetails, setProfileDetails] = useState<{
    education: string;
    experience: string;
    goals: string;
    projects: string;
  }>({
    education: '',
    experience: '',
    goals: '',
    projects: ''
  });

  // Always get the current user from supabase.auth to ensure we have the right id
  const [currentUser, setCurrentUser] = useState<any>(null);
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setCurrentUser(data?.user || null);
    };
    getUser();
  }, []);

  const fetchLearningStats = async (userId: string) => {
    try {
      setIsLoadingStats(true);
      
      // Use the comprehensive stats function for better performance
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_user_stats', { user_id_param: userId });

      if (statsError) {
        console.error('Error fetching learning stats:', statsError);
        // Keep default stats on error
      } else if (statsData && statsData.length > 0) {
        const stats = statsData[0];
        setLearningStats({
          videosWatched: parseInt(stats.videos_watched) || 0,
          postsLiked: parseInt(stats.posts_liked) || 0,
          postsSaved: parseInt(stats.posts_saved) || 0,
          daysActive: stats.days_active || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching learning stats:', error);
      // Keep default stats on error
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    const fetchProfileAndSaves = async () => {
      if (!currentUser) return;
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, email, created_at, xp, level, avatar_url')
        .eq('id', currentUser.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      } else if (profileData) {
        setFullName(profileData.full_name || defaultUserData.name);
        const xp = profileData.xp ?? 0;
        const level = profileData.level ?? 1;
        setUserXpDisplay(String(xp));
        setUserLevelDisplay(String(level));
        setUserXp(xp);
        setUserLevel(level);
        setAvatarUrl(profileData.avatar_url);
        setUserData((prev) => ({
          ...prev,
          name: profileData.full_name || defaultUserData.name,
          email: profileData.email || defaultUserData.email,
          joinDate: profileData.created_at
            ? new Date(profileData.created_at).toLocaleString('default', { month: 'long', year: 'numeric' })
            : defaultUserData.joinDate,
        }));
      }

      // Fetch user interests
      const { data: industriesData, error: industriesError } = await supabase
        .from('user_industries')
        .select('industries (name)')
        .eq('user_id', currentUser.id);

      if (industriesError) {
        console.error('Error fetching user industries:', industriesError);
      } else if (industriesData) {
        setInterests(industriesData.map((i: any) => i.industries.name));
      }

      const userId = currentUser.id;

      // Fetch saved content from all three tables
      const [savedArticles, savedPapers, savedBooks] = await Promise.all([
        supabase.from('article_saves').select('articles(*)')
          .eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('paper_saves').select('papers(*)')
          .eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('book_saves').select('books(*)')
          .eq('user_id', userId).order('created_at', { ascending: false }),
      ]);

      const savedContent: SavedContentItem[] = [];

      if (savedArticles.data) {
        savedContent.push(...savedArticles.data.map((row: any) => {
          const item = row.articles;
          return {
            id: item?.id,
            title: item?.title || 'Untitled',
            type: 'article',
            date: item?.created_at ? new Date(item.created_at).toLocaleDateString() : '',
          };
        }));
      }

      if (savedPapers.data) {
        savedContent.push(...savedPapers.data.map((row: any) => {
          const item = row.papers;
          return {
            id: item?.id,
            title: item?.title || 'Untitled',
            type: 'paper',
            date: item?.created_at ? new Date(item.created_at).toLocaleDateString() : '',
          };
        }));
      }

      if (savedBooks.data) {
        savedContent.push(...savedBooks.data.map((row: any) => {
          const item = row.books;
          return {
            id: item?.id,
            title: item?.title || 'Untitled',
            type: 'book',
            date: item?.created_at ? new Date(item.created_at).toLocaleDateString() : '',
          };
        }));
      }

      // Sort all saved content by date
      savedContent.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setUserData((prev) => ({ ...prev, savedContent }));
      
      // Fetch detailed profile information for display
      const [eduDetailsRes, expDetailsRes, goalsDetailsRes, projectsRes] = await Promise.all([
        supabase.from('user_education').select('universities (name), degrees (name), stage').eq('user_id', userId).maybeSingle(),
        supabase.from('user_experiences').select('companies (name), experience_level, description').eq('user_id', userId).maybeSingle(),
        supabase.from('user_goals').select('goal, timeframe').eq('user_id', userId).maybeSingle(),
        supabase.from('user_projects').select('title, description').eq('user_id', userId)
      ]);

      const education = eduDetailsRes.data 
        ? `${(eduDetailsRes.data as any).universities?.name || ''} - ${(eduDetailsRes.data as any).degrees?.name || ''} (${eduDetailsRes.data.stage || ''})`.replace(/^- |  - $/, '').trim()
        : '';
      
      const experience = expDetailsRes.data
        ? `${(expDetailsRes.data as any).companies?.name || ''} (${expDetailsRes.data.experience_level || ''})${expDetailsRes.data.description ? ` - ${expDetailsRes.data.description}` : ''}`.replace(/^- |  - $/, '').trim()
        : '';
      
      const goals = goalsDetailsRes.data
        ? `${goalsDetailsRes.data.goal || ''} (${goalsDetailsRes.data.timeframe || ''})`.replace(/^- |  - $/, '').trim()
        : '';
      
      const projects = projectsRes.data?.map((p: any) => `${p.title || ''}: ${p.description || ''}`).join('; ') || '';

      setProfileDetails({
        education,
        experience, 
        goals,
        projects
      });

      // Fetch learning stats
      await fetchLearningStats(userId);
    };
    fetchProfileAndSaves();
  }, [currentUser]);

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    profileHeader: {
      paddingTop: 60,
      paddingHorizontal: 20,
      paddingBottom: 20,
      alignItems: 'center',
    },
    settingsButton: {
      position: 'absolute',
      top: 60,
      right: 20,
      zIndex: 1,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      borderWidth: 3,
      borderColor: 'white',
      marginBottom: 12,
    },
    avatarEditOverlay: {
      position: 'absolute',
      bottom: 12,
      right: 0,
      backgroundColor: colors.primary,
      borderRadius: 12,
      padding: 4,
      borderWidth: 2,
      borderColor: 'white',
    },
    userName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: 'white',
    },
    userEmail: {
      fontSize: 16,
      color: 'rgba(255, 255, 255, 0.8)',
    },
    statsContainer: {
      paddingHorizontal: 16,
      marginTop: 20,
    },
    interestContainer: {
      paddingHorizontal: 20,
      marginTop: 20,
    },
    interestTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    interestTagContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    interestTag: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: 20,
      paddingVertical: 8,
      paddingHorizontal: 16,
      marginRight: 8,
      marginBottom: 8,
    },
    interestText: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: '500',
    },
    savedCard: {
      marginTop: 20,
      marginHorizontal: 16,
      backgroundColor: colors.card,
      padding: 20,
      borderRadius: 16,
    },
    savedTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    signOutButton: {
      marginTop: 20,
      alignSelf: 'center',
    },
    signOutText: {
      color: '#EF4444',
      fontSize: 16,
      fontWeight: '600',
    },
    savedItemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      backgroundColor: colors.card,
      marginBottom: 12,
      width: 300,
      marginRight: 12,
    },
    savedItemTitle: {
      fontWeight: '500',
      color: colors.text,
      fontSize: 16,
    },
    savedItemType: {
      textTransform: 'capitalize',
      color: colors.textTertiary,
      fontSize: 12,
    },
    savedItemDate: {
      color: colors.textTertiary,
      fontSize: 12,
    },
    contentContainer: {
      paddingBottom: 120,
    },
    xpContainer: {
      marginHorizontal: 16,
      marginTop: 20,
      backgroundColor: colors.card,
      padding: 20,
      borderRadius: 16,
    },
    xpHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    xpTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    xpText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    progressBarContainer: {
      marginBottom: 12,
    },
    progressBar: {
      height: 8,
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 4,
    },
    totalXpText: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 16,
    },
    awardsSection: {
      marginTop: 8,
    },
    awardsTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    awardsScrollView: {
      flexDirection: 'row',
    },
    awardBadge: {
      width: 50,
      height: 50,
      borderRadius: 25,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    awardText: {
      color: 'white',
      fontSize: 12,
      fontWeight: 'bold',
    },
    noAwardsText: {
      fontSize: 14,
      fontStyle: 'italic',
      textAlign: 'center',
      paddingVertical: 15,
    },
    profileDetailsContainer: {
      marginHorizontal: 16,
      marginTop: 20,
      backgroundColor: colors.card,
      padding: 20,
      borderRadius: 16,
    },
    profileDetailsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    profileDetailsTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    profileDetailItem: {
      marginBottom: 12,
    },
    profileDetailLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    profileDetailValue: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    emptyProfileText: {
      fontSize: 14,
      textAlign: 'center',
      marginBottom: 16,
      lineHeight: 20,
    },
    editProfileButton: {
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      alignItems: 'center',
    },
    editProfileButtonText: {
      color: 'white',
      fontSize: 14,
      fontWeight: '600',
    },
  });

  const renderInterests = () => {
      if (!interests || interests.length === 0) return null;
      return (
        <View style={dynamicStyles.interestContainer}>
          <Text style={dynamicStyles.interestTitle}>Interests</Text>
          <View style={dynamicStyles.interestTagContainer}>
            {interests.map((interest) => (
              <View key={interest} style={dynamicStyles.interestTag}>
                <Text style={dynamicStyles.interestText}>{interest}</Text>
              </View>
            ))}
          </View>
        </View>
      );
    };

  const renderProfileDetails = () => {
    const details = [
      { label: 'Education', value: profileDetails.education },
      { label: 'Experience', value: profileDetails.experience },
      { label: 'Goals', value: profileDetails.goals },
      { label: 'Projects', value: profileDetails.projects }
    ].filter(detail => detail.value);

    if (details.length === 0) {
      return (
        <View style={dynamicStyles.profileDetailsContainer}>
          <Text style={dynamicStyles.profileDetailsTitle}>Profile Details</Text>
          <Text style={[dynamicStyles.emptyProfileText, { color: colors.textSecondary }]}>
            Complete your profile in Settings to showcase your background and goals.
          </Text>
          <TouchableOpacity 
            style={[dynamicStyles.editProfileButton, { backgroundColor: colors.primary }]}
            onPress={() => setIsSettingsModalVisible(true)}
          >
            <Text style={dynamicStyles.editProfileButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={dynamicStyles.profileDetailsContainer}>
        <View style={dynamicStyles.profileDetailsHeader}>
          <Text style={dynamicStyles.profileDetailsTitle}>Profile Details</Text>
          <TouchableOpacity onPress={() => setIsSettingsModalVisible(true)}>
            <Feather name="edit" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
        
        {details.map((detail, index) => (
          <View key={index} style={dynamicStyles.profileDetailItem}>
            <Text style={dynamicStyles.profileDetailLabel}>{detail.label}</Text>
            <Text style={dynamicStyles.profileDetailValue}>{detail.value}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderXPProgress = () => {
    const currentLevelXP = (userLevel - 1) * 20; // XP needed to reach current level
    const nextLevelXP = userLevel * 20; // XP needed to reach next level
    const progressInCurrentLevel = userXp - currentLevelXP;
    const progressPercentage = (progressInCurrentLevel / 20) * 100;

    return (
      <View style={dynamicStyles.xpContainer}>
        <View style={dynamicStyles.xpHeader}>
          <Text style={dynamicStyles.xpTitle}>Level {userLevel}</Text>
          <Text style={dynamicStyles.xpText}>{progressInCurrentLevel}/20 XP</Text>
        </View>
        
        <View style={dynamicStyles.progressBarContainer}>
          <View style={[dynamicStyles.progressBar, { backgroundColor: colors.border }]}>
            <View style={[
              dynamicStyles.progressFill, 
              { 
                width: `${Math.min(progressPercentage, 100)}%`,
                backgroundColor: colors.primary 
              }
            ]} />
          </View>
        </View>
        
        <Text style={dynamicStyles.totalXpText}>Total XP: {userXp}</Text>
        
        {/* Awards Section */}
        <View style={dynamicStyles.awardsSection}>
          <Text style={dynamicStyles.awardsTitle}>Achievements</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={dynamicStyles.awardsScrollView}>
            {Array.from({ length: userLevel - 1 }, (_, index) => (
              <View key={index} style={[dynamicStyles.awardBadge, { backgroundColor: colors.primary }]}>
                <Text style={dynamicStyles.awardText}>L{index + 1}</Text>
              </View>
            ))}
            {userLevel === 1 && (
              <Text style={[dynamicStyles.noAwardsText, { color: colors.textSecondary }]}>
                Complete quizzes to earn your first achievement!
              </Text>
            )}
          </ScrollView>
        </View>
      </View>
    );
  };

  const renderStats = () => (
    <View style={dynamicStyles.statsContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <StatCard
          title="XP"
          value={userXpDisplay}
          icon={<Feather name="star" size={24} color={colors.text} />}
          color="yellow"
        />
        <StatCard
          title="Level"
          value={userLevelDisplay}
          icon={<Feather name="trending-up" size={24} color={colors.text} />}
          color="purple"
        />
        <StatCard
          title="Posts Liked"
          value={isLoadingStats ? '...' : learningStats.postsLiked.toString()}
          icon={<Feather name="heart" size={24} color={colors.text} />}
          color="green"
        />
        <StatCard
          title="Posts Saved"
          value={isLoadingStats ? '...' : learningStats.postsSaved.toString()}
          icon={<Feather name="bookmark" size={24} color={colors.text} />}
          color="blue"
        />
        <StatCard
          title="Days Active"
          value={learningStats.daysActive.toString()}
          icon={<Feather name="calendar" size={24} color={colors.text} />}
          color="yellow"
        />
      </ScrollView>
    </View>
  );

  const renderSavedItem = (item: SavedContentItem) => (
    <TouchableOpacity
      key={item.id}
      style={[dynamicStyles.savedItemRow, { width: 260, marginRight: 16 }]}
      accessibilityLabel={`View saved content: ${item.title}`}
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/feed', params: { contentId: item.id, contentType: item.type } })}
    >
      <View style={styles.savedIconCircle}>
        <Feather name="bookmark" size={18} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={dynamicStyles.savedItemTitle}>{item.title}</Text>
        <View style={styles.savedItemMetaRow}>
          <Text style={dynamicStyles.savedItemType}>{item.type}</Text>
          <View style={styles.savedDot} />
          <Text style={dynamicStyles.savedItemDate}>{item.date}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const handleSignOut = async () => {
    if (signOut) {
      await signOut();
    }
  };

  const handleProfilePicturePress = () => {
    Alert.alert(
      "Update Profile Picture",
      "Choose an option",
      [
        {
          text: "Take Photo",
          onPress: () => Alert.alert("Camera", "Camera functionality requires expo-image-picker. For now, using placeholder.")
        },
        {
          text: "Choose from Gallery", 
          onPress: () => Alert.alert("Gallery", "Gallery functionality requires expo-image-picker. For now, using placeholder.")
        },
        {
          text: "Use Default",
          onPress: () => updateProfilePicture("default")
        },
        {
          text: "Cancel",
          style: "cancel"
        }
      ]
    );
  };

  const updateProfilePicture = async (type: string) => {
    if (!currentUser) return;
    
    try {
      let newAvatarUrl = null;
      
      if (type === "default") {
        // Use the profileIcon.png as default
        newAvatarUrl = null; // This will fall back to profileIcon.png
      } else {
        // For future implementation with expo-image-picker
        newAvatarUrl = "https://randomuser.me/api/portraits/men/32.jpg"; // Placeholder
      }

      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: newAvatarUrl })
        .eq('id', currentUser.id);

      if (error) {
        throw error;
      }

      setAvatarUrl(newAvatarUrl);
      Alert.alert("Success", "Profile picture updated successfully!");
    } catch (error) {
      console.error('Error updating profile picture:', error);
      Alert.alert("Error", "Failed to update profile picture.");
    }
  };

  // User profile modal data interface
  interface UserProfile {
    id: string;
    full_name: string;
    avatar_url: string | null;
    xp: number;
    level: number;
    email: string;
    created_at: string;
    industries: string[];
    education: string;
    experience: string;
    goals: string;
  }

  // Small inline component to render top-3 leaderboard by XP
  const LeaderboardTop3: React.FC = () => {
    const { colors } = useTheme();
    const [rows, setRows] = useState<Array<{ id: string; full_name: string; avatar_url: string | null; xp: number }>>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [userModalVisible, setUserModalVisible] = useState(false);

    useEffect(() => {
      const fetchLeaderboard = async () => {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, xp')
          .order('xp', { ascending: false })
          .limit(3);
        if (!error && data) setRows(data as any);
        setLoading(false);
      };
      fetchLeaderboard();
    }, []);

    const fetchUserProfile = async (userId: string) => {
      try {
        // Fetch basic profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, xp, level, email, created_at')
          .eq('id', userId)
          .single();

        if (profileError || !profileData) {
          console.error('Error fetching user profile:', profileError);
          return;
        }

        // Fetch user industries
        const { data: industriesData } = await supabase
          .from('user_industries')
          .select('industries (name)')
          .eq('user_id', userId);

        // Fetch education data
        const { data: educationData } = await supabase
          .from('user_education')
          .select('universities (name), degrees (name), stage')
          .eq('user_id', userId)
          .maybeSingle();

        // Fetch experience data
        const { data: experienceData } = await supabase
          .from('user_experiences')
          .select('companies (name), experience_level, description')
          .eq('user_id', userId)
          .maybeSingle();

        // Fetch goals data
        const { data: goalsData } = await supabase
          .from('user_goals')
          .select('goal, timeframe')
          .eq('user_id', userId)
          .maybeSingle();

        const industries = industriesData?.map((i: any) => i.industries.name) || [];
        const education = educationData 
          ? `${educationData.universities?.name || ''} - ${educationData.degrees?.name || ''} (${educationData.stage || ''})`.replace(/^- |  - $/, '').trim()
          : '';
        const experience = experienceData
          ? `${experienceData.companies?.name || ''} (${experienceData.experience_level || ''})${experienceData.description ? ` - ${experienceData.description}` : ''}`.replace(/^- |  - $/, '').trim()
          : '';
        const goals = goalsData
          ? `${goalsData.goal || ''} (${goalsData.timeframe || ''})`.replace(/^- |  - $/, '').trim()
          : '';

        const userProfile: UserProfile = {
          ...profileData,
          industries,
          education,
          experience,
          goals
        };

        setSelectedUser(userProfile);
        setUserModalVisible(true);
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    if (loading) {
      return <Text style={{ color: colors.textSecondary }}>Loading...</Text>;
    }

    if (!rows.length) {
      return <Text style={{ color: colors.textSecondary }}>No leaderboard data yet.</Text>;
    }

    return (
      <>
        <View>
          {rows.map((r, idx) => (
            <TouchableOpacity 
              key={r.id} 
              style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, padding: 8, borderRadius: 8 }}
              onPress={() => fetchUserProfile(r.id)}
            >
              <Text style={{ width: 24, color: colors.text }}>{idx + 1}.</Text>
              <Image source={{ uri: r.avatar_url || 'https://i.pravatar.cc/40' }} style={{ width: 28, height: 28, borderRadius: 14, marginRight: 8 }} />
              <Text style={{ flex: 1, color: colors.text }}>{r.full_name}</Text>
              <Text style={{ color: colors.textSecondary }}>{r.xp} XP</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* User Profile Modal */}
        <Modal
          visible={userModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setUserModalVisible(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ 
              backgroundColor: colors.card, 
              margin: 20, 
              borderRadius: 16, 
              padding: 20, 
              maxHeight: '80%',
              width: '90%'
            }}>
              {selectedUser && (
                <ScrollView showsVerticalScrollIndicator={false}>
                  {/* Header */}
                  <View style={{ alignItems: 'center', marginBottom: 20 }}>
                    <Image 
                      source={{ uri: selectedUser.avatar_url || 'https://i.pravatar.cc/80' }} 
                      style={{ width: 80, height: 80, borderRadius: 40, marginBottom: 12 }}
                    />
                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text, marginBottom: 4 }}>
                      {selectedUser.full_name}
                    </Text>
                    <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>
                      Level {selectedUser.level} • {selectedUser.xp} XP
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                      Joined {new Date(selectedUser.created_at).toLocaleDateString()}
                    </Text>
                  </View>

                  {/* Profile Details */}
                  {selectedUser.industries.length > 0 && (
                    <View style={{ marginBottom: 16 }}>
                      <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 8 }}>
                        Industries
                      </Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                        {selectedUser.industries.map((industry, index) => (
                          <View key={index} style={{ 
                            backgroundColor: colors.primary + '20', 
                            paddingHorizontal: 12, 
                            paddingVertical: 4, 
                            borderRadius: 16, 
                            marginRight: 8, 
                            marginBottom: 4 
                          }}>
                            <Text style={{ color: colors.primary, fontSize: 12 }}>{industry}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {selectedUser.education && (
                    <View style={{ marginBottom: 16 }}>
                      <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 8 }}>
                        Education
                      </Text>
                      <Text style={{ color: colors.textSecondary }}>{selectedUser.education}</Text>
                    </View>
                  )}

                  {selectedUser.experience && (
                    <View style={{ marginBottom: 16 }}>
                      <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 8 }}>
                        Experience
                      </Text>
                      <Text style={{ color: colors.textSecondary }}>{selectedUser.experience}</Text>
                    </View>
                  )}

                  {selectedUser.goals && (
                    <View style={{ marginBottom: 16 }}>
                      <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 8 }}>
                        Goals
                      </Text>
                      <Text style={{ color: colors.textSecondary }}>{selectedUser.goals}</Text>
                    </View>
                  )}
                </ScrollView>
              )}

              {/* Close Button */}
              <TouchableOpacity
                style={{ 
                  backgroundColor: colors.primary, 
                  padding: 12, 
                  borderRadius: 8, 
                  alignItems: 'center', 
                  marginTop: 16 
                }}
                onPress={() => setUserModalVisible(false)}
              >
                <Text style={{ color: 'white', fontWeight: '600' }}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </>
    );
  };

  return (
    <View style={dynamicStyles.container}>
      <ScrollView contentContainerStyle={dynamicStyles.contentContainer}>
        <LinearGradient
          colors={['#4F46E5', '#8B5CF6']}
          style={dynamicStyles.profileHeader}
        >
          <TouchableOpacity style={dynamicStyles.settingsButton} onPress={() => setIsSettingsModalVisible(true)}>
            <Feather name="settings" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleProfilePicturePress}>
            <Image
              source={
                avatarUrl 
                  ? { uri: avatarUrl } 
                  : require('../profileIcon.png') // Fallback to local profileIcon.png
              }
              style={dynamicStyles.avatar}
            />
            <View style={dynamicStyles.avatarEditOverlay}>
              <Feather name="edit-2" size={16} color="white" />
            </View>
          </TouchableOpacity>
          <Text style={dynamicStyles.userName}>{fullName}</Text>
          <Text style={dynamicStyles.userEmail}>{userData.email}</Text>
        </LinearGradient>
        {renderXPProgress()}
        {renderStats()}
        <View style={dynamicStyles.savedCard}>
          <Text style={dynamicStyles.savedTitle}>Leaderboard (Top 3)</Text>
          <LeaderboardTop3 />
        </View>
        {renderInterests()}
        {renderProfileDetails()}
        <View style={dynamicStyles.savedCard}>
          <Text style={dynamicStyles.savedTitle}>Saved Content</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {userData.savedContent.length > 0 ? (
              userData.savedContent.map(renderSavedItem)
            ) : (
              <Text style={{ color: colors.textSecondary, marginTop: 10 }}>No saved content yet.</Text>
            )}
          </ScrollView>
        </View>
      </ScrollView>

      <SettingsModal
        visible={isSettingsModalVisible}
        onClose={() => setIsSettingsModalVisible(false)}
        navigateTo={router.push}
        signOut={signOut || (async () => {})}
      />
    </View>
  );
};

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'yellow';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => {
  const { colors } = useTheme();

  const colorMap = {
    blue: {
      background: 'rgba(79, 70, 229, 0.1)',
      border: 'rgba(79, 70, 229, 0.2)',
    },
    green: {
      background: 'rgba(16, 185, 129, 0.1)',
      border: 'rgba(16, 185, 129, 0.2)',
    },
    purple: {
      background: 'rgba(139, 92, 246, 0.1)',
      border: 'rgba(139, 92, 246, 0.2)',
    },
    yellow: {
      background: 'rgba(245, 158, 11, 0.1)',
      border: 'rgba(245, 158, 11, 0.2)',
    },
  };

  const selectedColor = colorMap[color];

  const styles = StyleSheet.create({
    card: {
      backgroundColor: selectedColor.background,
      borderColor: selectedColor.border,
      borderWidth: 1,
      borderRadius: 16,
      padding: 16,
      alignItems: 'center',
      width: 150,
      marginRight: 12,
      marginBottom: 12,
    },
    value: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
    },
    title: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.textSecondary,
      marginTop: 4,
    },
  });

  return (
    <View style={styles.card}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scrollContent: {
    paddingBottom: 80,
    paddingTop: 17,
  },
  headerContainer: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerSettingsBtn: {
    padding: 8,
    borderRadius: 999,
  },
  innerContent: {
    padding: 16,
  },
  userInfoCard: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    marginBottom: 15,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
  },
  avatarCircle: {
    height: 80,
    width: 80,
    backgroundColor: '#2563EB',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
  },
  userInfoTextCol: {
    marginLeft: 16,
    flex: 1,
    alignItems: 'flex-start',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  userEmail: {
    color: '#4B5563',
    fontSize: 16,
  },
  userJoinDate: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  interestsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-start',
    marginTop: 16,
  },
  interestPill: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    marginRight: 8,
    marginBottom: 8,
  },
  interestText: {
    color: '#1E40AF',
    fontSize: 14,
  },
  statsCard: {
    marginTop: 16,
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 16,
    color: '#111827',
  },
  statsContainer: {
    marginHorizontal: -8,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 4,
    height: 110,
  },
  statsCol: {
    width: '50%',
    padding: 8,
    alignItems: 'stretch',
  },
  savedCard: {
    marginTop: 16,
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    marginBottom: 16,
  },
  savedHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  savedTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#111827',
  },
  savedViewAll: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  savedItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  savedIconCircle: {
    padding: 10,
    backgroundColor: '#DBEAFE',
    borderRadius: 999,
    marginRight: 12,
  },
  savedItemTitle: {
    fontWeight: '500',
    color: '#111827',
    fontSize: 16,
    lineHeight: 20,
  },
  savedItemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  savedItemType: {
    textTransform: 'capitalize',
    color: '#6B7280',
    fontSize: 12,
  },
  savedDot: {
    height: 4,
    width: 4,
    borderRadius: 2,
    backgroundColor: '#9CA3AF',
    marginHorizontal: 8,
  },
  savedItemDate: {
    color: '#6B7280',
    fontSize: 12,
  },
  savedEmptyText: {
    color: '#6B7280',
    textAlign: 'center',
    paddingVertical: 16,
  },
});
