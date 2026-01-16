import { supabase } from './supabase';

export interface SearchResult {
  id: number;
  title: string;
  summary?: string;
  longer_summary?: string; // For articles expanded view
  content_simple?: string;
  content_complex?: string; // For papers detailed summary
  short_summary?: string;
  key_insights?: string[]; // For books slideshow
  authors?: string[] | string;
  link: string;
  type: 'article' | 'paper' | 'book';
  content_type?: 'article' | 'paper' | 'book'; // Legacy field for edge function compatibility
  site_name?: string;
  date?: string;
  industry_id?: string;
  likes_count?: number;
  saves_count?: number;
  comments_count?: number;
  views_count?: number;
  created_at?: string;
  rank?: number;
  score?: number; // Now as percentage (0-100)
  searchSource?: 'keyword' | 'vector' | 'both';
  combinedScore?: number;
  keywordRank?: number;
  vectorRank?: number;
}

export interface SearchResultV2 {
  id: string;
  type: 'article' | 'paper' | 'book' | 'video' | 'podcast';
  title: string;
  subtitle: string;
  image_url?: string;
  colour?: string;
  date?: string;
  special?: boolean;
  match_score?: number;
}

export interface SearchResponse {
  results: SearchResult[];
  searchType: 'keyword' | 'progressive' | 'recent';
  hasMore: boolean;
  isProFeature: boolean;
  upgradeMessage?: string;
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
 * Immediate keyword search for typing (free for all users)
 */
/**
 * Process search results from Edge Function
 * The RPC functions already return correct content_type, so we just ensure type field matches
 */
function processSearchResults(results: SearchResult[]): SearchResult[] {
  return results.map(result => {
    const processedResult: SearchResult = {
      ...result,
      type: (result.content_type || result.type) as 'article' | 'paper' | 'book'
    };

    // Map summary to content_simple for papers if not already present
    if (processedResult.type === 'paper' && result.summary && !processedResult.content_simple) {
      processedResult.content_simple = result.summary;
    }

    // Map summary to short_summary for books if not already present
    if (processedResult.type === 'book' && result.summary && !processedResult.short_summary) {
      processedResult.short_summary = result.summary;
    }

    return processedResult;
  });
}

export async function immediateKeywordSearch(
  query: string,
  industryId?: string,
  contentType?: 'article' | 'paper' | 'book'
): Promise<SearchResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('smart-search', {
      body: {
        query,
        searchType: 'keyword',
        industry_id: industryId || null,
        content_type: contentType || null
      },
    });

    if (error) {
      console.error('Immediate keyword search error:', error);
      return {
        results: [],
        searchType: 'keyword',
        hasMore: false,
        isProFeature: false,
        error: error.message
      };
    }

    // Fix content types before returning
    const processedData = {
      ...data,
      results: processSearchResults(data.results || [])
    };

    console.log(`🔍 Search: Fixed ${processedData.results.length} results with correct types:`,
      processedData.results.map((r: SearchResult) => `${r.type}:${r.id}`).join(', '));

    return processedData;
  } catch (error) {
    console.error('Immediate keyword search exception:', error);
    return {
      results: [],
      searchType: 'keyword',
      hasMore: false,
      isProFeature: false,
      error: 'Search failed. Please try again.'
    };
  }
}

/**
 * Progressive search with vector search (Pro users only)
 * Falls back to keyword search for free users
 */
export async function progressiveSearch(
  query: string,
  match_threshold: number = 0.75,
  industryId?: string,
  contentType?: 'article' | 'paper' | 'book'
): Promise<SearchResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('smart-search', {
      body: {
        query,
        searchType: 'progressive',
        match_threshold,
        industry_id: industryId || null,
        content_type: contentType || null
      },
    });

    if (error) {
      console.error('Progressive search error:', error);
      return {
        results: [],
        searchType: 'keyword',
        hasMore: false,
        isProFeature: false,
        error: error.message
      };
    }

    // Fix content types before returning
    const processedData = {
      ...data,
      results: processSearchResults(data.results || [])
    };

    console.log(`🔍 Progressive Search: Fixed ${processedData.results.length} results with correct types:`,
      processedData.results.map((r: SearchResult) => `${r.type}:${r.id}`).join(', '));

    return processedData;
  } catch (error) {
    console.error('Progressive search exception:', error);
    return {
      results: [],
      searchType: 'keyword',
      hasMore: false,
      isProFeature: false,
      error: 'Search failed. Please try again.'
    };
  }
}

/**
 * Get recent content when no search query
 */
export async function getRecentContent(): Promise<SearchResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('smart-search', {
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
        isProFeature: false,
        error: error.message
      };
    }

    // Fix content types before returning
    const processedData = {
      ...data,
      results: processSearchResults(data.results || [])
    };

    console.log(`🔍 Recent Content: Fixed ${processedData.results.length} results with correct types:`,
      processedData.results.map((r: SearchResult) => `${r.type}:${r.id}`).join(', '));

    return processedData;
  } catch (error) {
    console.error('Recent content exception:', error);
    return {
      results: [],
      searchType: 'recent',
      hasMore: false,
      isProFeature: false,
      error: 'Failed to load content.'
    };
  }
}

/**
 * Check if current user has pro plan
 */
export async function checkProPlan(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: profile } = await supabase
      .from('profiles')
      .select('pro_plan')
      .eq('id', user.id)
      .single();

    return profile?.pro_plan || false;
  } catch (error) {
    console.error('Error checking pro plan:', error);
    return false;
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

export function formatScore(score?: number): string {
  if (!score) return '0%';
  return `${Math.round(score)}%`;
}

/**
 * Search V2 - Uses Postgres RPC 'search_content_v2'
 */
export async function searchContentV2(query: string): Promise<SearchResultV2[]> {
  try {
    const { data, error } = await supabase.rpc('search_content_v2', {
      query_text: query
    });

    if (error) {
      console.error('Search V2 Error:', error);
      return [];
    }

    return data as SearchResultV2[];
  } catch (err) {
    console.error('Search V2 Exception:', err);
    return [];
  }
}