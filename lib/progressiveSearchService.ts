import { supabase } from './supabase';

export interface SearchResult {
  id: number;
  title: string;
  summary?: string;
  content_simple?: string;
  short_summary?: string;
  authors?: string[] | string;
  link: string;
  type: 'article' | 'paper' | 'book';
  site_name?: string;
  date?: string;
  industry_id?: string;
  likes_count?: number;
  saves_count?: number;
  comments_count?: number;
  views_count?: number;
  created_at?: string;
  rank?: number;
  score?: number;
  searchSource?: 'keyword' | 'vector' | 'both';
  combinedScore?: number;
  keywordRank?: number;
  vectorRank?: number;
}

export interface SearchResponse {
  results: SearchResult[];
  searchType: 'keyword' | 'vector' | 'progressive' | 'recent';
  hasMore: boolean;
  meta?: {
    keywordCount: number;
    vectorCount: number;
    totalCount: number;
  };
  error?: string | null;
}

export interface SearchFilters {
  industryId?: string;
  type?: 'article' | 'paper' | 'book';
  dateRange?: {
    start: string;
    end: string;
  };
}

/**
 * Immediate keyword search for typing (3-5 results max)
 * Fast response for immediate user feedback
 */
export async function immediateKeywordSearch(
  query: string,
  industryId?: string,
  contentType?: 'article' | 'paper' | 'book'
): Promise<SearchResponse> {
  try {
    if (!query.trim()) {
      return { results: [], searchType: 'recent', hasMore: false };
    }

    const { data, error } = await supabase.functions.invoke('progressive-search', {
      body: { 
        query,
        searchType: 'keyword',
        industry_id: industryId || null,
        content_type: contentType || null,
      },
    });

    if (error) {
      console.error('Immediate keyword search error:', error);
      return { 
        results: [], 
        searchType: 'keyword', 
        hasMore: false, 
        error: error.message 
      };
    }

    return data;
  } catch (error) {
    console.error('Immediate keyword search exception:', error);
    return { 
      results: [], 
      searchType: 'keyword', 
      hasMore: false, 
      error: 'Search failed. Please try again.' 
    };
  }
}

/**
 * Vector search for comprehensive results (slower)
 * Used when user presses Enter or for final results
 */
export async function vectorSearch(
  query: string,
  match_threshold: number = 0.75
): Promise<SearchResponse> {
  try {
    if (!query.trim()) {
      return { results: [], searchType: 'recent', hasMore: false };
    }

    const { data, error } = await supabase.functions.invoke('progressive-search', {
      body: { 
        query, 
        searchType: 'vector',
        match_threshold 
      },
    });

    if (error) {
      console.error('Vector search error:', error);
      return { 
        results: [], 
        searchType: 'vector', 
        hasMore: false, 
        error: error.message 
      };
    }

    return data;
  } catch (error) {
    console.error('Vector search exception:', error);
    return { 
      results: [], 
      searchType: 'vector', 
      hasMore: false, 
      error: 'Search failed. Please try again.' 
    };
  }
}

/**
 * Progressive search combining keyword + vector
 * Best of both worlds for comprehensive results
 */
export async function progressiveSearch(
  query: string,
  match_threshold: number = 0.75
): Promise<SearchResponse> {
  try {
    if (!query.trim()) {
      return { results: [], searchType: 'recent', hasMore: false };
    }

    const { data, error } = await supabase.functions.invoke('progressive-search', {
      body: { 
        query, 
        searchType: 'progressive',
        match_threshold 
      },
    });

    if (error) {
      console.error('Progressive search error:', error);
      return { 
        results: [], 
        searchType: 'progressive', 
        hasMore: false, 
        error: error.message 
      };
    }

    return data;
  } catch (error) {
    console.error('Progressive search exception:', error);
    return { 
      results: [], 
      searchType: 'progressive', 
      hasMore: false, 
      error: 'Search failed. Please try again.' 
    };
  }
}

/**
 * Get recent content when no search query
 */
export async function getRecentContent(): Promise<SearchResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('progressive-search', {
      body: { 
        query: '', 
        searchType: 'keyword' 
      },
    });

    if (error) {
      console.error('Recent content error:', error);
      return { 
        results: [], 
        searchType: 'recent', 
        hasMore: false, 
        error: error.message 
      };
    }

    return data;
  } catch (error) {
    console.error('Recent content exception:', error);
    return { 
      results: [], 
      searchType: 'recent', 
      hasMore: false, 
      error: 'Failed to load content.' 
    };
  }
}

// Utility function to highlight search terms in results
export function highlightSearchTerms(text: string, searchQuery: string): string {
  if (!searchQuery.trim()) return text;
  
  const terms = searchQuery.split(' ').filter(term => term.length > 2);
  let highlightedText = text;
  
  terms.forEach(term => {
    const regex = new RegExp(`(${term})`, 'gi');
    highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
  });
  
  return highlightedText;
}