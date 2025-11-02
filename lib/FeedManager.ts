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
      console.log(`📱 FeedManager: Loading viewed content with key: ${viewedKey}`);
      
      const viewedData = await AsyncStorage.getItem(viewedKey);
      
      if (viewedData) {
        const viewedArray = JSON.parse(viewedData);
        this.viewedContentIds = new Set(viewedArray);
        console.log(`📱 FeedManager: Loaded ${this.viewedContentIds.size} viewed items from AsyncStorage`);
        
        // Log first few viewed items for debugging
        const viewedSample = Array.from(this.viewedContentIds).slice(0, 10);
        console.log(`📱 FeedManager: Sample viewed items:`, viewedSample);
        
        // Show breakdown by content type
        const byType = {
          article: viewedArray.filter((id: string) => id.startsWith('article-')).length,
          paper: viewedArray.filter((id: string) => id.startsWith('paper-')).length,
          insight: viewedArray.filter((id: string) => id.startsWith('insight-')).length
        };
        console.log(`📱 FeedManager: Viewed content by type:`, byType);
      } else {
        console.log(`📱 FeedManager: No viewed content found in AsyncStorage`);
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
   * PRIORITY: Content with slides first, then regular content
   */
  async fetchContent(targetCount: number = 10): Promise<FeedItem[]> {
    try {
      console.log(`📡 FeedManager: Fetching ${targetCount} fresh items`);

      const allContent: FeedItem[] = [];

      // STEP 1: Prioritize content with slides
      console.log(`📡 FeedManager: Step 1 - Fetching content WITH slides first`);
      const contentWithSlides = await this.fetchContentWithSlides(targetCount);
      console.log(`📡 FeedManager: Found ${contentWithSlides.length} items with slides`);
      allContent.push(...contentWithSlides);

      // STEP 2: If we don't have enough items, fetch regular content
      const remainingCount = targetCount - allContent.length;
      if (remainingCount > 0) {
        console.log(`📡 FeedManager: Step 2 - Fetching ${remainingCount} additional regular items`);

        // Define content type distribution for remaining slots
        const distribution = [
          { type: 'article' as const, count: Math.ceil(remainingCount * 0.5) },
          { type: 'paper' as const, count: Math.ceil(remainingCount * 0.3) },
          { type: 'insight' as const, count: Math.ceil(remainingCount * 0.2) }
        ];

        console.log(`📡 FeedManager: Content distribution for ${remainingCount} items:`, distribution);

        // Fetch each content type
        for (const { type, count } of distribution) {
          console.log(`📡 FeedManager: Fetching ${count} items of type ${type}`);
          const items = await this.fetchContentByType(type, count);
          console.log(`📡 FeedManager: Received ${items.length} items of type ${type} (requested ${count})`);
          allContent.push(...items);
        }
      }

      console.log(`📡 FeedManager: Total items collected before shuffle: ${allContent.length}`);
      console.log(`📡 FeedManager: Breakdown: ${allContent.filter(i => i.type === 'article').length} articles, ${allContent.filter(i => i.type === 'paper').length} papers, ${allContent.filter(i => i.type === 'insight').length} insights`);
      console.log(`📡 FeedManager: Items with slides: ${allContent.filter((i: any) => i.hasSlides).length}`);

      // Shuffle for variety and return requested count
      const shuffled = this.shuffleArray(allContent);
      const result = shuffled.slice(0, targetCount);

      console.log(`📡 FeedManager: Retrieved ${result.length} items (${result.filter((i: any) => i.hasSlides).length} with slides)`);

      return result;
    } catch (error) {
      console.error('📡 FeedManager: Error in fetchContent:', error);
      return [];
    }
  }

  /**
   * Fetch content that has slides from content_slides table
   */
  private async fetchContentWithSlides(limit: number): Promise<FeedItem[]> {
    try {
      // Query content_slides to get IDs of content with slides
      const { data: slidesData, error } = await supabase
        .from('content_slides')
        .select('content_id, content_type')
        .in('content_type', ['article', 'paper'])
        .order('generated_at', { ascending: false })
        .limit(limit * 2); // Get more to account for viewed content filtering

      if (error || !slidesData || slidesData.length === 0) {
        console.log(`📡 FeedManager: No content_slides found`);
        return [];
      }

      console.log(`📡 FeedManager: Found ${slidesData.length} total items in content_slides`);

      // Group by content type
      const articleIds = slidesData.filter(s => s.content_type === 'article').map(s => s.content_id);
      const paperIds = slidesData.filter(s => s.content_type === 'paper').map(s => s.content_id);

      const allItems: FeedItem[] = [];

      // Fetch articles with slides
      if (articleIds.length > 0) {
        const { data: articles } = await supabase
          .from('articles')
          .select('*')
          .in('id', articleIds)
          .in('industry_id', this.userIndustries)
          .limit(limit);

        if (articles) {
          const articleItems = articles.map(article => {
            const item = this.convertToFeedItem(article, 'article');
            (item as any).hasSlides = true;
            return item;
          });
          allItems.push(...articleItems);
          console.log(`📡 FeedManager: Fetched ${articleItems.length} articles with slides`);
        }
      }

      // Fetch papers with slides
      if (paperIds.length > 0) {
        const { data: papers } = await supabase
          .from('papers')
          .select('*')
          .in('id', paperIds)
          .in('industry_id', this.userIndustries)
          .limit(limit);

        if (papers) {
          const paperItems = papers.map(paper => {
            const item = this.convertToFeedItem(paper, 'paper');
            (item as any).hasSlides = true;
            return item;
          });
          allItems.push(...paperItems);
          console.log(`📡 FeedManager: Fetched ${paperItems.length} papers with slides`);
        }
      }

      // Don't filter out viewed content for slides (we want to prioritize showing them)
      // Regular content will still be filtered in fetchContentByType
      console.log(`📡 FeedManager: Returning ${allItems.length} items with slides (not filtering viewed for slides)`);
      return allItems.slice(0, limit);
    } catch (error) {
      console.error('📡 FeedManager: Error fetching content with slides:', error);
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
      console.log(`📡 FeedManager: Starting fetchContentByType for ${contentType}, target count: ${count}`);
      
      console.log(`📡 FeedManager: Using efficient database-level filtering for ${contentType}`);

      // For insights, always use the original method to ensure proper profile joins
      // The RPC function may not properly join with profiles table
      if (contentType === 'insight') {
        console.log(`📡 FeedManager: Using original method for insights to ensure profile data`);
        const insightsResult = await this.fetchContentByTypeOriginal(contentType, count);
        console.log(`📡 FeedManager: Original method returned ${insightsResult.length} insights for target count ${count}`);
        return insightsResult;
      }

      // Use RPC function for other content types
      const { data, error } = await supabase.rpc('get_unviewed_content_by_type', {
        p_user_id: this.userId,
        p_content_type: contentType,
        p_industry_ids: this.userIndustries,
        p_limit: count * 3 // Get extra in case some fail conversion
      });

      if (error) {
        console.error(`📡 FeedManager: RPC error for ${contentType}:`, error);
        console.log(`📡 FeedManager: Falling back to simple query without view filtering...`);

        // Fallback to original method if RPC doesn't exist yet
        return this.fetchContentByTypeOriginal(contentType, count);
      }

      if (!data || data.length === 0) {
        console.log(`📡 FeedManager: No unviewed ${contentType} data returned from RPC`);
        return [];
      }

      console.log(`📡 FeedManager: RPC returned ${data.length} unviewed ${contentType} items`);

      // Debug logging for RPC response data
      if (data.length > 0 && (contentType === 'article' || contentType === 'paper')) {
        console.log(`📡 FeedManager: First ${contentType} RPC data sample:`, {
          id: data[0].id,
          title: data[0].title?.substring(0, 30),
          date: data[0].date,
          created_at: data[0].created_at,
          hasDate: !!data[0].date,
          dateType: typeof data[0].date
        });
      }

      // Check which content has slides
      // Convert IDs to integers since content_slides.content_id is integer type
      const contentIds = data.map((item: any) => parseInt(item.id, 10));
      console.log(`📡 FeedManager: Checking slides for ${contentIds.length} ${contentType} IDs:`, contentIds.slice(0, 5));

      const { data: slidesData, error: slidesError } = await supabase
        .from('content_slides')
        .select('content_id')
        .eq('content_type', contentType)
        .in('content_id', contentIds);

      if (slidesError) {
        console.error(`📡 FeedManager: Error fetching slides:`, slidesError);
      }

      console.log(`📡 FeedManager: Slides query returned:`, slidesData);
      const contentWithSlidesIds = new Set(slidesData?.map(s => s.content_id) || []);
      console.log(`📡 FeedManager: Found ${contentWithSlidesIds.size} ${contentType} items with slides out of ${data.length}`, Array.from(contentWithSlidesIds));

      // Convert to FeedItem format - no client-side filtering needed since DB already filtered
      const feedItems = data.slice(0, count).map((item: any) => {
        const feedItem = this.convertToFeedItem(item, contentType);
        // Mark if this item has slides (compare as integer)
        if (contentType === 'article' || contentType === 'paper') {
          (feedItem as any).hasSlides = contentWithSlidesIds.has(parseInt(item.id, 10));
        }
        return feedItem;
      });

      console.log(`📡 FeedManager: Final ${contentType} result: ${feedItems.length} items (${feedItems.filter((f: any) => f.hasSlides).length} with slides)`);
      return feedItems;
    } catch (error) {
      console.error(`📡 FeedManager: Exception in fetchContentByType for ${contentType}:`, error);
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
        console.log(`📡 FeedManager: Executing insights query with profile join for user ${this.userId}`);
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
        console.error(`📡 FeedManager: Fallback query error for ${contentType}:`, error);
        return [];
      }

      // Debug logging for articles specifically to check longer_summary
      if (contentType === 'article' && data.length > 0) {
        console.log(`📡 FeedManager: Articles query returned ${data.length} items`);
        console.log(`📡 FeedManager: First article raw data sample:`, {
          id: data[0].id,
          title: data[0].title?.substring(0, 50),
          summary: data[0].summary?.substring(0, 50),
          longer_summary: data[0].longer_summary ? `${data[0].longer_summary.substring(0, 50)}...` : 'NOT PRESENT',
          hasLongerSummary: !!data[0].longer_summary
        });
      }

      // Debug logging for insights profile data
      if (contentType === 'insight') {
        console.log(`📡 FeedManager: Insights query returned ${data.length} items`);
        if (data.length > 0) {
          console.log(`📡 FeedManager: First insight data sample:`, {
            id: data[0].id,
            author_id: data[0].author_id,
            profiles: data[0].profiles,
            content_preview: data[0].content?.substring(0, 50)
          });
        }
      }

      // Filter out viewed content client-side
      const viewedKeys = Array.from(this.viewedContentIds);
      console.log(`📡 FeedManager: Filtering ${contentType} - ${data.length} raw items, ${viewedKeys.length} viewed keys`);
      
      const unviewedData = data.filter((item: any) => {
        const itemKey = `${contentType}-${item.id}`;
        return !viewedKeys.includes(itemKey);
      });
      
      console.log(`📡 FeedManager: After filtering ${contentType} - ${unviewedData.length} unviewed items (filtered out ${data.length - unviewedData.length} viewed items)`);

      const feedItems = unviewedData.slice(0, count).map((item: any) => 
        this.convertToFeedItem(item, contentType)
      );
      
      console.log(`📡 FeedManager: Final ${contentType} result after conversion - ${feedItems.length} items (requested ${count})`);

      return feedItems;
    } catch (error) {
      console.error(`📡 FeedManager: Fallback error for ${contentType}:`, error);
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
        const articleItem = {
          ...baseItem,
          title: data.title || '',
          summary: data.summary || '',
          longer_summary: data.longer_summary,
          author: data.author || '',
          date: data.date,
          site_name: data.site_name
        } as Article;

        // Debug logging for article conversion
        console.log(`📡 FeedManager: Converting article ${data.id}:`, {
          id: data.id,
          title: data.title?.substring(0, 30),
          summary_length: data.summary?.length || 0,
          longer_summary_length: data.longer_summary?.length || 0,
          hasLongerSummary: !!data.longer_summary,
          longer_summary_preview: data.longer_summary ? `${data.longer_summary.substring(0, 50)}...` : 'NOT PRESENT',
          raw_date: data.date,
          raw_created_at: data.created_at,
          hasDate: !!data.date,
          dateType: typeof data.date
        });

        return articleItem;

      case 'paper':
        const paperItem = {
          ...baseItem,
          title: data.title || '',
          content_simple: data.content_simple || '',
          content_complex: data.content_complex || '',
          authors: data.authors || [],
          date: data.date,
          site_name: data.site_name
        } as Paper;

        // Debug logging for paper conversion
        console.log(`📡 FeedManager: Converting paper ${data.id}:`, {
          id: data.id,
          title: data.title?.substring(0, 30),
          content_simple_length: data.content_simple?.length || 0,
          content_complex_length: data.content_complex?.length || 0,
          hasContentSimple: !!data.content_simple,
          hasContentComplex: !!data.content_complex,
          content_simple_preview: data.content_simple ? data.content_simple.substring(0, 50) + '...' : 'NOT PRESENT',
          raw_date: data.date,
          raw_created_at: data.created_at,
          hasDate: !!data.date,
          dateType: typeof data.date
        });

        return paperItem;

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
        
        // Debug log to see what profile data we're getting
        console.log(`🧠 FeedManager: Processing insight ${data.id}, profile data:`, profile);
        
        // Improved fallback logic - try to get name from different sources
        let authorName = 'User'; // Better fallback than 'Anonymous'
        if (profile?.full_name) {
          authorName = profile.full_name;
        } else {
          // Log when we have missing profile data
          console.log(`⚠️ FeedManager: Missing profile data for insight ${data.id}, author_id: ${data.author_id}`);
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
   * Fetch specific content by ID and type with fresh interaction counts
   */
  async fetchSpecificContent(contentId: string | number, contentType: 'article' | 'paper' | 'book' | 'insight'): Promise<FeedItem | null> {
    try {
      console.log(`🔍 FeedManager: Fetching specific ${contentType} with ID: ${contentId} (type: ${typeof contentId})`);

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

      console.log(`🔍 FeedManager: Querying ${tableName} table for ID: ${contentId}`);
      const { data, error } = await query;

      if (error) {
        console.error(`📡 FeedManager: Query error for ${contentType} ${contentId}:`, error);
        return null;
      }

      if (!data) {
        console.log(`📡 FeedManager: No data found for ${contentType} ${contentId}`);
        return null;
      }

      console.log(`✅ FeedManager: Successfully found ${contentType} ${contentId}, now fetching fresh interaction counts...`);

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

      console.log(`📊 FeedManager: Fresh counts for ${contentType} ${contentId}: likes=${freshLikes}, saves=${freshSaves}, comments=${freshComments}`);

      // Update data with fresh counts
      const dataWithFreshCounts = {
        ...data,
        likes_count: freshLikes,
        saves_count: freshSaves,
        comments_count: freshComments,
      };

      return this.convertToFeedItem(dataWithFreshCounts, contentType);
    } catch (error) {
      console.error(`📡 FeedManager: Exception fetching specific ${contentType} ${contentId}:`, error);
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