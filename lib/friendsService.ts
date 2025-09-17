import { supabase } from './supabase';
import type {
  Friendship,
  FriendProfile,
  FriendSuggestion,
  FriendRequest,
  FriendsListItem,
  UserReferral,
  MutualFriend,
  FriendshipInfo,
  FriendshipStatus,
  FriendSearchFilters,
  LeaderboardEntry,
  FriendsLeaderboard
} from '../types/friends';
import { FriendsError, FRIENDS_ERROR_CODES } from '../types/friends';

export class FriendsService {
  /**
   * Send a friend request to another user
   */
  static async sendFriendRequest(addresseeId: string): Promise<Friendship> {
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) {
      throw new FriendsError('Not authenticated', 'UNAUTHENTICATED');
    }

    // Check if requester is trying to friend themselves
    if (currentUser.user.id === addresseeId) {
      throw new FriendsError(
        'Cannot send friend request to yourself',
        FRIENDS_ERROR_CODES.CANNOT_FRIEND_SELF
      );
    }

    // Check if addressee exists and allows friend requests
    const { data: addressee, error: addresseeError } = await supabase
      .from('profiles')
      .select('id, allow_friend_requests, privacy_settings')
      .eq('id', addresseeId)
      .single();

    if (addresseeError || !addressee) {
      throw new FriendsError('User not found', FRIENDS_ERROR_CODES.USER_NOT_FOUND);
    }

    if (!addressee.allow_friend_requests) {
      throw new FriendsError(
        'User does not allow friend requests',
        FRIENDS_ERROR_CODES.PRIVACY_RESTRICTED
      );
    }

    // Check existing friendship status
    const existingFriendship = await this.getFriendshipStatus(currentUser.user.id, addresseeId);
    if (existingFriendship.status) {
      if (existingFriendship.status === 'blocked') {
        throw new FriendsError('Cannot send request to blocked user', FRIENDS_ERROR_CODES.USER_BLOCKED);
      }
      throw new FriendsError('Friendship already exists', FRIENDS_ERROR_CODES.FRIENDSHIP_EXISTS);
    }

    const { data, error } = await supabase
      .from('friendships')
      .insert({
        requester_id: currentUser.user.id,
        addressee_id: addresseeId,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      if (error.message.includes('Too many friend requests')) {
        throw new FriendsError('Rate limit exceeded', FRIENDS_ERROR_CODES.RATE_LIMITED);
      }
      throw new FriendsError('Failed to send friend request', 'REQUEST_FAILED', error);
    }

    return data;
  }

  /**
   * Accept a friend request
   */
  static async acceptFriendRequest(friendshipId: string): Promise<void> {
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) {
      throw new FriendsError('Not authenticated', 'UNAUTHENTICATED');
    }

    const { error } = await supabase
      .from('friendships')
      .update({
        status: 'accepted',
        updated_at: new Date().toISOString()
      })
      .eq('id', friendshipId)
      .eq('addressee_id', currentUser.user.id) // Only addressee can accept
      .eq('status', 'pending'); // Only pending requests can be accepted

    if (error) {
      throw new FriendsError('Failed to accept friend request', 'ACCEPT_FAILED', error);
    }
  }

  /**
   * Decline a friend request
   */
  static async declineFriendRequest(friendshipId: string): Promise<void> {
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) {
      throw new FriendsError('Not authenticated', 'UNAUTHENTICATED');
    }

    const { error } = await supabase
      .from('friendships')
      .update({
        status: 'declined',
        updated_at: new Date().toISOString()
      })
      .eq('id', friendshipId)
      .eq('addressee_id', currentUser.user.id)
      .eq('status', 'pending');

    if (error) {
      throw new FriendsError('Failed to decline friend request', 'DECLINE_FAILED', error);
    }
  }

  /**
   * Cancel an outgoing friend request
   */
  static async cancelFriendRequest(friendshipId: string): Promise<void> {
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) {
      throw new FriendsError('Not authenticated', 'UNAUTHENTICATED');
    }

    const { data, error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId)
      .eq('requester_id', currentUser.user.id)
      .eq('status', 'pending')
      .select();

    if (error) {
      console.error('Cancel friend request error:', error);
      throw new FriendsError('Failed to cancel friend request', 'CANCEL_FAILED', error);
    }

    if (!data || data.length === 0) {
      console.warn('No friend request was deleted. Friendship may not exist or RLS policy issue.');
      // Still don't throw an error since the UI should refresh anyway
    } else {
      console.log('Successfully canceled friend request:', data[0]);
    }
  }

  /**
   * Remove a friend (unfriend)
   */
  static async removeFriend(friendshipId: string): Promise<void> {
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) {
      throw new FriendsError('Not authenticated', 'UNAUTHENTICATED');
    }

    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId)
      .or(`requester_id.eq.${currentUser.user.id},addressee_id.eq.${currentUser.user.id}`)
      .eq('status', 'accepted');

    if (error) {
      throw new FriendsError('Failed to remove friend', 'REMOVE_FAILED', error);
    }
  }

  /**
   * Block a user
   */
  static async blockUser(userId: string): Promise<void> {
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) {
      throw new FriendsError('Not authenticated', 'UNAUTHENTICATED');
    }

    // First, check if there's an existing friendship
    const { data: existingFriendship } = await supabase
      .from('friendships')
      .select('id, status')
      .or(`and(requester_id.eq.${currentUser.user.id},addressee_id.eq.${userId}),and(requester_id.eq.${userId},addressee_id.eq.${currentUser.user.id})`)
      .single();

    if (existingFriendship) {
      // Update existing friendship to blocked
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'blocked', updated_at: new Date().toISOString() })
        .eq('id', existingFriendship.id);

      if (error) {
        throw new FriendsError('Failed to block user', 'BLOCK_FAILED', error);
      }
    } else {
      // Create new blocked relationship
      const { error } = await supabase
        .from('friendships')
        .insert({
          requester_id: currentUser.user.id,
          addressee_id: userId,
          status: 'blocked'
        });

      if (error) {
        throw new FriendsError('Failed to block user', 'BLOCK_FAILED', error);
      }
    }
  }

  /**
   * Get user's friends list
   */
  static async getFriends(
    userId?: string,
    filters: FriendSearchFilters = {}
  ): Promise<FriendsListItem[]> {
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) {
      throw new FriendsError('Not authenticated', 'UNAUTHENTICATED');
    }

    const targetUserId = userId || currentUser.user.id;

    let query = supabase
      .from('friendships')
      .select(`
        id,
        requester_id,
        addressee_id,
        connection_strength,
        mutual_friends_count,
        created_at,
        requester:profiles!friendships_requester_id_fkey(
          id, full_name, avatar_url, friends_count,
          public_profile, privacy_settings
        ),
        addressee:profiles!friendships_addressee_id_fkey(
          id, full_name, avatar_url, friends_count,
          public_profile, privacy_settings
        )
      `)
      .or(`requester_id.eq.${targetUserId},addressee_id.eq.${targetUserId}`)
      .eq('status', 'accepted');

    // Apply search filter
    if (filters.query) {
      // Note: This would need to be implemented with a text search
      // For now, we'll filter on the client side
    }

    // Apply sorting
    if (filters.sort_by) {
      const order = filters.sort_order || 'desc';
      switch (filters.sort_by) {
        case 'recent':
          query = query.order('created_at', { ascending: order === 'asc' });
          break;
        case 'mutual_friends':
          query = query.order('mutual_friends_count', { ascending: order === 'asc' });
          break;
        case 'connection_strength':
          query = query.order('connection_strength', { ascending: order === 'asc' });
          break;
        case 'name':
          // Name sorting would need to be done client-side
          break;
      }
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      throw new FriendsError('Failed to fetch friends', 'FETCH_FAILED', error);
    }

    const friends: FriendsListItem[] = data?.map(friendship => {
      const friend = friendship.requester_id === targetUserId
        ? friendship.addressee
        : friendship.requester;

      return {
        id: friendship.id,
        friend: friend as unknown as FriendProfile,
        friendship_id: friendship.id,
        connection_strength: friendship.connection_strength,
        mutual_friends_count: friendship.mutual_friends_count,
        created_at: friendship.created_at
      };
    }) || [];

    // Client-side filtering for query and name sorting
    let filteredFriends = friends;

    if (filters.query) {
      const query = filters.query.toLowerCase();
      filteredFriends = friends.filter(item =>
        item.friend.full_name.toLowerCase().includes(query)
      );
    }

    if (filters.sort_by === 'name') {
      filteredFriends.sort((a, b) => {
        const comparison = a.friend.full_name.localeCompare(b.friend.full_name);
        return filters.sort_order === 'desc' ? -comparison : comparison;
      });
    }

    return filteredFriends;
  }

  /**
   * Get friend requests (incoming and outgoing)
   */
  static async getFriendRequests(): Promise<{
    incoming: FriendRequest[];
    outgoing: FriendRequest[];
  }> {
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) {
      throw new FriendsError('Not authenticated', 'UNAUTHENTICATED');
    }

    const { data, error } = await supabase
      .from('friendships')
      .select(`
        id,
        requester_id,
        addressee_id,
        status,
        created_at,
        mutual_friends_count,
        requester:profiles!friendships_requester_id_fkey(
          id, full_name, avatar_url, friends_count,
          public_profile, privacy_settings
        ),
        addressee:profiles!friendships_addressee_id_fkey(
          id, full_name, avatar_url, friends_count,
          public_profile, privacy_settings
        )
      `)
      .or(`requester_id.eq.${currentUser.user.id},addressee_id.eq.${currentUser.user.id}`)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get friend requests error:', error);
      throw new FriendsError('Failed to fetch friend requests', 'FETCH_FAILED', error);
    }

    console.log('Friend requests raw data:', data?.length || 0, 'requests found');

    const incoming: FriendRequest[] = [];
    const outgoing: FriendRequest[] = [];

    data?.forEach(friendship => {
      const request: FriendRequest = {
        id: friendship.id,
        requester: friendship.requester as unknown as FriendProfile,
        addressee: friendship.addressee as unknown as FriendProfile,
        status: friendship.status as FriendshipStatus,
        created_at: friendship.created_at,
        mutual_friends_count: friendship.mutual_friends_count
      };

      if (friendship.addressee_id === currentUser.user.id) {
        incoming.push(request);
      } else {
        outgoing.push(request);
      }
    });

    console.log(`Friend requests processed: ${incoming.length} incoming, ${outgoing.length} outgoing`);

    return { incoming, outgoing };
  }

  /**
   * Get friend suggestions
   */
  static async getFriendSuggestions(limit: number = 10): Promise<FriendSuggestion[]> {
    console.log('🔍 getFriendSuggestions called with limit:', limit);

    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) {
      console.error('❌ getFriendSuggestions: User not authenticated');
      throw new FriendsError('Not authenticated', 'UNAUTHENTICATED');
    }

    console.log('✅ getFriendSuggestions: User authenticated:', currentUser.user.id);

    try {
      // Always use the RPC function to get fresh data with profile information
    console.log('🔄 Skipping cache, using RPC function for fresh profile data');

    // Use RPC function to get suggestions with profile data
    const { data, error } = await supabase.rpc('generate_friend_suggestions', {
      p_user_id: currentUser.user.id,
      p_limit: limit
    });

    if (error) {
      console.error('RPC generate_friend_suggestions error:', error);
      throw new FriendsError('Failed to generate friend suggestions', 'SUGGESTIONS_FAILED', error);
    }

    console.log('Friend suggestions RPC result:', data?.length || 0, 'suggestions returned');
    console.log('First suggestion sample:', data?.[0]);

    // Cache the new suggestions
    if (data && data.length > 0) {
      const suggestionsToCache = data.map((suggestion: any) => ({
        user_id: currentUser.user.id,
        suggested_user_id: suggestion.suggested_user_id,
        suggestion_score: suggestion.suggestion_score,
        mutual_friends_count: suggestion.mutual_friends_count,
        same_industry: suggestion.same_industry,
        suggestion_reasons: JSON.stringify([
          ...(suggestion.mutual_friends_count > 0 ? [`${suggestion.mutual_friends_count} mutual friends`] : []),
          ...(suggestion.same_industry ? ['Same industry'] : [])
        ])
      }));

      await supabase
        .from('friend_suggestions')
        .insert(suggestionsToCache);
    }

    const mappedSuggestions = data?.map((suggestion: any) => {
      console.log('Mapping suggestion:', suggestion.suggested_user_id, 'name:', suggestion.full_name);
      return {
        id: suggestion.id || suggestion.suggested_user_id,
        user_id: currentUser.user.id,
        suggested_user_id: suggestion.suggested_user_id,
        suggestion_score: suggestion.suggestion_score,
        mutual_friends_count: suggestion.mutual_friends_count || 0,
        same_industry: suggestion.same_industry || false,
        full_name: suggestion.full_name || 'Unknown User',
        avatar_url: suggestion.avatar_url || null,
        friends_count: suggestion.friends_count || 0,
        created_at: new Date().toISOString(),
        suggestion_reasons: Array.isArray(suggestion.suggestion_reasons)
          ? suggestion.suggestion_reasons
          : suggestion.suggestion_reasons
          ? [suggestion.suggestion_reasons]
          : ['Suggested for you']
      };
    }) || [];

    console.log('Final mapped suggestions:', mappedSuggestions.length, 'suggestions');
    console.log('First mapped suggestion:', mappedSuggestions[0]);

    return mappedSuggestions;

    } catch (error) {
      console.error('🚨 getFriendSuggestions: Unexpected error:', error);
      if (error instanceof FriendsError) {
        throw error;
      } else {
        throw new FriendsError('Unable to load friend suggestions', 'SUGGESTIONS_FAILED', error);
      }
    }
  }

  /**
   * Dismiss a friend suggestion
   */
  static async dismissFriendSuggestion(suggestionId: string): Promise<void> {
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) {
      throw new FriendsError('Not authenticated', 'UNAUTHENTICATED');
    }

    const { error } = await supabase
      .from('friend_suggestions')
      .update({ dismissed_at: new Date().toISOString() })
      .eq('id', suggestionId)
      .eq('user_id', currentUser.user.id);

    if (error) {
      throw new FriendsError('Failed to dismiss suggestion', 'DISMISS_FAILED', error);
    }
  }

  /**
   * Get friendship status between two users
   */
  static async getFriendshipStatus(userId: string, otherUserId: string): Promise<FriendshipInfo> {
    const { data, error } = await supabase
      .from('friendships')
      .select('id, status, requester_id, addressee_id, mutual_friends_count')
      .or(`and(requester_id.eq.${userId},addressee_id.eq.${otherUserId}),and(requester_id.eq.${otherUserId},addressee_id.eq.${userId})`)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new FriendsError('Failed to check friendship status', 'STATUS_CHECK_FAILED', error);
    }

    if (!data) {
      return {
        status: null,
        can_send_request: true,
        is_blocked: false,
        mutual_friends_count: 0
      };
    }

    const direction = data.requester_id === userId ? 'outgoing' : 'incoming';
    const isBlocked = data.status === 'blocked';

    return {
      status: data.status as FriendshipStatus,
      direction,
      friendship_id: data.id,
      can_send_request: !data.status || data.status === 'declined',
      is_blocked: isBlocked,
      mutual_friends_count: data.mutual_friends_count || 0
    };
  }

  /**
   * Get mutual friends between current user and another user
   */
  static async getMutualFriends(otherUserId: string): Promise<MutualFriend[]> {
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) {
      throw new FriendsError('Not authenticated', 'UNAUTHENTICATED');
    }

    const { data, error } = await supabase.rpc('get_mutual_friends', {
      user1_id: currentUser.user.id,
      user2_id: otherUserId
    });

    if (error) {
      throw new FriendsError('Failed to fetch mutual friends', 'MUTUAL_FRIENDS_FAILED', error);
    }

    return data || [];
  }

  /**
   * Search for users (for sending friend requests)
   */
  static async searchUsers(
    query: string,
    limit: number = 20
  ): Promise<FriendProfile[]> {
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) {
      throw new FriendsError('Not authenticated', 'UNAUTHENTICATED');
    }

    if (query.length < 2) {
      return [];
    }

    // Get users that match the query and are discoverable
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, friends_count, public_profile, allow_friend_requests, discoverable, privacy_settings')
      .ilike('full_name', `%${query}%`)
      .eq('discoverable', true)
      .neq('id', currentUser.user.id)
      .limit(limit);

    if (error) {
      throw new FriendsError('Failed to search users', 'SEARCH_FAILED', error);
    }

    return data as FriendProfile[] || [];
  }

  /**
   * Get friends-enhanced leaderboard
   */
  static async getFriendsLeaderboard(): Promise<FriendsLeaderboard> {
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) {
      throw new FriendsError('Not authenticated', 'UNAUTHENTICATED');
    }

    // Get user's friends
    const friends = await this.getFriends();
    const friendIds = friends.map(f => f.friend.id);

    // Get global leaderboard
    const { data: globalLeaderboard, error: globalError } = await supabase
      .from('leaderboard')
      .select('*')
      .order('total_voltz_earned', { ascending: false })
      .limit(100);

    if (globalError) {
      throw new FriendsError('Failed to fetch leaderboard', 'LEADERBOARD_FAILED', globalError);
    }

    // Enhance with friend information
    const enhancedGlobal: LeaderboardEntry[] = globalLeaderboard?.map((entry, index) => ({
      ...entry,
      rank: index + 1,
      is_friend: friendIds.includes(entry.user_id),
      friends_count: 0 // This would need to be added to the leaderboard view
    })) || [];

    // Filter for friends only
    const friendsOnly = enhancedGlobal.filter(entry => entry.is_friend);

    // Find user's rank
    const userGlobalRank = enhancedGlobal.findIndex(entry => entry.user_id === currentUser.user.id) + 1;
    const userFriendsRank = friendsOnly.findIndex(entry => entry.user_id === currentUser.user.id) + 1;

    return {
      friends_only: friendsOnly,
      global_with_friends_highlighted: enhancedGlobal,
      user_rank: {
        global: userGlobalRank || 0,
        among_friends: userFriendsRank || 0
      }
    };
  }

  /**
   * Generate or get user's referral code
   */
  static async getReferralCode(): Promise<string> {
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) {
      throw new FriendsError('Not authenticated', 'UNAUTHENTICATED');
    }

    // Check if user already has a referral code
    const { data: profile } = await supabase
      .from('profiles')
      .select('referral_code')
      .eq('id', currentUser.user.id)
      .single();

    if (profile?.referral_code) {
      return profile.referral_code;
    }

    // Generate new referral code
    const { data, error } = await supabase.rpc('generate_referral_code', {
      user_id: currentUser.user.id
    });

    if (error) {
      throw new FriendsError('Failed to generate referral code', 'REFERRAL_CODE_FAILED', error);
    }

    // Update user's profile with the new code
    await supabase
      .from('profiles')
      .update({ referral_code: data })
      .eq('id', currentUser.user.id);

    return data;
  }

  /**
   * Process referral rewards (typically called by a scheduled function)
   */
  static async processReferralRewards(): Promise<void> {
    const { error } = await supabase.rpc('process_referral_rewards');

    if (error) {
      throw new FriendsError('Failed to process referral rewards', 'REWARDS_PROCESSING_FAILED', error);
    }
  }
}