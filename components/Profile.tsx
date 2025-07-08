import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import type { UserData, SavedContentItem } from '../types';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { industryIdToName } from '../lib/industryMap';
import { useRouter } from 'expo-router';

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
    videosWatched: 247,
    minutesLearned: 823,
    topicsExplored: 18,
    daysStreak: 14,
  },
  savedContent: [],
};

export const Profile: React.FC<ProfileProps> = ({ user, navigateTo, signOut }) => {
  const [userData, setUserData] = useState<UserData>(defaultUserData);
  const [fullName, setFullName] = useState<string>(defaultUserData.name);
  const [interests, setInterests] = useState<number[]>([]);
  const router = useRouter();

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
        }
      }
    };
    fetchProfileAndSaves();
  }, [user]);

  return (
    <View style={styles.container}>
     {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity style={styles.headerSettingsBtn} accessibilityLabel="Open settings" accessibilityRole="button" onPress={() => navigateTo && navigateTo('settings')}>
            <Feather name="settings" size={22} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
     

      <View style={styles.innerContent}>
        {/* User Info */}
        <View style={styles.userInfoCard}>
          <View style={styles.userInfoRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>{fullName.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.userInfoTextCol}>
              <Text style={styles.userName}>{fullName}</Text>
              <Text style={styles.userEmail}>{userData.email}</Text>
              <Text style={styles.userJoinDate}>Member since {userData.joinDate}</Text>
            </View>
          </View>
          <View style={styles.interestsRow}>
            {interests.map((interest) => (
              <View
                key={interest}
                style={styles.interestPill}
              >
                <Text style={styles.interestText}>{industryIdToName[interest] || interest}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Your Learning Stats</Text>
          <View style={styles.statsGridRow}>
            <View style={styles.statsCol}><StatCard
              title="Watch Time"
              value={`${userData.stats.minutesLearned} min`}
              icon={<Feather name="clock" size={20} color="#2563EB" />}
              color="blue"
            /></View>
            <View style={styles.statsCol}><StatCard
              title="Videos Watched"
              value={userData.stats.videosWatched.toString()}
              icon={<MaterialCommunityIcons name="chart-bar" size={20} color="#16A34A" />}
              color="green"
            /></View>
            <View style={styles.statsCol}><StatCard
              title="Topics Explored"
              value={userData.stats.topicsExplored.toString()}
              icon={<Feather name="book-open" size={20} color="#9333EA" />}
              color="purple"
            /></View>
            <View style={styles.statsCol}><StatCard
              title="Day Streak"
              value={`${userData.stats.daysStreak} days`}
              icon={<Feather name="trending-up" size={20} color="#F59E42" />}
              color="yellow"
            /></View>
          </View>
        </View>

        {/* Saved Content */}
        <View style={styles.savedCard}>
          <View style={styles.savedHeaderRow}>
            <Text style={styles.savedTitle}>Saved Content</Text>
          </View>
          <ScrollView
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 4 }}
            style={{ marginTop: 8 }}
          >
            {userData.savedContent.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.savedItemRow, { width: 260, marginRight: 16 }]}
                accessibilityLabel={`View saved content: ${item.title}`}
                accessibilityRole="button"
                onPress={() => router.push({ pathname: '/feed', params: { articleId: item.id } })}
              >
                <View style={styles.savedIconCircle}>
                  <Feather name="bookmark" size={18} color="#2563EB" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.savedItemTitle}>{item.title}</Text>
                  <View style={styles.savedItemMetaRow}>
                    <Text style={styles.savedItemType}>{item.type}</Text>
                    <View style={styles.savedDot} />
                    <Text style={styles.savedItemDate}>{item.date}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
            {userData.savedContent.length === 0 && (
              <Text style={styles.savedEmptyText}>No saved content yet.</Text>
            )}
          </ScrollView>
        </View>

        {/* Add a logout button if signOut is provided */}
        {signOut && (
          <TouchableOpacity style={{marginTop: 16, alignSelf: 'center'}} onPress={signOut} accessibilityLabel="Log out" accessibilityRole="button">
            <Text style={{color: 'red', fontWeight: 'bold'}}>Log Out</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
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
  const bgColors = {
    blue: '#EFF6FF',
    green: '#ECFDF5',
    purple: '#F3E8FF',
    yellow: '#FEF9C3',
  };
  return (
    <View style={[statStyles.card, { backgroundColor: bgColors[color] }]}> 
      <View style={statStyles.row}>
        {icon}
        <Text style={statStyles.title}>{title}</Text>
      </View>
      <Text style={statStyles.value}>{value}</Text>
    </View>
  );
};

const statStyles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    flex: 1,
    marginBottom: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontWeight: '500',
    fontSize: 14,
    marginLeft: 8,
  },
  value: {
    fontWeight: 'bold',
    fontSize: 24,
    color: '#1F2937',
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scrollContent: {
    paddingBottom: 80,
    paddingTop: 30,
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
  statsGridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  statsCol: {
    width: '50%',
    padding: 8,
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
