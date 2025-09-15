// Friends System TypeScript Types

export type FriendshipStatus = 'pending' | 'accepted' | 'blocked' | 'declined';
export type ReferralStatus = 'pending' | 'registered' | 'completed' | 'expired';

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  created_at: string;
  updated_at: string;
  connection_strength?: number;
  mutual_friends_count: number;
  interaction_score?: number;
}

export interface FriendProfile {
  id: string;
  full_name: string;
  avatar_url?: string;
  industry_id?: string;
  friends_count: number;
  public_profile: boolean;
  allow_friend_requests: boolean;
  discoverable: boolean;
  privacy_settings: {
    discoverable: boolean;
    allow_friend_requests: boolean;
    show_mutual_friends: boolean;
    show_in_suggestions: boolean;
    public_friend_list: boolean;
  };
}

export interface FriendSuggestion {
  id: string;
  user_id: string;
  suggested_user_id: string;
  suggestion_score: number;
  mutual_friends_count: number;
  same_industry: boolean;
  full_name: string;
  avatar_url?: string;
  suggestion_reasons?: string[];
  interaction_history_score?: number;
  created_at: string;
  shown_at?: string;
  dismissed_at?: string;
}

export interface UserReferral {
  id: string;
  referrer_id?: string;
  referral_code: string;
  referred_email?: string;
  referred_user_id?: string;
  status: ReferralStatus;
  shared_content_type?: 'article' | 'paper' | 'book' | 'insight';
  shared_content_id?: string;
  referral_source?: 'ios_share' | 'email' | 'link' | 'direct';
  created_at: string;
  completed_at?: string;
  reward_given: boolean;
  reward_amount: number;
}

export interface MutualFriend {
  mutual_friend_id: string;
  mutual_friend_name: string;
  avatar_url?: string;
}

export interface FriendRequest {
  id: string;
  requester: FriendProfile;
  addressee: FriendProfile;
  status: FriendshipStatus;
  created_at: string;
  mutual_friends_count: number;
}

export interface FriendsListItem {
  id: string;
  friend: FriendProfile;
  friendship_id: string;
  connection_strength?: number;
  mutual_friends_count: number;
  created_at: string;
}

export interface ShareContent {
  type: 'article' | 'paper' | 'book' | 'insight';
  id: string;
  title: string;
  url?: string;
}

export interface InviteData {
  referral_code: string;
  invite_url: string;
  shared_content?: ShareContent;
}

// API Response types
export interface FriendsApiResponse<T> {
  data: T;
  error?: string;
  success: boolean;
}

export interface PaginatedFriendsResponse<T> {
  data: T[];
  count: number;
  next_cursor?: string;
  has_more: boolean;
}

// Search and filtering types
export interface FriendSearchFilters {
  query?: string;
  industry_id?: string;
  mutual_friends_min?: number;
  sort_by?: 'name' | 'recent' | 'mutual_friends' | 'connection_strength';
  sort_order?: 'asc' | 'desc';
}

export interface FriendSuggestionFilters {
  limit?: number;
  min_score?: number;
  same_industry_only?: boolean;
  exclude_dismissed?: boolean;
}

// Leaderboard types (enhanced for friends)
export interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  avatar_url?: string;
  total_voltz_earned: number;
  rank: number;
  is_friend: boolean;
  friends_count: number;
}

export interface FriendsLeaderboard {
  friends_only: LeaderboardEntry[];
  global_with_friends_highlighted: LeaderboardEntry[];
  user_rank: {
    global: number;
    among_friends: number;
  };
}

// Privacy and settings types
export interface FriendPrivacySettings {
  discoverable: boolean;
  allow_friend_requests: boolean;
  show_mutual_friends: boolean;
  show_in_suggestions: boolean;
  public_friend_list: boolean;
}

export interface FriendNotificationSettings {
  friend_requests: boolean;
  friend_accepts: boolean;
  friend_activity: boolean;
  mutual_friend_joins: boolean;
}

// Analytics and tracking types
export interface FriendEngagementMetrics {
  requests_sent: number;
  requests_received: number;
  requests_accepted: number;
  requests_declined: number;
  friends_total: number;
  suggestions_viewed: number;
  suggestions_accepted: number;
  referrals_sent: number;
  referrals_completed: number;
}

export interface FriendInteraction {
  type: 'profile_view' | 'message_sent' | 'content_shared' | 'mutual_interaction';
  timestamp: string;
  metadata?: Record<string, any>;
}

// UI Component Props types
export interface FriendCardProps {
  friend: FriendProfile;
  friendship?: Friendship;
  mutual_friends_count: number;
  onViewProfile: (userId: string) => void;
  onRemoveFriend?: (friendshipId: string) => void;
  showMutualFriends?: boolean;
}

export interface FriendSuggestionCardProps {
  suggestion: FriendSuggestion;
  onSendRequest: (userId: string) => void;
  onDismiss: (suggestionId: string) => void;
  onViewProfile: (userId: string) => void;
  loading?: boolean;
}

export interface FriendRequestCardProps {
  request: FriendRequest;
  onAccept: (friendshipId: string) => void;
  onDecline: (friendshipId: string) => void;
  onViewProfile: (userId: string) => void;
  loading?: boolean;
}

// State management types
export interface FriendsState {
  friends: FriendsListItem[];
  friendRequests: FriendRequest[];
  friendSuggestions: FriendSuggestion[];
  leaderboard: FriendsLeaderboard | null;
  loading: {
    friends: boolean;
    requests: boolean;
    suggestions: boolean;
    leaderboard: boolean;
  };
  errors: {
    friends?: string;
    requests?: string;
    suggestions?: string;
    leaderboard?: string;
  };
}

// Hook return types
export interface UseFriendsReturn {
  friends: FriendsListItem[];
  loading: boolean;
  error?: string;
  refreshFriends: () => Promise<void>;
  removeFriend: (friendshipId: string) => Promise<void>;
  searchFriends: (query: string) => Promise<FriendsListItem[]>;
}

export interface UseFriendRequestsReturn {
  incomingRequests: FriendRequest[];
  outgoingRequests: FriendRequest[];
  loading: boolean;
  error?: string;
  sendFriendRequest: (userId: string) => Promise<void>;
  acceptFriendRequest: (friendshipId: string) => Promise<void>;
  declineFriendRequest: (friendshipId: string) => Promise<void>;
  cancelFriendRequest: (friendshipId: string) => Promise<void>;
}

export interface UseFriendSuggestionsReturn {
  suggestions: FriendSuggestion[];
  loading: boolean;
  error?: string;
  refreshSuggestions: () => Promise<void>;
  dismissSuggestion: (suggestionId: string) => Promise<void>;
  sendRequestFromSuggestion: (userId: string) => Promise<void>;
}

// Utility types
export type FriendshipDirection = 'outgoing' | 'incoming' | 'mutual';

export interface FriendshipInfo {
  status: FriendshipStatus | null;
  direction?: FriendshipDirection;
  friendship_id?: string;
  can_send_request: boolean;
  is_blocked: boolean;
  mutual_friends_count: number;
}

// Error types
export class FriendsError extends Error {
  code: string;
  details?: any;

  constructor(message: string, code: string, details?: any) {
    super(message);
    this.name = 'FriendsError';
    this.code = code;
    this.details = details;
  }
}

export const FRIENDS_ERROR_CODES = {
  FRIENDSHIP_EXISTS: 'FRIENDSHIP_EXISTS',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  CANNOT_FRIEND_SELF: 'CANNOT_FRIEND_SELF',
  USER_BLOCKED: 'USER_BLOCKED',
  PRIVACY_RESTRICTED: 'PRIVACY_RESTRICTED',
  RATE_LIMITED: 'RATE_LIMITED',
  FRIENDSHIP_NOT_FOUND: 'FRIENDSHIP_NOT_FOUND',
  INVALID_STATUS_TRANSITION: 'INVALID_STATUS_TRANSITION',
  REFERRAL_CODE_INVALID: 'REFERRAL_CODE_INVALID',
  REFERRAL_EXPIRED: 'REFERRAL_EXPIRED',
} as const;

export type FriendsErrorCode = typeof FRIENDS_ERROR_CODES[keyof typeof FRIENDS_ERROR_CODES];