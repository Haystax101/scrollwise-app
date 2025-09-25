// Using React.ReactElement for icons from lucide-react-native is generally fine.
// No specific changes needed unless stricter typing for icon components is desired.
// For simplicity, ReactNode is acceptable as lucide-react-native icons are React components.
import type { ReactElement } from 'react';

// Re-export friends types for easy access
export * from './types/friends'; 

export interface User {
  email: string;
  name: string;
}

export interface Industry {
  id: string; // Changed to string for UUID
  name: string;
  description?: string;
  icon_name?: string;
  color?: string;
}

export type ExperienceLevel = 'Student' | 'Working Professional' | 'Researcher' | 'Enthusiast';

export type ContentType = 'paper' | 'book' | 'article' | 'insight';

export interface InsightAuthor {
  name: string;
  handle: string;
  avatar: string;
  tagline?: string;
  // Expanded details
  role: string;
  company: string;
  industry: string;
  location: string;
  currentProject: string;
  projectTags: string[];
}

export interface Insight {
  id: string;
  type: 'insight';
  content: string;
  author: InsightAuthor;
  title: string;
  site_name?: string;
  industry_id?: string;
  likes_count?: number;
  saves_count?: number;
  comments_count?: number;
  views_count?: number;
  created_at?: string;
  link?: string;
}

// Base interface for all content types
export interface BaseContent {
  id: number;
  title: string;
  link: string;
  created_at: string;
  date?: string;
  site_name?: string;
  industry_id: string; // UUID
  likes_count: number;
  saves_count: number;
  comments_count: number;
  views_count: number;
}

export interface Article extends BaseContent {
  type: 'article';
  summary: string;
  longer_summary?: string; // For expanded view, falls back to summary if not available
  author?: string;
}

export interface Paper extends BaseContent {
  type: 'paper';
  content_simple: string;
  content_complex: string;
  authors: string[];
}

export interface Book extends BaseContent {
  type: 'book';
  author: string;
  year?: number;
  short_summary: string;
  key_insights?: string[];
}

// Legacy Video interface for backward compatibility
export interface Video {
  id: number;
  title: string;
  description: string;
  source_url: string;
  video_url?: string;
  thumbnail_url?: string;
  authors: string[];
  content: string;
  likes: number;
  saves: number;
  comments: number;
  views: number;
  type: ContentType;
  created_at: string;
  date: string;
  file_name?: string;
  industry_id: string; // Changed to string for UUID
  likes_count: number;
  saves_count: number;
  comments_count: number;
  // Insight-specific fields
  author?: InsightAuthor;
  question?: string;
}

export type FeedItem = Article | Paper | Book | Insight;

export interface SavedContentItem {
  id: number;
  title: string;
  type: string;
  date: string;
}

export type ScreenName = 'onboarding' | 'feed' | 'discover' | 'people' | 'profile' | 'settings' | 'chats';

export interface UserData {
  name: string;
  email: string;
  joinDate: string;
  interests: string[];
  stats: {
    videosWatched: number;
    minutesLearned: number;
    topicsExplored: number;
    daysStreak: number;
  };
  savedContent: SavedContentItem[];
}

export interface SearchResultUser {
  type: 'user';
  id: number;
  name: string;
  role: string;
  avatar: string; // URL for the image
}

export interface SearchResultPost {
  type: 'post';
  id: number;
  title:string;
  author: string;
  thumbnail: string; // URL for the image
}

export type SearchResult = SearchResultUser | SearchResultPost;

export interface MainFeedProps {
  industries: Industry[];
  initialReelId?: number;
}

// Quiz system interfaces
export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // Index of correct option
  explanation?: string;
  sourceContentId: number | string;
  sourceContentType: ContentType;
  sourceTitle: string;
}

export interface QuizSession {
  userId: string;
  sessionId: string;
  contentViewed: Array<{
    contentId: number | string;
    contentType: ContentType;
    title: string;
    viewedAt: Date;
  }>;
  quizAttempts: Set<string>; // Content IDs that have been quizzed
  totalContentViewed: number;
  contentSinceLastQuiz: number; // Track content viewed since last quiz
  currentProbability: number;
  lastQuizAt?: Date;
}

export interface QuizAttempt {
  sessionId: string;
  questionId: string;
  userAnswer: number;
  isCorrect: boolean;
  timeSpent: number; // in seconds
  attemptedAt: Date;
}

export interface QuizOverlay {
  visible: boolean;
  question: QuizQuestion;
  onAnswer: (answerIndex: number) => void;
  onClose: () => void;
}
