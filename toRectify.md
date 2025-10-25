# Comprehensive Fix Plan for 9 Issues

## Issue 1: Update Post-Onboarding Achievement Criteria for Profile Completion

**Current State:**
- Achievement: "Profile Perfectionist" requires 100% profile completion
- Profile has been redesigned - removed: current work, skills, dream role/company
- New profile includes: projects, passions, bio, industries, avatar

**Investigation Needed:**
- Find where Profile Perfectionist achievement criteria is defined (likely in database triggers or RPC functions)
- Check current profile completeness calculation logic

**Plan:**
1. **Database Updates:**
   - Search for `check_profile_completion` or similar RPC functions in database
   - Update profile completeness logic to check:
     - ✅ Full name
     - ✅ Avatar uploaded
     - ✅ Bio filled
     - ✅ At least 1 industry selected
     - ✅ At least 1 project added
     - ✅ At least 1 passion added
   - Remove checks for: current_role, dream_role, skills

2. **UI Updates:**
   - Update `OnboardingProgressCard` component to display correct steps
   - Update `services/onboardingService.ts` step descriptions:
     - Keep: "Explore & Engage" (like first post)
     - Update: "Complete Profile" description to reflect new requirements
     - Keep: "Join the Conversation" (first comment)
     - Keep: "Share Knowledge" (publish first insight)
   - Ensure step icons and descriptions match new profile structure

3. Test achievement awards correctly at 100% completion

**Files to Modify:**
- Database RPC function for profile completeness (need to locate)
- `components/onboarding/OnboardingProgressCard.tsx` - update step display
- `services/onboardingService.ts` - update step descriptions
- Potentially achievement trigger functions

---

## Issue 2: Fix Light Mode Text Color for Book Summaries

**Current State:**
- Book summaries show white text in light mode (unreadable)
- Should be black in light mode, white in dark mode

**Plan:**
1. Check ThemeContext for text color definitions
2. Find BookCard or BookSummary component
3. Ensure all text uses `colors.text` from theme context instead of hardcoded white
4. Verify in both light and dark modes

**Files to Check:**
- `context/ThemeContext.tsx`
- `components/BookCard.tsx` or similar
- Any book summary rendering components

---

## Issue 3: Fix Create Insight Button on iPhone SE

**Current State:**
- "Create insight" button obscured by bottom navigation on small screens (iPhone SE)
- Only affects devices with home button (non-notch phones)

**Plan:**
1. Find insights tab component with create button
2. Add extra bottom padding for phones with home screen button
3. Use device detection or `useSafeAreaInsets()` to determine if extra padding needed
4. Add `paddingBottom` of ~20-30px for devices with home button

**Files to Modify:**
- `app/insight.tsx` or insights tab screen
- Add conditional bottom padding based on device type

---

## Issue 4: Split "What Drives You" Modal into Separate Modals

**Current State:**
- Single modal called "What Drives You" allows editing both projects and passions
- Bottom field obscured by keyboard when typing

**Plan:**
1. Find "What Drives You" modal component in profile
2. Create two separate edit modals:
   - **Projects Modal**: Edit/add what you're working on
   - **Passions Modal**: Edit/add what you're passionate about
3. Update profile section to have separate edit buttons for each:
   - "Edit Projects" button → opens Projects modal
   - "Edit Passions" button → opens Passions modal
4. Each modal has single input field, no keyboard obstruction

**Files to Modify:**
- Current "What Drives You" modal (split into two)
- `components/profile/ProjectsModal.tsx` (new)
- `components/profile/PassionsModal.tsx` (new)
- Profile screen - update to have two separate edit buttons

---

## Issue 5: Vault Progressive Loading & Fresh Content

**Current State:**
- Vault caches content permanently (shows weeks-old data)
- All content loads at once (slow)

**Plan:**
1. Update Vault data fetching to:
   - Sort by `created_at DESC` or `updated_at DESC`
   - Add cache invalidation (max age: 1 hour)
2. Implement progressive loading:
   - Initial load: 10-15 items
   - Background fetch: remaining items
   - Show loading indicator
3. Add pull-to-refresh functionality

**Files to Modify:**
- `components/Vault.tsx`
- Vault data fetching service/hook

---

## Issue 6: Show Friend Insights on User Profile

**Current State:**
- Viewing another user's profile doesn't show their insights
- Should only show if you're friends

**Plan:**
1. Find UserProfile component
2. Add friendship status check query
3. If friends, fetch user's insights filtered by `author_id = viewed_user_id`
4. Display insights in a **horizontal ScrollView** (similar to insights tab layout)
5. Reuse existing InsightCard component
6. Position below profile info section

**Files to Modify:**
- User profile view component
- Add friendship check query
- Add horizontal insights ScrollView section

---

## Issue 7: Debug Daily Streak Notifications ✅ FIXED

**Previous State:**
- Streak notifications should send at 10 AM GMT daily
- Not working (cron job couldn't authenticate with edge function)

**Root Cause:**
- Cron job tried to call edge function via HTTP
- Couldn't set service role key as database parameter (permission denied)
- Authentication failed silently

**Solution Implemented:**
- Created database function `send_daily_streak_reminders()` that creates notifications directly
- No edge function call needed for scheduled reminders
- Cleaner, faster, no authentication issues

**Deployment:**
1. Run `deploy_streak_notifications_db_function.sql` in Supabase SQL Editor
2. Test with `SELECT * FROM send_daily_streak_reminders();`
3. Verify notifications created

**Files:**
- ✅ `deploy_streak_notifications_db_function.sql` - Complete deployment
- ✅ `STREAK_NOTIFICATIONS_FINAL.md` - Documentation
- 📝 `supabase/functions/daily-streak-reminders/index.ts` - Edge function still exists for manual triggers

---

## Issue 8: Investigate Insight Publishing Issue

**User Report:** Cannot publish insights after recent database changes

**Investigation:**
1. Check recent database schema changes to `insights` table
2. Look for broken triggers or constraints
3. Check RLS policies on insights table
4. Review insight creation RPC function

**Plan:**
1. Review `databaseOverview.sql` for insights table structure
2. Check if any required fields were added
3. Test insight creation manually in database
4. Check app logs for specific error messages
5. Verify RLS policies allow INSERT

**Files to Check:**
- `database/` - any recent insight-related migrations
- `databaseOverview.sql` - insights table definition
- Insight creation service/component

---

## Issue 9: Add Content Request Feature to Vault

**New Feature:** Allow users to request articles/papers

**Plan:**
1. Create new database table `user_content_requests`:
   ```sql
   CREATE TABLE user_content_requests (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES profiles(id),
     request_text TEXT NOT NULL,
     topic TEXT,
     content_type TEXT, -- 'article', 'paper', 'book'
     status TEXT DEFAULT 'pending', -- 'pending', 'reviewing', 'completed', 'declined'
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

2. Create modal component:
   - Text input for request description
   - Optional: topic/category selector
   - Submit button

3. Add button in Vault header/footer
4. Create RPC function to insert request
5. Set up RLS policies

**Files to Create/Modify:**
- `database/user_content_requests.sql` (new)
- `components/Vault.tsx` - add request button
- `components/ContentRequestModal.tsx` (new)
- RPC function for submitting requests

---

## Priority Order:

1. **Issue 8** (Blocking bug - users can't publish)
2. **Issue 7** (Broken feature - notifications)
3. **Issue 2** (UX bug - unreadable text)
4. **Issue 3** (UX bug - obscured button)
5. **Issue 1** (Broken achievement)
6. **Issue 4** (UX improvement - keyboard)
7. **Issue 5** (Performance/UX - stale content)
8. **Issue 6** (Feature gap - friend insights)
9. **Issue 9** (New feature - content requests)

---

## Issue 10: Limit Insight Text Display in Feed with "Read More"

**Current State:**
- Long insights display in full in the feed, taking up excessive space
- No truncation or character limit
- Makes feed scrolling difficult

**Plan:**
1. Find InsightCard component used in feed
2. Implement 14-line limit for insight text display:
   - Use `numberOfLines={14}` on Text component
   - Calculate if text exceeds 14 lines
3. Add "Read More" button when text is truncated:
   - Position to the right of view count
   - Only show if content is longer than 14 lines
4. Create "Read More" modal:
   - Same UI as feed card
   - Display insight with 14 lines visible initially
   - Wrap in ScrollView to allow reading full content
   - User can scroll to read entire insight
5. Handle modal open/close

**Files to Create/Modify:**
- `components/InsightCard.tsx` - add truncation logic and Read More button
- `components/InsightReadMoreModal.tsx` (new) - modal with scrollable full insight
- Add `onLayout` or text measurement to detect when truncation needed

**Implementation Details:**
```tsx
// In InsightCard
const [isTextTruncated, setIsTextTruncated] = useState(false);
const [showReadMore, setShowReadMore] = useState(false);

// Detect if text is truncated
<Text
  numberOfLines={14}
  onTextLayout={(e) => {
    if (e.nativeEvent.lines.length >= 14) {
      setIsTextTruncated(true);
    }
  }}
>
  {insightContent}
</Text>

// Show Read More button
{isTextTruncated && (
  <TouchableOpacity onPress={() => setShowReadMore(true)}>
    <Text>Read More</Text>
  </TouchableOpacity>
)}
```

---

---

## Issue 11: Add Unread Notification Badge to People Page

**Current State:**
- Mail/notification icon in People page header has no badge
- Users don't know when they have new notifications
- Notification types include: friend requests, likes, comments, friend insights, etc.

**Plan:**
1. Create service/hook to count unread notifications:
   - Query `notifications` table where `user_id = current_user` AND `is_read = false`
   - Return count of unread notifications
   - Set up real-time subscription to update count when new notifications arrive

2. Find People page header component with mail icon
3. Add badge component displaying unread count
4. Position badge in top-right corner of mail icon (standard iOS/Android pattern)
5. Badge should:
   - Show number if count ≤ 99
   - Show "99+" if count > 99
   - Hide badge when count = 0
   - Update in real-time when notifications arrive

6. Optional: Use different colors for different priority levels
   - Red badge for high priority (friend requests)
   - Orange/yellow for medium priority (likes, comments)

**Files to Create/Modify:**
- `services/notificationService.ts` - add `getUnreadCount()` and real-time subscription
- `components/friends/People.tsx` - add badge to mail icon
- `components/NotificationBadge.tsx` (new) - reusable badge component
- Consider caching unread count in context/state for performance

**Implementation Details:**
```tsx
// In notificationService.ts
export const getUnreadNotificationCount = async (userId: string): Promise<number> => {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  return count || 0;
};

// Real-time subscription
export const subscribeToUnreadCount = (userId: string, callback: (count: number) => void) => {
  return supabase
    .channel(`notifications_${userId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${userId}`
    }, async () => {
      const count = await getUnreadNotificationCount(userId);
      callback(count);
    })
    .subscribe();
};

// In People.tsx header
<View style={styles.iconContainer}>
  <Ionicons name="mail-outline" size={24} color={colors.text} />
  {unreadCount > 0 && (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>
        {unreadCount > 99 ? '99+' : unreadCount}
      </Text>
    </View>
  )}
</View>
```

---

## Priority Order:

1. ~~**Issue 8** (Blocking bug - users can't publish)~~ ✅ FIXED
2. ~~**Issue 7** (Broken feature - notifications)~~ ✅ FIXED (pending daily streak test)
3. **Issue 2** (UX bug - unreadable text)
4. **Issue 3** (UX bug - obscured button)
5. **Issue 10** (UX bug - long insights clutter feed)
6. **Issue 11** (UX improvement - notification badge)
7. **Issue 1** (Broken achievement)
8. **Issue 4** (UX improvement - keyboard)
9. **Issue 5** (Performance/UX - stale content)
10. **Issue 6** (Feature gap - friend insights)
11. **Issue 9** (New feature - content requests)

## Estimated Effort:

- Issues 2, 3, 11: 15-30 min each (simple CSS/layout fixes)
- Issues 1, 4, 6, 10: 1-2 hours each (moderate complexity)
- ~~Issues 7, 8: 1-3 hours (debugging required)~~ ✅ COMPLETED
- Issues 5, 9: 2-4 hours (new features/refactoring)
