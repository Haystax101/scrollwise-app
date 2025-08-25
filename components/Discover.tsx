import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, FlatList } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { useIndustries } from '../context/IndustriesContext';
import { immediateKeywordSearch, progressiveSearch, checkProPlan, SearchResult } from '../lib/smartSearchService';

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

const getIndustryPillColor = (industryId: string): string => {
  const colors = [
    '#3B82F6', // Bold Blue
    '#10B981', // Bold Green
    '#EF4444', // Bold Red
    '#8B5CF6', // Bold Purple
    '#F97316', // Bold Orange
    '#F59E0B', // Bold Amber
    '#64748B', // Bold Slate
    '#06B6D4', // Bold Cyan
    '#EC4899', // Bold Pink
    '#84CC16', // Bold Lime
  ];
  
  // Use industryId as seed for consistent color assignment
  const hash = industryId.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  return colors[Math.abs(hash) % colors.length];
};

export const Discover: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { allIndustries } = useIndustries(); // Use allIndustries from the context
  const router = useRouter();
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [keywordResults, setKeywordResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [vectorLoading, setVectorLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null); // Changed to string for UUID
  const [isFocused, setIsFocused] = useState(false);
  const [searchMode, setSearchMode] = useState<'typing' | 'submitted'>('typing');
  const [isProUser, setIsProUser] = useState(false);
  const [showUpgradeMessage, setShowUpgradeMessage] = useState(false);
  
  // Debounce search query for better performance
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Check pro plan status on mount and load initial content
  useEffect(() => {
    const checkUserPlan = async () => {
      const isPro = await checkProPlan();
      setIsProUser(isPro);
    };
    checkUserPlan();
    
    // Load initial content (most interacted content)
    loadInitialContent();
  }, []);

  // Load initial content when component mounts or when industry filter changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      loadInitialContent();
    }
  }, [selectedIndustry]);

  // Watch for industry changes and always re-run current search if a query exists
  useEffect(() => {
    if (searchQuery.trim()) {
      if (searchMode === 'typing') {
        performImmediateSearch(searchQuery);
      } else {
        performFullSearch(searchQuery);
      }
    }
  }, [selectedIndustry]);

  const loadInitialContent = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Call the search service with empty query to get most liked content
      const response = await immediateKeywordSearch('', selectedIndustry || undefined, undefined);
      
      if (response.error) {
        setError(response.error);
        setSearchResults([]);
      } else {
        setSearchResults(response.results);
        setKeywordResults(response.results);
      }
    } catch (err) {
      setError('Failed to load content. Please try again.');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, [selectedIndustry]);

  // Get the name of an industry from its ID
  const getIndustryName = (id: string) => {
    const industry = allIndustries.find(ind => ind.id === id);
    return industry ? industry.name : 'General';
  };

  // Immediate keyword search while typing
  useEffect(() => {
    if (searchMode === 'typing') {
      performImmediateSearch(debouncedSearchQuery);
    }
  }, [debouncedSearchQuery, searchMode]);

  const performImmediateSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      // If query is empty, load initial content instead
      loadInitialContent();
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await immediateKeywordSearch(query, selectedIndustry || undefined, undefined);
      
      if (response.error) {
        setError(response.error);
        setKeywordResults([]);
      } else {
        setKeywordResults(response.results);
        setSearchResults(response.results); // Show immediate results
        setShowUpgradeMessage(false); // Hide upgrade message for immediate results
      }
    } catch (err) {
      setError('Search failed. Please try again.');
      setKeywordResults([]);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, [selectedIndustry, loadInitialContent]);

  // Full search when user submits (Enter key)
  const performFullSearch = useCallback(async (query: string) => {
    if (!query.trim()) return;

    setSearchMode('submitted');
    // If user is not pro, do NOT start vector search; show upgrade immediately
    if (!isProUser) {
      setShowUpgradeMessage(true);
      setVectorLoading(false);
      // Keep showing keyword results; do not call progressive/embedding
      return;
    }

    setVectorLoading(true);
    setError(null);

    // Start with keyword results if we have them
    if (keywordResults.length > 0) {
      setSearchResults(keywordResults);
    } else {
      setLoading(true);
    }
    
    try {
      const response = await progressiveSearch(query, 0.75, selectedIndustry || undefined, undefined);
      
      if (response.error) {
        setError(response.error);
        // Keep keyword results if vector search fails
        if (keywordResults.length === 0) {
          setSearchResults([]);
        }
        setShowUpgradeMessage(false);
      } else {
        setSearchResults(response.results);
        setShowUpgradeMessage(!!response.upgradeMessage);
      }
    } catch (err) {
      setError('Search failed. Please try again.');
      // Keep keyword results if available
      if (keywordResults.length === 0) {
        setSearchResults([]);
      }
    } finally {
      setLoading(false);
      setVectorLoading(false);
    }
  }, [keywordResults, isProUser, selectedIndustry]);

  const clearSearch = () => {
    setSearchQuery('');
    setError(null);
    setSearchMode('typing');
    setVectorLoading(false);
    setShowUpgradeMessage(false);
    // Load initial content when search is cleared
    loadInitialContent();
  };

  // Handle Enter key press for full search
  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      performFullSearch(searchQuery);
    }
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
    const isInvalid = (val?: string) => {
      if (!val) return true;
      const trimmed = String(val).trim().toLowerCase();
      return trimmed === '' || trimmed === 'null' || trimmed === 'undefined';
    };

    if (!authors || (Array.isArray(authors) && authors.length === 0)) {
      return siteName ? `From ${siteName}` : 'By Unknown Author';
    }

    if (Array.isArray(authors)) {
      const clean = authors.filter(a => !isInvalid(a));
      if (clean.length === 0) return siteName ? `From ${siteName}` : 'By Unknown Author';
      if (clean.length === 1) return `By ${clean[0]}`;
      if (clean.length === 2) return `By ${clean[0]} & ${clean[1]}`;
      return `By ${clean[0]} et al.`;
    }

    return isInvalid(authors) ? (siteName ? `From ${siteName}` : 'By Unknown Author') : `By ${authors}`;
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
        // Navigate to feed with the specific content at the top
        router.push({ pathname: '/feed', params: { contentId: item.id.toString(), contentType: item.type } });
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
            <Text style={dynamicStyles.statText}>{item.likes_count || 0}</Text>
          </View>
          <View style={styles.stat}>
            <Feather name="message-circle" size={14} color={colors.textTertiary} />
            <Text style={dynamicStyles.statText}>{item.comments_count || 0}</Text>
          </View>
          <View style={styles.stat}>
            <Feather name="bookmark" size={14} color={colors.textTertiary} />
            <Text style={dynamicStyles.statText}>{item.saves_count || 0}</Text>
          </View>
          <View style={styles.stat}>
            <Feather name="eye" size={14} color={colors.textTertiary} />
            <Text style={dynamicStyles.statText}>{item.views_count || 0}</Text>
          </View>
          <View style={styles.stat}>
            <Feather name="calendar" size={14} color={colors.textTertiary} />
            <Text style={dynamicStyles.statText}>{formatDate(item.created_at || '')}</Text>
          </View>
        </View>
        {/* Removed match percentage display */}
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
    vectorLoadingText: {
      ...styles.vectorLoadingText,
      color: colors.textSecondary,
    },
    upgradeContainer: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginHorizontal: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.primary + '20',
    },
    upgradeContent: {
      alignItems: 'center',
    },
    upgradeTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginTop: 8,
      marginBottom: 4,
    },
    upgradeDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 16,
      lineHeight: 20,
    },
    upgradeButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },
    upgradeButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
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
            onChangeText={(text) => {
              setSearchQuery(text);
              setSearchMode('typing');
            }}
            onSubmitEditing={handleSearchSubmit}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={dynamicStyles.clearIcon}>
              <Feather name="x-circle" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

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
          {allIndustries.map((industry) => {
            const pillColor = getIndustryPillColor(industry.id);
            return (
              <TouchableOpacity
                key={industry.id}
                style={[
                  dynamicStyles.categoryPill, 
                  selectedIndustry === industry.id 
                    ? { backgroundColor: pillColor }
                    : { backgroundColor: pillColor + '20', borderWidth: 1, borderColor: pillColor + '40' }
                ]}
                onPress={() => setSelectedIndustry(industry.id)}
              >
                <Text style={[
                  dynamicStyles.categoryText, 
                  selectedIndustry === industry.id 
                    ? { color: 'white', fontWeight: '600' }
                    : { color: pillColor, fontWeight: '500' }
                ]}>{industry.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading && searchResults.length === 0 ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
      ) : error && searchResults.length === 0 ? (
        <View style={dynamicStyles.errorContainer}>
          <Feather name="alert-triangle" size={40} color="#EF4444" />
          <Text style={dynamicStyles.errorText}>{error}</Text>
        </View>
      ) : searchResults.length === 0 && debouncedSearchQuery.length > 0 && !loading ? (
        <View style={dynamicStyles.emptyContainer}>
          <Feather name="search" size={40} color={colors.textTertiary} />
          <Text style={dynamicStyles.emptyText}>No results found for "{debouncedSearchQuery}"</Text>
          <Text style={dynamicStyles.emptyText}>Try a different search term.</Text>
        </View>
      ) : (
        <FlatList
          data={
            showUpgradeMessage && !isProUser
              ? [{ id: -1, __upgrade: true } as any, ...searchResults]
              : searchResults
          }
          renderItem={({ item }) => {
            if ((item as any).__upgrade) {
              return (
                <View style={dynamicStyles.upgradeContainer}>
                  <View style={dynamicStyles.upgradeContent}>
                    <MaterialCommunityIcons name="crown" size={24} color="#FFD700" />
                    <Text style={dynamicStyles.upgradeTitle}>Upgrade to Pro</Text>
                    <Text style={dynamicStyles.upgradeDescription}>
                      Get AI-powered semantic search with more comprehensive results!
                    </Text>
                    <TouchableOpacity 
                      style={dynamicStyles.upgradeButton}
                      onPress={() => {
                        router.push('/upgrade' as any);
                      }}
                    >
                      <Text style={dynamicStyles.upgradeButtonText}>Upgrade Now</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }
            return renderSearchResult({ item });
          }}
          keyExtractor={(item: any) => (item.__upgrade ? 'upgrade' : item.id.toString())}
          contentContainerStyle={dynamicStyles.resultsListContent}
          style={dynamicStyles.resultsContainer}
          ListHeaderComponent={vectorLoading ? (
            <View style={styles.vectorLoadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.vectorLoadingText, { color: colors.text }]}>Finding more results...</Text>
            </View>
          ) : null}
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
  vectorLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  vectorLoadingText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
});
