import AsyncStorage from '@react-native-async-storage/async-storage';
import type { QuizSession, QuizQuestion, QuizAttempt, ContentType, FeedItem } from '../types';
import { supabase } from './supabase';

/**
 * QuizSessionManager - Comprehensive quiz tracking and probability management
 * 
 * Core functionality:
 * - Tracks content viewing in session
 * - Manages progressive probability (0% → 40% → 50% → 60% ... → 100%)
 * - Prevents re-quizzing on same content in session
 * - Generates questions from viewed content
 * - Handles quiz completion and session reset
 */
export class QuizSessionManager {
  private session: QuizSession;
  private readonly STORAGE_KEY_PREFIX = 'quiz_session_';
  private readonly INITIAL_PROBABILITY = 0;
  private readonly FIRST_QUIZ_PROBABILITY = 0.4;
  private readonly PROBABILITY_INCREMENT = 0.1;
  private readonly MAX_PROBABILITY = 1.0;
  private readonly MIN_CONTENT_BEFORE_QUIZ = 5;

  constructor(userId: string) {
    this.session = {
      userId,
      sessionId: this.generateSessionId(),
      contentViewed: [],
      quizAttempts: new Set(),
      totalContentViewed: 0,
      contentSinceLastQuiz: 0,
      currentProbability: this.INITIAL_PROBABILITY,
      lastQuizAt: undefined
    };
    
    this.loadSession();
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Load existing session from AsyncStorage
   */
  private async loadSession(): Promise<void> {
    try {
      const storageKey = `${this.STORAGE_KEY_PREFIX}${this.session.userId}`;
      console.log(`QuizSessionManager: Loading session with key: ${storageKey}`);
      
      const sessionData = await AsyncStorage.getItem(storageKey);
      
      if (sessionData) {
        const parsedSession = JSON.parse(sessionData);
        
        // Restore session but generate new sessionId for this app launch
        this.session = {
          ...parsedSession,
          sessionId: this.generateSessionId(),
          quizAttempts: new Set(parsedSession.quizAttempts || []),
          contentViewed: parsedSession.contentViewed.map((item: any) => ({
            ...item,
            viewedAt: new Date(item.viewedAt)
          })),
          // Ensure contentSinceLastQuiz is properly restored or defaulted
          contentSinceLastQuiz: parsedSession.contentSinceLastQuiz || 0,
          lastQuizAt: parsedSession.lastQuizAt ? new Date(parsedSession.lastQuizAt) : undefined
        };
        
        // Check for corrupted data and force reset if needed
        if (isNaN(this.session.contentSinceLastQuiz) || this.session.contentSinceLastQuiz < 0) {
          console.log('QuizSessionManager: Detected corrupted contentSinceLastQuiz, force resetting...');
          await this.forceResetSession();
          return;
        }
        
        console.log(`QuizSessionManager: Loaded session - ${this.session.totalContentViewed} content viewed, ${this.session.contentSinceLastQuiz} since last quiz`);
        console.log(`QuizSessionManager: Quiz attempts: ${Array.from(this.session.quizAttempts).length}`);
      } else {
        console.log(`QuizSessionManager: No existing session found, starting fresh`);
      }
    } catch (error) {
      console.error('QuizSessionManager: Error loading session:', error);
    }
  }

  /**
   * Save current session to AsyncStorage
   */
  private async saveSession(): Promise<void> {
    try {
      const storageKey = `${this.STORAGE_KEY_PREFIX}${this.session.userId}`;
      
      // Convert Set to Array for JSON serialization
      const sessionToSave = {
        ...this.session,
        quizAttempts: Array.from(this.session.quizAttempts)
      };
      
      await AsyncStorage.setItem(storageKey, JSON.stringify(sessionToSave));
      console.log(`QuizSessionManager: Session saved - ${this.session.totalContentViewed} content, probability: ${this.session.currentProbability}`);
    } catch (error) {
      console.error('QuizSessionManager: Error saving session:', error);
    }
  }

  /**
   * Track content viewing
   */
  async trackContentView(content: FeedItem): Promise<void> {
    const contentKey = `${content.type}-${content.id}`;
    
    // Check if this content was already viewed in current session
    const alreadyViewed = this.session.contentViewed.some(
      item => `${item.contentType}-${item.contentId}` === contentKey
    );
    
    if (alreadyViewed) {
      console.log(`QuizSessionManager: Content ${contentKey} already viewed in session`);
      return;
    }

    // Add to viewed content
    this.session.contentViewed.push({
      contentId: content.id,
      contentType: content.type,
      title: content.title,
      viewedAt: new Date()
    });
    
    this.session.totalContentViewed++;
    this.session.contentSinceLastQuiz++;
    
    console.log(`QuizSessionManager: Tracked view of ${contentKey} - Total: ${this.session.totalContentViewed}, Since last quiz: ${this.session.contentSinceLastQuiz}`);
    
    await this.saveSession();
  }

  /**
   * Check if quiz should be shown based on progressive probability
   * Logic: Need 5 content views since last quiz, then probability increases each view
   */
  shouldShowQuiz(): { show: boolean; reason: string } {
    // Must have viewed at least minimum content since last quiz
    if (this.session.contentSinceLastQuiz < this.MIN_CONTENT_BEFORE_QUIZ) {
      return {
        show: false,
        reason: `Need ${this.MIN_CONTENT_BEFORE_QUIZ - this.session.contentSinceLastQuiz} more content views since last quiz`
      };
    }

    // Check if we have available content for quizzing (not already quizzed)
    const availableForQuiz = this.session.contentViewed.filter(
      item => !this.session.quizAttempts.has(`${item.contentType}-${item.contentId}`)
    );

    if (availableForQuiz.length === 0) {
      return {
        show: false,
        reason: 'No unquizzed content available'
      };
    }

    // Calculate probability based on content viewed since last quiz
    // Item 6 (1st eligible): 40%, Item 7: 50%, Item 8: 60%, etc.
    const contentBeyondMinimum = this.session.contentSinceLastQuiz - this.MIN_CONTENT_BEFORE_QUIZ;
    const currentProbability = Math.min(
      this.FIRST_QUIZ_PROBABILITY + (contentBeyondMinimum * this.PROBABILITY_INCREMENT),
      this.MAX_PROBABILITY
    );

    // Progressive probability logic
    const shouldShow = Math.random() < currentProbability;
    
    console.log(`QuizSessionManager: Quiz check - Content since last quiz: ${this.session.contentSinceLastQuiz}, Probability: ${currentProbability}, Roll: ${shouldShow}`);
    
    return {
      show: shouldShow,
      reason: shouldShow ? 'Probability hit' : `Probability miss (${currentProbability})`
    };
  }

  /**
   * Generate quiz question from specific content array (current session only)
   */
  async generateQuizQuestionFromContent(contentArray: any[]): Promise<QuizQuestion | null> {
    try {
      if (contentArray.length === 0) {
        console.log('QuizSessionManager: No content provided for quiz generation');
        return null;
      }

      // Randomly select content from the provided array
      const selectedContent = contentArray[Math.floor(Math.random() * contentArray.length)];
      
      console.log(`QuizSessionManager: Generating quiz from current session for ${selectedContent.type}-${selectedContent.id}`);

      // Fetch quiz question from database
      const { data, error } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('content_type', selectedContent.type)
        .eq('content_id', selectedContent.id)
        .maybeSingle();

      if (error || !data) {
        console.log(`QuizSessionManager: No quiz found in database for ${selectedContent.type}-${selectedContent.id}`);
        return null;
      }

      // Validate that all options are present and non-empty
      const options = [data.option_a, data.option_b, data.option_c, data.option_d];
      const hasValidOptions = options.every(option => option && option.trim().length > 0);
      
      if (!hasValidOptions) {
        console.log('QuizSessionManager: Quiz has blank options, skipping:', data.id);
        return null;
      }

      // Validate that the question text exists and correct_option_index is valid
      if (!data.question || data.question.trim().length === 0) {
        console.log('QuizSessionManager: Quiz has blank question, skipping:', data.id);
        return null;
      }

      if (data.correct_option_index < 0 || data.correct_option_index > 3) {
        console.log('QuizSessionManager: Quiz has invalid correct_option_index, skipping:', data.id);
        return null;
      }

      const question: QuizQuestion = {
        id: data.id,
        question: data.question,
        options,
        correctAnswer: data.correct_option_index,
        explanation: data.explanation || 'Good question!',
        sourceContentId: selectedContent.id,
        sourceContentType: selectedContent.type,
        sourceTitle: 'title' in selectedContent ? selectedContent.title : 'Content'
      };

      console.log(`QuizSessionManager: Successfully generated quiz question from current session: "${question.question}"`);
      return question;
    } catch (error) {
      console.error('QuizSessionManager: Error generating quiz question from content:', error);
      return null;
    }
  }

  /**
   * Generate quiz question from viewed content by fetching from database
   */
  async generateQuizQuestion(): Promise<QuizQuestion | null> {
    try {
      // Get content that hasn't been quizzed yet
      const availableContent = this.session.contentViewed.filter(
        item => !this.session.quizAttempts.has(`${item.contentType}-${item.contentId}`)
      );

      if (availableContent.length === 0) {
        console.log('QuizSessionManager: No available content for quiz generation');
        return null;
      }

      // Randomly select content to quiz about
      const selectedContent = availableContent[Math.floor(Math.random() * availableContent.length)];
      
      console.log(`QuizSessionManager: Generating quiz for ${selectedContent.contentType}-${selectedContent.contentId}`);

      // Fetch quiz question from database
      const { data, error } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('content_type', selectedContent.contentType)
        .eq('content_id', selectedContent.contentId)
        .maybeSingle();

      if (error || !data) {
        console.log(`QuizSessionManager: No quiz found in database for ${selectedContent.contentType}-${selectedContent.contentId}`);
        return null;
      }

      // Validate that all options are present and non-empty
      const options = [data.option_a, data.option_b, data.option_c, data.option_d];
      const hasValidOptions = options.every(option => option && option.trim().length > 0);
      
      if (!hasValidOptions) {
        console.log('QuizSessionManager: Quiz has blank options, skipping:', data.id);
        return null;
      }

      // Validate that the question text exists and correct_option_index is valid
      if (!data.question || data.question.trim().length === 0) {
        console.log('QuizSessionManager: Quiz has blank question, skipping:', data.id);
        return null;
      }

      if (data.correct_option_index < 0 || data.correct_option_index > 3) {
        console.log('QuizSessionManager: Quiz has invalid correct_option_index, skipping:', data.id);
        return null;
      }

      const question: QuizQuestion = {
        id: data.id,
        question: data.question,
        options,
        correctAnswer: data.correct_option_index,
        explanation: data.explanation || 'Good question!',
        sourceContentId: selectedContent.contentId,
        sourceContentType: selectedContent.contentType,
        sourceTitle: selectedContent.title
      };

      console.log(`QuizSessionManager: Successfully generated quiz question from database: "${question.question}"`);
      return question;
    } catch (error) {
      console.error('QuizSessionManager: Error generating quiz question:', error);
      return null;
    }
  }

  /**
   * Handle quiz attempt and update probabilities
   */
  async handleQuizAttempt(question: QuizQuestion, userAnswer: number): Promise<void> {
    const isCorrect = userAnswer === question.correctAnswer;
    const contentKey = `${question.sourceContentType}-${question.sourceContentId}`;
    
    // Record the attempt
    const attempt: QuizAttempt = {
      sessionId: this.session.sessionId,
      questionId: question.id,
      userAnswer,
      isCorrect,
      timeSpent: 0, // Could be tracked in UI
      attemptedAt: new Date()
    };

    // Mark this content as quizzed
    this.session.quizAttempts.add(contentKey);
    this.session.lastQuizAt = new Date();

    // Reset the content counter - user needs to see 5 more pieces before next quiz
    this.session.contentSinceLastQuiz = 0;

    console.log(`QuizSessionManager: Quiz attempt recorded - ${isCorrect ? 'Correct': 'Incorrect'}`);
    console.log(`QuizSessionManager: Reset content counter - need 5 more content views for next quiz cycle`);

    // Save attempt to database (using only fields that exist in the schema)
    try {
      await supabase
        .from('quiz_attempts')
        .insert({
          user_id: this.session.userId,
          question_id: question.id,
          selected_option_index: userAnswer,
          is_correct: isCorrect
        });
    } catch (error) {
      console.error('QuizSessionManager: Error saving quiz attempt to database:', error);
    }

    await this.saveSession();
  }


  /**
   * Reset session after quiz completion or user choice
   */
  async resetSession(): Promise<void> {
    console.log('QuizSessionManager: Resetting session');
    
    this.session = {
      userId: this.session.userId,
      sessionId: this.generateSessionId(),
      contentViewed: [],
      quizAttempts: new Set(),
      totalContentViewed: 0,
      contentSinceLastQuiz: 0,
      currentProbability: this.INITIAL_PROBABILITY,
      lastQuizAt: undefined
    };

    await this.saveSession();
  }

  /**
   * Get current session statistics
   */
  getSessionStats(): {
    totalContentViewed: number;
    contentSinceLastQuiz: number;
    quizAttempts: number;
    currentProbability: number;
    availableForQuiz: number;
    lastQuizAt?: Date;
  } {
    const availableForQuiz = this.session.contentViewed.filter(
      item => !this.session.quizAttempts.has(`${item.contentType}-${item.contentId}`)
    ).length;

    // Calculate current probability based on content since last quiz
    const contentBeyondMinimum = Math.max(0, this.session.contentSinceLastQuiz - this.MIN_CONTENT_BEFORE_QUIZ);
    const currentProbability = this.session.contentSinceLastQuiz >= this.MIN_CONTENT_BEFORE_QUIZ 
      ? Math.min(this.FIRST_QUIZ_PROBABILITY + (contentBeyondMinimum * this.PROBABILITY_INCREMENT), this.MAX_PROBABILITY)
      : 0;

    return {
      totalContentViewed: this.session.totalContentViewed,
      contentSinceLastQuiz: this.session.contentSinceLastQuiz,
      quizAttempts: this.session.quizAttempts.size,
      currentProbability,
      availableForQuiz,
      lastQuizAt: this.session.lastQuizAt
    };
  }

  /**
   * Clear all quiz session data (for debugging/reset)
   */
  async clearAllData(): Promise<void> {
    try {
      const storageKey = `${this.STORAGE_KEY_PREFIX}${this.session.userId}`;
      await AsyncStorage.removeItem(storageKey);
      console.log('QuizSessionManager: All session data cleared');
      
      await this.resetSession();
    } catch (error) {
      console.error('QuizSessionManager: Error clearing session data:', error);
    }
  }

  /**
   * Force reset session if data is corrupted (for debugging)
   */
  async forceResetSession(): Promise<void> {
    console.log('QuizSessionManager: Force resetting session due to data issues');
    
    this.session = {
      userId: this.session.userId,
      sessionId: this.generateSessionId(),
      contentViewed: [],
      quizAttempts: new Set(),
      totalContentViewed: 0,
      contentSinceLastQuiz: 0,
      currentProbability: this.INITIAL_PROBABILITY,
      lastQuizAt: undefined
    };

    await this.saveSession();
  }
}