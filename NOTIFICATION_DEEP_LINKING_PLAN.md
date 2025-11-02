# Notification Deep Linking Implementation Plan

## Overview
This document outlines the plan to implement proper deep linking for all notification types, so tapping a notification takes users to the relevant content.

## Routing Logic Summary

| Notification Type | Destination | Route/Action |
|------------------|-------------|--------------|
| **like** (insight) | Specific insight | `/insight/[id]` |
| **comment** (insight) | Specific insight | `/insight/[id]` |
| **save** | Specific saved content | `/content/[type]/[id]` |
| **streak_reminder** | Main feed | `/feed` |
| **level_up** | User profile | `/profile` |
| **friend_request** | Friend requests screen | `/friend-requests` |
| **friend_accepted** | People tab | `/people` |
| **friend_insight** | Specific friend's insight | `/insight/[id]` |
| **goal_achievement** | User profile | `/profile` |
| **feedback_posted** | Feedback modal | `/feedback` (modal route) |
| **reply** (insight comment) | Specific insight | `/insight/[id]` |

## Implementation Steps

### Step 1: Update Database Functions to Set Correct `action_url`

**File to modify**: `create_notification_secure()` function in Supabase

**Location**: Around line 142-160 in the message generation section

**Changes needed**:
Currently the function generates action URLs in some cases, but not all. Need to ensure every notification type gets the correct `action_url`.

**Updated logic**:
```sql
CASE notification_type
  WHEN 'like' THEN
    -- If it's an insight like, set action_url to /insight/[content_id]
    IF content_type = 'insight' THEN
      action_url := '/insight/' || content_id;
    ELSE
      action_url := '/content/' || content_type || '/' || content_id;
    END IF;

  WHEN 'comment', 'reply' THEN
    -- Comments on insights go to insight detail
    IF content_type = 'insight' THEN
      action_url := '/insight/' || content_id;
    ELSE
      action_url := '/content/' || content_type || '/' || content_id;
    END IF;

  WHEN 'save' THEN
    -- Navigate to the saved content
    action_url := '/content/' || content_type || '/' || content_id;

  WHEN 'streak_reminder' THEN
    action_url := '/feed';

  WHEN 'level_up' THEN
    action_url := '/profile';

  WHEN 'friend_request' THEN
    action_url := '/friend-requests';

  WHEN 'friend_accepted' THEN
    action_url := '/people';

  WHEN 'friend_insight' THEN
    action_url := '/insight/' || content_id;

  WHEN 'goal_achievement' THEN
    action_url := '/profile';

  WHEN 'feedback_posted' THEN
    action_url := '/feedback';  -- Will need special handling in app
END CASE;
```

**Important**: This should happen BEFORE the existing action_url sanitization check (around line 155-161).

### Step 2: Update All Notification Creation Points

**Files/Functions to check**:
- Friend request triggers (need to pass `content_type` and `content_id`)
- Insight publishing triggers
- Any direct calls to `create_notification_secure()` in other database functions

**Ensure all calls include**:
- `content_type` (e.g., 'insight', 'article', 'paper', 'book')
- `content_id` (the ID of the content being referenced)

**Example**:
```sql
PERFORM create_notification_secure(
  recipient_id := friend_id,
  source_user_id := NEW.user_id,
  notification_type := 'friend_insight',
  content_type := 'insight',  -- ADD THIS
  content_id := NEW.id::text,  -- ADD THIS
  custom_message := NULL,
  action_url := NULL,  -- Let function generate it
  additional_data := '{}',
  channel_override := 'social'
);
```

### Step 3: Implement Notification Tap Handler in React Native

**File to modify**: `/Users/gdwha/supercharged-1/context/NotificationContext.tsx`

**Current code** (lines 64-72):
```typescript
onNotificationResponse: (response) => {
  const data = response.notification.request.content.data;
  if (data.route) {
    console.log('Navigate to:', data.route);
  }
}
```

**New implementation**:
```typescript
import { useRouter } from 'expo-router';

// Inside NotificationProvider component
const router = useRouter();

// Update listener
onNotificationResponse: (response) => {
  const data = response.notification.request.content.data;
  const actionUrl = data.action_url || data.route;

  if (actionUrl) {
    console.log('Navigating to:', actionUrl);

    // Use Expo Router's navigation
    router.push(actionUrl);

    // Mark notification as read (optional)
    if (data.notification_id) {
      // Call API to mark as read
    }
  }
}
```

**Considerations**:
- May need to store router reference in a ref to avoid hook dependency issues
- Should handle navigation errors gracefully
- Consider adding haptic feedback on tap

### Step 4: Handle Feedback Modal Special Case

**Challenge**: Feedback isn't a route, it's a modal that can appear on any screen

**Solution Options**:

#### Option 1: Make feedback a modal route (RECOMMENDED)
Create `/feedback` as a modal presentation in `app/_layout.tsx`:

```typescript
<Stack.Screen
  name="feedback"
  options={{
    presentation: 'modal',
    title: 'Feedback Board'
  }}
/>
```

Then create `app/feedback.tsx` that renders the feedback modal content.

#### Option 2: Use navigation state
Navigate to `/feed` with a query param like `?openFeedback=true` and check in feed component to open modal.

#### Option 3: Use a global modal context
Trigger feedback modal from anywhere via context, but this is more complex.

**Recommended**: Option 1 (modal route) - cleanest implementation with Expo Router.

### Step 5: Update Trigger Functions That Call `create_notification_secure()`

**Files to check**:
- `notify_users_of_new_feedback()` - Already sets action_url to `/feedback` ✅
- Friend request triggers
- Insight publishing triggers
- Like/save/comment triggers
- Any other notification triggers

**For each trigger, ensure**:
1. `content_type` is passed correctly
2. `content_id` is passed correctly
3. Either let function generate `action_url` OR pass it explicitly

**Example - Friend Request Trigger**:
```sql
PERFORM create_notification_secure(
  recipient_id := NEW.addressee_id,
  source_user_id := NEW.requester_id,
  notification_type := 'friend_request',
  content_type := NULL,  -- No content for friend requests
  content_id := NULL,
  custom_message := NULL,
  action_url := NULL,  -- Function will set to /friend-requests
  additional_data := jsonb_build_object('friendship_id', NEW.id),
  channel_override := 'social'
);
```

### Step 6: Update Edge Function (if needed)

**File**: `supabase/functions/send-push-notification/index.ts`

**Ensure the Edge Function passes `action_url` to Expo**:

```typescript
const message = {
  to: pushToken,
  sound: 'default',
  title: 'Supercharged',
  body: notificationMessage,
  data: {
    notification_id: notificationId,
    action_url: actionUrl,  // ENSURE THIS IS INCLUDED
    type: notificationType,
    channel: channel
  },
  priority: priority,
  channelId: channelId  // Android
};
```

The Edge Function should:
1. Query the notification record from the database
2. Extract the `action_url` field
3. Include it in the push payload's `data` object

### Step 7: Testing Checklist

Test each notification type to ensure proper navigation:

- [ ] **Like on insight** → Create test insight → like it → verify tapping notification opens insight detail
- [ ] **Comment on insight** → Comment on insight → verify tapping opens insight detail
- [ ] **Save content** → Save an article → verify tapping opens article detail
- [ ] **Streak reminder** → Trigger streak reminder → verify opens `/feed`
- [ ] **Level up** → Level up (if possible) → verify opens `/profile`
- [ ] **Friend request** → Send friend request → verify opens `/friend-requests`
- [ ] **Friend accepted** → Accept friend request → verify opens `/people`
- [ ] **Friend posts insight** → Friend posts insight → verify opens insight detail
- [ ] **Feedback posted** → Post feedback → verify opens feedback modal
- [ ] **Reply to comment** → Reply to comment → verify opens insight detail
- [ ] **Save (articles/papers/books)** → Save different content types → verify opens correct content

**Test scenarios**:
1. App in foreground (notification banner)
2. App in background (notification tap)
3. App completely closed (notification tap)
4. iOS vs Android

## Additional Considerations

### Deep Link Configuration

Ensure `app.json` includes URL schemes:

```json
{
  "expo": {
    "scheme": "supercharged",
    "ios": {
      "associatedDomains": ["applinks:learningsupercharged.com"]
    },
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "data": [
            {
              "scheme": "supercharged"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```

### Notification Payload Structure

The final push notification payload should look like:

```json
{
  "to": "ExponentPushToken[...]",
  "sound": "default",
  "title": "Supercharged",
  "body": "George liked your insight",
  "data": {
    "notification_id": "uuid-here",
    "action_url": "/insight/abc123",
    "type": "like",
    "channel": "social"
  },
  "priority": "default",
  "channelId": "social"
}
```

### Error Handling

Consider adding error boundaries and fallback navigation:

```typescript
onNotificationResponse: (response) => {
  const data = response.notification.request.content.data;
  const actionUrl = data.action_url || data.route;

  if (actionUrl) {
    try {
      router.push(actionUrl);
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback to feed or show error
      router.push('/feed');
    }
  }
}
```

### Notification Read Status

Consider marking notifications as read when tapped:

```typescript
onNotificationResponse: async (response) => {
  const data = response.notification.request.content.data;
  const notificationId = data.notification_id;

  if (notificationId) {
    // Mark as read in database
    await supabase
      .from('notifications')
      .update({ is_read: true, opened_at: new Date().toISOString() })
      .eq('id', notificationId);
  }

  // Then navigate
  if (data.action_url) {
    router.push(data.action_url);
  }
}
```

## Files to Modify Summary

### Database (SQL)
1. `database/notifications_functions_secure.sql` - Update `create_notification_secure()`
2. Friend request trigger files
3. Insight publishing trigger files
4. Any other notification trigger files

### React Native (TypeScript)
1. `context/NotificationContext.tsx` - Implement navigation handler
2. `app/_layout.tsx` - Add feedback modal route (optional)
3. `app/feedback.tsx` - Create feedback modal screen (if needed)

### Edge Functions
1. `supabase/functions/send-push-notification/index.ts` - Ensure action_url is passed

## Implementation Priority

1. **High Priority** (Core functionality):
   - Step 1: Update `create_notification_secure()`
   - Step 3: Implement notification tap handler
   - Step 6: Test core notification types (like, comment, streak)

2. **Medium Priority** (Enhanced UX):
   - Step 4: Feedback modal route
   - Step 5: Update all trigger functions
   - Notification read status tracking

3. **Low Priority** (Polish):
   - Error handling and fallbacks
   - Haptic feedback
   - Analytics tracking

## Notes

- The app already has deep linking infrastructure via `lib/deepLinkHandler.ts`
- Expo Router handles most of the heavy lifting for navigation
- Existing notification system uses `pg_notify()` → Edge Function → Expo Push
- Push tokens are stored in `user_push_tokens` table
