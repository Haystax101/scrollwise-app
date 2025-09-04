import AsyncStorage from '@react-native-async-storage/async-storage';
import { immediateKeywordSearch, SearchResult } from '../lib/smartSearchService';

/**
 * InstantContentLoader Service
 * Provides instant content display through pre-loading and caching strategies
 */

export interface CachedIndustryContent {
  industryId: string;
  content: SearchResult[];
  timestamp: number;
  query: string;
}

export interface ContentCache {
  [industryId: string]: CachedIndustryContent;
}

export class InstantContentLoader {
  private static instance: InstantContentLoader;
  private memoryCache: ContentCache = {};
  private readonly CACHE_EXPIRY = 15 * 60 * 1000; // 15 minutes
  private readonly STORAGE_KEY = 'discover_content_cache';
  private readonly MAX_CACHED_ITEMS_PER_INDUSTRY = 15;
  private readonly MAX_MEMORY_INDUSTRIES = 10;

  private constructor() {}

  public static getInstance(): InstantContentLoader {
    if (!InstantContentLoader.instance) {
      InstantContentLoader.instance = new InstantContentLoader();
    }
    return InstantContentLoader.instance;
  }

  /**
   * Get cached content for an industry (memory first, then AsyncStorage)
   */
  async getCachedContent(industryId: string | null, query: string = ''): Promise<SearchResult[] | null> {
    const cacheKey = industryId || 'all';
    
    // Check memory cache first
    const memoryResult = this.getFromMemoryCache(cacheKey, query);
    if (memoryResult) {
      console.log(`📦 InstantLoader: Memory cache hit for ${cacheKey}`);
      return memoryResult;
    }

    // Check AsyncStorage cache
    const storageResult = await this.getFromStorageCache(cacheKey, query);
    if (storageResult) {
      // Move to memory cache for faster subsequent access
      this.addToMemoryCache(cacheKey, storageResult, query);
      console.log(`💾 InstantLoader: Storage cache hit for ${cacheKey}`);
      return storageResult;
    }

    console.log(`❌ InstantLoader: No cache found for ${cacheKey}`);
    return null;
  }

  /**
   * Pre-load content for an industry and store in cache
   */
  async preloadIndustryContent(industryId: string | null, query: string = ''): Promise<SearchResult[]> {
    const cacheKey = industryId || 'all';
    
    try {
      console.log(`🔄 InstantLoader: Pre-loading content for ${cacheKey}`);
      
      // Fetch fresh content
      const response = await immediateKeywordSearch(query, industryId || undefined, undefined);
      
      if (response.error) {
        console.error(`❌ InstantLoader: Error pre-loading ${cacheKey}:`, response.error);
        return [];
      }

      const content = response.results.slice(0, this.MAX_CACHED_ITEMS_PER_INDUSTRY);
      
      // Cache in both memory and storage
      await this.cacheContent(cacheKey, content, query);
      
      console.log(`✅ InstantLoader: Pre-loaded ${content.length} items for ${cacheKey}`);
      return content;
    } catch (error) {
      console.error(`❌ InstantLoader: Exception pre-loading ${cacheKey}:`, error);
      return [];
    }
  }

  /**
   * Pre-load content for multiple industries in background
   */
  async preloadMultipleIndustries(industryIds: string[], query: string = ''): Promise<void> {
    console.log(`🚀 InstantLoader: Pre-loading ${industryIds.length} industries`);
    
    // Process industries in batches to avoid overwhelming the API
    const batchSize = 3;
    for (let i = 0; i < industryIds.length; i += batchSize) {
      const batch = industryIds.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(industryId => 
          this.preloadIndustryContent(industryId, query)
            .catch(error => {
              console.error(`❌ InstantLoader: Failed to pre-load ${industryId}:`, error);
              return [];
            })
        )
      );
      
      // Small delay between batches to be API-friendly
      if (i + batchSize < industryIds.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    console.log(`✅ InstantLoader: Completed pre-loading for ${industryIds.length} industries`);
  }

  /**
   * Get content with instant display (cache first, then fresh fetch)
   */
  async getInstantContent(industryId: string | null, query: string = ''): Promise<{
    cachedContent: SearchResult[] | null;
    freshContent: Promise<SearchResult[]>;
  }> {
    // Get cached content immediately
    const cachedContent = await this.getCachedContent(industryId, query);
    
    // Start fresh fetch in background
    const freshContent = this.preloadIndustryContent(industryId, query);
    
    return {
      cachedContent,
      freshContent
    };
  }

  /**
   * Cache content in both memory and AsyncStorage
   */
  private async cacheContent(industryId: string, content: SearchResult[], query: string): Promise<void> {
    const cachedData: CachedIndustryContent = {
      industryId,
      content,
      timestamp: Date.now(),
      query
    };
    
    // Add to memory cache
    this.addToMemoryCache(industryId, content, query);
    
    // Add to AsyncStorage
    try {
      const existingCache = await this.loadCacheFromStorage();
      existingCache[industryId] = cachedData;
      
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(existingCache));
    } catch (error) {
      console.error('❌ InstantLoader: Error saving to AsyncStorage:', error);
    }
  }

  /**
   * Get content from memory cache
   */
  private getFromMemoryCache(industryId: string, query: string): SearchResult[] | null {
    const cached = this.memoryCache[industryId];
    
    if (!cached) return null;
    
    // Check if cache is expired
    if (Date.now() - cached.timestamp > this.CACHE_EXPIRY) {
      delete this.memoryCache[industryId];
      return null;
    }
    
    // Check if query matches (empty query matches all)
    if (query && cached.query !== query) {
      return null;
    }
    
    return cached.content;
  }

  /**
   * Get content from AsyncStorage cache
   */
  private async getFromStorageCache(industryId: string, query: string): Promise<SearchResult[] | null> {
    try {
      const cache = await this.loadCacheFromStorage();
      const cached = cache[industryId];
      
      if (!cached) return null;
      
      // Check if cache is expired
      if (Date.now() - cached.timestamp > this.CACHE_EXPIRY) {
        delete cache[industryId];
        await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(cache));
        return null;
      }
      
      // Check if query matches
      if (query && cached.query !== query) {
        return null;
      }
      
      return cached.content;
    } catch (error) {
      console.error('❌ InstantLoader: Error loading from AsyncStorage:', error);
      return null;
    }
  }

  /**
   * Add content to memory cache with LRU eviction
   */
  private addToMemoryCache(industryId: string, content: SearchResult[], query: string): void {
    // If we're at capacity, remove the oldest entry
    if (Object.keys(this.memoryCache).length >= this.MAX_MEMORY_INDUSTRIES) {
      const oldestKey = Object.keys(this.memoryCache)
        .reduce((oldest, key) => 
          !oldest || this.memoryCache[key].timestamp < this.memoryCache[oldest].timestamp 
            ? key : oldest
        );
      delete this.memoryCache[oldestKey];
    }
    
    this.memoryCache[industryId] = {
      industryId,
      content,
      timestamp: Date.now(),
      query
    };
  }

  /**
   * Load cache from AsyncStorage
   */
  private async loadCacheFromStorage(): Promise<ContentCache> {
    try {
      const cacheJson = await AsyncStorage.getItem(this.STORAGE_KEY);
      return cacheJson ? JSON.parse(cacheJson) : {};
    } catch (error) {
      console.error('❌ InstantLoader: Error loading cache from storage:', error);
      return {};
    }
  }

  /**
   * Clear all cached content
   */
  async clearCache(): Promise<void> {
    this.memoryCache = {};
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
      console.log('✅ InstantLoader: Cache cleared');
    } catch (error) {
      console.error('❌ InstantLoader: Error clearing cache:', error);
    }
  }

  /**
   * Get cache statistics for debugging
   */
  getCacheStats(): {
    memoryEntries: number;
    memorySizeKB: number;
    oldestCacheAge: number;
  } {
    const entries = Object.values(this.memoryCache);
    const memorySizeKB = Math.round(JSON.stringify(this.memoryCache).length / 1024);
    const oldestCacheAge = entries.length > 0 
      ? Date.now() - Math.min(...entries.map(e => e.timestamp))
      : 0;
    
    return {
      memoryEntries: entries.length,
      memorySizeKB,
      oldestCacheAge: Math.round(oldestCacheAge / 1000) // seconds
    };
  }
}

// Export singleton instance
export const instantContentLoader = InstantContentLoader.getInstance();