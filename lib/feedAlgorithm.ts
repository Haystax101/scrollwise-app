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
   * Core algorithm: For each industry, try to fetch one paper, one book, and one article
   * Repeat until we have the desired number of items
   */
  async fetchArticles(targetCount: number = 10, excludeInteracted: boolean = true): Promise<FeedItem[]> {
    try {
      await this.initializeUserInteractions();
      
      const fetchedContent: FetchedContent[] = [];
      const contentTypes: ('paper' | 'book' | 'article')[] = ['paper', 'book', 'article'];
      
      // Track which items we've tried to fetch to avoid infinite loops
      const attemptedIds = new Set<number>();
      
      // Continue fetching until we have enough content
      let attempts = 0;
      const maxAttempts = 50; // Prevent infinite loops
      
      while (fetchedContent.length < targetCount && attempts < maxAttempts) {
        attempts++;
        
        // Go through each user industry
        for (const industryId of this.userIndustries) {
          if (fetchedContent.length >= targetCount) break;
          
          // Try to fetch one item of each type for this industry
          for (const type of contentTypes) {
            if (fetchedContent.length >= targetCount) break;
            
            const content = await this.fetchContentByTypeAndIndustry(
              type, 
              industryId, 
              excludeInteracted, 
              attemptedIds
            );
            
            if (content) {
              fetchedContent.push(content);
              attemptedIds.add(content.id);
              this.fetchedIds.add(content.id);
            }
          }
        }
        
        // If we haven't made progress, try with more relaxed constraints
        if (fetchedContent.length === 0 && excludeInteracted) {
          return this.fetchArticles(targetCount, false);
        }
        
        // If we're not making progress, break out
        if (attempts > 10 && fetchedContent.length === 0) {
          break;
        }
      }
      
      // Randomize the order of content
      const shuffledContent = this.shuffleArray(fetchedContent);
      
      // Convert to FeedItem format
      const feedItems = shuffledContent.map(this.mapToFeedItem);
      return feedItems;
    } catch (error) {
      console.error('Error in fetchArticles:', error);
      return [];
    }
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

      // Initialize user interactions if not already done
      if (this.likedIds.size === 0 && this.savedIds.size === 0 && this.userId) {
        await this.initializeUserInteractions();
      }
      
      // Add to fetched IDs to avoid duplicates in regular feed
      this.fetchedIds.add(data.id);
      
      // Convert to FeedItem format
      const feedItem = this.mapToFeedItem({
        ...data,
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