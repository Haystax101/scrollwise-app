import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

interface LevelProgressCardProps {
  level: number;
  currentVoltz: number;
  spendableVoltz?: number;
}

export const LevelProgressCard: React.FC<LevelProgressCardProps> = ({
  level,
  currentVoltz,
  spendableVoltz = 0
}) => {
  const { colors, isDark } = useTheme();

  // Calculate progress within current level (each level requires 20 Voltz)
  const currentLevelVoltz = (level - 1) * 20;
  const nextLevelVoltz = level * 20;
  const progressInCurrentLevel = currentVoltz - currentLevelVoltz;
  const progressPercentage = Math.min((progressInCurrentLevel / 20) * 100, 100);

  const styles = StyleSheet.create({
    container: {
      backgroundColor: isDark ? colors.surface : colors.card,
      padding: 20,
      borderRadius: 16,
      marginBottom: 24,
      borderWidth: isDark ? 1 : 0,
      borderColor: isDark ? colors.border : 'transparent',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    leftHeader: {
      flex: 1,
    },
    levelLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '500',
      letterSpacing: 0.5,
    },
    levelContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
    },
    lightningIcon: {
      marginRight: 4,
    },
    levelText: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
    },
    rightHeader: {
      alignItems: 'flex-end',
    },
    voltzLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '500',
      letterSpacing: 0.5,
    },
    voltzText: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.primary,
      marginTop: 4,
    },
    batteryContainer: {
      position: 'relative',
      height: 40,
      backgroundColor: isDark ? '#2D2D3A' : '#F3F4F6',
      borderRadius: 8,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: isDark ? '#3D3D4A' : '#E5E7EB',
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    batteryTerminal: {
      position: 'absolute',
      right: -1,
      top: '50%',
      marginTop: -12,
      height: 24,
      width: 6,
      backgroundColor: isDark ? '#3D3D4A' : '#D1D5DB',
      borderTopRightRadius: 3,
      borderBottomRightRadius: 3,
    },
    progressFill: {
      height: '100%',
      borderRadius: 6,
      flexDirection: 'row',
      alignItems: 'center',
      paddingLeft: 8,
    },
    lightningInBattery: {
      marginRight: 4,
    },
    progressText: {
      position: 'absolute',
      left: 0,
      right: 0,
      textAlign: 'center',
      fontSize: 12,
      fontWeight: 'bold',
      color: colors.text,
      zIndex: 2,
    },
    totalVoltzText: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });

  const createLinearGradient = () => ({
    backgroundColor: colors.primary,
    // For React Native, we'll use a solid color instead of gradient
    // You could implement react-native-linear-gradient here if needed
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.leftHeader}>
          <Text style={styles.levelLabel}>CURRENT LEVEL</Text>
          <View style={styles.levelContainer}>
            <View style={styles.lightningIcon}>
              <Feather name="zap" size={20} color={colors.primary} />
            </View>
            <Text style={styles.levelText}>Level {level}</Text>
          </View>
        </View>
        <View style={styles.rightHeader}>
          <Text style={styles.voltzLabel}>VOLTZ POINTS</Text>
          <Text style={styles.voltzText}>{spendableVoltz.toLocaleString()}</Text>
        </View>
      </View>

      <View style={styles.batteryContainer}>
        <View style={styles.batteryTerminal} />
        <View 
          style={[
            styles.progressFill, 
            createLinearGradient(),
            { width: `${progressPercentage}%` }
          ]}
        >
          {progressPercentage > 15 && (
            <View style={styles.lightningInBattery}>
              <Feather name="zap" size={12} color="black" />
            </View>
          )}
        </View>
        <Text style={styles.progressText}>
          {progressPercentage.toFixed(0)}% to Level {level + 1}
        </Text>
      </View>

      <Text style={styles.totalVoltzText}>Total Voltz Earned: {currentVoltz.toLocaleString()}</Text>
    </View>
  );
};