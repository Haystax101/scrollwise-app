import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { profileImageService } from '../../services/profileImageService';

interface LeaderboardUser {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  total_voltz_earned: number;
  rank: number;
}

interface LeaderboardCardProps {
  loading?: boolean;
}

export const LeaderboardCard: React.FC<LeaderboardCardProps> = ({ loading: parentLoading = false }) => {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const [displayUsers, setDisplayUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      if (!user) return;

      setLoading(true);
      try {
        const { data, error } = await supabase.rpc('get_leaderboard_for_user', {
          p_user_id: user.id,
        });

        if (error) {
          console.error('Error fetching leaderboard:', error);
          return;
        }

        if (data) {
          const currentUser = data.find((u) => u.user_id === user.id);
          const top3 = data.filter((u) => u.rank <= 3);
          
          let finalUsers: LeaderboardUser[] = [];

          if (!currentUser || currentUser.rank <= 3) {
            finalUsers = top3.slice(0, 3);
          } else {
            const top2 = data.filter((u) => u.rank <= 2);
            finalUsers = [...top2, currentUser];
          }
          
          setDisplayUsers(finalUsers);
        }
      } catch (err) {
        console.error('Caught exception fetching leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [user]);

  const getRankDisplay = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      padding: 20,
      borderRadius: 16,
      marginBottom: 24,
      marginHorizontal: 20,
      borderWidth: isDark ? 0 : 1,
      borderColor: isDark ? 'transparent' : colors.border,
    },
    header: {
      marginBottom: 16,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    loadingContainer: {
      paddingVertical: 20,
      alignItems: 'center',
    },
    emptyContainer: {
      paddingVertical: 20,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    userRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 12,
      marginBottom: 8,
      borderRadius: 12,
      backgroundColor: isDark ? colors.background : '#F8F8F8',
    },
    currentUserRow: {
      backgroundColor: colors.primaryMuted,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    rankContainer: {
      width: 40,
      alignItems: 'center',
    },
    rankText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    avatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      marginRight: 12,
      backgroundColor: colors.border,
    },
    userInfo: {
      flex: 1,
    },
    userName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    voltzContainer: {
      alignItems: 'flex-end',
    },
    voltzText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.primary,
    },
    voltzLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
  });

  if (parentLoading || loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Leaderboard</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.emptyText, { marginTop: 8 }]}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (displayUsers.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Leaderboard</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No leaderboard data yet</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Leaderboard</Text>
      </View>
      
      {displayUsers.map((u) => {
        const isCurrentUser = u.user_id === user?.id;
        const imageUrl = profileImageService.getProfileImageUrl(u.avatar_url);
        return (
          <View key={u.user_id} style={[styles.userRow, isCurrentUser && styles.currentUserRow]}>
            <View style={styles.rankContainer}>
              <Text style={styles.rankText}>{getRankDisplay(u.rank)}</Text>
            </View>
            
            <Image 
              source={imageUrl ? { uri: imageUrl } : require('../../assets/profileIconDefault.png')}
              style={styles.avatar}
              onError={() => {
                console.log('Leaderboard avatar failed to load, using default');
              }}
            />
            
            <View style={styles.userInfo}>
              <Text style={styles.userName} numberOfLines={1}>
                {isCurrentUser ? 'You' : u.full_name}
              </Text>
            </View>
            
            <View style={styles.voltzContainer}>
              <Text style={styles.voltzText}>
                {u.total_voltz_earned.toLocaleString()}
              </Text>
              <Text style={styles.voltzLabel}>Voltz</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
};
