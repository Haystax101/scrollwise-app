import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useInsightsTheme } from '../../lib/insightsTheme';

interface Props {
  onDone: () => void;
}

export const EditSuccessScreen: React.FC<Props> = ({ onDone }) => {
  const { colors, spacing, borderRadius } = useInsightsTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: spacing.lg,
    },
    iconContainer: {
      position: 'relative',
    },
    checkContainer: {
      width: 96,
      height: 96,
      backgroundColor: colors.yellow[400],
      borderRadius: 48,
      justifyContent: 'center',
      alignItems: 'center',
    },
    messageContainer: {
      alignItems: 'center',
      maxWidth: 300,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.insightsTextPrimary,
      textAlign: 'center',
      marginBottom: spacing.sm,
    },
    description: {
      fontSize: 16,
      color: colors.insightsTextSecondary,
      textAlign: 'center',
      lineHeight: 24,
    },
    doneButton: {
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.sm,
      backgroundColor: 'transparent',
      borderRadius: borderRadius.lg,
      marginTop: spacing.md,
      borderWidth: 1,
      borderColor: colors.insightsBorder,
    },
    doneButtonText: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.insightsTextPrimary,
    },
  });

  return (
    <View style={styles.container}>
      {/* Success Icon */}
      <View style={styles.iconContainer}>
        <View style={styles.checkContainer}>
          <Feather name="check" size={48} color={colors.black} />
        </View>
      </View>

      {/* Success Message */}
      <View style={styles.messageContainer}>
        <Text style={styles.title}>
          Your insight has been updated!
        </Text>
        <Text style={styles.description}>
          Your changes have been saved and are now live for your network to see.
        </Text>
      </View>

      {/* Done Button */}
      <TouchableOpacity style={styles.doneButton} onPress={onDone}>
        <Text style={styles.doneButtonText}>Done</Text>
      </TouchableOpacity>
    </View>
  );
};