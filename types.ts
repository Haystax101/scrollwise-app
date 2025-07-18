// Using React.ReactElement for icons from lucide-react-native is generally fine.
// No specific changes needed unless stricter typing for icon components is desired.
// For simplicity, ReactNode is acceptable as lucide-react-native icons are React components.
import type { ReactElement } from 'react'; 

export interface User {
  email: string;
  name: string;
}

export interface Industry {
  id: number; // Changed to number to match new usage in Onboarding and database
  name: string;
  description: string;
  icon: ReactElement; // lucide-react-native icons are ReactElements
  color: string; // Tailwind background color class for icon container
}

export type ExperienceLevel = 'Student' | 'Working Professional' | 'Researcher' | 'Enthusiast';

export interface Article {
  id: number;
  type: 'paper' | 'book' | 'article';
  title: string;
  caption: string;
  source: string; // This will be the source_url from Supabase
  industry: string;
  video_url?: string; // Optional video support
  likes: number;
  saves: number;
  comments: number;
  views: number; // Add view count
  content: string; // Article text content
  authors: string[]; // Array of author names
  created_at: string; // Publication date
}

// Keep Video interface for backward compatibility if needed
export interface Video {
  id: number;
  type: 'paper' | 'book' | 'article';
  title: string;
  caption: string;
  source: string; // This will be the source_url from Supabase
  industry: string;
  video_url?: string; // Optional video support
  likes: number;
  saves: number;
  comments: number;
  views: number; // Add view count
  content: string; // Add content field
  authors: string[]; // Array of author names
  created_at: string; // Publication date
}

export interface SavedContentItem {
  id: number;
  title: string;
  type: string;
  date: string;
}

export type ScreenName = 'signIn' | 'signUp' | 'onboarding' | 'feed' | 'discover' | 'profile' | 'settings' | 'chats';

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
  industries: number[];
  initialReelId?: number;
}
