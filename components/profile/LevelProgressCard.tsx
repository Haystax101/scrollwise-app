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
      backgroundColor: isDark ? '#2D3748' : '#374151',
      padding: 20,
      borderRadius: 16,
      marginBottom: 24,
      marginHorizontal: 20,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    leftHeader: {
      flex: 1,
    },
    levelLabel: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.7)',
      fontWeight: '500',
    },
    rightHeader: {
      alignItems: 'flex-end',
    },
    voltzText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#EAB308',
    },
    progressContainer: {
      position: 'relative',
      height: 16,
      backgroundColor: isDark ? '#1A202C' : '#1F2937',
      borderRadius: 8,
      overflow: 'hidden',
      marginBottom: 12,
    },
    progressFill: {
      height: '100%',
      backgroundColor: '#EAB308',
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    progressIcon: {
      position: 'absolute',
      left: '50%',
      marginLeft: -8,
    },
    progressLabels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    levelText: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.7)',
      fontWeight: '500',
    },
    totalVoltzText: {
      fontSize: 12,
      color: 'rgba(255, 255, 255, 0.7)',
      textAlign: 'center',
    },
  });


  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.leftHeader}>
          <Text style={styles.levelLabel}>Voltz Level</Text>
        </View>
        <View style={styles.rightHeader}>
          <Text style={styles.voltzText}>{currentVoltz.toLocaleString()} Voltz</Text>
        </View>
      </View>

      <View style={styles.progressLabels}>
        <Text style={styles.levelText}>Level {level}</Text>
        <Text style={styles.levelText}>Level {level + 1}</Text>
      </View>

      <View style={styles.progressContainer}>
        <View 
          style={[
            styles.progressFill,
            { width: `${progressPercentage}%` }
          ]}
        >
          {progressPercentage > 30 && (
            <View style={styles.progressIcon}>
              <Feather name="zap" size={12} color="#000000" />
            </View>
          )}
        </View>
      </View>

      <Text style={styles.totalVoltzText}>Total Voltz Earned: {currentVoltz.toLocaleString()}</Text>
    </View>
  );
};