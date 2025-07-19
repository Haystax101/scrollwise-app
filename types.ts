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

export type ContentType = 'research' | 'book' | 'news' | 'article' | 'insight';

export interface InsightAuthor {
  name: string;
  handle: string;
  avatar: string;
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
  author_id: string;
  author_name: string;
  author_avatar: string;
}

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
  industry_id: number;
  likes_count: number;
  saves_count: number;
  comments_count: number;
  // Insight-specific fields
  author?: InsightAuthor;
  question?: string;
}

export type Article = Video;
export type FeedItem = Article | Insight;

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
