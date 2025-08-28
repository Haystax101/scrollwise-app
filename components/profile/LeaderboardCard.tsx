import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';

interface LeaderboardUser {
  id: string;
  full_name: string;
  avatar_url: string | null;
  total_voltz_earned: number;
}

interface LeaderboardCardProps {
  loading?: boolean;
}

export const LeaderboardCard: React.FC<LeaderboardCardProps> = ({ loading: parentLoading = false }) => {
  const { colors, isDark } = useTheme();
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, total_voltz_earned')
          .order('total_voltz_earned', { ascending: false })
          .limit(3);
        
        if (!error && data) {
          setUsers(data);
        } else {
          console.error('Error fetching leaderboard:', error);
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const getRankEmoji = (index: number) => {
    switch (index) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return `${index + 1}.`;
    }
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: isDark ? colors.surface : colors.card,
      padding: 20,
      borderRadius: 16,
      marginBottom: 24,
      marginHorizontal: 20,
      borderWidth: isDark ? 1 : 0,
      borderColor: colors.border,
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
      backgroundColor: isDark ? colors.background : colors.surface,
    },
    rankContainer: {
      width: 32,
      alignItems: 'center',
    },
    rankText: {
      fontSize: 16,
      fontWeight: '600',
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

  if (users.length === 0) {
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
      
      {users.map((user, index) => (
        <View key={user.id} style={styles.userRow}>
          <View style={styles.rankContainer}>
            <Text style={styles.rankText}>{getRankEmoji(index)}</Text>
          </View>
          
          <Image 
            source={{ uri: user.avatar_url || 'https://i.pravatar.cc/40' }} 
            style={styles.avatar} 
          />
          
          <View style={styles.userInfo}>
            <Text style={styles.userName} numberOfLines={1}>
              {user.full_name}
            </Text>
          </View>
          
          <View style={styles.voltzContainer}>
            <Text style={styles.voltzText}>
              {user.total_voltz_earned.toLocaleString()}
            </Text>
            <Text style={styles.voltzLabel}>Voltz</Text>
          </View>
        </View>
      ))}
    </View>
  );
};