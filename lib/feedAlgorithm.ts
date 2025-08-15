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
  private fetchedIds: Set<number> = new Set();
  private likedIds: Set<number> = new Set();
  private savedIds: Set<number> = new Set();

  constructor(userId: string, userIndustries: string[], allIndustries: Industry[]) {
    this.userId = userId;
    this.userIndustries = userIndustries;
    this.allIndustries = allIndustries;
  }

  /**
   * Initialize user interaction data (liked and saved content)
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
          ...(likedArticles?.map(item => item.article_id) || []),
          ...(likedPapers?.map(item => item.paper_id) || []),
          ...(likedBooks?.map(item => item.book_id) || [])
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
          ...(savedArticles?.map(item => item.article_id) || []),
          ...(savedPapers?.map(item => item.paper_id) || []),
          ...(savedBooks?.map(item => item.book_id) || [])
        ];
        this.savedIds = new Set(allSavedIds);
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
      return feedItems;
    } catch (error) {
      console.error('Error in fetchArticles:', error);
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
      for (const industryId of this.userIndustries) {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .eq('industry_id', industryId)
          .order('created_at', { ascending: false })
          .limit(20); // Get more options for better scoring

        if (error || !data) continue;

        const filteredData = data.filter(item => {
          if (this.fetchedIds.has(item.id)) return false;
          if (excludeInteracted && (this.likedIds.has(item.id) || this.savedIds.has(item.id))) {
            return false;
          }
          return true;
        });

        for (const item of filteredData) {
          const score = this.calculateTimeScore(item);
          scoredContent.push({
            ...item,
            type: contentType,
            score
          });
        }
      }

      // Sort by score and return top items
      scoredContent.sort((a, b) => b.score - a.score);
      return scoredContent.slice(0, targetCount);
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
          this.fetchedIds.add(item.id);
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
    attemptedIds: Set<number>
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
        // Always exclude already fetched items in this session
        if (this.fetchedIds.has(item.id) || attemptedIds.has(item.id)) {
          return false;
        }
        
        // Optionally exclude previously interacted items
        if (excludeInteracted) {
          if (this.likedIds.has(item.id) || this.savedIds.has(item.id)) {
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
        .single();

      if (error) {
        console.error('Database error in fetchSpecificContent:', error);
        return null;
      }

      if (!data) {
        return null;
      }

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

      const safeLikes = (likesCountRes.count as number | null) ?? data.likes_count ?? 0;
      const safeSaves = (savesCountRes.count as number | null) ?? data.saves_count ?? 0;
      const safeComments = (commentsCountRes.count as number | null) ?? data.comments_count ?? 0;

      const hydratedData = {
        ...data,
        likes_count: safeLikes,
        saves_count: safeSaves,
        comments_count: safeComments,
      };

      // Initialize user interactions if not already done
      if (this.likedIds.size === 0 && this.savedIds.size === 0 && this.userId) {
        await this.initializeUserInteractions();
      }
      
      // Add to fetched IDs to avoid duplicates in regular feed
      this.fetchedIds.add(data.id);
      
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
    // Keep liked and saved IDs as they represent persistent user interactions
  }

  /**
   * Update user interaction tracking when user likes/saves content
   */
  updateUserInteraction(contentId: number, action: 'like' | 'save' | 'unlike' | 'unsave'): void {
    switch (action) {
      case 'like':
        this.likedIds.add(contentId);
        break;
      case 'unlike':
        this.likedIds.delete(contentId);
        break;
      case 'save':
        this.savedIds.add(contentId);
        break;
      case 'unsave':
        this.savedIds.delete(contentId);
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