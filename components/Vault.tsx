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

  const loadInitialContent = useCallback(async () => {
    if (!user) {
      console.log('🔍 Vault: No user available, skipping content load');
      return;
    }

    setError(null);
    setLoading({ articles: true, papers: true, books: true });

    try {
      console.log('🔍 Vault: Loading initial content for user:', user.id, 'industry:', selectedIndustry);

      // Make separate calls for each content type to ensure we get 10 of each
      const [articlesResponse, papersResponse, booksResponse] = await Promise.all([
        immediateKeywordSearch('', selectedIndustry, 'article'),
        immediateKeywordSearch('', selectedIndustry, 'paper'),
        immediateKeywordSearch('', selectedIndustry, 'book')
      ]);

      console.log('🔍 Vault: Content responses - articles:', articlesResponse.results?.length, 'papers:', papersResponse.results?.length, 'books:', booksResponse.results?.length);

      const vaultResults: VaultData = {
        articles: articlesResponse.results || [],
        papers: papersResponse.results || [],
        books: booksResponse.results || []
      };

      console.log('🔍 Vault: Final categorized - articles:', vaultResults.articles.length, 'papers:', vaultResults.papers.length, 'books:', vaultResults.books.length);
      setVaultData(vaultResults);
    } catch (error) {
      console.error('🔍 Vault: Error loading initial content:', error);
      setError('Failed to load content');
      setVaultData({ articles: [], papers: [], books: [] });
    } finally {
      setLoading({ articles: false, papers: false, books: false });
    }
  }, [selectedIndustry, user]);

  const performSearch = useCallback(async (query: string) => {
    if (!user) {
      console.log('🔍 Vault: No user available, skipping search');
      return;
    }

    setError(null);
    setLoading({ articles: true, papers: true, books: true });

    try {
      console.log('🔍 Vault: Performing search:', query, 'industry:', selectedIndustry);

      // Make separate calls for each content type to ensure we get results for all
      const [articlesResponse, papersResponse, booksResponse] = await Promise.all([
        immediateKeywordSearch(query, selectedIndustry, 'article'),
        immediateKeywordSearch(query, selectedIndustry, 'paper'),
        immediateKeywordSearch(query, selectedIndustry, 'book')
      ]);

      console.log('🔍 Vault: Search responses - articles:', articlesResponse.results?.length, 'papers:', papersResponse.results?.length, 'books:', booksResponse.results?.length);

      const vaultResults: VaultData = {
        articles: articlesResponse.results || [],
        papers: papersResponse.results || [],
        books: booksResponse.results || []
      };

      console.log('🔍 Vault: Final search results - articles:', vaultResults.articles.length, 'papers:', vaultResults.papers.length, 'books:', vaultResults.books.length);
      setVaultData(vaultResults);
    } catch (error) {
      console.error('🔍 Vault: Error performing search:', error);
      setError('Search failed');
      setVaultData({ articles: [], papers: [], books: [] });
    } finally {
      setLoading({ articles: false, papers: false, books: false });
    }
  }, [selectedIndustry, user]);

  const categorizeResults = (results: SearchResult[]): VaultData => {
    return {
      articles: results.filter(r => r.type === 'article'),
      papers: results.filter(r => r.type === 'paper'),
      books: results.filter(r => r.type === 'book')
    };
  };

  const handleCreateArticle = () => {
    // TODO: Navigate to create article page
    console.log('Navigate to create article');
  };


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
        />

        <ContentSection
          title="Papers"
          data={vaultData.papers}
          loading={loading.papers}
          emptyState="none"
        />

        <ContentSection
          title="Books"
          data={vaultData.books}
          loading={loading.books}
          emptyState="none"
        />

        <SavedContentSection searchQuery={searchQuery} />
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