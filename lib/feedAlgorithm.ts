import { supabase } from './supabase';
import { industryIdToName } from './industryMap';
import type { Article } from '../types';

export interface FetchedArticle {
  id: number;
  type: 'paper' | 'book' | 'article';
  title: string;
  content: string;
  authors: string[];
  link: string;
  industry_id: number;
  likes_count: number;
  saves_count: number;
  comments_count: number;
  views_count: number;
  created_at: string;
}

export interface FeedState {
  articles: Article[];
  fetchedArticleIds: Set<number>;
  likedArticleIds: Set<number>;
  savedArticleIds: Set<number>;
  isLoading: boolean;
  hasMore: boolean;
  currentPage: number;
}

export class FeedAlgorithm {
  private userId: string;
  private userIndustries: number[];
  private fetchedIds: Set<number> = new Set();
  private likedIds: Set<number> = new Set();
  private savedIds: Set<number> = new Set();

  constructor(userId: string, userIndustries: number[]) {
    this.userId = userId;
    this.userIndustries = userIndustries;
  }

  /**
   * Initialize user interaction data (liked and saved articles)
   */
  async initializeUserInteractions(): Promise<void> {
    if (!this.userId) {
      return;
    }

    try {
      // Fetch user's liked articles
      const { data: likedData, error: likedError } = await supabase
        .from('article_likes')
        .select('article_id')
        .eq('user_id', this.userId);
      
      if (likedError) {
        console.error('Error fetching liked articles:', likedError);
      } else {
        this.likedIds = new Set(likedData?.map(item => item.article_id) || []);
      }

      // Fetch user's saved articles
      const { data: savedData, error: savedError } = await supabase
        .from('article_saves')
        .select('article_id')
        .eq('user_id', this.userId);
      
      if (savedError) {
        console.error('Error fetching saved articles:', savedError);
      } else {
        this.savedIds = new Set(savedData?.map(item => item.article_id) || []);
      }
    } catch (error) {
      console.error('Error in initializeUserInteractions:', error);
    }
  }

  /**
   * Core algorithm: For each industry, try to fetch one paper and one article (book/article)
   * Repeat until we have the desired number of articles
   */
  async fetchArticles(targetCount: number = 10, excludeInteracted: boolean = true): Promise<Article[]> {
    try {
      await this.initializeUserInteractions();
      
      const fetchedArticles: FetchedArticle[] = [];
      const articleTypes: ('paper' | 'book' | 'article')[] = ['paper', 'book', 'article'];
      
      // Track which articles we've tried to fetch to avoid infinite loops
      const attemptedIds = new Set<number>();
      
      // Continue fetching until we have enough articles
      let attempts = 0;
      const maxAttempts = 50; // Prevent infinite loops
      
      while (fetchedArticles.length < targetCount && attempts < maxAttempts) {
        attempts++;
        
        // Go through each user industry
        for (const industryId of this.userIndustries) {
          if (fetchedArticles.length >= targetCount) break;
          
          // Try to fetch one paper for this industry
          const paperArticle = await this.fetchArticleByTypeAndIndustry(
            'paper', 
            industryId, 
            excludeInteracted, 
            attemptedIds
          );
          
          if (paperArticle) {
            fetchedArticles.push(paperArticle);
            attemptedIds.add(paperArticle.id);
            this.fetchedIds.add(paperArticle.id);
          }
          
          if (fetchedArticles.length >= targetCount) break;
          
          // Try to fetch one book or article for this industry
          const nonPaperTypes = articleTypes.filter(type => type !== 'paper');
          for (const type of nonPaperTypes) {
            if (fetchedArticles.length >= targetCount) break;
            
            const nonPaperArticle = await this.fetchArticleByTypeAndIndustry(
              type, 
              industryId, 
              excludeInteracted, 
              attemptedIds
            );
            
            if (nonPaperArticle) {
              fetchedArticles.push(nonPaperArticle);
              attemptedIds.add(nonPaperArticle.id);
              this.fetchedIds.add(nonPaperArticle.id);
              break; // Only get one non-paper article per industry per iteration
            }
          }
        }
        
        // If we haven't made progress, try with more relaxed constraints
        if (fetchedArticles.length === 0 && excludeInteracted) {
          return this.fetchArticles(targetCount, false);
        }
        
        // If we're not making progress, break out
        if (attempts > 10 && fetchedArticles.length === 0) {
          break;
        }
      }
      
      // Randomize the order of articles
      const shuffledArticles = this.shuffleArray(fetchedArticles);
      
      // Convert to Article format
      const articles = shuffledArticles.map(this.mapToArticle);
      return articles;
    } catch (error) {
      console.error('Error in fetchArticles:', error);
      return [];
    }
  }

  /**
   * Fetch a single article by type and industry, excluding already fetched/interacted articles
   */
  private async fetchArticleByTypeAndIndustry(
    type: 'paper' | 'book' | 'article',
    industryId: number,
    excludeInteracted: boolean,
    attemptedIds: Set<number>
  ): Promise<FetchedArticle | null> {
    try {
      let query = supabase
        .from('articles')
        .select('id, type, title, content, authors, link, industry_id, likes_count, saves_count, comments_count, views_count, created_at')
        .eq('type', type)
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
      
      // Filter out articles we want to exclude
      const availableArticles = data.filter(article => {
        // Always exclude already fetched articles in this session
        if (this.fetchedIds.has(article.id) || attemptedIds.has(article.id)) {
          return false;
        }
        
        // Optionally exclude previously interacted articles
        if (excludeInteracted) {
          if (this.likedIds.has(article.id) || this.savedIds.has(article.id)) {
            return false;
          }
        }
        
        return true;
      });

      if (availableArticles.length === 0) {
        return null;
      }

      // Return a random article from available options
      const randomIndex = Math.floor(Math.random() * availableArticles.length);
      const selectedArticle = availableArticles[randomIndex];
      return selectedArticle;
    } catch (error) {
      console.error('Error in fetchArticleByTypeAndIndustry:', error);
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
   * Convert FetchedArticle to Article format
   */
  private mapToArticle = (article: FetchedArticle): Article => ({
    id: article.id,
    type: article.type,
    title: article.title,
    caption: '', // No caption in articles table
    source: article.link,
    industry: industryIdToName[article.industry_id] || `Industry ${article.industry_id}`,
    video_url: undefined, // No video_url in articles table
    likes: article.likes_count || 0,
    saves: article.saves_count || 0,
    comments: article.comments_count || 0,
    views: article.views_count || 0,
    content: article.content,
    authors: article.authors || [],
  });

  /**
   * Fetch a specific article by ID (used for saved posts)
   */
  async fetchSpecificArticle(articleId: number): Promise<Article | null> {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('id, type, title, content, authors, link, industry_id, likes_count, saves_count, comments_count, views_count, created_at')
        .eq('id', articleId)
        .single();

      if (error) {
        console.error('Database error in fetchSpecificArticle:', error);
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
      
      // Convert to Article format
      const article = this.mapToArticle(data);
      
      return article;
    } catch (error) {
      console.error('Exception in fetchSpecificArticle:', error);
      return null;
    }
  }

  /**
   * Reset the algorithm state for fresh fetch (pull-to-refresh)
   */
  reset(): void {
    this.fetchedIds.clear();
    // Keep liked and saved IDs as they represent persistent user interactions
  }

  /**
   * Update user interaction tracking when user likes/saves an article
   */
  updateUserInteraction(articleId: number, action: 'like' | 'save' | 'unlike' | 'unsave'): void {
    switch (action) {
      case 'like':
        this.likedIds.add(articleId);
        break;
      case 'unlike':
        this.likedIds.delete(articleId);
        break;
      case 'save':
        this.savedIds.add(articleId);
        break;
      case 'unsave':
        this.savedIds.delete(articleId);
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