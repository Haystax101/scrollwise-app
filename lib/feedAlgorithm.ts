import { supabase } from './supabase';
import type { FeedItem, Article, Paper, Book, Industry, Insight } from '../types';
import { feedContentPreloader } from '../services/FeedContentPreloader';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

// AsyncStorage keys for persistence across app sessions
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
    
    // Load persistent data asynchronously
    this.loadPersistentData();
  }

  /**
   * Load viewed content and cache from AsyncStorage
   */
  private async loadPersistentData(): Promise<void> {
    try {
      // Load viewed content
      const viewedKey = `${VIEWED_CONTENT_KEY}_${this.userId}`;
      const viewedData = await AsyncStorage.getItem(viewedKey);
      if (viewedData) {
        const viewedArray = JSON.parse(viewedData);
        this.viewedIds = new Set(viewedArray);
        console.log(`📦 AsyncStorage: Loaded ${this.viewedIds.size} viewed items`);
      }

      // Load fast fetch cache
      const cacheKey = `${FAST_CACHE_KEY}_${this.userId}`;
      const cacheData = await AsyncStorage.getItem(cacheKey);
      if (cacheData) {
        const cached = JSON.parse(cacheData);
        
        // Check if cache is not expired
        if (Date.now() - cached.timestamp < this.FAST_CACHE_TTL) {
          this.fastFetchCache = cached.cache;
          this.fastFetchCacheTimestamp = cached.timestamp;
          console.log(`📦 AsyncStorage: Loaded ${this.fastFetchCache.length} cached items`);
        } else {
          console.log(`📦 AsyncStorage: Cache expired, will fetch fresh`);
        }
      }
    } catch (error) {
      console.error('📦 AsyncStorage: Error loading persistent data:', error);
    }
  }

  /**
   * Normalize ID to string format to handle both number and bigint IDs consistently
   */
  private normalizeId(id: string | number | bigint): string {
    return String(id);
  }

  /**
   * Initialize user interaction data (liked, saved, and viewed content)
   */
  async initializeUserInteractions(): Promise<void> {
    if (!this.userId) {
      return;
    }

    try {
      // Fetch user's liked articles
      const { data: likedArticles, error: likedArticlesError } = await supabase
        .from('article_likes')
        .select('article_id')
        .eq('user_id', this.userId);
      
      // Fetch user's liked papers
      const { data: likedPapers, error: likedPapersError } = await supabase
        .from('paper_likes')
        .select('paper_id')
        .eq('user_id', this.userId);
      
      // Fetch user's liked books
      const { data: likedBooks, error: likedBooksError } = await supabase
        .from('book_likes')
        .select('book_id')
        .eq('user_id', this.userId);

      if (likedArticlesError || likedPapersError || likedBooksError) {
        console.error('Error fetching liked content:', { likedArticlesError, likedPapersError, likedBooksError });
      } else {
        const allLikedIds = [
          ...(likedArticles?.map(item => this.normalizeId(item.article_id)) || []),
          ...(likedPapers?.map(item => this.normalizeId(item.paper_id)) || []),
          ...(likedBooks?.map(item => this.normalizeId(item.book_id)) || [])
        ];
        this.likedIds = new Set(allLikedIds);
      }

      // Fetch user's saved content
      const { data: savedArticles, error: savedArticlesError } = await supabase
        .from('article_saves')
        .select('article_id')
        .eq('user_id', this.userId);
      
      const { data: savedPapers, error: savedPapersError } = await supabase
        .from('paper_saves')
        .select('paper_id')
        .eq('user_id', this.userId);
      
      const { data: savedBooks, error: savedBooksError } = await supabase
        .from('book_saves')
        .select('book_id')
        .eq('user_id', this.userId);
      
      if (savedArticlesError || savedPapersError || savedBooksError) {
        console.error('Error fetching saved content:', { savedArticlesError, savedPapersError, savedBooksError });
      } else {
        const allSavedIds = [
          ...(savedArticles?.map(item => this.normalizeId(item.article_id)) || []),
          ...(savedPapers?.map(item => this.normalizeId(item.paper_id)) || []),
          ...(savedBooks?.map(item => this.normalizeId(item.book_id)) || [])
        ];
        this.savedIds = new Set(allSavedIds);
      }

      // Fetch user's viewed content
      const { data: viewedContent, error: viewedError } = await supabase
        .from('content_views')
        .select('content_type, content_id')
        .eq('user_id', this.userId);
      
      if (viewedError) {
        console.error('Error fetching viewed content:', viewedError);
      } else {
        const viewedKeys = (viewedContent || []).map(view => `${view.content_type}-${this.normalizeId(view.content_id)}`);
        this.viewedIds = new Set(viewedKeys);
        console.log(`🔍 FeedAlgorithm: Initialized ${this.viewedIds.size} viewed items, ${this.likedIds.size} liked items, ${this.savedIds.size} saved items`);
      }
    } catch (error) {
      console.error('Error in initializeUserInteractions:', error);
    }
  }

  /**
   * Fast fetch method for immediate content display - uses smart caching
   * Use this for initial load to eliminate loading screens
   */
  async fetchArticlesFast(targetCount: number = 2): Promise<FeedItem[]> {
    try {
      // Check if we can use cached articles (not viewed, not expired)
      if (this.canUseFastCache()) {
        const unviewedCache = this.fastFetchCache.filter(item => 
          !this.viewedIds.has(`article-${this.normalizeId(item.id)}`)
        );
        
        if (unviewedCache.length >= targetCount) {
          console.log(`⚡ Fast fetch: Using ${unviewedCache.length} cached unviewed articles`);
          return unviewedCache.slice(0, targetCount);
        }
      }

      // Need to refresh cache - fetch new articles excluding viewed ones
      console.log(`🔄 Fast fetch: Refreshing cache (viewed: ${this.viewedIds.size} articles)`);
      
      // Get articles that haven't been viewed
      const viewedArticleIds = Array.from(this.viewedIds)
        .filter(id => id.startsWith('article-'))
        .map(id => id.replace('article-', ''));
      
      let query = supabase
        .from('articles')
        .select('*')
        .order('created_at', { ascending: false });
        
      // Exclude viewed articles if we have any
      if (viewedArticleIds.length > 0) {
        query = query.not('id', 'in', `(${viewedArticleIds.join(',')})`);
      }
      
      const { data: articles, error: articlesError } = await query.limit(targetCount + 3); // Get extra for cache

      if (articlesError) {
        console.error('Error in fast fetch articles:', articlesError);
        return [];
      }

      // Convert to FeedItem format quickly
      const feedItems = (articles || []).map(item => this.mapToFeedItem({
        ...item,
        type: 'article'
      }));

      // Update cache with fresh unviewed articles
      this.fastFetchCache = feedItems;
      this.fastFetchCacheTimestamp = Date.now();
      this.persistCache();

      // Track the returned items as fetched to avoid duplicates later
      const returnItems = feedItems.slice(0, targetCount);
      returnItems.forEach(item => {
        this.fetchedIds.add(this.normalizeId(item.id));
      });

      console.log(`⚡ Fast fetch: Retrieved ${returnItems.length} fresh articles, cached ${feedItems.length} total`);
      return returnItems;
      
    } catch (error) {
      console.error('Error in fetchArticlesFast:', error);
      return [];
    }
  }

  /**
   * Check if fast fetch cache is still valid and has unviewed content
   */
  private canUseFastCache(): boolean {
    const isNotExpired = Date.now() - this.fastFetchCacheTimestamp < this.FAST_CACHE_TTL;
    const hasContent = this.fastFetchCache.length > 0;
    return isNotExpired && hasContent;
  }

  /**
   * Persist cache to AsyncStorage
   */
  private async persistCache(): Promise<void> {
    try {
      const cacheKey = `${FAST_CACHE_KEY}_${this.userId}`;
      const cacheData = {
        cache: this.fastFetchCache,
        timestamp: this.fastFetchCacheTimestamp
      };
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
      console.log(`💾 AsyncStorage: Persisted cache with ${this.fastFetchCache.length} items`);
    } catch (error) {
      console.error('💾 AsyncStorage: Error persisting cache:', error);
    }
  }

  /**
   * Persist viewed content to AsyncStorage
   */
  private async persistViewedContent(): Promise<void> {
    try {
      const viewedKey = `${VIEWED_CONTENT_KEY}_${this.userId}`;
      const viewedArray = Array.from(this.viewedIds);
      await AsyncStorage.setItem(viewedKey, JSON.stringify(viewedArray));
      console.log(`💾 AsyncStorage: Persisted ${viewedArray.length} viewed items`);
    } catch (error) {
      console.error('💾 AsyncStorage: Error persisting viewed content:', error);
    }
  }

  /**
   * Refresh fast fetch cache in background - call when user scrolls past content
   * or switches tabs to ensure fresh content is ready
   */
  async refreshFastCacheBackground(): Promise<void> {
    try {
      console.log('🔄 Background: Refreshing fast cache...');
      
      // Get articles that haven't been viewed
      const viewedArticleIds = Array.from(this.viewedIds)
        .filter(id => id.startsWith('article-'))
        .map(id => id.replace('article-', ''));
      
      let query = supabase
        .from('articles')
        .select('*')
        .order('created_at', { ascending: false });
        
      // Exclude viewed articles if we have any
      if (viewedArticleIds.length > 0) {
        query = query.not('id', 'in', `(${viewedArticleIds.join(',')})`);
      }
      
      const { data: articles, error } = await query.limit(5); // Cache 5 for instant access

      if (!error && articles) {
        const feedItems = articles.map(item => this.mapToFeedItem({
          ...item,
          type: 'article'
        }));

        this.fastFetchCache = feedItems;
        this.fastFetchCacheTimestamp = Date.now();
        this.persistCache();
        
        console.log(`✅ Background: Fast cache refreshed with ${feedItems.length} fresh articles`);
      } else {
        console.error('Error refreshing fast cache:', error);
      }
    } catch (error) {
      console.error('Error in background cache refresh:', error);
    }
  }

  /**
   * Mark content as viewed and trigger cache refresh if needed
   * Call this when user scrolls past content or switches tabs
   */
  markContentAsViewed(contentId: number | string, contentType: string = 'article'): void {
    const viewKey = `${contentType}-${this.normalizeId(contentId)}`;
    
    if (!this.viewedIds.has(viewKey)) {
      this.viewedIds.add(viewKey);
      console.log(`👁️ Marked as viewed: ${viewKey} (total viewed: ${this.viewedIds.size})`);
      
      // Persist viewed content to AsyncStorage
      this.persistViewedContent().catch(error => {
        console.error('Failed to persist viewed content:', error);
      });
      
      // If user viewed articles from our fast cache, refresh it in background
      if (contentType === 'article' && this.fastFetchCache.some(item => 
        this.normalizeId(item.id) === this.normalizeId(contentId)
      )) {
        console.log('🔄 Triggering background cache refresh (viewed cached content)');
        // Refresh in background without blocking
        this.refreshFastCacheBackground().catch(error => {
          console.error('Background cache refresh failed:', error);
        });
      }
    }
  }

  /**
   * Force refresh fast cache - call on pull-to-refresh or tab changes
   */
  async forceFastCacheRefresh(): Promise<void> {
    console.log('🔄 Force refreshing fast cache...');
    this.fastFetchCacheTimestamp = 0; // Invalidate current cache
    await this.refreshFastCacheBackground();
  }

  /**
   * Proactive cache refresh when navigating away from feed
   * Checks which cached articles have been viewed and replaces them
   */
  async proactiveCacheRefresh(): Promise<void> {
    console.log('🎯 Proactive: Checking cache for viewed articles...');
    
    if (!this.canUseFastCache()) {
      console.log('🎯 Proactive: No valid cache, performing full refresh');
      await this.refreshFastCacheBackground();
      return;
    }

    // Check which cached articles have been viewed
    const unviewedInCache = this.fastFetchCache.filter(item => 
      !this.viewedIds.has(`article-${this.normalizeId(item.id)}`)
    );
    
    const viewedInCache = this.fastFetchCache.filter(item => 
      this.viewedIds.has(`article-${this.normalizeId(item.id)}`)
    );

    console.log(`🎯 Proactive: Cache status - ${unviewedInCache.length} unviewed, ${viewedInCache.length} viewed`);

    // If we have enough unviewed articles, we're good
    if (unviewedInCache.length >= 2) {
      console.log('🎯 Proactive: Cache is fresh, no refresh needed');
      return;
    }

    // Need to fetch replacement articles for viewed ones
    const articlesToFetch = 2 - unviewedInCache.length;
    
    try {
      const viewedArticleIds = Array.from(this.viewedIds)
        .filter(id => id.startsWith('article-'))
        .map(id => id.replace('article-', ''));
      
      // Get fresh articles excluding all viewed ones
      let query = supabase
        .from('articles')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (viewedArticleIds.length > 0) {
        query = query.not('id', 'in', `(${viewedArticleIds.join(',')})`);
      }
      
      const { data: articles, error } = await query.limit(articlesToFetch + 2); // Get extra for buffer

      if (!error && articles) {
        const newFeedItems = articles.map(item => this.mapToFeedItem({
          ...item,
          type: 'article'
        }));

        // Replace cache with combination of unviewed + new articles
        this.fastFetchCache = [...unviewedInCache, ...newFeedItems].slice(0, 5);
        this.fastFetchCacheTimestamp = Date.now();
        this.persistCache();
        
        console.log(`✅ Proactive: Replaced ${articlesToFetch} viewed articles with fresh ones (total cache: ${this.fastFetchCache.length})`);
      } else {
        console.error('🎯 Proactive: Error fetching replacement articles:', error);
      }
    } catch (error) {
      console.error('🎯 Proactive: Exception in cache refresh:', error);
    }
  }

  /**
   * Initialize the algorithm in background after fast fetch
   * This can run while user is reading the first articles
   */
  async initializeInBackground(): Promise<void> {
    try {
      console.log('🔄 Starting background algorithm initialization...');
      await this.initializeUserInteractions();
      console.log('✅ Background algorithm initialization complete');
    } catch (error) {
      console.error('Error in background initialization:', error);
    }
  }

  /**
   * Core algorithm: Implements time-based scoring with content-type balancing
   * Uses decaying time score and weighted content distribution
   */
  async fetchArticles(targetCount: number = 10, excludeInteracted: boolean = true): Promise<FeedItem[]> {
    try {
      await this.initializeUserInteractions();
      
      // Improved algorithm with weighted content type distribution
      const contentTypeWeights = {
        'article': 0.35,  // 35% articles (news, current events)
        'paper': 0.20,    // 20% papers (research, in-depth)
        'book': 0.30,     // 30% books (learning, development)
        'insight': 0.15   // 15% insights (user-generated content)
      };
      
      // Calculate target counts for each content type
      const targetCounts = {
        'article': Math.ceil(targetCount * contentTypeWeights.article),
        'paper': Math.ceil(targetCount * contentTypeWeights.paper),
        'book': Math.ceil(targetCount * contentTypeWeights.book),
        'insight': Math.ceil(targetCount * contentTypeWeights.insight)
      };
      
      // Fetch content with time-based scoring for each type
      const allContent: Array<FetchedContent & { score: number }> = [];
      
      for (const [contentType, targetTypeCount] of Object.entries(targetCounts)) {
        const typeContent = await this.fetchContentWithTimeScoring(
          contentType as 'article' | 'paper' | 'book' | 'insight',
          targetTypeCount * 2, // Fetch more than needed for better selection
          excludeInteracted
        );
        allContent.push(...typeContent);
      }
      
      // Sort by time-weighted score and take the best content
      allContent.sort((a, b) => b.score - a.score);
      
      // Ensure content type diversity by using round-robin selection
      const balancedContent = this.balanceContentTypes(allContent, targetCount, contentTypeWeights);
      
      // Convert to FeedItem format
      const feedItems = balancedContent.map(this.mapToFeedItem);
      
      // Progressive fallback if we didn't get enough content
      if (feedItems.length < Math.max(3, targetCount * 0.5)) {
        console.log(`⚠️ FeedAlgorithm: Only got ${feedItems.length} items, applying fallback strategy...`);
        const fallbackItems = await this.fetchFallbackContent(targetCount - feedItems.length);
        feedItems.push(...fallbackItems);
      }
      
      console.log(`✅ FeedAlgorithm: Returning ${feedItems.length} items (${feedItems.filter(item => item.type === 'article').length} articles, ${feedItems.filter(item => item.type === 'paper').length} papers, ${feedItems.filter(item => item.type === 'book').length} books, ${feedItems.filter(item => item.type === 'insight').length} insights)`);
      return feedItems;
    } catch (error) {
      console.error('Error in fetchArticles:', error);
      return [];
    }
  }

  /**
   * Fallback content fetcher when main algorithm doesn't return enough items
   */
  private async fetchFallbackContent(targetCount: number): Promise<FeedItem[]> {
    try {
      const fallbackItems: FeedItem[] = [];
      const contentTypes: ('article' | 'paper' | 'book')[] = ['article', 'paper', 'book'];
      
      for (const contentType of contentTypes) {
        if (fallbackItems.length >= targetCount) break;
        
        const tableName = contentType === 'paper' ? 'papers' : contentType === 'book' ? 'books' : 'articles';
        
        // First try: Get popular content from any industry, ignoring viewed filter
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .order('likes_count', { ascending: false })
          .limit(Math.ceil(targetCount / 3));

        if (!error && data) {
          const filteredData = data.filter(item => {
            const itemId = this.normalizeId(item.id);
            return !this.fetchedIds.has(itemId); // Only exclude already fetched in this session
          });

          const mappedItems = filteredData.map(item => this.mapToFeedItem({
            ...item,
            type: contentType
          }));

          fallbackItems.push(...mappedItems.slice(0, Math.ceil(targetCount / 3)));
          
          // Track these as fetched
          filteredData.slice(0, Math.ceil(targetCount / 3)).forEach(item => {
            this.fetchedIds.add(this.normalizeId(item.id));
          });
        }
      }
      
      console.log(`🔄 FeedAlgorithm: Fallback strategy returned ${fallbackItems.length} items`);
      return fallbackItems.slice(0, targetCount);
    } catch (error) {
      console.error('Error in fetchFallbackContent:', error);
      return [];
    }
  }

  /**
   * Fetch content with time-based scoring for a specific content type
   */
  private async fetchContentWithTimeScoring(
    contentType: 'article' | 'paper' | 'book' | 'insight',
    targetCount: number,
    excludeInteracted: boolean
  ): Promise<Array<FetchedContent & { score: number }>> {
    const tableName = contentType === 'paper' ? 'papers' : 
                     contentType === 'book' ? 'books' : 
                     contentType === 'insight' ? 'insights' : 'articles';
    const scoredContent: Array<FetchedContent & { score: number }> = [];
    
    try {
      // Handle insights separately since they don't have industries
      if (contentType === 'insight') {
        return await this.fetchInsightsContent(targetCount, excludeInteracted);
      }
      
      // Calculate items per industry for round-robin distribution
      const itemsPerIndustry = Math.ceil(targetCount / this.userIndustries.length);
      
      // Shuffle industries to prevent consistent ordering
      const shuffledIndustries = this.shuffleArray([...this.userIndustries]);
      
      // Collect content from each industry
      const industryContentMap = new Map<string, Array<FetchedContent & { score: number }>>();
      
      for (const industryId of shuffledIndustries) {
        // Get IDs to exclude (viewed content for this content type)
        const viewedIdsToExclude = Array.from(this.viewedIds)
          .filter(viewKey => viewKey.startsWith(`${contentType}-`))
          .map(viewKey => viewKey.replace(`${contentType}-`, ''));
        
        // For insights (UUIDs), keep as strings; for others, convert to integers
        const processedViewedIds = contentType === 'insight' 
          ? viewedIdsToExclude 
          : viewedIdsToExclude.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
        
        // Build query with exclusions
        let query = supabase
          .from(tableName)
          .select('*')
          .order('created_at', { ascending: false })
          .limit(itemsPerIndustry * 4); // Get more options since we're excluding viewed content
        
        // Add industry filter (insights are handled separately)
        query = query.eq('industry_id', industryId);
        
        // Exclude viewed content from the database query itself
        if (processedViewedIds.length > 0) {
          console.log(`🔍 Excluding ${processedViewedIds.length} viewed ${contentType} IDs from DB query:`, processedViewedIds.slice(0, 5));
          query = query.not('id', 'in', `(${processedViewedIds.join(',')})`);
        }
        
        const { data, error } = await query;

        if (error || !data) {
          console.log(`⚠️ FeedAlgorithm: No data for ${contentType} in industry ${industryId}:`, error?.message || 'No data returned');
          continue;
        }

        const filteredData = data.filter(item => {
          const itemId = this.normalizeId(item.id);
          
          // Only apply session-based and interaction filters since viewed content is excluded at DB level
          const isFetched = this.fetchedIds.has(itemId);
          const isLiked = this.likedIds.has(itemId);
          const isSaved = this.savedIds.has(itemId);
          
          if (isFetched) {
            console.log(`🔍 Item ${itemId} FILTERED: already fetched`);
            return false;
          }
          if (excludeInteracted && isLiked) {
            console.log(`🔍 Item ${itemId} FILTERED: liked`);
            return false;
          }
          if (excludeInteracted && isSaved) {
            console.log(`🔍 Item ${itemId} FILTERED: saved`);
            return false;
          }
          
          console.log(`✅ Item ${itemId} PASSES all filters`);
          return true;
        });

        const industryContent = filteredData.map(item => ({
          ...item,
          type: contentType,
          score: this.calculateTimeScore(item)
        }));

        // Sort by score and take the best items from this industry
        industryContent.sort((a, b) => b.score - a.score);
        industryContentMap.set(industryId, industryContent.slice(0, itemsPerIndustry));
        console.log(`📊 FeedAlgorithm: ${contentType} in ${industryId}: ${data.length} total → ${filteredData.length} after filtering → ${industryContent.slice(0, itemsPerIndustry).length} selected`);
        
        // Debug first few items if filtering is happening
        if (data.length > 0 && filteredData.length === 0) {
          console.log(`🔍 DEBUG: Sample IDs from data:`, data.slice(0, 2).map(item => `${this.normalizeId(item.id)} (${typeof item.id})`));
          console.log(`🔍 DEBUG: fetchedIds size: ${this.fetchedIds.size}, first few:`, Array.from(this.fetchedIds).slice(0, 5));
          console.log(`🔍 DEBUG: viewedIds size: ${this.viewedIds.size}, first few:`, Array.from(this.viewedIds).slice(0, 5));
        }
      }

      // Round-robin selection to ensure content diversity
      const maxItemsPerIndustry = Math.max(...Array.from(industryContentMap.values()).map(arr => arr.length));
      
      for (let i = 0; i < maxItemsPerIndustry && scoredContent.length < targetCount; i++) {
        for (const industryId of shuffledIndustries) {
          const industryContent = industryContentMap.get(industryId);
          if (industryContent && industryContent[i] && scoredContent.length < targetCount) {
            scoredContent.push(industryContent[i]);
          }
        }
      }

      // Final shuffle to prevent predictable patterns
      return this.shuffleArray(scoredContent);
    } catch (error) {
      console.error('Error in fetchContentWithTimeScoring:', error);
      return [];
    }
  }

  /**
   * Fetch insights content (separate method since insights don't have industries)
   */
  private async fetchInsightsContent(targetCount: number, excludeInteracted: boolean): Promise<Array<FetchedContent & { score: number }>> {
    try {
      // Fetch viewed insights from insight_views table
      const { data: viewedInsights, error: viewedError } = await supabase
        .from('insight_views')
        .select('insight_id')
        .eq('user_id', this.userId);
      
      if (viewedError) {
        console.error('Error fetching viewed insights:', viewedError);
      }
      
      const viewedInsightIds = (viewedInsights || []).map(view => view.insight_id);

      // Build insights query
      let query = supabase
        .from('insights')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(targetCount * 4) // Get more options for better selection
        .not('author_id', 'eq', this.userId); // Exclude current user's insights

      // Exclude viewed insights using insight_views table data
      if (viewedInsightIds.length > 0) {
        console.log(`🔍 Excluding ${viewedInsightIds.length} viewed insights from DB query:`, viewedInsightIds.slice(0, 5));
        query = query.not('id', 'in', `(${viewedInsightIds.join(',')})`);
      }

      const { data, error } = await query;

      if (error || !data) {
        console.log(`⚠️ FeedAlgorithm: No insights data:`, error?.message || 'No data returned');
        return [];
      }

      // Fetch author information separately
      let processedData = data;
      if (data.length > 0) {
        const authorIds = [...new Set(data.map(item => item.author_id).filter(Boolean))];
        if (authorIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select(`
              id, 
              full_name, 
              avatar_url,
              user_education!user_education_user_id_fkey(
                degree_name,
                field_of_study,
                university_name,
                is_current
              )
            `)
            .in('id', authorIds);
          
          const profileMap = new Map((profiles || []).map(p => [p.id, p]));
          
          processedData = data.map(item => ({
            ...item,
            author_name: profileMap.get(item.author_id)?.full_name || 'Anonymous',
            author_avatar_url: profileMap.get(item.author_id)?.avatar_url
          }));
        }
      }

      // Apply session-based filters
      const filteredData = processedData.filter(item => {
        const itemId = this.normalizeId(item.id);
        
        const isFetched = this.fetchedIds.has(itemId);
        const isLiked = this.likedIds.has(itemId);
        const isSaved = this.savedIds.has(itemId);
        
        if (isFetched) {
          console.log(`🔍 Insight ${itemId} FILTERED: already fetched`);
          return false;
        }
        if (excludeInteracted && isLiked) {
          console.log(`🔍 Insight ${itemId} FILTERED: liked`);
          return false;
        }
        if (excludeInteracted && isSaved) {
          console.log(`🔍 Insight ${itemId} FILTERED: saved`);
          return false;
        }
        
        console.log(`✅ Insight ${itemId} PASSES all filters`);
        return true;
      });

      // Map and score the insights
      const scoredInsights = filteredData.map(item => ({
        ...item,
        type: 'insight' as const,
        title: item.content ? item.content.substring(0, 50) + (item.content.length > 50 ? '...' : '') : '',
        link: `#insight-${item.id}`,
        flag: Number(item.flag) || 0, // Ensure valid integer, prevent NaN
        score: this.calculateTimeScore(item)
      }));

      // Sort by score and return the best ones
      scoredInsights.sort((a, b) => b.score - a.score);
      const selectedInsights = scoredInsights.slice(0, targetCount);

      console.log(`📊 FeedAlgorithm: insights: ${data.length} total → ${filteredData.length} after filtering → ${selectedInsights.length} selected`);

      return selectedInsights;
    } catch (error) {
      console.error('Error in fetchInsightsContent:', error);
      return [];
    }
  }

  /**
   * Calculate time-based score using decaying function
   * Formula: base_score * e^(-decay_rate * hours_old)
   */
  private calculateTimeScore(content: any): number {
    const now = new Date();
    const contentDate = new Date(content.created_at || content.date);
    const hoursOld = (now.getTime() - contentDate.getTime()) / (1000 * 60 * 60);
    
    let baseScore: number;
    let decayRate: number;
    
    if (content.type === 'insight') {
      // Insights use special scoring formula: (likes × 1) + (comments × 2) + (voltz_spent)
      const insightScore = (content.likes_count || 0) + 
                          ((content.comments_count || 0) * 2) + 
                          (content.voltz_spent || 0);
      
      // Normalize to 0-1 range (assuming max reasonable score of 1000)
      baseScore = Math.min(1, insightScore / 1000);
      
      // Insights decay slower than articles but faster than papers
      decayRate = 0.01;
    } else {
      // Standard scoring for other content types
      const engagementScore = Math.min(1, 
        (content.likes_count * 0.4 + content.saves_count * 0.6) / 100
      );
      
      // Base score: engagement (0-1) + quality boost (0.2) 
      baseScore = Math.max(0.2, engagementScore);
      
      // Decay rate: slower decay for papers/books (research content), faster for articles (news)
      decayRate = content.type === 'article' ? 0.02 : 0.005;
    }
    
    // Apply time decay
    const timeScore = baseScore * Math.exp(-decayRate * hoursOld);
    
    return timeScore;
  }

  /**
   * Balance content types using round-robin to prevent clustering
   */
  private balanceContentTypes(
    allContent: Array<FetchedContent & { score: number }>,
    targetCount: number,
    weights: { article: number; paper: number; book: number; insight: number }
  ): FetchedContent[] {
    const contentByType = {
      article: allContent.filter(c => c.type === 'article'),
      paper: allContent.filter(c => c.type === 'paper'),
      book: allContent.filter(c => c.type === 'book'),
      insight: allContent.filter(c => c.type === 'insight')
    };

    const result: FetchedContent[] = [];
    const indices = { article: 0, paper: 0, book: 0, insight: 0 };
    const typeOrder: ('article' | 'paper' | 'book' | 'insight')[] = ['article', 'book', 'insight', 'paper'];

    // Round-robin selection with type weighting
    while (result.length < targetCount) {
      let addedThisRound = false;

      for (const type of typeOrder) {
        if (result.length >= targetCount) break;
        
        // Check if we should add this type based on current distribution
        const currentTypeCount = result.filter(item => item.type === type).length;
        const targetTypeCount = Math.ceil(targetCount * weights[type]);
        
        if (currentTypeCount < targetTypeCount && 
            indices[type] < contentByType[type].length) {
          
          const item = contentByType[type][indices[type]];
          result.push(item);
          this.fetchedIds.add(this.normalizeId(item.id));
          indices[type]++;
          addedThisRound = true;
        }
      }

      // If no items were added this round, break to avoid infinite loop
      if (!addedThisRound) break;
    }

    return result;
  }

  /**
   * Fetch a single content item by type and industry, excluding already fetched/interacted items
   */
  private async fetchContentByTypeAndIndustry(
    type: 'paper' | 'book' | 'article',
    industryId: string,
    excludeInteracted: boolean,
    attemptedIds: Set<string>
  ): Promise<FetchedContent | null> {
    try {
      const tableName = type === 'paper' ? 'papers' : type === 'book' ? 'books' : 'articles';
      
      let query = supabase
        .from(tableName)
        .select('*')
        .eq('industry_id', industryId)
        .order('created_at', { ascending: false })
        .limit(10); // Get multiple options to choose from

      const { data, error } = await query;
      
      if (error) {
        console.error('Database error:', error);
        return null;
      }
      
      if (!data || data.length === 0) {
        return null;
      }
      
      // Filter out content we want to exclude
      const availableContent = data.filter(item => {
        const itemId = this.normalizeId(item.id);
        // Always exclude already fetched items in this session
        if (this.fetchedIds.has(itemId) || attemptedIds.has(itemId)) {
          return false;
        }
        
        // Optionally exclude previously interacted items
        if (excludeInteracted) {
          if (this.likedIds.has(itemId) || this.savedIds.has(itemId)) {
            return false;
          }
        }
        
        return true;
      });

      if (availableContent.length === 0) {
        return null;
      }

      // Return a random item from available options
      const randomIndex = Math.floor(Math.random() * availableContent.length);
      const selectedItem = availableContent[randomIndex];
      
      return {
        ...selectedItem,
        type
      };
    } catch (error) {
      console.error('Error in fetchContentByTypeAndIndustry:', error);
      return null;
    }
  }

  /**
   * Shuffle array using Fisher-Yates algorithm
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Convert FetchedContent to FeedItem format
   */
  private mapToFeedItem = (content: FetchedContent): FeedItem => {
    const baseFields = {
      id: content.id,
      title: content.title,
      link: content.link,
      created_at: content.created_at,
      date: content.date,
      site_name: content.site_name,
      industry_id: content.industry_id,
      likes_count: content.likes_count || 0,
      saves_count: content.saves_count || 0,
      comments_count: content.comments_count || 0,
      views_count: content.views_count || 0,
    };

    switch (content.type) {
      case 'article':
        return {
          ...baseFields,
          type: 'article',
          summary: content.summary || '',
          author: content.author,
        } as Article;
      
      case 'paper':
        return {
          ...baseFields,
          type: 'paper',
          content_simple: content.content_simple || '',
          content_complex: content.content_complex || '',
          authors: content.authors || [],
        } as Paper;
      
      case 'book':
        return {
          ...baseFields,
          type: 'book',
          author: content.author || '',
          year: content.year,
          short_summary: content.short_summary || '',
          key_insights: content.key_insights,
        } as Book;
      
      case 'insight':
        return {
          id: String(content.id), // Ensure string ID for insights
          type: 'insight',
          content: content.content || '',
          title: content.content ? content.content.substring(0, 50) + (content.content.length > 50 ? '...' : '') : '',
          author: {
            name: content.author_name || 'Anonymous',
            handle: `@${(content.author_name || 'anonymous').toLowerCase().replace(/\s+/g, '')}`,
            avatar: content.author_avatar_url || '',
            role: '',
            company: '',
            industry: '',
            location: '',
            currentProject: '',
            projectTags: []
          },
          likes_count: content.likes_count || 0,
          comments_count: content.comments_count || 0,
          saves_count: 0, // Insights don't have saves yet
          views_count: content.views_count || 0,
          created_at: content.created_at,
          link: `#insight-${content.id}` // Placeholder link
        } as any; // Using any to match FeedItem union constraints
      
      default:
        throw new Error(`Unknown content type: ${content.type}`);
    }
  };

  /**
   * Fetch a specific content item by ID and type
   */
  async fetchSpecificContent(contentId: number | string, contentType: 'article' | 'paper' | 'book' | 'insight'): Promise<FeedItem | null> {
    try {
      // Check for preloaded content first for instant display
      const preloadedContent = feedContentPreloader.getCachedContent(contentId, contentType);
      if (preloadedContent) {
        console.log(`⚡ FeedAlgorithm: Using preloaded ${contentType} ${contentId}`);
        
        // Add to fetched IDs to avoid duplicates in regular feed
        this.fetchedIds.add(this.normalizeId(contentId));
        
        // Convert to FeedItem format
        return this.mapToFeedItem({
          ...preloadedContent,
          type: contentType
        });
      }

      console.log(`🔄 FeedAlgorithm: Fetching ${contentType} ${contentId} from database`);
      
      const tableName = contentType === 'paper' ? 'papers' : 
                        contentType === 'book' ? 'books' : 
                        contentType === 'insight' ? 'insights' : 'articles';
      
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', contentId)
        .limit(1);

      if (error) {
        console.error('Database error in fetchSpecificContent:', error);
        return null;
      }

      if (!data || data.length === 0) {
        console.log(`No content found with ID ${contentId} in ${tableName}`);
        return null;
      }
      
      const contentItem = data[0]; // Get first (and should be only) item

      // Ensure interaction counters are accurate on first load by reading from join tables
      const likesTable = contentType === 'paper' ? 'paper_likes' : 
                         contentType === 'book' ? 'book_likes' : 
                         contentType === 'insight' ? 'insight_likes' : 'article_likes';
      const savesTable = contentType === 'paper' ? 'paper_saves' : 
                        contentType === 'book' ? 'book_saves' : 
                        contentType === 'insight' ? 'insight_saves' : 'article_saves';
      const commentsTable = contentType === 'paper' ? 'paper_comments' : 
                           contentType === 'book' ? 'book_comments' : 
                           contentType === 'insight' ? 'insight_comments' : 'comments';
      const idField = contentType === 'paper' ? 'paper_id' : 
                     contentType === 'book' ? 'book_id' : 
                     contentType === 'insight' ? 'insight_id' : 'article_id';

      const [likesCountRes, savesCountRes, commentsCountRes] = await Promise.all([
        supabase.from(likesTable).select('*', { count: 'exact', head: true }).eq(idField, contentId),
        supabase.from(savesTable).select('*', { count: 'exact', head: true }).eq(idField, contentId),
        supabase.from(commentsTable).select('*', { count: 'exact', head: true }).eq(idField, contentId),
      ]);

      const safeLikes = (likesCountRes.count as number | null) ?? contentItem.likes_count ?? 0;
      const safeSaves = (savesCountRes.count as number | null) ?? contentItem.saves_count ?? 0;
      const safeComments = (commentsCountRes.count as number | null) ?? contentItem.comments_count ?? 0;

      let hydratedData = {
        ...contentItem,
        likes_count: safeLikes,
        saves_count: safeSaves,
        comments_count: safeComments,
      };

      // For insights, fetch author information
      if (contentType === 'insight' && contentItem.author_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .eq('id', contentItem.author_id)
          .maybeSingle();
        
        if (profile) {
          hydratedData = {
            ...hydratedData,
            author: {
              name: profile.full_name || 'Anonymous',
              handle: '@' + (profile.full_name?.toLowerCase().replace(/\s+/g, '') || 'anonymous'),
              avatar: profile.avatar_url || '',
              role: '', 
              company: '', 
              industry: '', 
              location: '', 
              currentProject: '',
              projectTags: []
            }
          };
        }
      }

      // Initialize user interactions if not already done
      if (this.likedIds.size === 0 && this.savedIds.size === 0 && this.userId) {
        await this.initializeUserInteractions();
      }
      
      // Add to fetched IDs to avoid duplicates in regular feed
      this.fetchedIds.add(this.normalizeId(contentItem.id));
      
      // Convert to FeedItem format
      const feedItem = this.mapToFeedItem({
        ...hydratedData,
        type: contentType
      });
      
      // Cache the content for future instant display
      feedContentPreloader.preloadContent(contentId, contentType).catch(error => {
        console.error(`Error caching fetched content ${contentType} ${contentId}:`, error);
      });
      
      return feedItem;
    } catch (error) {
      console.error('Exception in fetchSpecificContent:', error);
      return null;
    }
  }

  /**
   * Legacy method for backward compatibility
   */
  async fetchSpecificArticle(articleId: number): Promise<FeedItem | null> {
    // Try to fetch from articles table first, then papers, then books
    const types: ('article' | 'paper' | 'book')[] = ['article', 'paper', 'book'];
    
    for (const type of types) {
      const result = await this.fetchSpecificContent(articleId, type);
      if (result) {
        return result;
      }
    }
    
    return null;
  }

  /**
   * Reset the algorithm state for fresh fetch (pull-to-refresh)
   */
  reset(): void {
    this.fetchedIds.clear();
    // Keep liked, saved, and viewed IDs as they represent persistent user interactions
    // Note: We don't clear viewedIds because we don't want to show already seen content again
  }

  /**
   * Update user interaction tracking when user likes/saves content
   */
  updateUserInteraction(contentId: number, action: 'like' | 'save' | 'unlike' | 'unsave'): void {
    const normalizedId = this.normalizeId(contentId);
    switch (action) {
      case 'like':
        this.likedIds.add(normalizedId);
        break;
      case 'unlike':
        this.likedIds.delete(normalizedId);
        break;
      case 'save':
        this.savedIds.add(normalizedId);
        break;
      case 'unsave':
        this.savedIds.delete(normalizedId);
        break;
    }
  }

  /**
   * Get current state summary for debugging
   */
  getState() {
    return {
      fetchedIds: Array.from(this.fetchedIds),
      likedIds: Array.from(this.likedIds),
      savedIds: Array.from(this.savedIds),
      userIndustries: this.userIndustries,
    };
  }
} 