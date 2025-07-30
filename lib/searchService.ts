import { supabase } from './supabase';

export interface SearchResult {
  id: number;
  title: string;
  content: string;
  authors: string[];
  link: string;
  created_at: string;
  type: string;
  industry_id: string; // Changed from number to string for UUID
  likes_count: number;
  saves_count: number;
  comments_count: number;
  views_count: number;
  site_name: string;
  rank: number;
}

export interface SearchFilters {
  industryId?: string; // Changed from number to string for UUID
  type?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

// Main search function using full-text search
export async function searchArticles(
  query: string,
  filters: SearchFilters = {},
  page: number = 1,
  limit: number = 20
): Promise<{ articles: SearchResult[]; error: string | null; totalCount?: number }> {
  const offset = (page - 1) * limit;

  try {
    if (!query.trim()) {
      // If no search query, return recent articles with filters
      let queryBuilder = supabase
        .from('articles')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters.industryId) {
        queryBuilder = queryBuilder.eq('industry_id', filters.industryId);
      }

      if (filters.type) {
        queryBuilder = queryBuilder.eq('type', filters.type);
      }

      const { data, error } = await queryBuilder
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Search error:', error);
        return { articles: [], error: error.message };
      }

      return { articles: data || [], error: null };
    }

    // Use the database search function for text queries
    const { data, error } = await supabase.rpc('search_articles', {
      search_query: query,
      industry_filter: filters.industryId || null,
      limit_count: limit,
      offset_count: offset
    });

    if (error) {
      console.error('Search error:', error);
      return { articles: [], error: error.message };
    }

    // Log the search for analytics (optional)
    await logSearch(query, data?.length || 0);

    return { articles: data || [], error: null };
  } catch (error) {
    console.error('Search error:', error);
    return { articles: [], error: 'An error occurred while searching' };
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

// Search within a specific industry
export async function searchByIndustry(
  industryId: string, // Changed from number to string
  query?: string,
  limit: number = 20
): Promise<{ articles: SearchResult[]; error: string | null }> {
  return searchArticles(query || '', { industryId }, 1, limit);
}

// Search by article type (research, book, article, etc.)
export async function searchByType(
  type: string,
  query?: string,
  limit: number = 20
): Promise<{ articles: SearchResult[]; error: string | null }> {
  return searchArticles(query || '', { type }, 1, limit);
}

// Advanced search with multiple filters
export async function advancedSearch(
  query: string,
  filters: SearchFilters & {
    authorName?: string;
    minLikes?: number;
    minSaves?: number;
  },
  page: number = 1,
  limit: number = 20
): Promise<{ articles: SearchResult[]; error: string | null }> {
  try {
    // Start with basic search
    const { articles, error } = await searchArticles(query, filters, page, limit);
    
    if (error || !articles) {
      return { articles: [], error };
    }

    // Apply additional client-side filters
    let filteredArticles = articles;

    if (filters.authorName) {
      filteredArticles = filteredArticles.filter(article =>
        article.authors.some(author =>
          author.toLowerCase().includes(filters.authorName!.toLowerCase())
        )
      );
    }

    if (filters.minLikes) {
      filteredArticles = filteredArticles.filter(article =>
        article.likes_count >= filters.minLikes!
      );
    }

    if (filters.minSaves) {
      filteredArticles = filteredArticles.filter(article =>
        article.saves_count >= filters.minSaves!
      );
    }

    if (filters.dateRange) {
      filteredArticles = filteredArticles.filter(article => {
        const articleDate = new Date(article.created_at);
        return articleDate >= filters.dateRange!.start && 
               articleDate <= filters.dateRange!.end;
      });
    }

    return { articles: filteredArticles, error: null };
  } catch (error) {
    console.error('Advanced search error:', error);
    return { articles: [], error: 'Advanced search failed' };
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