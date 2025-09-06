import { supabase } from './supabase';
import type { FeedItem, Article, Paper, Book, Industry, Insight } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QuizSessionManager } from './QuizSessionManager';

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
  private quizManager: QuizSessionManager;
  
  constructor(userId: string, userIndustries: string[], allIndustries: Industry[]) {
    this.userId = userId;
    this.userIndustries = userIndustries;
    this.allIndustries = allIndustries;
    
    // Initialize quiz session manager
    this.quizManager = new QuizSessionManager(userId);
    
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
          book: viewedArray.filter((id: string) => id.startsWith('book-')).length,
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
      
      console.log(`📡 FeedManager: Starting fetchContentByType for ${contentType}, target count: ${count}`);
      
      console.log(`📡 FeedManager: Using efficient database-level filtering for ${contentType}`);

      // For insights, always use the original method to ensure proper profile joins
      // The RPC function may not properly join with profiles table
      if (contentType === 'insight') {
        console.log(`📡 FeedManager: Using original method for insights to ensure profile data`);
        return this.fetchContentByTypeOriginal(contentType, count);
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

      // Convert to FeedItem format - no client-side filtering needed since DB already filtered
      const feedItems = data.slice(0, count).map((item: any) => 
        this.convertToFeedItem(item, contentType)
      );

      console.log(`📡 FeedManager: Final ${contentType} result: ${feedItems.length} items`);
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
      const unviewedData = data.filter((item: any) => {
        const itemKey = `${contentType}-${item.id}`;
        return !viewedKeys.includes(itemKey);
      });

      const feedItems = unviewedData.slice(0, count).map((item: any) => 
        this.convertToFeedItem(item, contentType)
      );

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
   * Mark content as viewed - simple tracking with quiz integration
   */
  async markAsViewed(contentId: string | number, contentType: string, contentItem?: FeedItem): Promise<void> {
    const viewKey = `${contentType}-${contentId}`;
    
    if (!this.viewedContentIds.has(viewKey)) {
      this.viewedContentIds.add(viewKey);
      console.log(`👁️ FeedManager: Marked as viewed: ${viewKey} (total: ${this.viewedContentIds.size})`);
      
      // Track in quiz session if content item provided
      if (contentItem) {
        try {
          await this.quizManager.trackContentView(contentItem);
        } catch (error) {
          console.error('👁️ FeedManager: Error tracking content in quiz session:', error);
        }
      }
      
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

      console.log(`✅ FeedManager: Successfully found ${contentType} ${contentId}`);
      return this.convertToFeedItem(data, contentType);
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
   * Clear quiz session data (for debugging)
   */
  async clearQuizData(): Promise<void> {
    try {
      await this.quizManager.clearAllData();
      console.log('🧹 FeedManager: Cleared quiz session data');
    } catch (error) {
      console.error('📡 FeedManager: Error clearing quiz data:', error);
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
   * Check if quiz should be shown for current session
   */
  shouldShowQuiz(): { show: boolean; reason: string } {
    return this.quizManager.shouldShowQuiz();
  }

  /**
   * Generate a quiz question from viewed content
   */
  async generateQuizQuestion() {
    return await this.quizManager.generateQuizQuestion();
  }

  /**
   * Generate a quiz question from specific content array (current session only)
   */
  async generateQuizQuestionFromContent(contentArray: FeedItem[]) {
    return await this.quizManager.generateQuizQuestionFromContent(contentArray);
  }

  /**
   * Handle quiz attempt
   */
  async handleQuizAttempt(question: any, userAnswer: number): Promise<void> {
    await this.quizManager.handleQuizAttempt(question, userAnswer);
  }

  /**
   * Get quiz session statistics
   */
  getQuizStats() {
    return this.quizManager.getSessionStats();
  }

  /**
   * Reset quiz session
   */
  async resetQuizSession(): Promise<void> {
    await this.quizManager.resetSession();
  }

  /**
   * Get debug info - enhanced with quiz stats
   */
  getDebugInfo(): { 
    viewedCount: number; 
    userIndustries: string[];
    quizStats: ReturnType<QuizSessionManager['getSessionStats']>;
  } {
    return {
      viewedCount: this.viewedContentIds.size,
      userIndustries: this.userIndustries,
      quizStats: this.quizManager.getSessionStats()
    };
  }
}