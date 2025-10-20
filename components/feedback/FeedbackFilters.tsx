import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import type { SortOption } from '../../types/feedback';

interface FeedbackFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
}

export const FeedbackFilters: React.FC<FeedbackFiltersProps> = ({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange
}) => {
  const { colors } = useTheme();

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'top', label: 'Top' },
    { value: 'newest', label: 'Newest' },
    { value: 'oldest', label: 'Oldest' },
  ];

  const dynamicStyles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingVertical: 12,
      gap: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    sortContainer: {
      flexDirection: 'row',
      backgroundColor: colors.inputBackground || colors.background,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    sortButton: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRightWidth: 1,
      borderRightColor: colors.border,
    },
    sortButtonLast: {
      borderRightWidth: 0,
    },
    sortButtonActive: {
      backgroundColor: colors.primary,
    },
    sortButtonText: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '500',
    },
    sortButtonTextActive: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    searchContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.inputBackground || colors.background,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
      gap: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 15,
      color: colors.text,
      paddingVertical: 10,
    },
  });

  return (
    <View style={dynamicStyles.container}>
      <View style={dynamicStyles.sortContainer}>
        {sortOptions.map((option, index) => (
          <TouchableOpacity
            key={option.value}
            style={[
              dynamicStyles.sortButton,
              index === sortOptions.length - 1 && dynamicStyles.sortButtonLast,
              sortBy === option.value && dynamicStyles.sortButtonActive,
            ]}
            onPress={() => onSortChange(option.value)}
          >
            <Text
              style={[
                dynamicStyles.sortButtonText,
                sortBy === option.value && dynamicStyles.sortButtonTextActive,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={dynamicStyles.searchContainer}>
        <Feather name="search" size={18} color={colors.textSecondary} />
        <TextInput
          style={dynamicStyles.searchInput}
          placeholder="Search feedback..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={onSearchChange}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => onSearchChange('')}>
            <Feather name="x" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};
