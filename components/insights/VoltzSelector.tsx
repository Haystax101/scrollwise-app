import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useInsightsTheme } from '../../lib/insightsTheme';

interface MediaType {
  type: 'photo' | 'reel';
  source: string;
}

interface Props {
  voltz: number;
  setVoltz: (voltz: number) => void;
  totalVoltz: number;
  onBack: () => void;
  onContinue: () => void;
  insightText: string;
  selectedMedia: MediaType | null;
}

export const VoltzSelector: React.FC<Props> = ({
  voltz,
  setVoltz,
  totalVoltz,
  onBack,
  onContinue,
}) => {
  const { colors, spacing, borderRadius } = useInsightsTheme();
  const [reach, setReach] = useState(0);
  const incrementIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const decrementIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const progressAnim = useRef(new Animated.Value(voltz)).current;

  useEffect(() => {
    setReach(voltz * 50);
    Animated.timing(progressAnim, {
      toValue: voltz,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [voltz, progressAnim]);

  const startIncrement = () => {
    if (incrementIntervalRef.current) return;
    incrementVoltz();
    incrementIntervalRef.current = setInterval(() => {
      incrementVoltz();
    }, 150);
  };

  const stopIncrement = () => {
    if (incrementIntervalRef.current) {
      clearInterval(incrementIntervalRef.current);
      incrementIntervalRef.current = null;
    }
  };

  const startDecrement = () => {
    if (decrementIntervalRef.current) return;
    decrementVoltz();
    decrementIntervalRef.current = setInterval(() => {
      decrementVoltz();
    }, 150);
  };

  const stopDecrement = () => {
    if (decrementIntervalRef.current) {
      clearInterval(decrementIntervalRef.current);
      decrementIntervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (incrementIntervalRef.current) clearInterval(incrementIntervalRef.current);
      if (decrementIntervalRef.current) clearInterval(decrementIntervalRef.current);
    };
  }, []);

  const incrementVoltz = () => {
    if (voltz < Math.min(100, totalVoltz)) setVoltz(voltz + 5);
  };

  const decrementVoltz = () => {
    if (voltz > 5) setVoltz(voltz - 5);
  };

  const remainingVoltz = totalVoltz - voltz;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      gap: spacing.lg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    backButton: {
      padding: spacing.sm,
      marginRight: spacing.sm,
      borderRadius: borderRadius.full,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.insightsTextPrimary,
    },
    iconContainer: {
      alignItems: 'center',
      gap: spacing.sm,
    },
    zapContainer: {
      width: 80,
      height: 80,
      backgroundColor: colors.yellow[400],
      borderRadius: borderRadius.full,
      justifyContent: 'center',
      alignItems: 'center',
    },
    description: {
      textAlign: 'center',
      color: colors.insightsTextSecondary,
      fontSize: 16,
    },
    selectionCard: {
      backgroundColor: colors.insightsCard,
      padding: spacing.lg,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.insightsBorder,
    },
    balanceContainer: {
      gap: spacing.xs,
      marginBottom: spacing.md,
    },
    balanceRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    balanceLabel: {
      fontSize: 14,
      color: colors.insightsTextSecondary,
    },
    balanceValue: {
      fontSize: 14,
      fontWeight: 'bold',
      color: colors.yellow[400],
    },
    controlsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.xl,
    },
    controlButton: {
      width: 48,
      height: 48,
      backgroundColor: colors.insightsCard,
      borderColor: colors.insightsBorder,
      borderWidth: 1,
      borderRadius: borderRadius.full,
      justifyContent: 'center',
      alignItems: 'center',
    },
    voltzDisplay: {
      alignItems: 'center',
    },
    voltzNumber: {
      fontSize: 36,
      fontWeight: 'bold',
      color: colors.yellow[400],
    },
    voltzLabel: {
      fontSize: 14,
      color: colors.insightsTextSecondary,
    },
    reachContainer: {
      backgroundColor: colors.insightsCard,
      borderColor: colors.insightsBorder,
      borderWidth: 1,
      padding: spacing.md,
      borderRadius: borderRadius.lg,
    },
    reachHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    },
    reachLabel: {
      fontSize: 14,
      color: colors.insightsTextPrimary,
    },
    reachValue: {
      fontSize: 14,
      color: colors.yellow[400],
    },
    progressBarContainer: {
      width: '100%',
      height: 8,
      backgroundColor: colors.insightsBorder,
      borderRadius: borderRadius.full,
      overflow: 'hidden',
    },
    progressBar: {
      height: '100%',
      backgroundColor: colors.yellow[400],
      borderRadius: borderRadius.full,
    },
    continueButton: {
      width: '100%',
      paddingVertical: spacing.md,
      backgroundColor: colors.yellow[400],
      borderRadius: borderRadius.lg,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: spacing.sm,
    },
    continueButtonText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.black,
    },
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Feather name="arrow-left" size={20} color={colors.insightsTextPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Supercharge</Text>
      </View>

      {/* Icon and Description */}
      <View style={styles.iconContainer}>
        <View style={styles.zapContainer}>
          <Feather name="zap" size={40} color={colors.black} />
        </View>
        <Text style={styles.description}>Choose how many voltz to spend</Text>
      </View>

      {/* Voltz Selection Card */}
      <View style={styles.selectionCard}>
        {/* Balance Info */}
        <View style={styles.balanceContainer}>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>
              Balance: {totalVoltz} VOLTZ → {remainingVoltz} VOLTZ remaining
            </Text>
          </View>
        </View>

        {/* Voltz Controls */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity
            style={styles.controlButton}
            onPressIn={startDecrement}
            onPressOut={stopDecrement}
          >
            <Feather name="minus" size={24} color={colors.insightsTextPrimary} />
          </TouchableOpacity>

          <View style={styles.voltzDisplay}>
            <Text style={styles.voltzNumber}>{voltz}</Text>
            <Text style={styles.voltzLabel}>VOLTZ</Text>
          </View>

          <TouchableOpacity
            style={styles.controlButton}
            onPressIn={startIncrement}
            onPressOut={stopIncrement}
          >
            <Feather name="plus" size={24} color={colors.insightsTextPrimary} />
          </TouchableOpacity>
        </View>

        {/* Reach Boost Info */}
        <View style={styles.reachContainer}>
          <View style={styles.reachHeader}>
            <Text style={styles.reachLabel}>Reach boost</Text>
            <Text style={styles.reachValue}>+{reach} people</Text>
          </View>
          <View style={styles.progressBarContainer}>
            <Animated.View
              style={[
                styles.progressBar,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%'],
                    extrapolate: 'clamp',
                  }),
                },
              ]}
            />
          </View>
        </View>
      </View>

      {/* Continue Button */}
      <TouchableOpacity style={styles.continueButton} onPress={onContinue}>
        <Text style={styles.continueButtonText}>Supercharge & Publish</Text>
        <Feather name="chevron-right" size={20} color={colors.black} />
      </TouchableOpacity>
    </View>
  );
};