import { supabase } from './supabase';
import type { FeedItem, Article, Paper, Book, Industry, Insight } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Simple, reliable FeedManager - replaces complex feedAlgorithm.ts
 * Core principles: 
 * - Single responsibility: content fetching
 * - No complex caching logic
 * - Simple viewed content tracking
 * - Predictable behavior over performance
 */
export class FeedManager {
  private userId: string;
  private userIndustries: string[];
  private allIndustries: Industry[];
  private viewedContentIds: Set<string> = new Set();
  
  constructor(userId: string, userIndustries: string[], allIndustries: Industry[]) {
    this.userId = userId;
    this.userIndustries = userIndustries;
    this.allIndustries = allIndustries;
    
    // Load viewed content from AsyncStorage (simple persistence)
    this.loadViewedContent();
  }

  /**
   * Load viewed content from AsyncStorage - simple and reliable
   */
  private async loadViewedContent(): Promise<void> {
    try {
      const viewedKey = `viewed_content_${this.userId}`;
      const viewedData = await AsyncStorage.getItem(viewedKey);
      
      if (viewedData) {
        const viewedArray = JSON.parse(viewedData);
        this.viewedContentIds = new Set(viewedArray);
        console.log(`📱 FeedManager: Loaded ${this.viewedContentIds.size} viewed items from AsyncStorage`);
      }
    } catch (error) {
      console.error('📱 FeedManager: Error loading viewed content:', error);
    }
  }

  /**
   * Save viewed content to AsyncStorage - simple persistence
   */
  private async saveViewedContent(): Promise<void> {
    try {
      const viewedKey = `viewed_content_${this.userId}`;
      const viewedArray = Array.from(this.viewedContentIds);
      await AsyncStorage.setItem(viewedKey, JSON.stringify(viewedArray));
      console.log(`📱 FeedManager: Saved ${viewedArray.length} viewed items to AsyncStorage`);
    } catch (error) {
      console.error('📱 FeedManager: Error saving viewed content:', error);
    }
  }

  /**
   * Fetch fresh content with simple deduplication
   * No complex caching - always fetch from database
   */
  async fetchContent(targetCount: number = 10): Promise<FeedItem[]> {
    try {
      console.log(`📡 FeedManager: Fetching ${targetCount} fresh items`);
      
      const allContent: FeedItem[] = [];
      
      // Define content type distribution
      const distribution = [
        { type: 'article' as const, count: Math.ceil(targetCount * 0.4) },
        { type: 'paper' as const, count: Math.ceil(targetCount * 0.2) },
        { type: 'book' as const, count: Math.ceil(targetCount * 0.25) },
        { type: 'insight' as const, count: Math.ceil(targetCount * 0.15) }
      ];

      // Fetch each content type
      for (const { type, count } of distribution) {
        const items = await this.fetchContentByType(type, count);
        allContent.push(...items);
      }

      // Shuffle for variety and return requested count
      const shuffled = this.shuffleArray(allContent);
      const result = shuffled.slice(0, targetCount);
      
      console.log(`📡 FeedManager: Retrieved ${result.length} items (${result.filter(i => i.type === 'article').length} articles, ${result.filter(i => i.type === 'paper').length} papers, ${result.filter(i => i.type === 'book').length} books, ${result.filter(i => i.type === 'insight').length} insights)`);
      
      return result;
    } catch (error) {
      console.error('📡 FeedManager: Error in fetchContent:', error);
      return [];
    }
  }

  /**
   * Fetch content of a specific type with simple exclusion logic
   */
  private async fetchContentByType(
    contentType: 'article' | 'paper' | 'book' | 'insight', 
    count: number
  ): Promise<FeedItem[]> {
    try {
      let query: any;
      
      // Handle insights separately (no industry filtering)
      if (contentType === 'insight') {
        query = supabase
          .from('insights')
          .select(`
            *,
            profiles:author_id (
              full_name,
              avatar_url
            )
          `)
          .neq('author_id', this.userId) // Don't show user's own insights
          .order('created_at', { ascending: false })
          .limit(count * 3); // Get extra for filtering
      } else {
        // Standard content types with industry filtering
        const tableName = contentType === 'paper' ? 'papers' : 
                         contentType === 'book' ? 'books' : 'articles';
        
        query = supabase
          .from(tableName)
          .select('*')
          .in('industry_id', this.userIndustries)
          .order('created_at', { ascending: false })
          .limit(count * 3); // Get extra for filtering
      }

      const { data, error } = await query;

      if (error || !data) {
        console.log(`📡 FeedManager: No ${contentType} data:`, error?.message);
        return [];
      }

      // Filter out viewed content - simple and reliable
      const viewedKeys = Array.from(this.viewedContentIds);
      const unviewedData = data.filter(item => {
        const itemKey = `${contentType}-${item.id}`;
        return !viewedKeys.includes(itemKey);
      });

      // Convert to FeedItem format
      const feedItems = unviewedData.slice(0, count).map(item => 
        this.convertToFeedItem(item, contentType)
      );

      return feedItems;
    } catch (error) {
      console.error(`📡 FeedManager: Error fetching ${contentType}:`, error);
      return [];
    }
  }

  /**
   * Convert database item to FeedItem format - simple and reliable
   */
  private convertToFeedItem(data: any, type: 'article' | 'paper' | 'book' | 'insight'): FeedItem {
    const baseItem = {
      id: data.id,
      type,
      link: data.link || '#',
      likes_count: data.likes_count || 0,
      saves_count: data.saves_count || 0,
      comments_count: data.comments_count || 0,
      views_count: data.views_count || 0,
      created_at: data.created_at,
      industry_id: data.industry_id
    };

    switch (type) {
      case 'article':
        return {
          ...baseItem,
          title: data.title || '',
          summary: data.summary || '',
          author: data.author || '',
          date: data.date,
          site_name: data.site_name
        } as Article;

      case 'paper':
        return {
          ...baseItem,
          title: data.title || '',
          content_simple: data.content_simple || '',
          content_complex: data.content_complex || '',
          authors: data.authors || [],
          date: data.date,
          site_name: data.site_name
        } as Paper;

      case 'book':
        return {
          ...baseItem,
          title: data.title || '',
          author: data.author || '',
          year: data.year,
          short_summary: data.short_summary || '',
          key_insights: data.key_insights || [],
          date: data.date,
          site_name: data.site_name
        } as Book;

      case 'insight':
        const profile = data.profiles;
        return {
          id: String(data.id),
          type: 'insight',
          content: data.content || '',
          title: data.content ? data.content.substring(0, 50) + '...' : '',
          author: {
            name: profile?.full_name || 'Anonymous',
            handle: `@${(profile?.full_name || 'anonymous').toLowerCase().replace(/\s+/g, '')}`,
            avatar: profile?.avatar_url || '',
            role: '',
            company: '',
            industry: '',
            location: '',
            currentProject: '',
            projectTags: []
          },
          likes_count: data.likes_count || 0,
          comments_count: data.comments_count || 0,
          saves_count: 0,
          views_count: data.views_count || 0,
          created_at: data.created_at,
          link: `#insight-${data.id}`
        } as any;

      default:
        throw new Error(`Unknown content type: ${type}`);
    }
  }

  /**
   * Mark content as viewed - simple tracking
   */
  async markAsViewed(contentId: string | number, contentType: string): Promise<void> {
    const viewKey = `${contentType}-${contentId}`;
    
    if (!this.viewedContentIds.has(viewKey)) {
      this.viewedContentIds.add(viewKey);
      console.log(`👁️ FeedManager: Marked as viewed: ${viewKey} (total: ${this.viewedContentIds.size})`);
      
      // Save to AsyncStorage
      await this.saveViewedContent();
      
      // Record view in database
      try {
        await supabase.rpc('record_content_view', {
          p_user_id: this.userId,
          p_content_type: contentType,
          p_content_id: contentId,
          p_view_duration: 3
        });
      } catch (error) {
        console.error('📡 FeedManager: Error recording view in database:', error);
      }
    }
  }

  /**
   * Fetch specific content by ID and type
   */
  async fetchSpecificContent(contentId: string | number, contentType: 'article' | 'paper' | 'book' | 'insight'): Promise<FeedItem | null> {
    try {
      const tableName = contentType === 'paper' ? 'papers' : 
                       contentType === 'book' ? 'books' : 
                       contentType === 'insight' ? 'insights' : 'articles';

      let query: any;
      
      if (contentType === 'insight') {
        query = supabase
          .from('insights')
          .select(`
            *,
            profiles:author_id (
              full_name,
              avatar_url
            )
          `)
          .eq('id', contentId)
          .single();
      } else {
        query = supabase
          .from(tableName)
          .select('*')
          .eq('id', contentId)
          .single();
      }

      const { data, error } = await query;

      if (error || !data) {
        console.log(`📡 FeedManager: Content not found: ${contentType} ${contentId}`);
        return null;
      }

      return this.convertToFeedItem(data, contentType);
    } catch (error) {
      console.error(`📡 FeedManager: Error fetching specific ${contentType}:`, error);
      return null;
    }
  }

  /**
   * Clear all viewed content - reset function
   */
  async clearViewedContent(): Promise<void> {
    try {
      this.viewedContentIds.clear();
      const viewedKey = `viewed_content_${this.userId}`;
      await AsyncStorage.removeItem(viewedKey);
      console.log('🧹 FeedManager: Cleared all viewed content');
    } catch (error) {
      console.error('📡 FeedManager: Error clearing viewed content:', error);
    }
  }

  /**
   * Simple array shuffle - Fisher-Yates algorithm
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
   * Get debug info
   */
  getDebugInfo(): { viewedCount: number; userIndustries: string[] } {
    return {
      viewedCount: this.viewedContentIds.size,
      userIndustries: this.userIndustries
    };
  }
}