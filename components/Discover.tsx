import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, FlatList } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useIndustries } from '../context/IndustriesContext';
import { searchArticles, getSearchSuggestions, SearchResult, SearchFilters } from '../lib/searchService';
import { industryIdToName } from '../lib/industryMap';

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
  const { colors } = useTheme();
  const { industries } = useIndustries();
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndustry, setSelectedIndustry] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Debounce search query for better performance
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

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

  const formatAuthors = (authors: string[], siteName?: string) => {
    if (!authors || authors.length === 0) {
      if (siteName) {
        return `From ${siteName}`;
      }
      return 'By Unknown Author';
    }
    if (authors.length === 1) return `By ${authors[0]}`;
    if (authors.length === 2) return `By ${authors[0]} & ${authors[1]}`;
    return `By ${authors[0]} et al.`;
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const renderSearchResult = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity 
      style={dynamicStyles.resultCard}
      accessibilityLabel={`View article: ${item.title}`}
      accessibilityRole="button"
      onPress={() => {
        // Handle article navigation - you can integrate with your existing navigation
        console.log('Navigate to article:', item.id);
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
             {industryIdToName[item.industry_id] || 'General'}
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
        {truncateText(item.content, 150)}
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
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      padding: 16,
      paddingTop: 60,
      zIndex: 10,
    },
    searchInput: {
      width: '100%',
      paddingLeft: 40,
      paddingRight: 40,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: 999,
      backgroundColor: colors.inputBackground,
      fontSize: 16,
      color: colors.inputText,
    },
    clearButton: {
      position: 'absolute',
      right: 12,
      top: '50%',
      marginTop: -12,
      padding: 4,
    },
    filtersContainer: {
      marginTop: 12,
    },
    industryScroll: {
      paddingVertical: 8,
    },
    industryChip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      marginRight: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    industryChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    industryChipText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
    },
    industryChipTextActive: {
      color: colors.surface,
    },
    suggestionsContainer: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      backgroundColor: colors.surface,
      borderBottomLeftRadius: 12,
      borderBottomRightRadius: 12,
      borderWidth: 1,
      borderTopWidth: 0,
      borderColor: colors.border,
      maxHeight: 200,
      zIndex: 20,
    },
    suggestionItem: {
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    suggestionText: {
      fontSize: 14,
      color: colors.text,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: 40,
    },
    loadingText: {
      marginTop: 12,
      color: colors.textSecondary,
      fontSize: 16,
    },
    errorContainer: {
      padding: 20,
      alignItems: 'center',
    },
         errorText: {
       color: '#ef4444',
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
    resultCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
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
      fontWeight: '500',
    },
  });

  return (
    <View style={dynamicStyles.root}>
      {/* Search Header */}
      <View style={dynamicStyles.searchHeader}>
        <View style={styles.searchInputWrapper}>
          <Feather
            name="search"
            style={styles.searchIcon}
            size={20}
            color={colors.textTertiary}
          />
          <TextInput
            placeholder="Search articles, papers, authors..."
            placeholderTextColor={colors.inputPlaceholder}
            style={dynamicStyles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            accessibilityLabel="Search input for articles and papers"
            onFocus={() => setShowSuggestions(suggestions.length > 0)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={dynamicStyles.clearButton}
              onPress={clearSearch}
              accessibilityLabel="Clear search"
            >
              <Feather name="x" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
          
          {/* Search Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <View style={dynamicStyles.suggestionsContainer}>
              {suggestions.map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={dynamicStyles.suggestionItem}
                  onPress={() => handleSuggestionPress(suggestion)}
                >
                  <Text style={dynamicStyles.suggestionText}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Industry Filters */}
        <View style={dynamicStyles.filtersContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={dynamicStyles.industryScroll}
          >
            <TouchableOpacity
              style={[
                dynamicStyles.industryChip,
                selectedIndustry === null && dynamicStyles.industryChipActive
              ]}
              onPress={() => setSelectedIndustry(null)}
            >
              <Text style={[
                dynamicStyles.industryChipText,
                selectedIndustry === null && dynamicStyles.industryChipTextActive
              ]}>
                All
              </Text>
            </TouchableOpacity>
            {industries.map((industryId) => (
              <TouchableOpacity
                key={industryId}
                style={[
                  dynamicStyles.industryChip,
                  selectedIndustry === industryId && dynamicStyles.industryChipActive
                ]}
                onPress={() => setSelectedIndustry(industryId)}
              >
                <Text style={[
                  dynamicStyles.industryChipText,
                  selectedIndustry === industryId && dynamicStyles.industryChipTextActive
                                 ]}>
                   {industryIdToName[industryId]}
                 </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Results */}
      <View style={{ flex: 1 }}>
        {loading ? (
          <View style={dynamicStyles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={dynamicStyles.loadingText}>Searching...</Text>
          </View>
        ) : error ? (
                     <View style={dynamicStyles.errorContainer}>
             <Feather name="alert-circle" size={48} color={'#ef4444'} />
             <Text style={dynamicStyles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={{ marginTop: 16, padding: 12 }}
              onPress={() => performSearch(searchQuery)}
            >
              <Text style={{ color: colors.primary }}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : searchResults.length === 0 && debouncedSearchQuery ? (
          <View style={dynamicStyles.emptyContainer}>
            <Feather name="search" size={48} color={colors.textTertiary} />
            <Text style={dynamicStyles.emptyText}>
              No articles found for "{debouncedSearchQuery}"
            </Text>
            <Text style={[dynamicStyles.emptyText, { marginTop: 8, fontSize: 14 }]}>
              Try different keywords or check your spelling
            </Text>
          </View>
        ) : (
          <FlatList
            data={searchResults}
            renderItem={renderSearchResult}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
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
