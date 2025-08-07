import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, FlatList } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { useIndustries, Industry } from '../context/IndustriesContext'; // Import Industry type
import { searchArticles, getSearchSuggestions, SearchResult, SearchFilters } from '../lib/searchService';

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export const Discover: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { allIndustries } = useIndustries(); // Use allIndustries from the context
  const router = useRouter();
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null); // Changed to string for UUID
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  // Debounce search query for better performance
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Get the name of an industry from its ID
  const getIndustryName = (id: string) => {
    const industry = allIndustries.find(ind => ind.id === id);
    return industry ? industry.name : 'General';
  };

  // Perform search when debounced query changes
  useEffect(() => {
    performSearch(debouncedSearchQuery);
  }, [debouncedSearchQuery, selectedIndustry]);

  // Get search suggestions when user types
  useEffect(() => {
    if (searchQuery.length >= 2 && searchQuery.length < 20) {
      getSuggestionsForQuery(searchQuery);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery]);

  const performSearch = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const filters: SearchFilters = {};
      if (selectedIndustry) {
        filters.industryId = selectedIndustry;
      }

      const { articles, error: searchError } = await searchArticles(query, filters, 1, 50);
      
      if (searchError) {
        setError(searchError);
        setSearchResults([]);
      } else {
        setSearchResults(articles);
      }
    } catch (err) {
      setError('Search failed. Please try again.');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, [selectedIndustry]);

  const getSuggestionsForQuery = useCallback(async (query: string) => {
    try {
      const { suggestions: newSuggestions } = await getSearchSuggestions(query, 5);
      setSuggestions(newSuggestions);
      setShowSuggestions(newSuggestions.length > 0);
    } catch (err) {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, []);

  const handleSuggestionPress = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setError(null);
    setShowSuggestions(false);
  };

  const getTypeIcon = (type: string) => {
    const iconProps = { size: 16, color: colors.primary };
    switch (type?.toLowerCase()) {
      case 'research':
      case 'paper':
        return <MaterialCommunityIcons name="microscope" {...iconProps} />;
      case 'book':
        return <Feather name="book-open" {...iconProps} />;
      case 'article':
      case 'news':
        return <MaterialCommunityIcons name="newspaper" {...iconProps} />;
      default:
        return <Feather name="file-text" {...iconProps} />;
    }
  };

  const formatAuthors = (authors?: string[] | string, siteName?: string) => {
    if (!authors || authors.length === 0) {
      if (siteName) {
        return `From ${siteName}`;
      }
      return 'By Unknown Author';
    }
    if (Array.isArray(authors)) {
      if (authors.length === 1) return `By ${authors[0]}`;
      if (authors.length === 2) return `By ${authors[0]} & ${authors[1]}`;
      return `By ${authors[0]} et al.`;
    }
    return `By ${authors}`;
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
      
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    } catch {
      return 'Unknown date';
    }
  };

  const getResultContent = (item: SearchResult) => {
    switch (item.type) {
      case 'article':
        return item.summary || '';
      case 'paper':
        return item.content_simple || '';
      case 'book':
        return item.short_summary || '';
      default:
        return '';
    }
  };

  const renderSearchResult = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity 
      style={dynamicStyles.resultCard}
      accessibilityLabel={`View article: ${item.title}`}
      accessibilityRole="button"
      onPress={() => {
        // Navigate to feed with the specific article at the top
        router.push({ pathname: '/feed', params: { reelId: item.id.toString() } });
      }}
    >
      <View style={styles.resultHeader}>
        <View style={styles.typeIndicator}>
          {getTypeIcon(item.type)}
          <Text style={dynamicStyles.typeText}>
            {item.type?.charAt(0).toUpperCase() + item.type?.slice(1) || 'Article'}
          </Text>
        </View>
                 {item.industry_id && (
           <Text style={dynamicStyles.industryTag}>
             {getIndustryName(item.industry_id)}
           </Text>
         )}
      </View>
      
      <Text style={dynamicStyles.resultTitle} numberOfLines={2}>
        {item.title}
      </Text>
      
      <Text style={dynamicStyles.resultAuthors}>
        {formatAuthors(item.authors, item.site_name)}
      </Text>
      
      <Text style={dynamicStyles.resultContent} numberOfLines={3}>
        {truncateText(getResultContent(item), 150)}
      </Text>
      
      <View style={styles.resultFooter}>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Feather name="heart" size={14} color={colors.textTertiary} />
            <Text style={dynamicStyles.statText}>{item.likes_count}</Text>
          </View>
          <View style={styles.stat}>
            <Feather name="bookmark" size={14} color={colors.textTertiary} />
            <Text style={dynamicStyles.statText}>{item.saves_count}</Text>
          </View>
          <View style={styles.stat}>
            <Feather name="message-circle" size={14} color={colors.textTertiary} />
            <Text style={dynamicStyles.statText}>{item.comments_count}</Text>
          </View>
          <View style={styles.stat}>
            <Feather name="eye" size={14} color={colors.textTertiary} />
            <Text style={dynamicStyles.statText}>{item.views_count}</Text>
          </View>
          <View style={styles.stat}>
            <Feather name="calendar" size={14} color={colors.textTertiary} />
            <Text style={dynamicStyles.statText}>{formatDate(item.created_at || '')}</Text>
          </View>
        </View>
        {item.rank && (
          <Text style={dynamicStyles.relevanceText}>
            {Math.round(item.rank * 100)}% match
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const dynamicStyles = StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    searchHeader: {
      padding: 16,
      paddingTop: 60,
      zIndex: 10,
    },
    searchContainer: {
      position: 'relative',
    },
    searchInput: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      paddingVertical: 12,
      paddingLeft: 40,
      paddingRight: 40,
      fontSize: 16,
      color: colors.text,
      borderWidth: 1,
      borderColor: isFocused ? colors.primary : colors.surface,
    },
    searchIcon: {
      position: 'absolute',
      top: 14,
      left: 12,
      zIndex: 1,
    },
    clearIcon: {
      position: 'absolute',
      top: 14,
      right: 12,
      zIndex: 1,
    },
    suggestionList: {
      position: 'absolute',
      top: 65,
      left: 16,
      right: 16,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      zIndex: 9,
    },
    suggestionItem: {
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    suggestionText: {
      color: colors.text,
      fontSize: 16,
    },
    filtersContainer: {
      paddingHorizontal: 16,
      height: 50,
      alignItems: 'center',
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
    resultsContainer: {
      flex: 1,
    },
    resultsListContent: {
      paddingHorizontal: 16,
      paddingBottom: 100,
    },
    resultCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    resultHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    typeIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    resultFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
    },
    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    stat: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 16,
    },
    resultTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 6,
      lineHeight: 22,
    },
    resultAuthors: {
      fontSize: 14,
      color: '#3b82f6', // Blue color for authors as requested
      marginBottom: 8,
      fontWeight: '500',
    },
    resultContent: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: 12,
    },
    typeText: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: '500',
      marginLeft: 4,
    },
    industryTag: {
      fontSize: 12,
      color: colors.textTertiary,
      backgroundColor: colors.surface,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
    },
    statText: {
      fontSize: 12,
      color: colors.textTertiary,
      marginLeft: 4,
    },
    relevanceText: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: '600',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    errorText: {
      color: '#EF4444',
      fontSize: 16,
      textAlign: 'center',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: 40,
    },
    emptyText: {
      fontSize: 16,
      color: colors.textTertiary,
      textAlign: 'center',
    },
  });

  return (
    <View style={dynamicStyles.root}>
      <View style={dynamicStyles.searchHeader}>
        <View style={dynamicStyles.searchContainer}>
          <Feather name="search" size={20} color={colors.textTertiary} style={dynamicStyles.searchIcon} />
          <TextInput
            style={dynamicStyles.searchInput}
            placeholder="Search articles, papers, and more..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={dynamicStyles.clearIcon}>
              <Feather name="x-circle" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {showSuggestions && (
        <View style={dynamicStyles.suggestionList}>
          {suggestions.map((item, index) => (
            <TouchableOpacity key={index} style={dynamicStyles.suggestionItem} onPress={() => handleSuggestionPress(item)}>
              <Text style={dynamicStyles.suggestionText}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={dynamicStyles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ alignItems: 'center' }}
        >
          <TouchableOpacity
            style={[dynamicStyles.categoryPill, selectedIndustry === null ? dynamicStyles.activeCategory : dynamicStyles.inactiveCategory]}
            onPress={() => setSelectedIndustry(null)}
          >
            <Text style={[dynamicStyles.categoryText, selectedIndustry === null ? dynamicStyles.activeCategoryText : dynamicStyles.inactiveCategoryText]}>All</Text>
          </TouchableOpacity>
          {allIndustries.map((industry) => (
            <TouchableOpacity
              key={industry.id}
              style={[dynamicStyles.categoryPill, selectedIndustry === industry.id ? dynamicStyles.activeCategory : dynamicStyles.inactiveCategory]}
              onPress={() => setSelectedIndustry(industry.id)}
            >
              <Text style={[dynamicStyles.categoryText, selectedIndustry === industry.id ? dynamicStyles.activeCategoryText : dynamicStyles.inactiveCategoryText]}>{industry.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
      ) : error ? (
        <View style={dynamicStyles.errorContainer}>
          <Feather name="alert-triangle" size={40} color="#EF4444" />
          <Text style={dynamicStyles.errorText}>{error}</Text>
        </View>
      ) : searchResults.length === 0 && debouncedSearchQuery.length > 0 ? (
        <View style={dynamicStyles.emptyContainer}>
          <Feather name="search" size={40} color={colors.textTertiary} />
          <Text style={dynamicStyles.emptyText}>No results found for "{debouncedSearchQuery}"</Text>
          <Text style={dynamicStyles.emptyText}>Try a different search term.</Text>
        </View>
      ) : (
        <FlatList
          data={searchResults}
          renderItem={renderSearchResult}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={dynamicStyles.resultsListContent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  searchInputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    top: '50%',
    marginTop: -10,
    zIndex: 10,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
});
