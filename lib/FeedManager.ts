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
  private blockedUserIds: Set<string> = new Set();

  constructor(userId: string, userIndustries: string[], allIndustries: Industry[]) {
    this.userId = userId;
    this.userIndustries = userIndustries;
    this.allIndustries = allIndustries;

    // Load viewed content from AsyncStorage (simple persistence)
    this.loadViewedContent();
    // Load blocked users
    this.loadBlockedUsers();
  }

  /**
   * Load blocked user IDs from database
   */
  private async loadBlockedUsers(): Promise<void> {
    try {
      const { data, error } = await supabase.rpc('get_blocked_user_ids');

      if (error) {
        console.error('FeedManager: Error loading blocked users:', error);
        return;
      }

      if (data && Array.isArray(data)) {
        this.blockedUserIds = new Set(data);
        console.log(`FeedManager: Loaded ${data.length} blocked users`);
      }
    } catch (error) {
      console.error('FeedManager: Error loading blocked users:', error);
    }
  }

  /**
   * Refresh blocked users list (call after blocking/unblocking)
   */
  async refreshBlockedUsers(): Promise<void> {
    await this.loadBlockedUsers();
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
   * Fetch fresh content with articles prioritized at the top
   * PRIORITY: Articles first, then papers and insights shuffled together
   */
  async fetchContent(targetCount: number = 10): Promise<FeedItem[]> {
    try {
      const allContent: FeedItem[] = [];

      // STEP 1: Fetch ARTICLES FIRST (40% of target)
      const articlesCount = Math.ceil(targetCount * 0.4);
      const articles = await this.fetchContentByType('article', articlesCount);
      allContent.push(...articles);

      // STEP 2: Fetch other content types
      const remainingCount = targetCount - articles.length;
      if (remainingCount > 0) {
        const otherContent: FeedItem[] = [];

        // Fetch papers (50% of remaining ≈ 30% of original)
        const papersCount = Math.ceil(remainingCount * 0.5);
        const papers = await this.fetchContentByType('paper', papersCount);
        otherContent.push(...papers);

        // Fetch insights (remainder ≈ 30% of original)
        // REMOVED: Insights now only appear in Community Feed
        // const insightsCount = remainingCount - papers.length;
        // const insights = await this.fetchContentByType('insight', insightsCount);
        // otherContent.push(...insights);

        // SHUFFLE only non-article content
        const shuffledOthers = this.shuffleArray(otherContent);
        allContent.push(...shuffledOthers);
      }

      // Fetch social context for all items
      await this.fetchSocialContext(allContent);

      return allContent.slice(0, targetCount);
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
        .in('content_type', ['article', 'paper', 'video', 'podcast'])
        .in('industry_id', this.userIndustries)
        .order('generated_at', { ascending: false })
        .limit(limit * 2); // Fetch 2x to account for filtering

      if (error || !slidesData || slidesData.length === 0) {
        return [];
      }

      console.log(`ContentCard: Found ${slidesData.length} items with slides`);

      // Filter out viewed content using the standard view key format
      const unviewedSlides = slidesData.filter((slide: any) => {
        const viewKey = `${slide.content_type}-${slide.content_id}`;
        return !this.viewedContentIds.has(viewKey);
      });

      console.log(`ContentCard: ${unviewedSlides.length} unviewed items with slides after filtering`);

      // Map slides to feed items
      // Note: Interaction counts start at 0 and update via optimistic UI in ContentCard
      // TODO: Implement efficient count fetching from content_* tables (RPC function)
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
          likes_count: 0, // Will be updated by optimistic UI when user interacts
          saves_count: 0, // Will be updated by optimistic UI when user interacts
          comments_count: 0, // TODO: Fetch from content_comments table
          views_count: slide.views_count || 0,
          hasSlides: true,
          slidesId: slide.id,
          category: slide.category,
        };

        if (slide.content_type === 'article' || slide.content_type === 'video' || slide.content_type === 'podcast') {
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
      // Use fallback method to get all fields including animation_code
      return await this.fetchContentByTypeOriginal(contentType, count);
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
              avatar_url,
              tagline
            )
          `)
          // Filter out own insights for Community Feed
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

      console.log(`FeedManager: Fetched ${data.length} ${contentType} items from database`);

      // Filter out viewed content client-side for all content types
      const viewedKeys = Array.from(this.viewedContentIds);

      const unviewedData = data.filter((item: any) => {
        const itemKey = `${contentType}-${item.id}`;
        // Filter out viewed content
        if (viewedKeys.includes(itemKey)) {
          console.log(`FeedManager: Filtering out viewed content: ${itemKey}`);
          return false;
        }
        // Filter out blocked users for insights
        if (contentType === 'insight' && this.blockedUserIds.has(item.author_id)) return false;

        // Debug logging for insight filtering
        if (contentType === 'insight' && item.author_id === this.userId) {
          console.log(`FeedManager: Filtering out OWN insight: ${item.id} (author: ${item.author_id})`);
          return false;
        } else if (contentType === 'insight' && item.author_id === this.userId) {
          // Case where it slipped through via some other equality check failure?
          console.error(`FeedManager: OWN insight slipped through preliminary filter: ${item.id}`);
        }

        return true;
      });

      console.log(`FeedManager: Returning ${unviewedData.length} unique ${contentType} items after filtering`);

      let finalData = unviewedData;

      // If we don't have enough unviewed content, backfill with viewed content
      if (unviewedData.length < count) {
        const needed = count - unviewedData.length;
        console.log(`FeedManager: Not enough new ${contentType} items. Need ${needed} more. Backfilling...`);

        // Find items that WERE filtered out (viewed previously)
        const viewedItems = data.filter((item: any) => {
          const itemKey = `${contentType}-${item.id}`;
          return viewedKeys.includes(itemKey) &&
            !(contentType === 'insight' && this.blockedUserIds.has(item.author_id)) &&
            !(contentType === 'insight' && item.author_id === this.userId);
        });

        // Shuffle the viewed items so the recycled feed doesn't feel stagnant
        const shuffledViewedItems = this.shuffleArray(viewedItems);

        // Append needed items
        finalData = [...unviewedData, ...shuffledViewedItems.slice(0, needed)];
      }

      const feedItems = finalData.slice(0, count).map((item: any) =>
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
        const article = {
          ...baseItem,
          title: data.title || '',
          summary: data.summary || '',
          longer_summary: data.longer_summary,
          author: data.author || '',
          date: data.date,
          site_name: data.site_name,
          animation_code: data.animation_code,
          storyboard: data.storyboard,
          special: data.special,
          narrative_code: data.narrative_code,
          image_url: data.image_url,
          colour: data.colour
        } as Article;

        console.log(`FeedManager: Converted article ${data.id} to FeedItem:`, {
          id: article.id,
          hasAnimationCode: !!article.animation_code,
          hasNarrativeCode: !!article.narrative_code,
          narrativeCodeCount: article.narrative_code?.length || 0,
          animationCodeLength: article.animation_code?.length || 0,
          animationCodePreview: article.animation_code?.substring(0, 100)
        });

        return article;

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
          image_url: data.image_url, // Map image_url
          author: {
            name: authorName,
            handle: `@${authorName.toLowerCase().replace(/\s+/g, '')}`,
            avatar: profile?.avatar_url || '',
            tagline: profile?.tagline || '',
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
              avatar_url,
              tagline
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
   * Fetch social context (friend likes) for feed items
   */
  async fetchSocialContext(items: FeedItem[]): Promise<void> {
    if (!items || items.length === 0) return;

    const articleIds: number[] = [];
    const paperIds: number[] = [];
    const bookIds: number[] = [];
    const insightIds: number[] = [];
    const videoIds: number[] = [];
    const podcastIds: number[] = [];

    items.forEach(item => {
      const id = typeof item.id === 'string' ? parseInt(item.id, 10) : item.id;
      if (isNaN(id)) return;

      switch (item.type) {
        case 'article': articleIds.push(id); break;
        case 'paper': paperIds.push(id); break;
        case 'book': bookIds.push(id); break;
        case 'insight': insightIds.push(id); break;
        case 'video': videoIds.push(id); break;
        case 'podcast': podcastIds.push(id); break;
      }
    });

    try {
      const { data, error } = await supabase.rpc('get_feed_social_context', {
        p_user_id: this.userId,
        p_article_ids: articleIds,
        p_paper_ids: paperIds,
        p_book_ids: bookIds,
        p_insight_ids: insightIds,
        p_video_ids: videoIds,
        p_podcast_ids: podcastIds
      });

      if (error) {
        console.error('FeedManager: Error fetching social context:', error);
        return;
      }

      if (data && Array.isArray(data)) {
        // Map context to items
        data.forEach((context: any) => {
          const item = items.find(i => String(i.id) === String(context.content_id) && i.type === context.content_type);
          if (item) {
            item.social_context = {
              action: context.action,
              friend_name: context.friend_name,
              friend_id: context.friend_id,
              friend_avatar: context.friend_avatar
            };
          }
        });
        console.log(`FeedManager: Added social context to ${data.length} items`);
      }
    } catch (error) {
      console.error('FeedManager: Exception fetching social context:', error);
    }
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