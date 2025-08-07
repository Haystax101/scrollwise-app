import { supabase } from './supabase';

export interface SearchResult {
  id: number;
  title: string;
  summary?: string; // for articles
  content_simple?: string; // for papers
  short_summary?: string; // for books
  authors?: string[] | string; // papers have array, books/articles have string
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
}

export interface SearchFilters {
  industryId?: string;
  type?: 'article' | 'paper' | 'book';
  dateRange?: {
    start: string;
    end: string;
  };
}

export async function searchArticles(
  query: string = '',
  filters: SearchFilters = {},
  page: number = 1,
  limit: number = 20
): Promise<{ articles: SearchResult[]; error: string | null; totalCount?: number }> {
  try {
    const offset = (page - 1) * limit;

    // If no search query, return recent content with filters
    if (!query.trim()) {
      return await searchRecentContent(filters, limit, offset);
    }

    // Search across all content types using the search function
    const { data, error } = await supabase.rpc('search_all_content', {
      search_query: query,
      industry_filter: filters.industryId || null,
      content_type_filter: filters.type || null,
      result_limit: limit,
      result_offset: offset
    });

    if (error) {
      console.error('Search error:', error);
      return { articles: [], error: error.message };
    }

    return { articles: data || [], error: null };
  } catch (error) {
    console.error('Search exception:', error);
    return { articles: [], error: 'An error occurred while searching' };
  }
}

/**
 * Search recent content when no query is provided
 */
async function searchRecentContent(
  filters: SearchFilters,
  limit: number,
  offset: number
): Promise<{ articles: SearchResult[]; error: string | null }> {
  try {
    const results: SearchResult[] = [];
    
    // Define which tables to search based on filter
    const tablesToSearch = filters.type 
      ? [filters.type === 'paper' ? 'papers' : filters.type === 'book' ? 'books' : 'articles']
      : ['articles', 'papers', 'books'];
    
    for (const table of tablesToSearch) {
      const contentType = table === 'papers' ? 'paper' : table === 'books' ? 'book' : 'article';
      
      let query = supabase
        .from(table)
        .select('*')
        .order('created_at', { ascending: false });
      
      if (filters.industryId) {
        query = query.eq('industry_id', filters.industryId);
      }
      
      if (filters.dateRange) {
        query = query
          .gte('created_at', filters.dateRange.start)
          .lte('created_at', filters.dateRange.end);
      }
      
      const { data, error } = await query.limit(Math.ceil(limit / tablesToSearch.length));
      
      if (error) {
        console.error(`Error fetching from ${table}:`, error);
        continue;
      }
      
      if (data) {
        const mappedResults = data.map(item => ({
          ...item,
          type: contentType,
          authors: item.authors || (item.author ? [item.author] : [])
        })) as SearchResult[];
        
        results.push(...mappedResults);
      }
    }
    
    // Sort all results by created_at and apply pagination
    const sortedResults = results
      .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
      .slice(offset, offset + limit);
    
    return { articles: sortedResults, error: null };
  } catch (error) {
    console.error('Error in searchRecentContent:', error);
    return { articles: [], error: 'Failed to fetch recent content' };
  }
}

/**
 * Search by industry
 */
export async function searchByIndustry(
  industryId: string,
  limit: number = 10
): Promise<{ articles: SearchResult[]; error: string | null }> {
  return searchArticles('', { industryId }, 1, limit);
}

/**
 * Search by content type
 */
export async function searchByType(
  type: 'article' | 'paper' | 'book',
  query?: string,
  limit: number = 10
): Promise<{ articles: SearchResult[]; error: string | null }> {
  return searchArticles(query || '', { type }, 1, limit);
}

/**
 * Advanced search with multiple filters
 */
export async function advancedSearch(
  query: string,
  filters: SearchFilters & {
    minLikes?: number;
    minSaves?: number;
    minViews?: number;
  },
  page: number = 1,
  limit: number = 20
): Promise<{ articles: SearchResult[]; error: string | null }> {
  try {
    const { articles, error } = await searchArticles(query, filters, page, limit);

    if (error || !articles) {
      return { articles: [], error };
    }

    // Apply additional filters
    let filteredArticles = articles;

    if (filters.minLikes !== undefined) {
      filteredArticles = filteredArticles.filter(article =>
        (article.likes_count || 0) >= filters.minLikes!
      );
    }

    if (filters.minSaves !== undefined) {
      filteredArticles = filteredArticles.filter(article =>
        (article.saves_count || 0) >= filters.minSaves!
      );
    }

    if (filters.minViews !== undefined) {
      filteredArticles = filteredArticles.filter(article =>
        (article.views_count || 0) >= filters.minViews!
      );
    }

    return { articles: filteredArticles, error: null };
  } catch (error) {
    console.error('Advanced search failed:', error);
    return { articles: [], error: 'Advanced search failed' };
  }
}

// Get search suggestions as user types
export async function getSearchSuggestions(
  partialQuery: string,
  limit: number = 5
): Promise<{ suggestions: string[]; error: string | null }> {
  try {
    if (!partialQuery.trim() || partialQuery.length < 2) {
      return { suggestions: [], error: null };
    }

    const { data, error } = await supabase.rpc('get_article_search_suggestions', {
      partial_query: partialQuery,
      limit_count: limit
    });

    if (error) {
      console.error('Suggestions error:', error);
      return { suggestions: [], error: error.message };
    }

    return { 
      suggestions: data?.map((item: any) => item.suggestion) || [], 
      error: null 
    };
  } catch (error) {
    console.error('Suggestions error:', error);
    return { suggestions: [], error: 'Failed to get suggestions' };
  }
}

// Get popular search terms (based on analytics)
export async function getPopularSearches(
  limit: number = 10
): Promise<{ searches: string[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('search_analytics')
      .select('query, count(*)')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
      .order('count', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Popular searches error:', error);
      return { searches: [], error: error.message };
    }

    return { 
      searches: data?.map((item: any) => item.query) || [], 
      error: null 
    };
  } catch (error) {
    console.error('Popular searches error:', error);
    return { searches: [], error: null };
  }
}

// Helper function to log searches (optional)
async function logSearch(query: string, resultsCount: number) {
  try {
    // Get current user if available
    const { data: { user } } = await supabase.auth.getUser();
    
    await supabase.rpc('log_search', {
      search_query: query,
      user_id: user?.id || null,
      results_count: resultsCount
    });
  } catch (error) {
    // Don't throw error if logging fails
    console.warn('Failed to log search:', error);
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