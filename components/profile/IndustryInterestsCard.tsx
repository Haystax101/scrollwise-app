import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Feather, MaterialIcons, Ionicons } from '@expo/vector-icons';
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
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 24,
      marginHorizontal: 20,
      borderWidth: isDark ? 0 : 1,
      borderColor: isDark ? 'transparent' : colors.border,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    headerIcon: {
      marginRight: 12,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      flex: 1,
    },
    editButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    editButtonText: {
      fontSize: 14,
      color: colors.primary || '#EAB308',
      fontWeight: '500',
    },
    scrollView: {
      marginHorizontal: -20,
      paddingLeft: 20,
    },
    scrollContainer: {
      paddingRight: 20,
    },
    industryTile: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      width: 140,
      alignItems: 'center',
      minHeight: 120,
      marginRight: 16,
      borderWidth: isDark ? 0 : 1,
      borderColor: isDark ? 'transparent' : colors.border,
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
      color: colors.text,
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
      backgroundColor: '#EAB308',
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    addButtonText: {
      color: colors.primaryText,
      fontSize: 14,
      fontWeight: '600',
    },
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Feather name="globe" size={24} color={colors.primary} />
          </View>
          <Text style={styles.title}>Industry Interests</Text>
          <TouchableOpacity style={styles.editButton} onPress={onEditPress}>
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
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
            <Feather name="globe" size={24} color={colors.primary} />
          </View>
          <Text style={styles.title}>Industry Interests</Text>
          <TouchableOpacity style={styles.editButton} onPress={onEditPress}>
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>
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
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Feather name="globe" size={24} color="#EAB308" />
        </View>
        <Text style={styles.title}>Industry Interests</Text>
        <TouchableOpacity style={styles.editButton} onPress={onEditPress}>
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
        style={styles.scrollView}
      >
        {industries.map((industry, index) => {
          const iconConfig = getIndustryIcon(industry.name);
          const backgroundColor = getIndustryColor(industry.name);
          
          const IconComponent = iconConfig.family === 'MaterialIcons' ? MaterialIcons : 
                              iconConfig.family === 'Ionicons' ? Ionicons : Feather;
          
          return (
            <TouchableOpacity key={index} style={styles.industryTile} onPress={onEditPress}>
              <View style={[styles.industryIcon, { backgroundColor }]}>
                <IconComponent name={iconConfig.name as any} size={24} color="white" />
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};