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

export interface Video {
  id: number;
  type: 'research' | 'book' | 'news';
  title: string;
  caption: string;
  source: string; // This will be the source_url from Supabase
  industry: string;
  video_url: string; // Add this property for video playback
  likes: number;
  saves: number;
  comments: number;
  content: string; // Add content field
}

export interface SavedContentItem {
  id: number;
  title: string;
  type: string;
  date: string;
}

export type ScreenName = 'signIn' | 'signUp' | 'onboarding' | 'feed' | 'discover' | 'profile' | 'settings';

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
