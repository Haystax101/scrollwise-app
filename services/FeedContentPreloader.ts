/**
 * FeedContentPreloader Service
 * Handles preloading and caching of specific content items for instant MainFeed display
 * This is different from InstantContentLoader which handles Discover search results
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

export interface PreloadedContent {
  id: number | string;
  type: 'article' | 'paper' | 'book' | 'insight';
  data: any;
  timestamp: number;
  preloaded: boolean; // Indicates this was preloaded for instant display
}

export interface ContentCache {
  [key: string]: PreloadedContent; // key format: "type_id"
}

export class FeedContentPreloader {
  private static instance: FeedContentPreloader;
  private memoryCache: ContentCache = {};
  private readonly CACHE_EXPIRY = 30 * 60 * 1000; // 30 minutes (longer than Discover cache)
  private readonly STORAGE_KEY = 'feed_content_cache';
  private readonly MAX_CACHED_ITEMS = 50;

  private constructor() {
    this.loadCacheFromStorage();
  }

  public static getInstance(): FeedContentPreloader {
    if (!FeedContentPreloader.instance) {
      FeedContentPreloader.instance = new FeedContentPreloader();
    }
    return FeedContentPreloader.instance;
  }

  /**
   * Generate cache key for content
   */
  private getCacheKey(contentId: number | string, contentType: string): string {
    return `${contentType}_${contentId}`;
  }

  /**
   * Preload specific content for instant MainFeed display
   * This is called when user taps on Discover results or Insights
   */
  async preloadContent(contentId: number | string, contentType: 'article' | 'paper' | 'book' | 'insight'): Promise<any | null> {
    const cacheKey = this.getCacheKey(contentId, contentType);
    
    // Check if already cached and not expired
    const cachedContent = this.getCachedContent(contentId, contentType);
    if (cachedContent) {
      console.log(`FeedPreloader: Using cached ${contentType} ${contentId}`);
      return cachedContent;
    }

    try {
      console.log(`FeedPreloader: Pre-loading ${contentType} ${contentId}`);
      
      // Fetch from appropriate table
      const tableName = contentType === 'paper' ? 'papers' : 
                        contentType === 'book' ? 'books' : 
                        contentType === 'insight' ? 'insights' : 'articles';
      
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', contentId)
        .limit(1);

      if (error) {
        console.error(`FeedPreloader: Database error for ${contentType} ${contentId}:`, error);
        return null;
      }

      if (!data || data.length === 0) {
        console.warn(`FeedPreloader: No content found for ${contentType} ${contentId}`);
        return null;
      }

      const content = data[0];
      
      // Cache the content
      await this.cacheContent(contentId, contentType, content);
      
      console.log(`FeedPreloader: Successfully preloaded ${contentType} ${contentId}`);
      return content;
      
    } catch (error) {
      console.error(`FeedPreloader: Exception preloading ${contentType} ${contentId}:`, error);
      return null;
    }
  }

  /**
   * Get cached content if available and not expired
   */
  getCachedContent(contentId: number | string, contentType: string): any | null {
    const cacheKey = this.getCacheKey(contentId, contentType);
    const cached = this.memoryCache[cacheKey];
    
    if (!cached) {
      return null;
    }
    
    // Check if cache is expired
    if (Date.now() - cached.timestamp > this.CACHE_EXPIRY) {
      delete this.memoryCache[cacheKey];
      return null;
    }
    
    return cached.data;
  }

  /**
   * Cache content in memory and AsyncStorage
   */
  private async cacheContent(contentId: number | string, contentType: string, content: any): Promise<void> {
    const cacheKey = this.getCacheKey(contentId, contentType);
    
    const cachedData: PreloadedContent = {
      id: contentId,
      type: contentType as 'article' | 'paper' | 'book' | 'insight',
      data: content,
      timestamp: Date.now(),
      preloaded: true
    };
    
    // Implement LRU eviction if we're at capacity
    if (Object.keys(this.memoryCache).length >= this.MAX_CACHED_ITEMS) {
      const oldestKey = Object.keys(this.memoryCache)
        .reduce((oldest, key) => 
          !oldest || this.memoryCache[key].timestamp < this.memoryCache[oldest].timestamp 
            ? key : oldest
        );
      delete this.memoryCache[oldestKey];
    }
    
    // Add to memory cache
    this.memoryCache[cacheKey] = cachedData;
    
    // Save to AsyncStorage
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.memoryCache));
    } catch (error) {
      console.error('FeedPreloader: Error saving to AsyncStorage:', error);
    }
  }

  /**
   * Load cache from AsyncStorage on initialization
   */
  private async loadCacheFromStorage(): Promise<void> {
    try {
      const cacheJson = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (cacheJson) {
        const cache: ContentCache = JSON.parse(cacheJson);
        
        // Filter out expired items
        const now = Date.now();
        const validCache: ContentCache = {};
        
        for (const [key, item] of Object.entries(cache)) {
          if (now - item.timestamp <= this.CACHE_EXPIRY) {
            validCache[key] = item;
          }
        }
        
        this.memoryCache = validCache;
        console.log(`FeedPreloader: Loaded ${Object.keys(validCache).length} cached items from storage`);
      }
    } catch (error) {
      console.error('FeedPreloader: Error loading cache from storage:', error);
    }
  }

  /**
   * Preload multiple content items (useful for batch operations)
   */
  async preloadMultipleContent(items: Array<{ id: number | string; type: 'article' | 'paper' | 'book' | 'insight' }>): Promise<void> {
    console.log(`FeedPreloader: Batch preloading ${items.length} items`);
    
    const promises = items.map(item => 
      this.preloadContent(item.id, item.type)
        .catch(error => {
          console.error(`FeedPreloader: Failed to preload ${item.type} ${item.id}:`, error);
          return null;
        })
    );
    
    await Promise.all(promises);
    console.log(`FeedPreloader: Completed batch preloading`);
  }

  /**
   * Check if specific content is already cached
   */
  isContentCached(contentId: number | string, contentType: string): boolean {
    return this.getCachedContent(contentId, contentType) !== null;
  }

  /**
   * Clear specific content from cache
   */
  clearContent(contentId: number | string, contentType: string): void {
    const cacheKey = this.getCacheKey(contentId, contentType);
    delete this.memoryCache[cacheKey];
  }

  /**
   * Clear all cached content
   */
  async clearCache(): Promise<void> {
    this.memoryCache = {};
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
      console.log('FeedPreloader: Cache cleared');
    } catch (error) {
      console.error('FeedPreloader: Error clearing cache:', error);
    }
  }

  /**
   * Get cache statistics for debugging
   */
  getCacheStats(): {
    cachedItems: number;
    cacheKeys: string[];
    memorySizeKB: number;
  } {
    const keys = Object.keys(this.memoryCache);
    const memorySizeKB = Math.round(JSON.stringify(this.memoryCache).length / 1024);
    
    return {
      cachedItems: keys.length,
      cacheKeys: keys,
      memorySizeKB
    };
  }

  /**
   * Preload content when navigation is initiated (call this from Discover/Insights)
   */
  async preloadForNavigation(contentId: number | string, contentType: 'article' | 'paper' | 'book' | 'insight'): Promise<void> {
    // Start preloading in background - don't await to avoid blocking navigation
    this.preloadContent(contentId, contentType).catch(error => {
      console.error(`Background preload failed for ${contentType} ${contentId}:`, error);
    });
  }
}

// Export singleton instance
export const feedContentPreloader = FeedContentPreloader.getInstance();