import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { streakService, StreakInfo } from '../../services/streakService';
import { StreakEditModal } from './StreakEditModal';

interface StreakDisplayProps {
  userId: string;
  onRefresh?: () => void;
}

export const StreakDisplay: React.FC<StreakDisplayProps> = ({ userId, onRefresh }) => {
  const { colors } = useTheme();
  const [streakInfo, setStreakInfo] = useState<StreakInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    if (userId && userId.trim() !== '') {
      loadStreakInfo();
    } else {
      console.log('StreakDisplay: No valid userId provided:', userId);
      setLoading(false);
    }
  }, [userId]);

  const loadStreakInfo = async () => {
    if (!userId || userId.trim() === '') {
      console.log('StreakDisplay: Cannot load streak info - invalid userId');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const info = await streakService.getStreakInfo(userId);
      setStreakInfo(info);
    } catch (error) {
      console.error('Error loading streak info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditPress = () => {
    setShowEditModal(true);
  };

  const handleModalClose = () => {
    setShowEditModal(false);
  };

  const handleModalSave = () => {
    setShowEditModal(false);
    loadStreakInfo(); // Refresh data
    onRefresh?.(); // Notify parent to refresh
  };

  const getStreakColor = (streak: number) => {
    if (streak >= 30) return '#10B981'; // Green for 30+ days
    if (streak >= 7) return '#F59E0B'; // Amber for 7+ days
    return colors.primary; // Default primary color
  };

  const getProgressPercentage = () => {
    if (!streakInfo) return 0;
    return Math.min((streakInfo.current_streak / streakInfo.target_days) * 100, 100);
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      marginHorizontal: 20,
      marginVertical: 10,
      borderRadius: 16,
      padding: 20,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    editButton: {
      padding: 4,
    },
    loadingContainer: {
      height: 80,
      justifyContent: 'center',
      alignItems: 'center',
    },
    streakContent: {
      alignItems: 'center',
      gap: 12,
    },
    streakNumber: {
      fontSize: 36,
      fontWeight: 'bold',
      color: getStreakColor(streakInfo?.current_streak || 0),
    },
    streakLabel: {
      fontSize: 16,
      color: colors.textSecondary,
      marginTop: -4,
    },
    streakMessage: {
      fontSize: 14,
      color: colors.text,
      textAlign: 'center',
      marginTop: 8,
      fontStyle: 'italic',
    },
    progressContainer: {
      width: '100%',
      marginTop: 16,
    },
    progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    progressLabel: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    progressPercentage: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },
    progressBar: {
      height: 6,
      backgroundColor: colors.border,
      borderRadius: 3,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: 3,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    statItem: {
      alignItems: 'center',
      gap: 4,
    },
    statNumber: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
    },
    statLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    riskIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: '#FEF3CD',
      borderRadius: 12,
      gap: 4,
    },
    riskText: {
      fontSize: 12,
      color: '#92400E',
      fontWeight: '500',
    },
  });

  // Don't render anything if no valid userId
  if (!userId || userId.trim() === '') {
    return null;
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Learning Streak</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (!streakInfo) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Learning Streak</Text>
          <TouchableOpacity style={styles.editButton} onPress={handleEditPress}>
            <Feather name="settings" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.streakContent}>
          <Text style={[styles.streakNumber, { color: colors.textSecondary }]}>1</Text>
          <Text style={styles.streakLabel}>Day Streak</Text>
          <Text style={styles.streakMessage}>Start your learning journey today!</Text>
        </View>
      </View>
    );
  }

  const progressPercentage = getProgressPercentage();
  const isAtRisk = streakService.isStreakAtRisk(streakInfo);
  const streakMessage = streakService.getStreakMessage(streakInfo);

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Learning Streak</Text>
          <TouchableOpacity style={styles.editButton} onPress={handleEditPress}>
            <Feather name="settings" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.streakContent}>
          <Text style={styles.streakNumber}>
            {streakInfo.current_streak}
          </Text>
          <Text style={styles.streakLabel}>
            {streakInfo.current_streak === 1 ? 'Day Streak' : 'Days Streak'}
          </Text>

          {isAtRisk && (
            <View style={styles.riskIndicator}>
              <Feather name="alert-triangle" size={12} color="#92400E" />
              <Text style={styles.riskText}>Streak at risk!</Text>
            </View>
          )}

          <Text style={styles.streakMessage}>{streakMessage}</Text>
        </View>

        {/* Progress towards goal */}
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>
              Progress to {streakInfo.target_days}-day goal
            </Text>
            <Text style={styles.progressPercentage}>
              {Math.round(progressPercentage)}%
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${progressPercentage}%` }
              ]}
            />
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{streakInfo.current_streak}</Text>
            <Text style={styles.statLabel}>Current</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{streakInfo.longest_streak}</Text>
            <Text style={styles.statLabel}>Best</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{streakInfo.target_days}</Text>
            <Text style={styles.statLabel}>Goal</Text>
          </View>
        </View>
      </View>

      <StreakEditModal
        visible={showEditModal}
        onClose={handleModalClose}
        onSave={handleModalSave}
        userId={userId}
        currentTarget={streakInfo?.target_days || 30}
      />
    </>
  );
};