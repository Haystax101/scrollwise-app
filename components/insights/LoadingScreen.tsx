import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useInsightsTheme } from '../../lib/insightsTheme';

interface Props {
  supercharged: boolean;
}

export const LoadingScreen: React.FC<Props> = ({ supercharged }) => {
  const { colors, spacing, borderRadius } = useInsightsTheme();
  const [progress, setProgress] = useState(0);
  const spinValue = new Animated.Value(0);

  useEffect(() => {
    // Spinning animation
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();

    // Progress animation
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 5;
      });
    }, 150);

    return () => clearInterval(interval);
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: spacing.xl,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.insightsTextPrimary,
    },
    loadingContainer: {
      position: 'relative',
      width: 96,
      height: 96,
      justifyContent: 'center',
      alignItems: 'center',
    },
    spinningBorder: {
      position: 'absolute',
      width: 96,
      height: 96,
      borderRadius: 48,
      borderWidth: 4,
      borderColor: 'transparent',
      borderTopColor: colors.yellow[400],
    },
    iconContainer: {
      width: 96,
      height: 96,
      backgroundColor: colors.gray[800],
      borderRadius: 48,
      justifyContent: 'center',
      alignItems: 'center',
    },
    progressContainer: {
      width: '100%',
      maxWidth: 300,
      alignItems: 'center',
    },
    progressText: {
      textAlign: 'center',
      marginBottom: spacing.sm,
      color: colors.insightsTextPrimary,
      fontSize: 16,
    },
    progressBarContainer: {
      width: '100%',
      height: 8,
      backgroundColor: colors.gray[800],
      borderRadius: borderRadius.full,
      marginBottom: spacing.xs,
      overflow: 'hidden',
    },
    progressBar: {
      height: '100%',
      backgroundColor: colors.yellow[400],
      borderRadius: borderRadius.full,
    },
    progressPercentage: {
      fontSize: 12,
      color: colors.insightsTextSecondary,
      alignSelf: 'flex-end',
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Publishing...</Text>
      
      <View style={styles.loadingContainer}>
        {/* Spinning Border */}
        <Animated.View style={[styles.spinningBorder, { transform: [{ rotate: spin }] }]} />
        
        {/* Center Icon */}
        <View style={styles.iconContainer}>
          <Feather name="zap" size={48} color={colors.yellow[400]} />
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          {supercharged ? 'Supercharging your insight...' : 'Publishing your insight...'}
        </Text>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressPercentage}>{progress}%</Text>
      </View>
    </View>
  );
};