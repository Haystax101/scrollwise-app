import { supabase } from './supabase';
import type { FeedItem, Article, Paper, Book, Industry } from '../types';

export interface FetchedContent {
  id: number;
  type: 'paper' | 'book' | 'article';
  title: string;
  link: string;
  industry_id: string;
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

export class FeedAlgorithm {
  private userId: string;
  private userIndustries: string[];
  private allIndustries: Industry[];
  private fetchedIds: Set<string> = new Set(); // Changed to string to handle bigint IDs
  private likedIds: Set<string> = new Set(); // Changed to string to handle bigint IDs
  private savedIds: Set<string> = new Set(); // Changed to string to handle bigint IDs
  private viewedIds: Set<string> = new Set(); // Track viewed content by type-id

  constructor(userId: string, userIndustries: string[], allIndustries: Industry[]) {
    this.userId = userId;
    this.userIndustries = userIndustries;
    this.allIndustries = allIndustries;
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
   * Core algorithm: Implements time-based scoring with content-type balancing
   * Uses decaying time score and weighted content distribution
   */
  async fetchArticles(targetCount: number = 10, excludeInteracted: boolean = true): Promise<FeedItem[]> {
    try {
      await this.initializeUserInteractions();
      
      // Improved algorithm with weighted content type distribution
      const contentTypeWeights = {
        'article': 0.4,  // 40% articles (news, current events)
        'paper': 0.25,   // 25% papers (research, in-depth)
        'book': 0.35     // 35% books (learning, development)
      };
      
      // Calculate target counts for each content type
      const targetCounts = {
        'article': Math.ceil(targetCount * contentTypeWeights.article),
        'paper': Math.ceil(targetCount * contentTypeWeights.paper),
        'book': Math.ceil(targetCount * contentTypeWeights.book)
      };
      
      // Fetch content with time-based scoring for each type
      const allContent: Array<FetchedContent & { score: number }> = [];
      
      for (const [contentType, targetTypeCount] of Object.entries(targetCounts)) {
        const typeContent = await this.fetchContentWithTimeScoring(
          contentType as 'article' | 'paper' | 'book',
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
      
      console.log(`✅ FeedAlgorithm: Returning ${feedItems.length} items (${feedItems.filter(item => item.type === 'article').length} articles, ${feedItems.filter(item => item.type === 'paper').length} papers, ${feedItems.filter(item => item.type === 'book').length} books)`);
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
    contentType: 'article' | 'paper' | 'book',
    targetCount: number,
    excludeInteracted: boolean
  ): Promise<Array<FetchedContent & { score: number }>> {
    const tableName = contentType === 'paper' ? 'papers' : contentType === 'book' ? 'books' : 'articles';
    const scoredContent: Array<FetchedContent & { score: number }> = [];
    
    try {
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
          .map(viewKey => viewKey.replace(`${contentType}-`, ''))
          .map(id => parseInt(id, 10))
          .filter(id => !isNaN(id));
        
        // Build query with exclusions
        let query = supabase
          .from(tableName)
          .select('*')
          .eq('industry_id', industryId)
          .order('created_at', { ascending: false })
          .limit(itemsPerIndustry * 4); // Get more options since we're excluding viewed content
        
        // Exclude viewed content from the database query itself
        if (viewedIdsToExclude.length > 0) {
          console.log(`🔍 Excluding ${viewedIdsToExclude.length} viewed ${contentType} IDs from DB query:`, viewedIdsToExclude.slice(0, 5));
          query = query.not('id', 'in', `(${viewedIdsToExclude.join(',')})`);
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
   * Calculate time-based score using decaying function
   * Formula: base_score * e^(-decay_rate * hours_old)
   */
  private calculateTimeScore(content: any): number {
    const now = new Date();
    const contentDate = new Date(content.created_at || content.date);
    const hoursOld = (now.getTime() - contentDate.getTime()) / (1000 * 60 * 60);
    
    // Base score from engagement metrics (normalized 0-1)
    const engagementScore = Math.min(1, 
      (content.likes_count * 0.4 + content.saves_count * 0.6) / 100
    );
    
    // Base score: engagement (0-1) + quality boost (0.2) 
    const baseScore = Math.max(0.2, engagementScore);
    
    // Decay rate: slower decay for papers/books (research content), faster for articles (news)
    const decayRate = content.type === 'article' ? 0.02 : 0.005;
    
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
    weights: { article: number; paper: number; book: number }
  ): FetchedContent[] {
    const contentByType = {
      article: allContent.filter(c => c.type === 'article'),
      paper: allContent.filter(c => c.type === 'paper'),
      book: allContent.filter(c => c.type === 'book')
    };

    const result: FetchedContent[] = [];
    const indices = { article: 0, paper: 0, book: 0 };
    const typeOrder: ('article' | 'paper' | 'book')[] = ['article', 'book', 'paper'];

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
      
      default:
        throw new Error(`Unknown content type: ${content.type}`);
    }
  };

  /**
   * Fetch a specific content item by ID and type
   */
  async fetchSpecificContent(contentId: number, contentType: 'article' | 'paper' | 'book'): Promise<FeedItem | null> {
    try {
      const tableName = contentType === 'paper' ? 'papers' : contentType === 'book' ? 'books' : 'articles';
      
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
      const likesTable = contentType === 'paper' ? 'paper_likes' : contentType === 'book' ? 'book_likes' : 'article_likes';
      const savesTable = contentType === 'paper' ? 'paper_saves' : contentType === 'book' ? 'book_saves' : 'article_saves';
      const commentsTable = contentType === 'paper' ? 'paper_comments' : contentType === 'book' ? 'book_comments' : 'comments';
      const idField = contentType === 'paper' ? 'paper_id' : contentType === 'book' ? 'book_id' : 'article_id';

      const [likesCountRes, savesCountRes, commentsCountRes] = await Promise.all([
        supabase.from(likesTable).select('*', { count: 'exact', head: true }).eq(idField, contentId),
        supabase.from(savesTable).select('*', { count: 'exact', head: true }).eq(idField, contentId),
        supabase.from(commentsTable).select('*', { count: 'exact', head: true }).eq(idField, contentId),
      ]);

      const safeLikes = (likesCountRes.count as number | null) ?? contentItem.likes_count ?? 0;
      const safeSaves = (savesCountRes.count as number | null) ?? contentItem.saves_count ?? 0;
      const safeComments = (commentsCountRes.count as number | null) ?? contentItem.comments_count ?? 0;

      const hydratedData = {
        ...contentItem,
        likes_count: safeLikes,
        saves_count: safeSaves,
        comments_count: safeComments,
      };

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