import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { getIndustryIcon, getIndustryColor } from '../../utils/industryIcons';

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
      marginRight: 12,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
    },
    industriesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: 20,
      gap: 16,
    },
    industryTile: {
      backgroundColor: isDark ? '#2D3748' : '#374151',
      borderRadius: 16,
      padding: 20,
      width: '48%',
      alignItems: 'center',
      minHeight: 120,
    },
    industryIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    industryName: {
      fontSize: 14,
      fontWeight: '500',
      color: 'white',
      textAlign: 'center',
      lineHeight: 18,
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
      backgroundColor: isDark ? '#2D3748' : '#374151',
      borderRadius: 16,
      padding: 24,
      alignItems: 'center',
      marginHorizontal: 20,
    },
    emptyIcon: {
      marginBottom: 12,
    },
    emptyText: {
      fontSize: 16,
      color: 'rgba(255, 255, 255, 0.7)',
      textAlign: 'center',
      marginBottom: 8,
    },
    emptySubtext: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.5)',
      textAlign: 'center',
      marginBottom: 16,
    },
    addButton: {
      backgroundColor: '#EAB308',
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    addButtonText: {
      color: '#000000',
      fontSize: 14,
      fontWeight: '600',
    },
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Feather name="globe" size={24} color="#EAB308" />
          </View>
          <Text style={styles.title}>Industry Interests</Text>
        </View>
        <View style={styles.emptyState}>
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
            <Feather name="globe" size={24} color="#EAB308" />
          </View>
          <Text style={styles.title}>Industry Interests</Text>
        </View>
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Feather name="globe" size={32} color="rgba(255, 255, 255, 0.3)" />
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
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Feather name="globe" size={24} color="#EAB308" />
        </View>
        <Text style={styles.title}>Industry Interests</Text>
      </View>
      
      <View style={styles.industriesGrid}>
        {industries.map((industry, index) => {
          const iconName = getIndustryIcon(industry.name);
          const backgroundColor = getIndustryColor(industry.name);
          
          return (
            <TouchableOpacity key={index} style={styles.industryTile} onPress={onEditPress}>
              <View style={[styles.industryIcon, { backgroundColor }]}>
                <Feather name={iconName.replace('-outline', '') as any} size={24} color="white" />
              </View>
              <Text style={styles.industryName}>{industry.name}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};