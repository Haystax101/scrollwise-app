import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

interface Industry {
  name: string;
  stage?: string;
}

interface IndustryInterestsCardProps {
  industries: Industry[];
  onEditPress: () => void;
  loading?: boolean;
}

export const IndustryInterestsCard: React.FC<IndustryInterestsCardProps> = ({
  industries,
  onEditPress,
  loading = false
}) => {
  const { colors, isDark } = useTheme();

  const styles = StyleSheet.create({
    container: {
      marginBottom: 24,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      paddingHorizontal: 20,
    },
    headerIcon: {
      marginRight: 8,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
    },
    card: {
      backgroundColor: isDark ? colors.surface : colors.card,
      borderRadius: 16,
      padding: 20,
      marginHorizontal: 20,
      borderWidth: isDark ? 1 : 0,
      borderColor: isDark ? colors.border : 'transparent',
      position: 'relative',
    },
    editButton: {
      position: 'absolute',
      top: 16,
      right: 16,
      padding: 4,
    },
    industriesContent: {
      paddingRight: 40,
    },
    industryItem: {
      marginBottom: 16,
      paddingLeft: 16,
      borderLeftWidth: 2,
      borderLeftColor: colors.border,
    },
    industryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    industryIcon: {
      marginRight: 8,
    },
    industryName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
    },
    industryStage: {
      fontSize: 12,
      color: colors.textSecondary,
      backgroundColor: isDark ? colors.border : colors.surface,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 12,
      overflow: 'hidden',
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 8,
    },
    tag: {
      backgroundColor: isDark ? colors.border : colors.surface,
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 4,
      marginRight: 8,
      marginBottom: 4,
    },
    tagText: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: '500',
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 32,
    },
    emptyIcon: {
      marginBottom: 12,
    },
    emptyText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 8,
    },
    emptySubtext: {
      fontSize: 14,
      color: colors.textTertiary,
      textAlign: 'center',
      marginBottom: 16,
    },
    addButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    addButtonText: {
      color: 'white',
      fontSize: 14,
      fontWeight: '600',
    },
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Feather name="globe" size={20} color={colors.primary} />
          </View>
          <Text style={styles.title}>Industry Interests</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.emptyText}>Loading industries...</Text>
        </View>
      </View>
    );
  }

  if (!industries || industries.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Feather name="globe" size={20} color={colors.primary} />
          </View>
          <Text style={styles.title}>Industry Interests</Text>
        </View>
        <View style={styles.card}>
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Feather name="globe" size={32} color={colors.textTertiary} />
            </View>
            <Text style={styles.emptyText}>Add your industry interests</Text>
            <Text style={styles.emptySubtext}>
              Tell others about the industries you're passionate about
            </Text>
            <TouchableOpacity style={styles.addButton} onPress={onEditPress}>
              <Text style={styles.addButtonText}>Add Industries</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Feather name="globe" size={20} color={colors.primary} />
        </View>
        <Text style={styles.title}>Industry Interests</Text>
      </View>
      <View style={styles.card}>
        <TouchableOpacity style={styles.editButton} onPress={onEditPress}>
          <Feather name="edit" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
        
        <View style={styles.industriesContent}>
          {industries.map((industry, index) => (
            <View key={index} style={styles.industryItem}>
              <View style={styles.industryHeader}>
                <View style={styles.industryIcon}>
                  <Feather name="building" size={16} color={colors.textTertiary} />
                </View>
                <Text style={styles.industryName}>{industry.name}</Text>
                {industry.stage && (
                  <Text style={styles.industryStage}>{industry.stage}</Text>
                )}
              </View>
            </View>
          ))}
          
          {/* You can add tags here if you implement sub-interests later */}
          {/* 
          <View style={styles.tagsContainer}>
            {subInterests.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
          */}
        </View>
      </View>
    </View>
  );
};