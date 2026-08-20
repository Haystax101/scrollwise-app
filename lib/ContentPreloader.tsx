import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

interface PreloadedContent {
  articles: any[];
  papers: any[];
  books: any[];
  timestamp: number;
}

const CACHE_KEY = 'preloaded_content';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export class ContentPreloader {
  private static instance: ContentPreloader;
  private preloadPromise: Promise<PreloadedContent | null> | null = null;

  static getInstance(): ContentPreloader {
    if (!ContentPreloader.instance) {
      ContentPreloader.instance = new ContentPreloader();
    }
    return ContentPreloader.instance;
  }

  async startPreloading(userIndustries?: string[]): Promise<void> {
    // Start preloading but don't await - let it run in background
    this.preloadPromise = this.preloadContent(userIndustries);
  }

  async getPreloadedContent(): Promise<PreloadedContent | null> {
    if (this.preloadPromise) {
      return await this.preloadPromise;
    }
    
    // Try to get from cache if no active preloading
    return await this.getCachedContent();
  }

  private async preloadContent(userIndustries?: string[]): Promise<PreloadedContent | null> {
    try {
      // Check if we have recent cached content first
      const cached = await this.getCachedContent();
      if (cached) {
        return cached;
      }

      console.log('Starting content preloading...');
      const startTime = Date.now();

      // Parallel requests for different content types
      const [articlesResult, papersResult, booksResult] = await Promise.allSettled([
        this.preloadArticles(userIndustries),
        this.preloadPapers(userIndustries),
        this.preloadBooks(userIndustries)
      ]);

      const preloadedContent: PreloadedContent = {
        articles: articlesResult.status === 'fulfilled' ? articlesResult.value : [],
        papers: papersResult.status === 'fulfilled' ? papersResult.value : [],
        books: booksResult.status === 'fulfilled' ? booksResult.value : [],
        timestamp: Date.now()
      };

      // Cache the results
      await this.cacheContent(preloadedContent);

      const loadTime = Date.now() - startTime;
      console.log(`Content preloading completed in ${loadTime}ms`);
      
      return preloadedContent;
    } catch (error) {
      console.error('Content preloading failed:', error);
      return null;
    }
  }

  private async preloadArticles(userIndustries?: string[]): Promise<any[]> {
    let query = supabase
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(15);

    if (userIndustries && userIndustries.length > 0) {
      query = query.in('industry_id', userIndustries);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  private async preloadPapers(userIndustries?: string[]): Promise<any[]> {
    let query = supabase
      .from('papers')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(8);

    if (userIndustries && userIndustries.length > 0) {
      query = query.in('industry_id', userIndustries);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  private async preloadBooks(userIndustries?: string[]): Promise<any[]> {
    let query = supabase
      .from('books')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (userIndustries && userIndustries.length > 0) {
      query = query.in('industry_id', userIndustries);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  private async getCachedContent(): Promise<PreloadedContent | null> {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const content: PreloadedContent = JSON.parse(cached);
      const isExpired = Date.now() - content.timestamp > CACHE_DURATION;
      
      if (isExpired) {
        await AsyncStorage.removeItem(CACHE_KEY);
        return null;
      }

      return content;
    } catch (error) {
      console.error('Error reading cached content:', error);
      return null;
    }
  }

  private async cacheContent(content: PreloadedContent): Promise<void> {
    try {
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(content));
    } catch (error) {
      console.error('Error caching content:', error);
    }
  }

  async clearCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(CACHE_KEY);
    } catch (error) {
      console.error('Error clearing content cache:', error);
    }
  }
}