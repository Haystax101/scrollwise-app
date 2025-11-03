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
      }
    } catch (error) {
      console.error('FeedManager: Error loading viewed content:', error);
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
    } catch (error) {
      console.error('FeedManager: Error saving viewed content:', error);
    }
  }

  /**
   * Fetch fresh content with simple deduplication
   * PRIORITY: Content with slides first, then regular content
   */
  async fetchContent(targetCount: number = 10): Promise<FeedItem[]> {
    try {
      const allContent: FeedItem[] = [];

      // STEP 1: Prioritize content with slides
      const contentWithSlides = await this.fetchContentWithSlides(targetCount);
      allContent.push(...contentWithSlides);

      // STEP 2: If we don't have enough items, fetch regular content
      const remainingCount = targetCount - allContent.length;
      if (remainingCount > 0) {
        const distribution = [
          { type: 'article' as const, count: Math.ceil(remainingCount * 0.4) },
          { type: 'paper' as const, count: Math.ceil(remainingCount * 0.3) },
          { type: 'insight' as const, count: Math.ceil(remainingCount * 0.3) }
        ];

        for (const { type, count } of distribution) {
          const items = await this.fetchContentByType(type, count);
          // Filter out items that already have slides to prevent duplicates
          const itemsWithoutSlides = items.filter(item => !(item as any).hasSlides);
          allContent.push(...itemsWithoutSlides);
        }
      }

      const shuffled = this.shuffleArray(allContent);
      return shuffled.slice(0, targetCount);
    } catch (error) {
      console.error('FeedManager: Error in fetchContent:', error);
      return [];
    }
  }

  /**
   * Fetch content that has slides from content_slides table
   * Now queries content_slides directly with all metadata (self-sufficient)
   */
  private async fetchContentWithSlides(limit: number): Promise<FeedItem[]> {
    try {
      // Fetch more than we need to account for filtering
      const { data: slidesData, error } = await supabase
        .from('content_slides')
        .select('*')
        .in('content_type', ['article', 'paper'])
        .in('industry_id', this.userIndustries)
        .order('generated_at', { ascending: false })
        .limit(limit * 2); // Fetch 2x to account for filtering

      if (error || !slidesData || slidesData.length === 0) {
        return [];
      }

      console.log(`📊 ContentCard: Found ${slidesData.length} items with slides`);

      // Filter out viewed content using the standard view key format
      const unviewedSlides = slidesData.filter((slide: any) => {
        const viewKey = `${slide.content_type}-${slide.content_id}`;
        return !this.viewedContentIds.has(viewKey);
      });

      console.log(`📊 ContentCard: ${unviewedSlides.length} unviewed items with slides after filtering`);

      const allItems: FeedItem[] = unviewedSlides.map((slide: any) => {
        const feedItem: any = {
          id: slide.content_id,
          type: slide.content_type,
          title: slide.title,
          link: slide.link,
          created_at: slide.generated_at,
          date: slide.date,
          site_name: slide.site_name,
          industry_id: slide.industry_id,
          likes_count: slide.likes_count || 0,
          saves_count: slide.saves_count || 0,
          comments_count: slide.comments_count || 0,
          views_count: slide.views_count || 0,
          hasSlides: true,
          slidesId: slide.id,
          category: slide.category,
        };

        if (slide.content_type === 'article') {
          feedItem.summary = slide.slides_text[0] || '';
          feedItem.author = slide.authors?.[0];
        } else if (slide.content_type === 'paper') {
          feedItem.content_simple = slide.slides_text[0] || '';
          feedItem.content_complex = slide.slides_text[1] || '';
          feedItem.authors = slide.authors || [];
        }

        return feedItem;
      });

      return allItems.slice(0, limit);
    } catch (error) {
      console.error('FeedManager: Error fetching content with slides:', error);
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
      // For insights, always use the original method to ensure proper profile joins
      // The RPC function may not properly join with profiles table
      if (contentType === 'insight') {
        return await this.fetchContentByTypeOriginal(contentType, count);
      }

      // Use RPC function for other content types
      const { data, error } = await supabase.rpc('get_unviewed_content_by_type', {
        p_user_id: this.userId,
        p_content_type: contentType,
        p_industry_ids: this.userIndustries,
        p_limit: count * 3 // Get extra in case some fail conversion
      });

      if (error) {
        console.error(`FeedManager: RPC error for ${contentType}:`, error);
        // Fallback to original method if RPC doesn't exist yet
        return this.fetchContentByTypeOriginal(contentType, count);
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Check which content has slides
      // Convert IDs to integers since content_slides.content_id is integer type
      const contentIds = data.map((item: any) => parseInt(item.id, 10));

      const { data: slidesData, error: slidesError } = await supabase
        .from('content_slides')
        .select('content_id')
        .eq('content_type', contentType)
        .in('content_id', contentIds);

      if (slidesError) {
        console.error(`FeedManager: Error fetching slides:`, slidesError);
      }

      const contentWithSlidesIds = new Set(slidesData?.map(s => s.content_id) || []);

      // Convert to FeedItem format - no client-side filtering needed since DB already filtered
      const feedItems = data.slice(0, count).map((item: any) => {
        const feedItem = this.convertToFeedItem(item, contentType);
        // Mark if this item has slides (compare as integer)
        if (contentType === 'article' || contentType === 'paper') {
          (feedItem as any).hasSlides = contentWithSlidesIds.has(parseInt(item.id, 10));
        }
        return feedItem;
      });

      return feedItems;
    } catch (error) {
      console.error(`FeedManager: Exception in fetchContentByType for ${contentType}:`, error);
      return [];
    }
  }

  /**
   * Fallback method - original client-side filtering approach
   */
  private async fetchContentByTypeOriginal(
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
          .neq('author_id', this.userId)
          .order('created_at', { ascending: false })
          .limit(count * 5); // Get more to account for filtering
      } else {
        const tableName = contentType === 'paper' ? 'papers' :
                         contentType === 'book' ? 'books' : 'articles';

        query = supabase
          .from(tableName)
          .select('*')
          .in('industry_id', this.userIndustries)
          .order('created_at', { ascending: false })
          .limit(count * 5);
      }

      const { data, error } = await query;

      if (error || !data) {
        console.error(`FeedManager: Fallback query error for ${contentType}:`, error);
        return [];
      }

      // Filter out viewed content client-side
      const viewedKeys = Array.from(this.viewedContentIds);

      const unviewedData = data.filter((item: any) => {
        const itemKey = `${contentType}-${item.id}`;
        return !viewedKeys.includes(itemKey);
      });

      const feedItems = unviewedData.slice(0, count).map((item: any) =>
        this.convertToFeedItem(item, contentType)
      );

      return feedItems;
    } catch (error) {
      console.error(`FeedManager: Fallback error for ${contentType}:`, error);
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
          longer_summary: data.longer_summary,
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

        // Improved fallback logic - try to get name from different sources
        let authorName = 'User'; // Better fallback than 'Anonymous'
        if (profile?.full_name) {
          authorName = profile.full_name;
        }

        return {
          id: String(data.id),
          type: 'insight',
          content: data.content || '',
          title: data.content ? data.content.substring(0, 50) + '...' : '',
          author: {
            name: authorName,
            handle: `@${authorName.toLowerCase().replace(/\s+/g, '')}`,
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
  async markAsViewed(contentId: string | number, contentType: string, contentItem?: FeedItem): Promise<void> {
    const viewKey = `${contentType}-${contentId}`;

    if (!this.viewedContentIds.has(viewKey)) {
      this.viewedContentIds.add(viewKey);

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
        console.error('FeedManager: Error recording view in database:', error);
      }
    }
  }

  /**
   * Fetch specific content by ID and type with fresh interaction counts
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

      if (error) {
        console.error(`FeedManager: Query error for ${contentType} ${contentId}:`, error);
        return null;
      }

      if (!data) {
        return null;
      }

      // Fetch fresh interaction counts from interaction tables
      const likesTable = contentType === 'insight' ? 'user_insights_likes' : `user_${contentType}_likes`;
      const savesTable = contentType === 'insight' ? 'user_insights_saves' : `user_${contentType}_saves`;
      const commentsTable = contentType === 'insight' ? 'user_insights_comments' : `user_${contentType}_comments`;
      const idField = contentType === 'paper' ? 'paper_id' :
                     contentType === 'book' ? 'book_id' :
                     contentType === 'insight' ? 'insight_id' : 'article_id';

      const [likesCountRes, savesCountRes, commentsCountRes] = await Promise.all([
        supabase.from(likesTable).select('*', { count: 'exact', head: true }).eq(idField, contentId),
        contentType === 'insight'
          ? Promise.resolve({ count: 0 }) // Insights don't have saves yet
          : supabase.from(savesTable).select('*', { count: 'exact', head: true }).eq(idField, contentId),
        supabase.from(commentsTable).select('*', { count: 'exact', head: true }).eq(idField, contentId),
      ]);

      const freshLikes = (likesCountRes.count as number | null) ?? data.likes_count ?? 0;
      const freshSaves = contentType === 'insight' ? 0 : ((savesCountRes.count as number | null) ?? data.saves_count ?? 0);
      const freshComments = (commentsCountRes.count as number | null) ?? data.comments_count ?? 0;

      // Update data with fresh counts
      const dataWithFreshCounts = {
        ...data,
        likes_count: freshLikes,
        saves_count: freshSaves,
        comments_count: freshComments,
      };

      return this.convertToFeedItem(dataWithFreshCounts, contentType);
    } catch (error) {
      console.error(`FeedManager: Exception fetching specific ${contentType} ${contentId}:`, error);
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
    } catch (error) {
      console.error('FeedManager: Error clearing viewed content:', error);
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
  getDebugInfo(): {
    viewedCount: number;
    userIndustries: string[];
  } {
    return {
      viewedCount: this.viewedContentIds.size,
      userIndustries: this.userIndustries
    };
  }
}