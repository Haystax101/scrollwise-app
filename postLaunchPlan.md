# Post-Launch Implementation Plan

## EAS Update Compatibility ✅

**All features listed below are compatible with EAS Update and can be shipped without a new build.**

- ✅ No native dependencies required (all packages already installed)
- ✅ No project configuration changes needed
- ✅ All changes are pure JavaScript/TypeScript UI updates
- ✅ Database schema changes handled server-side
- ✅ `expo-image-picker` and `expo-image-manipulator` already installed for profile pictures

## Implementation Timeline

Each feature can be implemented and shipped independently via EAS Update.

---

## 1. Mail Icon & Inbox System

### Database Changes Required
```sql
-- Add notifications table for likes/comments
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['like'::text, 'comment'::text, 'friend_request'::text])),
  source_user_id uuid NOT NULL,
  content_type text CHECK (content_type = ANY (ARRAY['insight'::text, 'article'::text, 'paper'::text, 'book'::text])),
  content_id text,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT notifications_source_user_id_fkey FOREIGN KEY (source_user_id) REFERENCES public.profiles(id)
);
```

### Implementation Steps
1. **Update people.tsx (app/people.tsx:87)**
   - Replace add-people icon with mail icon (`<Feather name="mail" />`)
   - Update onPress to navigate to new inbox route

2. **Create inbox page (app/inbox.tsx)**
   - Three tabs: "Received Requests", "Sent Requests", "Notifications"
   - Reuse existing friend request components from friend-requests.tsx
   - Create NotificationsList component for likes/comments

3. **Update notification triggers**
   - Add notification creation in like/comment functions in relevant services
   - Update FriendsService to create notifications for friend requests

### Files to Modify
- `app/people.tsx` - Import People component instead of containing JSX
- `components/friends/People.tsx` - New component (move JSX from people.tsx)
- `app/inbox.tsx` - New file (import Inbox component)
- `components/friends/Inbox.tsx` - New component containing inbox JSX
- `lib/friendsService.ts` - Add notification functions
- `lib/notificationService.ts` - New service file

---

## 2. Tagline System

### Database Changes Required
```sql
-- Rename existing bio field to tagline and add length constraint
ALTER TABLE public.profiles RENAME COLUMN bio TO tagline;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_tagline_length CHECK (length(tagline) <= 100);
```

### Implementation Steps
1. **Update profile editing**
   - Update NewProfile component to use existing bio field as tagline
   - Change field labels from "bio" to "tagline" in UI
   - Add 100-character limit validation

2. **Display taglines in leaderboard**
   - Update LeaderboardEntry type to include tagline (was bio)
   - Modify leaderboard component to show tagline below names
   - Update FriendsService.getFriendsLeaderboard() to query tagline field

3. **Display taglines on insights**
   - Update insight card components to show author tagline (was bio)
   - Modify insight API calls to include author tagline field

### Files to Modify
- `components/profile/NewProfile.tsx` - Update bio field to tagline with 100 char limit
- `app/leaderboard.tsx` - Import Leaderboard component instead of containing JSX
- `components/friends/Leaderboard.tsx` - Move JSX from leaderboard.tsx, add taglines
- `lib/friendsService.ts` - Update queries from bio to tagline field
- `types/friends.ts` - Update bio to tagline in interfaces
- Insight components - Show author taglines (update bio to tagline)

---

## 3. Leaderboard Redesign

### Implementation Steps
1. **Update leaderboard.tsx layout**
   - Implement design from leaderboard.png reference
   - Keep voltz count but update visual styling
   - Add tagline display below usernames
   - Ensure responsive design for various screen sizes

2. **Visual enhancements**
   - Add ranking badges/icons for top 3 positions
   - Improve avatar display consistency
   - Update color scheme and typography

### Files to Modify
- `components/friends/Leaderboard.tsx` - Complete redesign (JSX moved from app/leaderboard.tsx)
- `app/leaderboard.tsx` - Import component instead of containing JSX

---

## 4. Profile Detail Modal

### Implementation Steps
1. **Search existing modal implementation**
   - Check if UserDetailModal or similar exists in components
   - If exists, integrate into required locations
   - If not, create new modal component

2. **Create/Update UserDetailModal**
   - Show expanded profile info (avatar, name, tagline, voltz, connection status)
   - Add connect/message actions
   - Make it dismissible with back button

3. **Integrate modal in multiple locations**
   - Leaderboard entries (app/leaderboard.tsx)
   - People like you section (app/people.tsx)
   - Your team section (app/people.tsx)
   - Inbox entries (app/inbox.tsx)
   - Insight author names (insight components)

### Files to Modify
- `components/friends/UserDetailModal.tsx` - New/updated component
- `components/friends/Leaderboard.tsx` - Add modal trigger
- `components/friends/People.tsx` - Add modal triggers
- `components/friends/Inbox.tsx` - Add modal trigger
- Insight components - Add modal trigger for authors

---

## 5. Vault Content Isolation

### Implementation Steps
1. **Update vault.tsx navigation**
   - Modify content tap handlers to navigate to isolated view
   - Pass content data and source flag to indicate vault origin

2. **Create isolated content views**
   - `app/vault/article/[id].tsx` - Isolated article view
   - `app/vault/paper/[id].tsx` - Isolated paper view
   - `app/vault/book/[id].tsx` - Isolated book view
   - Reuse existing content card components but render outside feed context

3. **Maintain vault tab highlighting**
   - Update navigation state to keep "vault" active
   - Ensure back button returns to vault, not feed
   - Preserve existing back button logic

### Files to Create
- `app/vault/article/[id].tsx`
- `app/vault/paper/[id].tsx`
- `app/vault/book/[id].tsx`

### Files to Modify
- `app/vault.tsx` - Update navigation logic
- Content card components - Handle vault context

---

## 6. Feed Persistence

### Implementation Decision Required
**Option A: Local State Management**
- Use React Context to store feed position
- Persist scroll position and data between tab switches
- Risk: Memory usage increase

**Option B: Navigation State**
- Use expo-router params to track position
- Less memory intensive
- Risk: Complexity in deep navigation

### Recommended Approach: Option A with Memory Management

### Implementation Steps
1. **Create FeedContext**
   - Store feed data, scroll position, loading state
   - Implement smart cache invalidation (time-based)

2. **Update tab navigation**
   - Preserve feed state when switching tabs
   - Only reload on app restart or manual refresh

3. **Implement pull-to-refresh**
   - Verify existing swipe-to-reload functionality
   - Ensure it clears cache and reloads feed

### Files to Create
- `context/FeedContext.tsx` - New context for feed persistence

### Files to Modify
- `app/(app)/_layout.tsx` - Wrap with FeedContext
- `app/feed.tsx` - Integrate with FeedContext
- Feed-related components - Use context instead of local state

---

## 7. More "People Like You" Profiles

### Implementation Steps
1. **Update people.tsx data loading**
   - Increase suggestions limit from 3 to 6 in loadData()
   - Modify FriendsService.getFriendSuggestions(6) call

2. **Update UI layout**
   - Ensure ScrollView accommodates 6 profiles
   - Test horizontal scrolling performance
   - Verify "See more" button still functions

### Files to Modify
- `components/friends/People.tsx` - Change suggestions count in component
- `app/people.tsx` - No changes needed (just imports component)
- Verify no layout issues with increased count

---

## 8. Remove Industry Interest Text Labels

### Implementation Steps
1. **Find industry interests component**
   - Search for industry interests in profile components
   - Likely in NewProfile or related profile components

2. **Update to icons-only display**
   - Remove text labels, keep only icons
   - Adjust spacing and alignment
   - Test for visual clarity

### Files to Search & Modify
- `components/profile/NewProfile.tsx` - Remove text labels
- Related profile components showing industry interests

---

## 9. Replace Streak with Connection Count

### Database Query Update
```sql
-- Query to get connection count for a user
SELECT COUNT(*) as connections_count
FROM friendships
WHERE (requester_id = $1 OR addressee_id = $1)
AND status = 'accepted';
```

### Implementation Steps
1. **Update profile progress section**
   - Replace "day streak" display with "connections"
   - Update data fetching in profile service
   - Change UI labels and icons

2. **Update user progress tracking**
   - Modify profile data loading to fetch connection count
   - Update ProfileService or relevant service

### Files to Modify
- `components/profile/NewProfile.tsx` - Update progress section
- Profile service files - Add connection count query

---

## 10. Simplified Profile Sections

### Database Changes Required
```sql
-- Create table for passionate about and working on sections
CREATE TABLE public.profile_passions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  passionate_about text CHECK (length(passionate_about) <= 400),
  working_on text CHECK (length(working_on) <= 400),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profile_passions_pkey PRIMARY KEY (id),
  CONSTRAINT profile_passions_user_id_key UNIQUE (user_id),
  CONSTRAINT profile_passions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
```

### Implementation Steps
1. **Remove existing complex sections**
   - Remove work experience, education, skills sections from profile
   - Keep only essential profile information

2. **Add new simplified sections**
   - "What you're passionate about" - 400 char limit
   - "What you're working on" - 400 char limit
   - Simple text input fields with character counters

3. **Update profile editing**
   - Add form fields for new sections
   - Implement save/update functionality
   - Add character limit validation

### Files to Modify
- `components/profile/NewProfile.tsx` - Replace sections
- Profile service files - Add new fields API
- Database migration - Create new table

---

## 11. Profile Picture with Compression

### Implementation Steps
1. **Create image compression utility**
   - Use existing expo-image-manipulator package
   - Implement 200x200px resize with WebP output
   - Achieve ~20-50KB file size target

2. **Update profile photo functionality**
   - Add "Remove photo" option
   - Add "Choose from library" option
   - Add "Take photo" option
   - Implement compression before Supabase upload

3. **Supabase storage setup**
   - Ensure profile-pics bucket exists
   - Set up proper RLS policies
   - Use upsert for avatar updates

### Implementation Reference (from postLaunch.md)
```typescript
// Image compression function
const compressImage = async (uri: string): Promise<string> => {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 200, height: 200 } }],
    {
      compress: 0.8,
      format: ImageManipulator.SaveFormat.WEBP
    }
  );
  return result.uri;
};

// Upload to Supabase
const uploadProfilePicture = async (userId: string, imageUri: string) => {
  const compressedUri = await compressImage(imageUri);
  const { data, error } = await supabase.storage
    .from('profile-pics')
    .upload(`${userId}/avatar.webp`, compressedUri, {
      contentType: 'image/webp',
      upsert: true
    });
};
```

### Files to Modify
- `components/profile/NewProfile.tsx` - Add photo management UI
- `lib/imageService.ts` - New service for image handling
- `lib/supabaseService.ts` - Add storage functions

---

## Architectural Note: Component Structure

Following the existing app pattern, all JSX should be moved from page files (app/*.tsx) to component files (components/**/*.tsx):

- `app/people.tsx` → `components/friends/People.tsx`
- `app/leaderboard.tsx` → `components/friends/Leaderboard.tsx`
- `app/inbox.tsx` → `components/friends/Inbox.tsx`

Page files should only handle routing and import the respective components.

## Implementation Priority & Dependencies

### Phase 1 (Independent - Can ship immediately)
1. **Refactor existing components** - Move JSX from app files to components
2. Mail icon & basic inbox (without notifications)
3. More "People Like You" profiles
4. Remove industry interest text labels
5. Leaderboard redesign (without taglines)

### Phase 2 (Requires database changes)
6. Tagline system (database + UI)
7. Replace streak with connections
8. Simplified profile sections
9. Profile picture functionality

### Phase 3 (Complex features)
10. Feed persistence system
11. Vault content isolation
12. Profile detail modal integration
13. Complete notification system

## Testing Strategy

1. **Per-feature testing** - Each feature should be tested independently
2. **Database migration testing** - Test all schema changes in development first
3. **Cross-platform testing** - Verify iOS and Android compatibility
4. **Performance testing** - Especially for feed persistence and image compression
5. **EAS Update testing** - Test each update deployment in staging

## Risk Mitigation

1. **Database backups** before schema changes
2. **Feature flags** for easy rollback of UI changes
3. **Gradual rollout** via EAS Update channels
4. **Performance monitoring** for memory usage with feed persistence
5. **Storage monitoring** for profile picture usage
