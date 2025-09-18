import React from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useIndustries } from '../../context/IndustriesContext';
import { IndustryColorBadge } from '../discover/IndustryColorBadge';

interface VaultSearchHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedIndustry: string | null;
  onIndustryChange: (industryId: string | null) => void;
  isFocused: boolean;
  onFocus: () => void;
  onBlur: () => void;
}

export const VaultSearchHeader: React.FC<VaultSearchHeaderProps> = ({
  searchQuery,
  onSearchChange,
  selectedIndustry,
  onIndustryChange,
  isFocused,
  onFocus,
  onBlur
}) => {
  const { colors, isDark } = useTheme();
  const { allIndustries } = useIndustries();

  const dynamicStyles = StyleSheet.create({
    container: {
      backgroundColor: colors.background,
      paddingBottom: 16,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.border + '20',
      marginHorizontal: 16,
      marginBottom: 16,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderWidth: isFocused ? 2 : 0,
      borderColor: isFocused ? colors.primary : 'transparent',
    },
    searchIcon: {
      marginRight: 12,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: colors.text,
    },
    clearButton: {
      padding: 4,
      marginLeft: 8,
    },
    filtersContainer: {
      paddingLeft: 16,
    },
    filterScrollView: {
      paddingRight: 16,
    },
    categoryPill: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 20,
      marginRight: 8,
      justifyContent: 'center',
    },
    activeCategory: {
      backgroundColor: colors.primary,
    },
    inactiveCategory: {
      backgroundColor: isDark ? colors.surface : colors.inputBackground,
    },
    categoryText: {
      fontSize: 14,
      fontWeight: '500',
    },
    activeCategoryText: {
      color: colors.primaryText,
    },
    inactiveCategoryText: {
      color: colors.textSecondary,
    },
  });

  return (
    <View style={dynamicStyles.container}>
      {/* Search Bar */}
      <View style={dynamicStyles.searchContainer}>
        <Feather
          name="search"
          size={20}
          color={colors.textSecondary}
          style={dynamicStyles.searchIcon}
        />
        <TextInput
          style={dynamicStyles.searchInput}
          placeholder="Search articles, papers, books..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={onSearchChange}
          onFocus={onFocus}
          onBlur={onBlur}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={dynamicStyles.clearButton}
            onPress={() => onSearchChange('')}
          >
            <Feather name="x" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Industry Filter Pills */}
      <View style={dynamicStyles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={dynamicStyles.filterScrollView}
        >
          {/* All Industries Pill */}
          <TouchableOpacity
            style={[
              dynamicStyles.categoryPill,
              selectedIndustry === null ? dynamicStyles.activeCategory : dynamicStyles.inactiveCategory
            ]}
            onPress={() => onIndustryChange(null)}
          >
            <Text style={[
              dynamicStyles.categoryText,
              selectedIndustry === null ? dynamicStyles.activeCategoryText : dynamicStyles.inactiveCategoryText
            ]}>
              All
            </Text>
          </TouchableOpacity>

          {/* Industry Pills */}
          {allIndustries.map((industry) => (
            <IndustryColorBadge
              key={industry.id}
              industryId={industry.id}
              industryName={industry.name}
              selected={selectedIndustry === industry.id}
              onPress={() => onIndustryChange(
                selectedIndustry === industry.id ? null : industry.id
              )}
              size="medium"
              variant="pill"
            />
          ))}
        </ScrollView>
      </View>
    </View>
  );
};