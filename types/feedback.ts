/**
 * Feedback System Types
 *
 * Types for the feedback and feature request system
 */

export interface Feedback {
  id: string;
  user_id: string;
  title: string;
  body: string;
  status: 'under_review' | 'in_progress' | 'completed' | 'declined' | 'planned';
  upvotes_count: number;
  downvotes_count: number;
  dev_response: string | null;
  dev_response_at: string | null;
  created_at: string;
  updated_at: string;
  profiles?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
}

export type SortOption = 'top' | 'newest' | 'oldest';

export interface FeedbackVote {
  feedback_id: string;
  user_id: string;
  created_at: string;
}

export interface FeedbackFormData {
  title: string;
  body: string;
}

export interface FeedbackFilters {
  searchQuery: string;
  sortBy: SortOption;
}
