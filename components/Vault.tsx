import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useIndustries } from '../context/IndustriesContext';
import { immediateKeywordSearch, checkProPlan, SearchResult } from '../lib/smartSearchService';
import { instantContentLoader } from '../services/InstantContentLoader';
import { VaultSearchHeader } from './vault/VaultSearchHeader';
import { ContentSection } from './vault/ContentSection';
import { SavedContentSection } from './vault/SavedContentSection';
import { VaultContentViewer } from './vault/VaultContentViewer';
import { supabase } from '../lib/supabase';

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

interface VaultData {
  articles: SearchResult[];
  papers: SearchResult[];
  books: SearchResult[];
}

export const Vault: React.FC = () => {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { allIndustries } = useIndustries();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isProUser, setIsProUser] = useState(false);

  // Content state
  const [vaultData, setVaultData] = useState<VaultData>({
    articles: [],
    papers: [],
    books: []
  });
  const [loading, setLoading] = useState({
    articles: false,
    papers: false,
    books: false
  });
  const [error, setError] = useState<string | null>(null);

  // Content viewer state
  const [selectedContent, setSelectedContent] = useState<SearchResult | null>(null);

  // Debounce search query for better performance
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Check pro plan status on mount
  useEffect(() => {
    const checkUserPlan = async () => {
      const isPro = await checkProPlan();
      setIsProUser(isPro);
    };
    checkUserPlan();

    // Load initial content
    loadInitialContent();

    // Pre-load content for other industries in background
    if (allIndustries.length > 0) {
      const industryIds = allIndustries.slice(0, 8).map(ind => ind.id);
      instantContentLoader.preloadMultipleIndustries(industryIds, '').catch(error => {
        console.error('Background pre-loading failed:', error);
      });
    }
  }, [allIndustries.length]);

  // Load initial content when industry filter changes and no search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      loadInitialContent();
    }
  }, [selectedIndustry]);

  // Perform search when search query or industry changes
  useEffect(() => {
    if (debouncedSearchQuery.trim()) {
      performSearch(debouncedSearchQuery);
    } else {
      loadInitialContent();
    }
  }, [debouncedSearchQuery, selectedIndustry]);

  const fetchContentByIndustry = useCallback(async (industryId: string): Promise<VaultData> => {
    if (!user) {
      return { articles: [], papers: [], books: [] };
    }

    try {
      console.log(`🔍 Vault: Fetching prioritized content for industry ${industryId}`);

      // Function to fetch prioritized content for a specific type
      const fetchPrioritizedContent = async (
        tableName: 'articles' | 'papers' | 'books',
        viewTableName: 'article_views_enhanced' | 'paper_views' | 'book_views',
        contentIdField: 'article_id' | 'paper_id' | 'book_id',
        selectFields: string
      ) => {
        console.log(`🔍 Vault: Fetching unviewed ${tableName} for industry ${industryId}`);

        // First, get the list of viewed content IDs for this user
        const { data: viewedIds } = await supabase
          .from(viewTableName)
          .select(contentIdField)
          .eq('user_id', user.id);

        const viewedIdsArray = viewedIds?.map(item => item[contentIdField]) || [];

        console.log(`🔍 Vault: User has viewed ${viewedIdsArray.length} ${tableName} items`);

        // Get unviewed content (exclude viewed IDs)
        let unviewedQuery = supabase
          .from(tableName)
          .select(selectFields)
          .eq('industry_id', industryId)
          .order('created_at', { ascending: false })
          .limit(5);

        // Only add the NOT IN filter if there are viewed items
        if (viewedIdsArray.length > 0) {
          unviewedQuery = unviewedQuery.not('id', 'in', `(${viewedIdsArray.join(',')})`);
        }

        const { data: unviewedData, error: unviewedError } = await unviewedQuery;

        if (unviewedError) {
          console.warn(`🔍 Vault: Error fetching unviewed ${tableName}:`, unviewedError);
          // Fallback to basic query without view filtering
          const { data: fallbackData } = await supabase
            .from(tableName)
            .select(selectFields)
            .eq('industry_id', industryId)
            .order('created_at', { ascending: false })
            .limit(5);

          return fallbackData || [];
        }

        const unviewedCount = unviewedData?.length || 0;
        console.log(`🔍 Vault: Found ${unviewedCount} unviewed ${tableName} for industry ${industryId}`);

        // If we have less than 5 unviewed items, fill the remainder with viewed content
        if (unviewedCount < 5) {
          const remainingNeeded = 5 - unviewedCount;
          console.log(`🔍 Vault: Need ${remainingNeeded} more ${tableName}, fetching viewed content`);

          // Get viewed content to fill remainder
          let viewedQuery = supabase
            .from(tableName)
            .select(selectFields)
            .eq('industry_id', industryId)
            .order('created_at', { ascending: false })
            .limit(remainingNeeded);

          // Only add the IN filter if there are viewed items
          if (viewedIdsArray.length > 0) {
            viewedQuery = viewedQuery.in('id', viewedIdsArray);
          } else {
            // No viewed content available
            return unviewedData || [];
          }

          const { data: viewedData } = await viewedQuery;

          console.log(`🔍 Vault: Found ${viewedData?.length || 0} viewed ${tableName} to fill remainder`);

          // Combine unviewed (first) + viewed (remainder)
          return [...(unviewedData || []), ...(viewedData || [])];
        }

        return unviewedData || [];
      };

      // Fetch all content types with prioritization
      const [articlesData, papersData, booksData] = await Promise.all([
        fetchPrioritizedContent(
          'articles',
          'article_views_enhanced',
          'article_id',
          'id, title, summary, author, site_name, date, industry_id, likes_count, saves_count, comments_count, views_count, created_at'
        ),
        fetchPrioritizedContent(
          'papers',
          'paper_views',
          'paper_id',
          'id, title, content_simple, authors, created_at, industry_id, likes_count, saves_count, comments_count, views_count'
        ),
        fetchPrioritizedContent(
          'books',
          'book_views',
          'book_id',
          'id, title, short_summary, author, created_at, industry_id, likes_count, saves_count, comments_count, views_count'
        )
      ]);

      const articles: SearchResult[] = articlesData.map((item: any) => ({
        ...item,
        type: 'article' as const,
        link: '#'
      }));

      const papers: SearchResult[] = papersData.map((item: any) => ({
        ...item,
        type: 'paper' as const,
        link: '#'
      }));

      const books: SearchResult[] = booksData.map((item: any) => ({
        ...item,
        type: 'book' as const,
        link: '#'
      }));

      console.log(`🔍 Vault: Final prioritized results - articles: ${articles.length}, papers: ${papers.length}, books: ${books.length}`);

      return { articles, papers, books };
    } catch (error) {
      console.error('🔍 Vault: Error fetching prioritized content by industry:', error);
      return { articles: [], papers: [], books: [] };
    }
  }, [user]);

  const loadInitialContent = useCallback(async () => {
    if (!user) {
      console.log('🔍 Vault: No user available, skipping content load');
      return;
    }

    setError(null);
    setLoading({ articles: true, papers: true, books: true });

    try {
      console.log('🔍 Vault: Loading initial content for user:', user.id, 'industry:', selectedIndustry);

      let vaultResults: VaultData;

      if (selectedIndustry) {
        // If industry is selected, fetch content directly by industry with prioritization
        console.log('🔍 Vault: Fetching prioritized content by industry:', selectedIndustry);
        vaultResults = await fetchContentByIndustry(selectedIndustry);
      } else {
        // If no industry selected, use general search to get diverse content
        const [articlesResponse, papersResponse, booksResponse] = await Promise.all([
          immediateKeywordSearch('', undefined, 'article'),
          immediateKeywordSearch('', undefined, 'paper'),
          immediateKeywordSearch('', undefined, 'book')
        ]);

        console.log('🔍 Vault: General content responses - articles:', articlesResponse.results?.length, 'papers:', papersResponse.results?.length, 'books:', booksResponse.results?.length);

        vaultResults = {
          articles: articlesResponse.results || [],
          papers: papersResponse.results || [],
          books: booksResponse.results || []
        };
      }

      console.log('🔍 Vault: Final initial content - articles:', vaultResults.articles.length, 'papers:', vaultResults.papers.length, 'books:', vaultResults.books.length);
      setVaultData(vaultResults);
    } catch (error) {
      console.error('🔍 Vault: Error loading initial content:', error);
      setError('Failed to load content');
      setVaultData({ articles: [], papers: [], books: [] });
    } finally {
      setLoading({ articles: false, papers: false, books: false });
    }
  }, [selectedIndustry, user, fetchContentByIndustry]);

  const performSearch = useCallback(async (query: string) => {
    if (!user) {
      console.log('🔍 Vault: No user available, skipping search');
      return;
    }

    setError(null);
    setLoading({ articles: true, papers: true, books: true });

    try {
      console.log('🔍 Vault: Performing search:', query, 'industry:', selectedIndustry);

      let vaultResults: VaultData;

      if (selectedIndustry && !query.trim()) {
        // If industry is selected but no search query, fetch content directly by industry
        console.log('🔍 Vault: Fetching content by industry:', selectedIndustry);
        vaultResults = await fetchContentByIndustry(selectedIndustry);
      } else {
        // Use regular search functionality
        const [articlesResponse, papersResponse, booksResponse] = await Promise.all([
          immediateKeywordSearch(query, selectedIndustry || undefined, 'article'),
          immediateKeywordSearch(query, selectedIndustry || undefined, 'paper'),
          immediateKeywordSearch(query, selectedIndustry || undefined, 'book')
        ]);

        console.log('🔍 Vault: Search responses - articles:', articlesResponse.results?.length, 'papers:', papersResponse.results?.length, 'books:', booksResponse.results?.length);

        vaultResults = {
          articles: articlesResponse.results || [],
          papers: papersResponse.results || [],
          books: booksResponse.results || []
        };
      }

      console.log('🔍 Vault: Final search results - articles:', vaultResults.articles.length, 'papers:', vaultResults.papers.length, 'books:', vaultResults.books.length);
      setVaultData(vaultResults);
    } catch (error) {
      console.error('🔍 Vault: Error performing search:', error);
      setError('Search failed');
      setVaultData({ articles: [], papers: [], books: [] });
    } finally {
      setLoading({ articles: false, papers: false, books: false });
    }
  }, [selectedIndustry, user, fetchContentByIndustry]);

  const handleContentPress = (content: SearchResult) => {
    setSelectedContent(content);
  };

  const handleCloseViewer = () => {
    setSelectedContent(null);
  };

  // Show content viewer when content is selected
  if (selectedContent) {
    return (
      <VaultContentViewer
        content={selectedContent}
        onClose={handleCloseViewer}
      />
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <VaultSearchHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedIndustry={selectedIndustry}
        onIndustryChange={setSelectedIndustry}
        isFocused={isFocused}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <ContentSection
          title="Articles"
          data={vaultData.articles}
          loading={loading.articles}
          emptyState="none"
          onItemPress={handleContentPress}
        />

        <ContentSection
          title="Papers"
          data={vaultData.papers}
          loading={loading.papers}
          emptyState="none"
          onItemPress={handleContentPress}
        />

        <ContentSection
          title="Books"
          data={vaultData.books}
          loading={loading.books}
          emptyState="none"
          onItemPress={handleContentPress}
        />

        <SavedContentSection searchQuery={searchQuery} onItemPress={handleContentPress} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Extra padding for navbar
  },
});