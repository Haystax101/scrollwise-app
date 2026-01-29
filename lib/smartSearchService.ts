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
  type: 'article' | 'paper' | 'book' | 'video' | 'podcast' | 'user'; // user added
  title: string;
  subtitle: string;
  image_url?: string;
  colour?: string;
  date?: string;
  special?: boolean;
  match_score?: number;
}

// ... existing code ...

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

/**
 * Search Users - Uses 'search_profiles' RPC
 */
export async function searchUsers(query: string): Promise<SearchResultV2[]> {
  try {
    const { data, error } = await supabase.rpc('search_profiles', {
      query_text: query
    });

    if (error) {
      console.error('Search Users Error:', error);
      return [];
    }

    return (data || []).map((user: any) => ({
      id: user.id,
      type: 'user',
      title: user.full_name || 'Unknown User',
      subtitle: user.tagline || 'No tagline',
      image_url: user.avatar_url,
      colour: '#4F46E5', // Indigo color for users
    })) as SearchResultV2[];
  } catch (err) {
    console.error('Search Users Exception:', err);
    return [];
  }
}