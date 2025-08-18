import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useInsightsTheme } from '../../lib/insightsTheme';

interface Props {
  onBack: () => void;
  onSupercharge: () => void;
  onPublishNormal: () => void;
}

export const PublishOptions: React.FC<Props> = ({
  onBack,
  onSupercharge,
  onPublishNormal,
}) => {
  const { colors, spacing, borderRadius } = useInsightsTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      gap: spacing.lg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.md,
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
    superchargeCard: {
      backgroundColor: colors.insightsCard,
      padding: spacing.lg,
      borderRadius: borderRadius.lg,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.insightsBorder,
    },
    superchargeHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
      marginBottom: spacing.md,
    },
    zapContainer: {
      width: 48,
      height: 48,
      backgroundColor: colors.yellow[400],
      borderRadius: borderRadius.full,
      justifyContent: 'center',
      alignItems: 'center',
    },
    superchargeContent: {
      flex: 1,
    },
    superchargeTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.insightsTextPrimary,
      marginBottom: spacing.xs,
    },
    superchargeDescription: {
      fontSize: 16,
      color: colors.insightsTextSecondary,
      lineHeight: 24,
    },
    superchargeButton: {
      width: '100%',
      paddingVertical: spacing.sm,
      backgroundColor: colors.yellow[400],
      borderRadius: borderRadius.lg,
      marginBottom: spacing.md,
      justifyContent: 'center',
      alignItems: 'center',
    },
    superchargeButtonText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.black,
    },
    normalButton: {
      width: '100%',
      paddingVertical: spacing.sm,
      backgroundColor: 'transparent',
      borderRadius: borderRadius.lg,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.insightsBorder,
    },
    normalButtonText: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.insightsTextPrimary,
    },
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Feather name="arrow-left" size={20} color={colors.insightsTextPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Publish Options</Text>
      </View>

      {/* Supercharge Card */}
      <View style={styles.superchargeCard}>
        <View style={styles.superchargeHeader}>
          <View style={styles.zapContainer}>
            <Feather name="zap" size={24} color={colors.black} />
          </View>
          <View style={styles.superchargeContent}>
            <Text style={styles.superchargeTitle}>Supercharge Your Insight</Text>
            <Text style={styles.superchargeDescription}>
              Boost your insight's visibility with voltz to reach more industry
              professionals and gain more engagement.
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.superchargeButton} onPress={onSupercharge}>
          <Text style={styles.superchargeButtonText}>Supercharge This Insight</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.normalButton} onPress={onPublishNormal}>
          <Text style={styles.normalButtonText}>Publish Without Supercharging</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};