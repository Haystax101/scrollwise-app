import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { MediaSelector } from './MediaSelector';
import { useInsightsTheme } from '../../lib/insightsTheme';

interface MediaType {
  type: 'photo' | 'reel';
  source: string;
}

interface Props {
  insightText: string;
  setInsightText: (text: string) => void;
  selectedMedia: MediaType | null;
  setSelectedMedia: (media: MediaType | null) => void;
  showMediaSelector: boolean;
  setShowMediaSelector: (show: boolean) => void;
  onNext: () => void;
}

export const InsightInput: React.FC<Props> = ({
  insightText,
  setInsightText,
  selectedMedia,
  setSelectedMedia,
  showMediaSelector,
  setShowMediaSelector,
  onNext,
}) => {
  const { colors, spacing, borderRadius, isDark } = useInsightsTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      gap: spacing.lg,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.insightsTextPrimary,
    },
    zapContainer: {
      width: 40,
      height: 40,
      backgroundColor: colors.yellow[400],
      borderRadius: borderRadius.full,
      justifyContent: 'center',
      alignItems: 'center',
    },
    textInput: {
      backgroundColor: colors.insightsCard,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      height: 192,
      fontSize: 18,
      color: colors.insightsTextPrimary,
      borderWidth: 1,
      borderColor: colors.insightsBorder,
      textAlignVertical: 'top',
    },
    mediaToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    mediaToggleText: {
      color: colors.insightsTextSecondary,
      fontSize: 16,
    },
    mediaSelectorContainer: {
      gap: spacing.sm,
    },
    mediaSelectorHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    mediaSelectorTitle: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.insightsTextPrimary,
    },
    hideButton: {
      fontSize: 12,
      color: colors.insightsTextSecondary,
    },
    nextButton: {
      width: '100%',
      paddingVertical: spacing.md,
      borderRadius: borderRadius.lg,
      marginTop: spacing.md,
      justifyContent: 'center',
      alignItems: 'center',
    },
    nextButtonActive: {
      backgroundColor: colors.yellow[400],
    },
    nextButtonInactive: {
      backgroundColor: colors.gray[700],
    },
    nextButtonText: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    nextButtonTextActive: {
      color: colors.black,
    },
    nextButtonTextInactive: {
      color: colors.gray[400],
    },
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Publish Insight</Text>
        <View style={styles.zapContainer}>
          <Feather name="zap" size={24} color={colors.black} />
        </View>
      </View>

      {/* Text Input */}
      <TextInput
        style={styles.textInput}
        placeholder="Share your industry insight..."
        placeholderTextColor={colors.insightsTextSecondary}
        value={insightText}
        onChangeText={setInsightText}
        multiline
        textAlignVertical="top"
      />

      {/* Media Selector Toggle */}
      {!showMediaSelector ? (
        <TouchableOpacity
          style={styles.mediaToggle}
          onPress={() => setShowMediaSelector(true)}
        >
          <Feather name="image" size={20} color={colors.insightsTextSecondary} />
          <Text style={styles.mediaToggleText}>Add media to your insight</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.mediaSelectorContainer}>
          <View style={styles.mediaSelectorHeader}>
            <Text style={styles.mediaSelectorTitle}>Media</Text>
            <TouchableOpacity onPress={() => setShowMediaSelector(false)}>
              <Text style={styles.hideButton}>Hide</Text>
            </TouchableOpacity>
          </View>
          <MediaSelector
            selectedMedia={selectedMedia}
            setSelectedMedia={setSelectedMedia}
          />
        </View>
      )}

      {/* Next Button */}
      <TouchableOpacity
        style={[
          styles.nextButton,
          insightText ? styles.nextButtonActive : styles.nextButtonInactive,
        ]}
        disabled={!insightText}
        onPress={onNext}
      >
        <Text
          style={[
            styles.nextButtonText,
            insightText ? styles.nextButtonTextActive : styles.nextButtonTextInactive,
          ]}
        >
          Next
        </Text>
      </TouchableOpacity>
    </View>
  );
};