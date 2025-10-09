# Notifications System Implementation Plan

## Overview
This plan outlines implementing a comprehensive push notification system for real-time user engagement, handling both in-app and background scenarios using Expo Notifications and Supabase triggers.

## Current State Analysis

### Database Schema
- ✅ **`notifications` table** (lines 523-536) - Basic notification storage
  - `type` ('like', 'comment', 'friend_request')
  - Missing save/share notification types
  - No batch/digest support
- ✅ **User interaction tables** - All trigger sources exist:
  - `friendships`, `article_likes`, `insight_likes`, `paper_likes`, `book_likes`
  - `comments`, `insight_comments`, `article_saves`, etc.

### Current Implementation
- ✅ **expo-notifications plugin** configured in app.json
- ❌ **No notification sending logic**
- ❌ **No background notification system**
- ❌ **No push notification tokens management**

## Notification Events to Implement

### 1. Social Events
- **Friend Request Received**: When someone sends you a friend request
- **Friend Request Accepted**: When someone accepts your friend request
- **New Friend Activity**: When friend posts insight (configurable frequency)

### 2. Content Engagement
- **Like Notifications**: Someone likes your content (insight/comment)
- **Comment Notifications**: Someone comments on your content
- **Save Notifications**: Someone saves your content
- **Reply Notifications**: Someone replies to your comment

### 3. Streak & Goal Reminders
- **Daily Streak Reminder**: "Don't break your 5-day streak!"
- **Goal Achievement**: "You've reached your weekly learning goal!"
- **Streak Milestones**: "Congratulations on your 30-day streak!"

## Architecture Overview

```mermaid
graph TB
    A[User Action] --> B[Database Trigger]
    B --> C[Insert into notifications table]
    C --> D[Call Supabase Edge Function]
    D --> E[Send Push Notification via Expo]
    D --> F[Send In-App Notification]

    G[Scheduled Tasks] --> H[Check Daily Reminders]
    H --> I[Send Streak Reminders]

    J[App Launch] --> K[Register Push Token]
    K --> L[Update user_push_tokens table]
```

## Implementation Plan

### Phase 1: Database Infrastructure

#### 1.1 Enhanced Notifications Table
```sql
-- Add missing notification types and batch support
ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS batch_id UUID,
ADD COLUMN IF NOT EXISTS action_url TEXT,
ADD COLUMN IF NOT EXISTS push_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS push_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS opened_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}',
MODIFY COLUMN type TEXT CHECK (type = ANY (ARRAY[
  'like', 'comment', 'friend_request', 'friend_accepted',
  'save', 'share', 'streak_reminder', 'goal_achievement',
  'friend_insight', 'milestone', 'reply'
]));

-- Create push tokens table
CREATE TABLE IF NOT EXISTS public.user_push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  push_token TEXT NOT NULL,
  device_type TEXT NOT NULL CHECK (device_type = ANY (ARRAY['ios', 'android', 'web'])),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, push_token)
);

-- Create notification preferences table
CREATE TABLE IF NOT EXISTS public.user_notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  friend_requests BOOLEAN DEFAULT TRUE,
  likes BOOLEAN DEFAULT TRUE,
  comments BOOLEAN DEFAULT TRUE,
  saves BOOLEAN DEFAULT TRUE,
  friend_activity BOOLEAN DEFAULT TRUE,
  streak_reminders BOOLEAN DEFAULT TRUE,
  goal_achievements BOOLEAN DEFAULT TRUE,
  digest_frequency TEXT DEFAULT 'immediate' CHECK (digest_frequency = ANY (ARRAY[
    'immediate', 'hourly', 'daily', 'weekly', 'off'
  ])),
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '08:00',
  timezone TEXT DEFAULT 'GMT',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 1.2 Database Triggers for Real-Time Events
```sql
-- Generic function to create notifications
CREATE OR REPLACE FUNCTION create_notification(
  recipient_id UUID,
  source_user_id UUID,
  notification_type TEXT,
  content_type TEXT DEFAULT NULL,
  content_id TEXT DEFAULT NULL,
  custom_message TEXT DEFAULT NULL,
  action_url TEXT DEFAULT NULL,
  additional_data JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  notification_id UUID;
  default_message TEXT;
  user_prefs RECORD;
BEGIN
  -- Get user notification preferences
  SELECT * INTO user_prefs
  FROM user_notification_preferences
  WHERE user_id = recipient_id;

  -- Check if user wants this type of notification
  CASE notification_type
    WHEN 'like' THEN
      IF user_prefs.likes = FALSE THEN RETURN NULL; END IF;
    WHEN 'comment', 'reply' THEN
      IF user_prefs.comments = FALSE THEN RETURN NULL; END IF;
    WHEN 'friend_request' THEN
      IF user_prefs.friend_requests = FALSE THEN RETURN NULL; END IF;
    WHEN 'save' THEN
      IF user_prefs.saves = FALSE THEN RETURN NULL; END IF;
    WHEN 'friend_insight' THEN
      IF user_prefs.friend_activity = FALSE THEN RETURN NULL; END IF;
  END CASE;

  -- Don't notify users about their own actions
  IF recipient_id = source_user_id THEN
    RETURN NULL;
  END IF;

  -- Generate default message if not provided
  IF custom_message IS NULL THEN
    SELECT full_name INTO default_message FROM profiles WHERE id = source_user_id;
    CASE notification_type
      WHEN 'like' THEN default_message := default_message || ' liked your ' || content_type;
      WHEN 'comment' THEN default_message := default_message || ' commented on your ' || content_type;
      WHEN 'friend_request' THEN default_message := default_message || ' sent you a friend request';
      WHEN 'save' THEN default_message := default_message || ' saved your ' || content_type;
      WHEN 'friend_insight' THEN default_message := default_message || ' shared a new insight';
      ELSE default_message := 'New notification';
    END CASE;
  ELSE
    default_message := custom_message;
  END IF;

  -- Insert notification
  INSERT INTO notifications (
    user_id, source_user_id, type, content_type, content_id,
    message, action_url, data
  ) VALUES (
    recipient_id, source_user_id, notification_type, content_type, content_id,
    default_message, action_url, additional_data
  ) RETURNING id INTO notification_id;

  -- Queue for push notification (via Edge Function)
  PERFORM pg_notify('push_notification', json_build_object(
    'notification_id', notification_id,
    'user_id', recipient_id,
    'type', notification_type,
    'message', default_message
  )::text);

  RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger functions for different events
CREATE OR REPLACE FUNCTION notify_on_like()
RETURNS TRIGGER AS $$
DECLARE
  content_owner_id UUID;
  content_type_name TEXT;
BEGIN
  -- Determine content owner and type
  CASE TG_TABLE_NAME
    WHEN 'article_likes' THEN
      SELECT NULL INTO content_owner_id; -- Articles don't have owners in this system
      content_type_name := 'article';
    WHEN 'insight_likes' THEN
      SELECT author_id INTO content_owner_id FROM insights WHERE id = NEW.insight_id;
      content_type_name := 'insight';
    WHEN 'paper_likes' THEN
      SELECT NULL INTO content_owner_id; -- Papers don't have owners
      content_type_name := 'paper';
    WHEN 'book_likes' THEN
      SELECT NULL INTO content_owner_id; -- Books don't have owners
      content_type_name := 'book';
  END CASE;

  -- Only notify if content has an owner (user-generated content)
  IF content_owner_id IS NOT NULL THEN
    PERFORM create_notification(
      content_owner_id,
      NEW.user_id,
      'like',
      content_type_name,
      COALESCE(NEW.insight_id, NEW.article_id, NEW.paper_id, NEW.book_id)::TEXT
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for like events
CREATE TRIGGER insight_like_notification
  AFTER INSERT ON insight_likes
  FOR EACH ROW EXECUTE FUNCTION notify_on_like();

-- Similar triggers for comments, saves, friend requests, etc.
CREATE OR REPLACE FUNCTION notify_on_comment()
RETURNS TRIGGER AS $$
DECLARE
  content_owner_id UUID;
  content_type_name TEXT;
BEGIN
  CASE TG_TABLE_NAME
    WHEN 'insight_comments' THEN
      SELECT author_id INTO content_owner_id FROM insights WHERE id = NEW.insight_id;
      content_type_name := 'insight';
    WHEN 'comments' THEN
      SELECT NULL INTO content_owner_id; -- Articles don't have owners
      content_type_name := 'article';
  END CASE;

  IF content_owner_id IS NOT NULL THEN
    PERFORM create_notification(
      content_owner_id,
      NEW.user_id,
      'comment',
      content_type_name,
      COALESCE(NEW.insight_id, NEW.article_id)::TEXT
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER insight_comment_notification
  AFTER INSERT ON insight_comments
  FOR EACH ROW EXECUTE FUNCTION notify_on_comment();

-- Friend request notifications
CREATE OR REPLACE FUNCTION notify_on_friend_request()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'pending' AND OLD.status IS NULL THEN
    -- New friend request
    PERFORM create_notification(
      NEW.addressee_id,
      NEW.requester_id,
      'friend_request'
    );
  ELSIF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    -- Friend request accepted - notify the requester
    PERFORM create_notification(
      NEW.requester_id,
      NEW.addressee_id,
      'friend_accepted'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER friendship_notification
  AFTER INSERT OR UPDATE ON friendships
  FOR EACH ROW EXECUTE FUNCTION notify_on_friend_request();
```

### Phase 2: Supabase Edge Functions (Background Processing)

#### 2.1 Push Notification Edge Function
```typescript
// supabase/functions/send-push-notification/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const EXPO_ACCESS_TOKEN = Deno.env.get('EXPO_ACCESS_TOKEN')!

serve(async (req) => {
  try {
    const { notification_id, user_id, type, message } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Get user's active push tokens
    const { data: tokens } = await supabase
      .from('user_push_tokens')
      .select('push_token, device_type')
      .eq('user_id', user_id)
      .eq('is_active', true)

    if (!tokens?.length) {
      console.log('No active push tokens for user:', user_id)
      return new Response(JSON.stringify({ success: false, reason: 'no_tokens' }))
    }

    // Check notification preferences and quiet hours
    const { data: prefs } = await supabase
      .from('user_notification_preferences')
      .select('*')
      .eq('user_id', user_id)
      .single()

    // Check quiet hours (if applicable)
    if (prefs && isQuietHours(prefs)) {
      console.log('Skipping notification due to quiet hours')
      return new Response(JSON.stringify({ success: false, reason: 'quiet_hours' }))
    }

    // Send push notifications via Expo Push API
    const messages = tokens.map(token => ({
      to: token.push_token,
      sound: 'default',
      title: 'Supercharged',
      body: message,
      data: {
        notification_id,
        type,
        user_id
      },
      badge: 1
    }))

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${EXPO_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(messages),
    })

    const result = await response.json()

    // Mark notification as sent
    await supabase
      .from('notifications')
      .update({
        push_sent: true,
        push_sent_at: new Date().toISOString()
      })
      .eq('id', notification_id)

    return new Response(JSON.stringify({
      success: true,
      sent_count: tokens.length,
      expo_response: result
    }))

  } catch (error) {
    console.error('Push notification error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), { status: 500 })
  }
})

function isQuietHours(prefs: any): boolean {
  const now = new Date()
  const userTime = new Date(now.toLocaleString("en-US", {timeZone: prefs.timezone || "GMT"}))
  const currentHour = userTime.getHours()

  const startHour = parseInt(prefs.quiet_hours_start?.split(':')[0] || '22')
  const endHour = parseInt(prefs.quiet_hours_end?.split(':')[0] || '8')

  if (startHour > endHour) {
    // Quiet hours span midnight (e.g., 22:00 to 08:00)
    return currentHour >= startHour || currentHour < endHour
  } else {
    // Quiet hours within same day
    return currentHour >= startHour && currentHour < endHour
  }
}
```

#### 2.2 Daily Streak Reminder Function
```typescript
// supabase/functions/daily-streak-reminders/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  try {
    // Find users who haven't been active today and have streak reminders enabled
    const { data: usersToRemind } = await supabase
      .from('user_streaks')
      .select(`
        user_id,
        current_streak,
        target_days,
        profiles!inner(full_name),
        user_notification_preferences!inner(streak_reminders)
      `)
      .eq('streak_type', 'daily_learning')
      .eq('is_active', true)
      .eq('user_notification_preferences.streak_reminders', true)
      .not('user_id', 'in', `(
        SELECT DISTINCT user_id
        FROM user_daily_activities
        WHERE activity_date = CURRENT_DATE
      )`)

    for (const user of usersToRemind || []) {
      const message = `Don't break your ${user.current_streak}-day streak! Keep learning today.`

      // Create notification record
      const { data: notification } = await supabase
        .from('notifications')
        .insert({
          user_id: user.user_id,
          source_user_id: user.user_id, // System notification
          type: 'streak_reminder',
          message,
          data: {
            current_streak: user.current_streak,
            target_days: user.target_days
          }
        })
        .select('id')
        .single()

      // Send push notification
      if (notification) {
        await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-push-notification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
          },
          body: JSON.stringify({
            notification_id: notification.id,
            user_id: user.user_id,
            type: 'streak_reminder',
            message
          })
        })
      }
    }

    return new Response(JSON.stringify({
      success: true,
      reminders_sent: usersToRemind?.length || 0
    }))

  } catch (error) {
    console.error('Streak reminder error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), { status: 500 })
  }
})
```

### Phase 3: Frontend Integration

#### 3.1 Push Token Management Service
```typescript
// services/notificationService.ts
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';

export const notificationService = {
  // Register device for push notifications
  async registerForPushNotifications(userId: string): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Push notification permissions denied');
        return false;
      }

      // Get push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PROJECT_ID,
      });

      // Save token to database
      await supabase
        .from('user_push_tokens')
        .upsert({
          user_id: userId,
          push_token: tokenData.data,
          device_type: Platform.OS === 'ios' ? 'ios' : 'android',
          is_active: true
        });

      console.log('Push token registered:', tokenData.data);
      return true;

    } catch (error) {
      console.error('Push notification registration failed:', error);
      return false;
    }
  },

  // Handle notification received while app is running
  setupNotificationHandlers() {
    // Handle notification received while app is in foreground
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    // Handle user tapping on notification
    Notifications.addNotificationResponseReceivedListener(response => {
      const { notification_id, type } = response.notification.request.content.data;

      // Mark notification as opened
      supabase
        .from('notifications')
        .update({ opened_at: new Date().toISOString() })
        .eq('id', notification_id);

      // Navigate based on notification type
      this.handleNotificationNavigation(type, response.notification.request.content.data);
    });
  },

  // Navigate to relevant screen based on notification
  handleNotificationNavigation(type: string, data: any) {
    // This would integrate with your navigation system
    switch (type) {
      case 'like':
      case 'comment':
        // Navigate to content detail screen
        break;
      case 'friend_request':
        // Navigate to friends/profile screen
        break;
      case 'streak_reminder':
        // Navigate to learning/home screen
        break;
    }
  },

  // Get user's unread notifications
  async getUnreadNotifications(userId: string): Promise<any[]> {
    const { data } = await supabase
      .from('notifications')
      .select(`
        *,
        source_user:profiles!notifications_source_user_id_fkey(full_name, avatar_url)
      `)
      .eq('user_id', userId)
      .eq('is_read', false)
      .order('created_at', { ascending: false });

    return data || [];
  },

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<void> {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
  }
};
```

#### 3.2 App-Level Setup
```typescript
// App.tsx / AuthContext integration
useEffect(() => {
  if (user) {
    // Register for push notifications on login
    notificationService.registerForPushNotifications(user.id);

    // Setup notification handlers
    notificationService.setupNotificationHandlers();

    // Initialize default preferences if not exist
    initializeNotificationPreferences(user.id);
  }
}, [user]);

async function initializeNotificationPreferences(userId: string) {
  const { data: existing } = await supabase
    .from('user_notification_preferences')
    .select('user_id')
    .eq('user_id', userId)
    .single();

  if (!existing) {
    await supabase
      .from('user_notification_preferences')
      .insert({ user_id: userId }); // Uses defaults from schema
  }
}
```

### Phase 4: Scheduled Tasks (Cron Jobs)

#### 4.1 Supabase Cron Extension
```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily streak reminders (10 AM GMT daily)
SELECT cron.schedule(
  'daily-streak-reminders',
  '0 10 * * *',
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/daily-streak-reminders',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  );
  $$
);

-- Schedule weekly digest (Sunday 9 AM GMT)
SELECT cron.schedule(
  'weekly-digest',
  '0 9 * * 0',
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/weekly-digest',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  );
  $$
);
```

### Phase 5: Advanced Features

#### 5.1 Notification Batching & Digests
- Group similar notifications (5 people liked your insight)
- Configurable digest frequency (immediate, hourly, daily)
- Smart throttling to prevent spam

#### 5.2 Real-Time Features
- WebSocket notifications for instant in-app updates
- Live activity indicators (typing, online status)
- Real-time badge count updates

#### 5.3 Analytics & Optimization
- Track notification open rates
- A/B test notification copy
- Optimize send times based on user engagement

## Testing Strategy

### 5.1 Unit Tests
- Notification creation logic
- Push token management
- Quiet hours calculation

### 5.2 Integration Tests
- Database trigger execution
- Edge function reliability
- Cross-platform push delivery

### 5.3 User Acceptance Tests
- End-to-end notification flow
- Preference management
- Cross-timezone testing

## Implementation Timeline

### Week 1: Database & Backend
- [ ] Enhance notifications table schema
- [ ] Create database triggers and functions
- [ ] Deploy Edge functions

### Week 2: Frontend Integration
- [ ] Implement notification service
- [ ] Add push token registration
- [ ] Create notification UI components

### Week 3: Scheduled Tasks & Testing
- [ ] Set up cron jobs for daily reminders
- [ ] Comprehensive testing across devices/platforms
- [ ] Performance optimization

### Week 4: Advanced Features & Monitoring
- [ ] Implement batching/digest features
- [ ] Set up analytics and monitoring
- [ ] User feedback collection

## Success Metrics

1. **Delivery Rate**: 95%+ successful push notification delivery
2. **Engagement**: 25%+ notification open rate
3. **User Retention**: 15% increase in daily active users
4. **Feature Adoption**: 80%+ users enable notifications
5. **Performance**: <100ms notification creation time

## How Big Apps Do It

### Instagram/Meta Approach
- **Micro-services**: Separate notification service handling millions of events
- **Message Queues**: Redis/Kafka for reliable delivery
- **Machine Learning**: Smart notification timing and content optimization
- **Global Infrastructure**: Region-specific push servers

### Our Simplified Approach
- **Supabase Edge Functions**: Handle background processing at scale
- **Database Triggers**: Real-time event detection
- **Expo Push Service**: Handles cross-platform delivery complexity
- **Intelligent Batching**: Prevent notification fatigue

## Key Decisions for Review

### 1. **Real-Time vs Batched Notifications**
- **Immediate**: Friend requests, direct mentions
- **Batched**: Multiple likes, saves (5-minute batching)
- **Digest**: Weekly friend activity summary

### 2. **Notification Persistence**
- **Database Storage**: All notifications stored for history
- **Push vs In-App**: Push for background, in-app for immediate
- **Retention**: 90-day notification history

### 3. **User Control Granularity**
- **Per-type toggles**: Like, comment, friend request controls
- **Quiet hours**: Customizable by timezone
- **Frequency options**: Immediate, hourly, daily, weekly

### 4. **Background Processing Architecture**
- **Database Triggers**: Immediate event detection
- **Edge Functions**: Reliable background processing
- **Cron Jobs**: Scheduled reminder delivery
- **Fallback Strategy**: Retry failed notifications

## Questions for Decision

1. **Should we implement notification channels** (like Discord) for different content types?

2. **What's the priority order for notification types?** Should friend requests override quiet hours?

3. **How aggressive should streak reminders be?** Daily only, or also hourly warnings before streak expires?

4. **Should we implement push notification analytics** to track open rates and optimize send times?

5. **Do we want social proof in notifications?** ("John and 4 others liked your insight")

6. **Should we support notification sounds/vibrations customization** per notification type?

This comprehensive notification system will significantly improve user engagement while respecting user preferences and preventing notification fatigue.