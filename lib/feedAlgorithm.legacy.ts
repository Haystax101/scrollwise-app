import { supabase } from './supabase';
import type { FeedItem, Article, Paper, Book, Industry, Insight } from '../types';
import { feedContentPreloader } from '../services/FeedContentPreloader';
import { MMKV } from 'react-native-mmkv';

export interface FetchedContent {
  id: number | string; // Support both integer IDs and uuid strings for insights
  type: 'paper' | 'book' | 'article' | 'insight';
  title: string;
  link: string;
  industry_id?: string; // Optional for insights
  likes_count: number;
  saves_count: number;
  comments_count: number;
  views_count: number;
  created_at: string;
  date?: string;
  site_name?: string;
  // Type-specific fields
  summary?: string; // article
  author?: string; // article, book
  content_simple?: string; // paper
  content_complex?: string; // paper
  authors?: string[]; // paper
  year?: number; // book
  short_summary?: string; // book
  key_insights?: string[]; // book
  // Insight-specific fields
  content?: string; // insight - full content text
  author_id?: string; // insight - author UUID
  author_name?: string; // insight - author display name
  author_avatar_url?: string; // insight - author avatar
  voltz_spent?: number; // insight - supercharge amount
}

export interface FeedState {
  articles: FeedItem[];
  fetchedArticleIds: Set<number>;
  likedArticleIds: Set<number>;
  savedArticleIds: Set<number>;
  isLoading: boolean;
  hasMore: boolean;
  currentPage: number;
}

// MMKV storage for synchronous persistence across app sessions
const storage = new MMKV();
const VIEWED_CONTENT_KEY = 'feed_viewed_content';
const FAST_CACHE_KEY = 'feed_fast_cache';

export class FeedAlgorithm {
  private userId: string;
  private userIndustries: string[];
  private allIndustries: Industry[];
  private fetchedIds: Set<string> = new Set(); // Changed to string to handle bigint IDs
  private likedIds: Set<string> = new Set(); // Changed to string to handle bigint IDs
  private savedIds: Set<string> = new Set(); // Changed to string to handle bigint IDs
  private viewedIds: Set<string> = new Set(); // Track viewed content by type-id
  private fastFetchCache: FeedItem[] = []; // Cache for instant loading
  private fastFetchCacheTimestamp: number = 0; // When cache was created
  private readonly FAST_CACHE_TTL = 5 * 60 * 1000; // 5 minutes TTL

  constructor(userId: string, userIndustries: string[], allIndustries: Industry[]) {
    this.userId = userId;
    this.userIndustries = userIndustries;
    this.allIndustries = allIndustries;
    
    // Load persistent data SYNCHRONOUSLY with MMKV - fixes race condition!
    this.loadPersistentDataSync();
  }

  /**
   * Nuclear reset - clear all tracking and cache for completely fresh start
   * Use this when user reports seeing same content repeatedly
   */
  nuclearReset(): void {
    try {
      console.log('NUCLEAR RESET: Clearing all tracking and cache data');
      
      // Clear all in-memory state
      this.viewedIds.clear();
      this.fetchedIds.clear();
      this.fastFetchCache = [];
      this.fastFetchCacheTimestamp = 0;
      
      // Clear all MMKV data for this user (synchronous)
      const viewedKey = `${VIEWED_CONTENT_KEY}_${this.userId}`;
      const cacheKey = `${FAST_CACHE_KEY}_${this.userId}`;
      
      storage.delete(viewedKey);
      storage.delete(cacheKey);
      
      console.log('NUCLEAR RESET: Complete - all data cleared');
    } catch (error) {
      console.error('NUCLEAR RESET: Error during reset:', error);
    }
  }

  // ... (rest of the legacy MMKV implementation)
  // This is a backup of the complex MMKV-based system that was causing issues
}