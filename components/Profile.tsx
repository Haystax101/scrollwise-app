import React, { useEffect, useState, useRef, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Image } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import { industryIdToName } from '../lib/industryMap';
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

export const Profile: React.FC<ProfileProps> = ({ user, navigateTo, signOut }) => {
  const { colors, isDark } = useTheme();
  const [userData, setUserData] = useState<UserData>(defaultUserData);
  const [fullName, setFullName] = useState<string>(defaultUserData.name);
  const [interests, setInterests] = useState<number[]>([]);
  const [learningStats, setLearningStats] = useState<LearningStats>(defaultLearningStats);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);
  const router = useRouter();

  const fetchLearningStats = async (userId: string) => {
    try {
      setIsLoadingStats(true);
      
      // Use the comprehensive stats function for better performance
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_user_learning_stats', { user_id_param: userId });

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
      // Fetch profile info
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, email, created_at, interests')
        .single();
      if (profileData) {
        setFullName(profileData.full_name || defaultUserData.name);
        setInterests(profileData.interests || defaultUserData.interests);
        setUserData((prev) => ({
          ...prev,
          name: profileData.full_name || defaultUserData.name,
          email: profileData.email || defaultUserData.email,
          joinDate: profileData.created_at
            ? new Date(profileData.created_at).toLocaleString('default', { month: 'long', year: 'numeric' })
            : defaultUserData.joinDate,
        }));
      }

      // Fetch saved reels for this user
      if (user && user.email) {
        // Get user id from supabase.auth
        const { data: authUser } = await supabase.auth.getUser();
        const userId = authUser?.user?.id;
        if (userId) {
          // Join article_saves and articles to get saved content
          const { data: savedRows, error: savedError } = await supabase
            .from('article_saves')
            .select('article_id, created_at, articles (id, title, type, created_at)')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
          if (!savedError && savedRows) {
            const savedContent: SavedContentItem[] = savedRows.map((row: any) => {
              const article = row.articles;
              return {
                id: article?.id,
                title: article?.title || 'Untitled',
                type: article?.type || 'unknown',
                date: article?.created_at
                  ? new Date(article.created_at).toLocaleDateString()
                  : '',
              };
            });
            setUserData((prev) => ({ ...prev, savedContent }));
          }
          
          // Fetch learning stats
          await fetchLearningStats(userId);
        }
      }
    };
    fetchProfileAndSaves();
  }, [user]);

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
  });

  const renderInterests = () => {
      if (!interests || interests.length === 0) return null;
      return (
        <View style={dynamicStyles.interestContainer}>
          <Text style={dynamicStyles.interestTitle}>Interests</Text>
          <View style={dynamicStyles.interestTagContainer}>
            {interests.map((id) => (
              <View key={id} style={dynamicStyles.interestTag}>
                <Text style={dynamicStyles.interestText}>{industryIdToName[id]}</Text>
              </View>
            ))}
          </View>
        </View>
      );
    };

  const renderStats = () => (
    <View style={dynamicStyles.statsContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <StatCard
          title="Insights Gained"
          value={isLoadingStats ? '...' : learningStats.videosWatched.toString()}
          icon={<Feather name="play-circle" size={24} color={colors.text} />}
          color="blue"
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
          color="purple"
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
      onPress={() => router.push({ pathname: '/feed', params: { reelId: item.id } })}
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
          <Image
            source={{ uri: 'https://randomuser.me/api/portraits/men/32.jpg' }} // Placeholder
            style={dynamicStyles.avatar}
          />
          <Text style={dynamicStyles.userName}>{fullName}</Text>
          <Text style={dynamicStyles.userEmail}>{userData.email}</Text>
        </LinearGradient>
        {renderStats()}
        {renderInterests()}
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
