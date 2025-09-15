# Friends System Implementation Plan

## Executive Summary

This plan outlines a comprehensive friends system for the social learning platform, designed to be scalable, future-proof, and extensible for viral growth. The system will enable bidirectional friend connections, smart friend suggestions, and viral content sharing capabilities.

## Research Foundation

### Industry Best Practices

Based on research into major platforms (Facebook, LinkedIn, Twitter), modern friend systems require:

1. **Graph Database Architecture**: Traditional RDBMS becomes slow at scale. Major platforms use graph databases or cached graph structures above MySQL.
2. **Geographic Clustering**: Users are more likely to be friends with geographically close users. Partition by country/city to reduce connection jumps.
3. **Incremental Development**: Build for today's needs, not projected 5-year scale. Facebook didn't design for 400M users on day one.
4. **Smart Sharding**: Use hash-based sharding for even distribution while keeping related data co-located.

### Friend Suggestion Algorithms

Research shows effective approaches include:
- **Common Neighbors (CN)**: Most fundamental algorithm - mutual friends drive suggestions
- **Jaccard Similarity**: Size of intersection divided by size of union of friend sets
- **GraphSAGE**: Modern GNN approach for large-scale friend recommendations
- **CCPA Algorithm**: Common Neighbor and Centrality based Parameterized Algorithm for complex networks

## Current State Analysis

### Existing Schema
- ✅ `profiles` table with UUID primary keys
- ✅ Basic `connections` table (user_id_1, user_id_2) 
- ✅ Engagement tables (likes, saves, comments, views)
- ✅ Industry-based user segmentation

### Identified Gaps
- ❌ No friend request/approval workflow
- ❌ No friend status tracking
- ❌ No friendship metadata (mutual friends count, connection strength)
- ❌ No referral/invitation system
- ❌ No social sharing capabilities

## Database Schema Enhancement

### 1. Enhanced Friendships Table

Replace the basic `connections` table with a comprehensive friendship system:

```sql
-- Drop the existing connections table and replace with friendships
DROP TABLE IF EXISTS public.connections;

CREATE TABLE public.friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES public.profiles(id),
  addressee_id uuid NOT NULL REFERENCES public.profiles(id),
  status friendship_status NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  connection_strength numeric DEFAULT 0 CHECK (connection_strength >= 0 AND connection_strength <= 1),
  mutual_friends_count integer DEFAULT 0,
  interaction_score numeric DEFAULT 0,
  
  -- Constraints
  CONSTRAINT friendships_unique_pair UNIQUE (requester_id, addressee_id),
  CONSTRAINT friendships_no_self_reference CHECK (requester_id != addressee_id)
);

-- Custom enum for friendship status
CREATE TYPE friendship_status AS ENUM (
  'pending',
  'accepted', 
  'blocked',
  'declined'
);

-- Indexes for performance
CREATE INDEX idx_friendships_requester_status ON public.friendships(requester_id, status);
CREATE INDEX idx_friendships_addressee_status ON public.friendships(addressee_id, status);
CREATE INDEX idx_friendships_status_created ON public.friendships(status, created_at);
CREATE INDEX idx_friendships_connection_strength ON public.friendships(connection_strength DESC) WHERE status = 'accepted';
```

### 2. Friend Requests System

```sql
-- Function to ensure bidirectional friendship uniqueness
CREATE OR REPLACE FUNCTION ensure_friendship_uniqueness()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if reverse friendship exists
  IF EXISTS (
    SELECT 1 FROM public.friendships 
    WHERE requester_id = NEW.addressee_id 
    AND addressee_id = NEW.requester_id
  ) THEN
    RAISE EXCEPTION 'Friendship relationship already exists in reverse direction';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER friendship_uniqueness_trigger
  BEFORE INSERT ON public.friendships
  FOR EACH ROW
  EXECUTE FUNCTION ensure_friendship_uniqueness();
```

### 3. Referral & Invitation System

```sql
CREATE TABLE public.user_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid REFERENCES public.profiles(id),
  referral_code varchar(20) UNIQUE NOT NULL,
  referred_email varchar(255),
  referred_user_id uuid REFERENCES public.profiles(id),
  status referral_status NOT NULL DEFAULT 'pending',
  shared_content_type varchar(50), -- 'article', 'paper', 'book', 'insight'
  shared_content_id varchar(100),
  referral_source varchar(50), -- 'ios_share', 'email', 'link'
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone,
  
  -- Reward tracking
  reward_given boolean DEFAULT false,
  reward_amount integer DEFAULT 0,
  
  CONSTRAINT referrals_valid_content CHECK (
    (shared_content_type IS NULL AND shared_content_id IS NULL) OR
    (shared_content_type IS NOT NULL AND shared_content_id IS NOT NULL)
  )
);

CREATE TYPE referral_status AS ENUM (
  'pending',     -- Invitation sent, not yet signed up
  'registered',  -- User signed up but hasn't completed onboarding
  'completed',   -- User completed onboarding
  'expired'      -- Referral link expired
);

-- Indexes
CREATE INDEX idx_referrals_referrer_status ON public.user_referrals(referrer_id, status);
CREATE INDEX idx_referrals_code ON public.user_referrals(referral_code);
CREATE INDEX idx_referrals_email ON public.user_referrals(referred_email) WHERE referred_user_id IS NULL;
```

### 4. Friend Suggestions Cache

```sql
CREATE TABLE public.friend_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  suggested_user_id uuid NOT NULL REFERENCES public.profiles(id),
  suggestion_score numeric NOT NULL CHECK (suggestion_score >= 0 AND suggestion_score <= 1),
  suggestion_reasons jsonb DEFAULT '{}',
  mutual_friends_count integer DEFAULT 0,
  same_industry boolean DEFAULT false,
  interaction_history_score numeric DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  shown_at timestamp with time zone,
  dismissed_at timestamp with time zone,
  
  CONSTRAINT friend_suggestions_unique UNIQUE (user_id, suggested_user_id),
  CONSTRAINT friend_suggestions_no_self CHECK (user_id != suggested_user_id)
);

-- Indexes for efficient querying
CREATE INDEX idx_friend_suggestions_user_score ON public.friend_suggestions(user_id, suggestion_score DESC) 
  WHERE dismissed_at IS NULL;
CREATE INDEX idx_friend_suggestions_created ON public.friend_suggestions(created_at);
```

### 5. Enhanced Profile Extensions

```sql
-- Add social-related fields to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS 
  friends_count integer DEFAULT 0,
  public_profile boolean DEFAULT true,
  allow_friend_requests boolean DEFAULT true,
  discoverable boolean DEFAULT true,
  referral_code varchar(20) UNIQUE;

-- Update friends_count field automatically
CREATE OR REPLACE FUNCTION update_friends_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update for both users in the friendship
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    -- Friendship accepted - increment both counts
    UPDATE public.profiles SET friends_count = friends_count + 1 
    WHERE id = NEW.requester_id OR id = NEW.addressee_id;
  ELSIF OLD.status = 'accepted' AND NEW.status != 'accepted' THEN
    -- Friendship ended - decrement both counts
    UPDATE public.profiles SET friends_count = GREATEST(friends_count - 1, 0) 
    WHERE id = NEW.requester_id OR id = NEW.addressee_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER friendship_count_trigger
  AFTER UPDATE ON public.friendships
  FOR EACH ROW
  EXECUTE FUNCTION update_friends_count();
```

## Performance Optimizations

### 1. Query Optimization Strategies

```sql
-- Materialized view for mutual friends calculation
CREATE MATERIALIZED VIEW mutual_friends_matrix AS
SELECT 
  f1.requester_id as user1_id,
  f2.requester_id as user2_id,
  COUNT(*) as mutual_count
FROM public.friendships f1
JOIN public.friendships f2 ON f1.addressee_id = f2.addressee_id
WHERE f1.status = 'accepted' 
  AND f2.status = 'accepted' 
  AND f1.requester_id != f2.requester_id
GROUP BY f1.requester_id, f2.requester_id;

-- Refresh strategy
CREATE INDEX idx_mutual_friends_matrix_user1 ON mutual_friends_matrix(user1_id);
CREATE INDEX idx_mutual_friends_matrix_user2 ON mutual_friends_matrix(user2_id);
```

### 2. Caching Strategy

```sql
-- Friendship cache table for ultra-fast lookups
CREATE TABLE public.friendship_cache (
  user_id uuid NOT NULL,
  friend_ids uuid[] NOT NULL,
  last_updated timestamp with time zone NOT NULL DEFAULT now(),
  
  CONSTRAINT friendship_cache_pkey PRIMARY KEY (user_id),
  CONSTRAINT friendship_cache_user_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

-- Update cache function
CREATE OR REPLACE FUNCTION refresh_friendship_cache(target_user_id uuid)
RETURNS void AS $$
BEGIN
  INSERT INTO public.friendship_cache (user_id, friend_ids)
  SELECT 
    target_user_id,
    ARRAY_AGG(
      CASE 
        WHEN requester_id = target_user_id THEN addressee_id
        ELSE requester_id
      END
    )
  FROM public.friendships
  WHERE (requester_id = target_user_id OR addressee_id = target_user_id)
    AND status = 'accepted'
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    friend_ids = EXCLUDED.friend_ids,
    last_updated = now();
END;
$$ LANGUAGE plpgsql;
```

### 3. Database Function Library

```sql
-- Get mutual friends between two users
CREATE OR REPLACE FUNCTION get_mutual_friends(user1_id uuid, user2_id uuid)
RETURNS TABLE(mutual_friend_id uuid, mutual_friend_name text) AS $$
BEGIN
  RETURN QUERY
  WITH user1_friends AS (
    SELECT CASE 
      WHEN requester_id = user1_id THEN addressee_id
      ELSE requester_id
    END as friend_id
    FROM public.friendships
    WHERE (requester_id = user1_id OR addressee_id = user1_id)
      AND status = 'accepted'
  ),
  user2_friends AS (
    SELECT CASE 
      WHEN requester_id = user2_id THEN addressee_id
      ELSE requester_id
    END as friend_id
    FROM public.friendships
    WHERE (requester_id = user2_id OR addressee_id = user2_id)
      AND status = 'accepted'
  )
  SELECT u1f.friend_id, p.full_name
  FROM user1_friends u1f
  JOIN user2_friends u2f ON u1f.friend_id = u2f.friend_id
  JOIN public.profiles p ON p.id = u1f.friend_id;
END;
$$ LANGUAGE plpgsql;

-- Friend suggestion algorithm
CREATE OR REPLACE FUNCTION generate_friend_suggestions(target_user_id uuid, limit_count integer DEFAULT 10)
RETURNS TABLE(
  suggested_user_id uuid,
  suggestion_score numeric,
  mutual_friends_count integer,
  same_industry boolean
) AS $$
BEGIN
  RETURN QUERY
  WITH current_user_info AS (
    SELECT industry_id FROM user_industries WHERE user_id = target_user_id LIMIT 1
  ),
  existing_friends AS (
    SELECT CASE 
      WHEN requester_id = target_user_id THEN addressee_id
      ELSE requester_id
    END as friend_id
    FROM public.friendships
    WHERE (requester_id = target_user_id OR addressee_id = target_user_id)
      AND status IN ('accepted', 'pending')
  ),
  friend_of_friends AS (
    SELECT 
      CASE 
        WHEN f.requester_id = ef.friend_id THEN f.addressee_id
        ELSE f.requester_id
      END as potential_friend_id,
      COUNT(*) as mutual_count
    FROM existing_friends ef
    JOIN public.friendships f ON (f.requester_id = ef.friend_id OR f.addressee_id = ef.friend_id)
    WHERE f.status = 'accepted'
      AND CASE 
        WHEN f.requester_id = ef.friend_id THEN f.addressee_id
        ELSE f.requester_id
      END NOT IN (SELECT friend_id FROM existing_friends)
      AND CASE 
        WHEN f.requester_id = ef.friend_id THEN f.addressee_id
        ELSE f.requester_id
      END != target_user_id
    GROUP BY potential_friend_id
  ),
  suggestions AS (
    SELECT 
      fof.potential_friend_id,
      fof.mutual_count,
      p.industry_id = cui.industry_id as same_industry,
      -- Score calculation: 60% mutual friends + 40% same industry
      (fof.mutual_count::numeric / 10.0 * 0.6) + 
      (CASE WHEN p.industry_id = cui.industry_id THEN 0.4 ELSE 0 END) as score
    FROM friend_of_friends fof
    JOIN public.profiles p ON p.id = fof.potential_friend_id
    CROSS JOIN current_user_info cui
    WHERE p.allow_friend_requests = true
      AND p.discoverable = true
  )
  SELECT 
    s.potential_friend_id,
    LEAST(s.score, 1.0)::numeric,
    s.mutual_count,
    s.same_industry
  FROM suggestions s
  ORDER BY s.score DESC, s.mutual_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;
```

## Application Integration

### 1. React Native Components

```typescript
// types/friends.ts
export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted' | 'blocked' | 'declined';
  created_at: string;
  updated_at: string;
  connection_strength?: number;
  mutual_friends_count: number;
}

export interface FriendSuggestion {
  id: string;
  suggested_user: Profile;
  suggestion_score: number;
  mutual_friends_count: number;
  same_industry: boolean;
  suggestion_reasons: string[];
}

export interface UserReferral {
  id: string;
  referral_code: string;
  referred_email?: string;
  status: 'pending' | 'registered' | 'completed' | 'expired';
  shared_content_type?: string;
  shared_content_id?: string;
  created_at: string;
}
```

### 2. Friends Service

```typescript
// lib/friendsService.ts
import { supabase } from './supabase';
import { Friendship, FriendSuggestion } from '../types/friends';

export class FriendsService {
  // Send friend request
  static async sendFriendRequest(addresseeId: string): Promise<Friendship> {
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('friendships')
      .insert({
        requester_id: currentUser.user.id,
        addressee_id: addresseeId,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Accept friend request
  static async acceptFriendRequest(friendshipId: string): Promise<void> {
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', friendshipId);

    if (error) throw error;
  }

  // Get friend suggestions
  static async getFriendSuggestions(limit: number = 10): Promise<FriendSuggestion[]> {
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) throw new Error('Not authenticated');

    const { data, error } = await supabase.rpc('generate_friend_suggestions', {
      target_user_id: currentUser.user.id,
      limit_count: limit
    });

    if (error) throw error;
    return data || [];
  }

  // Get user's friends
  static async getFriends(userId: string): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('friendships')
      .select(`
        requester:profiles!friendships_requester_id_fkey(id, full_name, avatar_url),
        addressee:profiles!friendships_addressee_id_fkey(id, full_name, avatar_url)
      `)
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
      .eq('status', 'accepted');

    if (error) throw error;

    return data?.map(friendship => 
      friendship.requester.id === userId ? friendship.addressee : friendship.requester
    ) || [];
  }

  // Check friendship status
  static async getFriendshipStatus(userId: string, otherUserId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('friendships')
      .select('status, requester_id')
      .or(`and(requester_id.eq.${userId},addressee_id.eq.${otherUserId}),and(requester_id.eq.${otherUserId},addressee_id.eq.${userId})`)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data?.status || null;
  }
}
```

### 3. UI Components

```typescript
// components/friends/FriendSuggestionCard.tsx
import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { FriendSuggestion } from '../../types/friends';
import { FriendsService } from '../../lib/friendsService';

interface Props {
  suggestion: FriendSuggestion;
  onRequestSent: (suggestionId: string) => void;
}

export const FriendSuggestionCard: React.FC<Props> = ({ suggestion, onRequestSent }) => {
  const [loading, setLoading] = useState(false);

  const handleSendRequest = async () => {
    setLoading(true);
    try {
      await FriendsService.sendFriendRequest(suggestion.suggested_user.id);
      onRequestSent(suggestion.id);
    } catch (error) {
      console.error('Error sending friend request:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image source={{ uri: suggestion.suggested_user.avatar_url }} style={styles.avatar} />
      <View style={styles.info}>
        <Text style={styles.name}>{suggestion.suggested_user.full_name}</Text>
        {suggestion.mutual_friends_count > 0 && (
          <Text style={styles.mutualFriends}>
            {suggestion.mutual_friends_count} mutual friends
          </Text>
        )}
        {suggestion.same_industry && (
          <Text style={styles.sameIndustry}>Same industry</Text>
        )}
      </View>
      <TouchableOpacity 
        style={styles.addButton} 
        onPress={handleSendRequest}
        disabled={loading}
      >
        <Text style={styles.addButtonText}>Add Friend</Text>
      </TouchableOpacity>
    </View>
  );
};
```

## Content Sharing & Viral Growth

### 1. iOS Share Integration

```typescript
// lib/shareService.ts
import { Share, Platform } from 'react-native';
import { generateReferralLink } from './referralService';

export class ShareService {
  static async shareContent(
    contentType: 'article' | 'paper' | 'book' | 'insight',
    contentId: string,
    contentTitle: string
  ): Promise<void> {
    const referralLink = await generateReferralLink(contentType, contentId);
    const shareMessage = `Check out "${contentTitle}" on Supercharged - ${referralLink}`;

    if (Platform.OS === 'ios') {
      await Share.share({
        message: shareMessage,
        url: referralLink,
      });
    } else {
      await Share.share({
        message: shareMessage,
      });
    }
  }

  static async inviteFriends(): Promise<void> {
    const referralLink = await generateReferralLink();
    const inviteMessage = `Join me on Supercharged - the best platform for professional learning! ${referralLink}`;

    await Share.share({
      message: inviteMessage,
      title: 'Join me on Supercharged!',
    });
  }
}

// lib/referralService.ts
export async function generateReferralLink(
  contentType?: string,
  contentId?: string
): Promise<string> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  // Generate or get existing referral code
  let referralCode = await getReferralCode(user.user.id);
  
  if (!referralCode) {
    referralCode = await createReferralCode(user.user.id);
  }

  // Create referral record
  const { error } = await supabase
    .from('user_referrals')
    .insert({
      referrer_id: user.user.id,
      referral_code: referralCode,
      shared_content_type: contentType,
      shared_content_id: contentId,
      referral_source: 'ios_share'
    });

  if (error) console.error('Error creating referral:', error);

  // Return deep link
  const baseUrl = 'https://supercharged.app/invite';
  return `${baseUrl}/${referralCode}${contentType && contentId ? `?content=${contentType}:${contentId}` : ''}`;
}
```

### 2. Deep Linking Setup

```typescript
// lib/deepLinkHandler.ts
import { Linking } from 'react-native';
import { router } from 'expo-router';
import { supabase } from './supabase';

export class DeepLinkHandler {
  static async handleReferralLink(url: string): Promise<void> {
    const urlParts = new URL(url);
    const referralCode = urlParts.pathname.split('/').pop();
    const contentParam = urlParts.searchParams.get('content');

    if (referralCode) {
      await this.processReferral(referralCode, contentParam);
    }
  }

  private static async processReferral(
    referralCode: string, 
    contentParam: string | null
  ): Promise<void> {
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // Existing user - navigate to content or show referrer profile
      if (contentParam) {
        const [contentType, contentId] = contentParam.split(':');
        router.push(`/content/${contentType}/${contentId}`);
      } else {
        // Show referrer's profile or send friend request
        const referrer = await this.getReferrer(referralCode);
        if (referrer) {
          router.push(`/profile/${referrer.id}?suggest_friend=true`);
        }
      }
    } else {
      // New user - store referral info and redirect to signup
      await AsyncStorage.setItem('pending_referral', JSON.stringify({
        referral_code: referralCode,
        content_param: contentParam
      }));
      
      router.push('/signup');
    }
  }

  static async completePendingReferral(): Promise<void> {
    const pendingReferral = await AsyncStorage.getItem('pending_referral');
    if (pendingReferral) {
      const { referral_code, content_param } = JSON.parse(pendingReferral);
      
      // Update referral status
      await supabase
        .from('user_referrals')
        .update({ 
          status: 'registered',
          referred_user_id: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('referral_code', referral_code);

      // Navigate to content if specified
      if (content_param) {
        const [contentType, contentId] = content_param.split(':');
        router.push(`/content/${contentType}/${contentId}`);
      }

      await AsyncStorage.removeItem('pending_referral');
    }
  }
}
```

### 3. Referral Rewards System

```sql
-- Reward processing function
CREATE OR REPLACE FUNCTION process_referral_rewards()
RETURNS void AS $$
DECLARE
  referral_record RECORD;
BEGIN
  -- Process completed referrals that haven't been rewarded
  FOR referral_record IN 
    SELECT r.*, p.full_name as referrer_name
    FROM public.user_referrals r
    JOIN public.profiles p ON p.id = r.referrer_id
    WHERE r.status = 'completed' 
      AND r.reward_given = false
      AND r.referrer_id IS NOT NULL
  LOOP
    -- Give voltz reward to referrer
    UPDATE public.profiles 
    SET spendable_voltz = spendable_voltz + 50,
        total_voltz_earned = total_voltz_earned + 50
    WHERE id = referral_record.referrer_id;
    
    -- Mark reward as given
    UPDATE public.user_referrals 
    SET reward_given = true, 
        reward_amount = 50
    WHERE id = referral_record.id;
    
    -- Log the reward (optional)
    INSERT INTO public.voltz_transactions (
      user_id, amount, transaction_type, description
    ) VALUES (
      referral_record.referrer_id,
      50,
      'referral_reward',
      'Friend referral reward: ' || referral_record.referrer_name
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Schedule this to run periodically
```

## Scalability & Future Considerations

### 1. Sharding Strategy

When the platform reaches 100K+ users:

```sql
-- Shard users by geographic region + user ID hash
-- Example partitioning by user_id hash
CREATE TABLE public.friendships_shard_0 (INHERITS (public.friendships));
CREATE TABLE public.friendships_shard_1 (INHERITS (public.friendships));
CREATE TABLE public.friendships_shard_2 (INHERITS (public.friendships));

-- Partition function
CREATE OR REPLACE FUNCTION friendship_partition_trigger()
RETURNS TRIGGER AS $$
DECLARE
  shard_num integer;
BEGIN
  shard_num := abs(hashtext(NEW.requester_id::text) % 3);
  
  CASE shard_num
    WHEN 0 THEN INSERT INTO public.friendships_shard_0 VALUES (NEW.*);
    WHEN 1 THEN INSERT INTO public.friendships_shard_1 VALUES (NEW.*);
    WHEN 2 THEN INSERT INTO public.friendships_shard_2 VALUES (NEW.*);
  END CASE;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
```

### 2. Graph Database Migration Path

For advanced friend suggestions at scale:

```typescript
// Future: Neo4j integration for complex graph algorithms
export class GraphFriendsService {
  private neo4jDriver: any;

  async getAdvancedSuggestions(userId: string): Promise<FriendSuggestion[]> {
    const session = this.neo4jDriver.session();
    
    try {
      const result = await session.run(`
        MATCH (user:User {id: $userId})-[:FRIEND]->(friend)-[:FRIEND]->(suggestion)
        WHERE NOT (user)-[:FRIEND]-(suggestion) AND user <> suggestion
        WITH suggestion, count(*) as mutualCount, user
        OPTIONAL MATCH (user)-[:LIKES|SAVES|COMMENTS]->(content)<-[:LIKES|SAVES|COMMENTS]-(suggestion)
        WITH suggestion, mutualCount, count(*) as sharedInterests
        RETURN suggestion.id as id, 
               suggestion.name as name,
               mutualCount,
               sharedInterests,
               (mutualCount * 0.6 + sharedInterests * 0.4) as score
        ORDER BY score DESC
        LIMIT 10
      `, { userId });
      
      return result.records.map(record => ({
        id: record.get('id'),
        name: record.get('name'),
        mutual_friends_count: record.get('mutualCount').toNumber(),
        suggestion_score: record.get('score').toNumber(),
        same_industry: false, // TODO: Add industry matching
      }));
    } finally {
      await session.close();
    }
  }
}
```

### 3. Advanced Analytics & ML

Future machine learning integration:

```python
# friend_recommendation_ml.py
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score

class FriendRecommendationML:
    def __init__(self):
        self.model = RandomForestClassifier(n_estimators=100, random_state=42)
    
    def prepare_features(self, user_id, potential_friend_id):
        """
        Extract features for friend recommendation:
        - Mutual friends count
        - Industry similarity
        - Geographic proximity
        - Content interaction overlap
        - Activity level similarity
        - Time zone compatibility
        """
        features = {
            'mutual_friends': self.get_mutual_friends_count(user_id, potential_friend_id),
            'same_industry': self.check_same_industry(user_id, potential_friend_id),
            'content_overlap': self.get_content_overlap_score(user_id, potential_friend_id),
            'activity_similarity': self.get_activity_similarity(user_id, potential_friend_id),
            'geographic_score': self.get_geographic_similarity(user_id, potential_friend_id)
        }
        return features
    
    def train_model(self, training_data):
        """Train on historical successful friendships"""
        X = training_data.drop('became_friends', axis=1)
        y = training_data['became_friends']
        
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)
        self.model.fit(X_train, y_train)
        
        predictions = self.model.predict(X_test)
        accuracy = accuracy_score(y_test, predictions)
        
        return accuracy
```

## Implementation Timeline

### Phase 1 (Weeks 1-2): Core Infrastructure
- [ ] Database schema migration
- [ ] Basic friendship CRUD operations  
- [ ] Friend request/accept API endpoints
- [ ] Simple friend list UI

### Phase 2 (Weeks 3-4): Friend Discovery
- [ ] Friend suggestion algorithm implementation
- [ ] Mutual friends calculation
- [ ] Friend discovery UI components
- [ ] Search functionality

### Phase 3 (Weeks 5-6): Content Sharing
- [ ] iOS Share integration
- [ ] Referral link generation
- [ ] Deep link handling
- [ ] Invitation flow UI

### Phase 4 (Weeks 7-8): Viral Features
- [ ] Referral reward system
- [ ] Analytics tracking
- [ ] A/B testing setup
- [ ] Performance monitoring

### Phase 5 (Weeks 9-10): Polish & Optimization
- [ ] Advanced friend suggestions
- [ ] Caching optimizations
- [ ] Security audit
- [ ] Load testing

## Security Considerations

### 1. Privacy Controls

```sql
-- User privacy settings
ALTER TABLE public.profiles ADD COLUMN 
  privacy_settings jsonb DEFAULT '{
    "discoverable": true,
    "allow_friend_requests": true,
    "show_mutual_friends": true,
    "show_in_suggestions": true,
    "public_friend_list": false
  }';
```

### 2. Rate Limiting

```typescript
// lib/rateLimiter.ts
export class RateLimiter {
  private static requests: Map<string, number[]> = new Map();

  static async checkFriendRequestLimit(userId: string): Promise<boolean> {
    const now = Date.now();
    const hour = 60 * 60 * 1000;
    const maxRequestsPerHour = 20;

    const userRequests = this.requests.get(userId) || [];
    const recentRequests = userRequests.filter(time => now - time < hour);

    if (recentRequests.length >= maxRequestsPerHour) {
      throw new Error('Too many friend requests. Please try again later.');
    }

    recentRequests.push(now);
    this.requests.set(userId, recentRequests);
    return true;
  }
}
```

### 3. Spam Prevention

```sql
-- Prevent spam friend requests
CREATE OR REPLACE FUNCTION prevent_friend_request_spam()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user has sent too many requests recently
  IF (
    SELECT COUNT(*)
    FROM public.friendships
    WHERE requester_id = NEW.requester_id
      AND created_at > NOW() - INTERVAL '1 hour'
  ) > 20 THEN
    RAISE EXCEPTION 'Too many friend requests sent recently. Please try again later.';
  END IF;
  
  -- Check if addressee has blocked requester
  IF EXISTS (
    SELECT 1
    FROM public.friendships
    WHERE requester_id = NEW.addressee_id
      AND addressee_id = NEW.requester_id
      AND status = 'blocked'
  ) THEN
    RAISE EXCEPTION 'Cannot send friend request to user who has blocked you.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER friend_request_spam_prevention
  BEFORE INSERT ON public.friendships
  FOR EACH ROW
  EXECUTE FUNCTION prevent_friend_request_spam();
```

## Monitoring & Analytics

### 1. Key Metrics to Track

```sql
-- Friend engagement metrics view
CREATE VIEW friend_engagement_metrics AS
SELECT 
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) FILTER (WHERE status = 'pending') as requests_sent,
  COUNT(*) FILTER (WHERE status = 'accepted') as friendships_formed,
  COUNT(*) FILTER (WHERE status = 'declined') as requests_declined,
  COUNT(*) FILTER (WHERE status = 'blocked') as users_blocked,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'accepted')::numeric / 
    NULLIF(COUNT(*) FILTER (WHERE status IN ('accepted', 'declined'))::numeric, 0) * 100, 
    2
  ) as acceptance_rate
FROM public.friendships
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;
```

### 2. A/B Testing Framework

```typescript
// lib/friendsExperiments.ts
export class FriendsExperiments {
  static async getSuggestionAlgorithm(userId: string): Promise<'common_neighbors' | 'ml_enhanced'> {
    const userHash = await this.getUserHash(userId);
    return userHash % 2 === 0 ? 'common_neighbors' : 'ml_enhanced';
  }

  static async trackSuggestionClick(userId: string, suggestionId: string, algorithm: string): Promise<void> {
    await supabase.from('experiment_events').insert({
      user_id: userId,
      event_type: 'suggestion_click',
      experiment_variant: algorithm,
      metadata: { suggestion_id: suggestionId }
    });
  }
}
```

## Conclusion

This comprehensive friends system plan provides:

✅ **Scalable Architecture**: Built for growth from day one with clear migration paths  
✅ **Modern Best Practices**: Based on research from major social platforms  
✅ **Viral Growth Mechanisms**: iOS sharing integration with referral rewards  
✅ **Smart Friend Suggestions**: Algorithm-driven recommendations with ML extensibility  
✅ **Performance Optimized**: Caching, indexing, and query optimization  
✅ **Security Focused**: Privacy controls, spam prevention, and rate limiting  
✅ **Analytics Ready**: Comprehensive tracking and A/B testing capabilities  

The system starts simple but provides clear paths for advanced features like graph databases, machine learning recommendations, and enterprise-scale sharding. The referral system creates viral growth opportunities while the friend suggestions increase user engagement and network effects.

Implementation should follow the phased approach, building core functionality first and adding sophisticated features as user adoption grows.