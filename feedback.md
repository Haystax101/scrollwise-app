# Feedback Component System - Implementation Plan

## Overview
A comprehensive feedback board system allowing users to submit, vote on, and track feature requests and bug reports. Design inspired by modern feedback platforms with dark/light mode support.

---

## 1. Database Schema

### Table: `feedback`
Primary table storing all feedback items.

```sql
CREATE TABLE public.feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL CHECK (length(title) >= 5 AND length(title) <= 200),
  body text NOT NULL CHECK (length(body) >= 10 AND length(body) <= 2000),
  status text NOT NULL DEFAULT 'under_review' CHECK (status = ANY (ARRAY[
    'under_review'::text,
    'in_progress'::text,
    'completed'::text,
    'declined'::text,
    'planned'::text
  ])),
  upvotes_count integer NOT NULL DEFAULT 0 CHECK (upvotes_count >= 0),
  downvotes_count integer NOT NULL DEFAULT 0 CHECK (downvotes_count >= 0),
  dev_response text,
  dev_response_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT feedback_pkey PRIMARY KEY (id),
  CONSTRAINT feedback_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

CREATE INDEX idx_feedback_status ON public.feedback(status);
CREATE INDEX idx_feedback_created_at ON public.feedback(created_at DESC);
CREATE INDEX idx_feedback_upvotes ON public.feedback(upvotes_count DESC);
```

### Table: `user_feedback_upvotes`
Tracks which users have upvoted which feedback items.

```sql
CREATE TABLE public.user_feedback_upvotes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  feedback_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_feedback_upvotes_pkey PRIMARY KEY (id),
  CONSTRAINT user_feedback_upvotes_unique UNIQUE (user_id, feedback_id),
  CONSTRAINT user_feedback_upvotes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT user_feedback_upvotes_feedback_id_fkey FOREIGN KEY (feedback_id) REFERENCES public.feedback(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_feedback_upvotes_user ON public.user_feedback_upvotes(user_id);
CREATE INDEX idx_user_feedback_upvotes_feedback ON public.user_feedback_upvotes(feedback_id);
```

### Table: `user_feedback_downvotes`
Tracks which users have downvoted which feedback items.

```sql
CREATE TABLE public.user_feedback_downvotes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  feedback_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_feedback_downvotes_pkey PRIMARY KEY (id),
  CONSTRAINT user_feedback_downvotes_unique UNIQUE (user_id, feedback_id),
  CONSTRAINT user_feedback_downvotes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT user_feedback_downvotes_feedback_id_fkey FOREIGN KEY (feedback_id) REFERENCES public.feedback(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_feedback_downvotes_user ON public.user_feedback_downvotes(user_id);
CREATE INDEX idx_user_feedback_downvotes_feedback ON public.user_feedback_downvotes(feedback_id);
```

### Database Triggers

**Trigger: Update feedback upvote count**
```sql
CREATE OR REPLACE FUNCTION update_feedback_upvotes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE feedback SET upvotes_count = upvotes_count + 1 WHERE id = NEW.feedback_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE feedback SET upvotes_count = upvotes_count - 1 WHERE id = OLD.feedback_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_feedback_upvotes
AFTER INSERT OR DELETE ON user_feedback_upvotes
FOR EACH ROW EXECUTE FUNCTION update_feedback_upvotes_count();
```

**Trigger: Update feedback downvote count**
```sql
CREATE OR REPLACE FUNCTION update_feedback_downvotes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE feedback SET downvotes_count = downvotes_count + 1 WHERE id = NEW.feedback_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE feedback SET downvotes_count = downvotes_count - 1 WHERE id = OLD.feedback_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_feedback_downvotes
AFTER INSERT OR DELETE ON user_feedback_downvotes
FOR EACH ROW EXECUTE FUNCTION update_feedback_downvotes_count();
```

**Trigger: Update updated_at timestamp**
```sql
CREATE OR REPLACE FUNCTION update_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_feedback_timestamp
BEFORE UPDATE ON feedback
FOR EACH ROW EXECUTE FUNCTION update_feedback_updated_at();
```

### Row Level Security (RLS) Policies

```sql
-- Enable RLS
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feedback_upvotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feedback_downvotes ENABLE ROW LEVEL SECURITY;

-- Feedback policies
CREATE POLICY "Users can view all feedback"
  ON feedback FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own feedback"
  ON feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feedback"
  ON feedback FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own feedback"
  ON feedback FOR DELETE
  USING (auth.uid() = user_id);

-- Upvotes policies
CREATE POLICY "Users can view all upvotes"
  ON user_feedback_upvotes FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own upvotes"
  ON user_feedback_upvotes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own upvotes"
  ON user_feedback_upvotes FOR DELETE
  USING (auth.uid() = user_id);

-- Downvotes policies
CREATE POLICY "Users can view all downvotes"
  ON user_feedback_downvotes FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own downvotes"
  ON user_feedback_downvotes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own downvotes"
  ON user_feedback_downvotes FOR DELETE
  USING (auth.uid() = user_id);
```

---

## 2. Component Architecture

### File Structure
```
components/
  feedback/
    FeedbackBoardModal.tsx     - Main feedback board (full-screen modal)
    FeedbackItem.tsx           - Individual feedback card (truncated body)
    FeedbackDetailModal.tsx    - Detail view for full feedback content
    CreateFeedbackModal.tsx    - Modal for creating new feedback
    FeedbackFilters.tsx        - Sort and filter controls
    FeedbackVoteButton.tsx     - Upvote/downvote button component
    DevResponseSection.tsx     - Developer response display
```

### Component Hierarchy
```
FeedbackBoardModal (Full-screen modal, like Settings)
├── FeedbackFilters (sort dropdown + search input)
├── CreateFeedbackModal (triggered by + button)
├── FeedbackDetailModal (opened when tapping a card)
└── FlatList
    └── FeedbackItem (each feedback card - truncated body)
        ├── FeedbackVoteButton (separate upvote button)
        ├── FeedbackVoteButton (separate downvote button)
        └── DevResponseSection (if dev_response exists)
```

---

## 3. Component Details

### 3.1 FeedbackBoardModal.tsx
**Purpose:** Full-screen modal container for feedback board (presentation similar to Settings modal)

**Props:**
- `visible`: boolean - Modal visibility
- `onClose`: () => void - Close modal callback

**State:**
- `feedback`: FeedbackItem[] - Array of feedback items
- `loading`: boolean - Loading state
- `searchQuery`: string - Search filter text
- `sortBy`: 'top' | 'newest' | 'oldest' - Sort order
- `showCreateModal`: boolean - Create modal visibility
- `showDetailModal`: boolean - Detail modal visibility
- `selectedFeedback`: Feedback | null - Currently selected feedback for detail view
- `userVotes`: Map<string, 'up' | 'down'> - User's vote status per feedback

**Key Functions:**
- `fetchFeedback()` - Load feedback with user vote status
- `handleSearch()` - Filter feedback by search query (frontend only)
- `handleSort()` - Sort feedback by selected criteria
- `handleCreateFeedback()` - Open create modal
- `handleFeedbackPress()` - Open detail modal for selected feedback
- `handleVote()` - Handle upvote/downvote interactions
- `handleDelete()` - Delete user's own feedback (with confirmation)

**Supabase Query:**
```typescript
const { data: feedbackData } = await supabase
  .from('feedback')
  .select(`
    *,
    profiles:user_id (
      id,
      full_name,
      avatar_url
    )
  `)
  .order(sortBy === 'top' ? 'upvotes_count' : 'created_at', {
    ascending: sortBy === 'oldest'
  });

// Fetch user's votes
const { data: upvotes } = await supabase
  .from('user_feedback_upvotes')
  .select('feedback_id')
  .eq('user_id', userId);

const { data: downvotes } = await supabase
  .from('user_feedback_downvotes')
  .select('feedback_id')
  .eq('user_id', userId);
```

**Search Implementation:**
- Frontend-only search using JavaScript `.filter()`
- Search against: title + body
- Case-insensitive matching

### 3.2 FeedbackItem.tsx
**Purpose:** Display individual feedback card (with truncated body text)

**Props:**
```typescript
interface FeedbackItemProps {
  feedback: {
    id: string;
    title: string;
    body: string;
    status: string;
    upvotes_count: number;
    downvotes_count: number;
    created_at: string;
    dev_response?: string;
    dev_response_at?: string;
    profiles: {
      full_name: string;
      avatar_url: string;
    };
  };
  userUpvoted: boolean;
  userDownvoted: boolean;
  onUpvote: (feedbackId: string) => void;
  onDownvote: (feedbackId: string) => void;
  onPress: () => void; // Open detail modal
}
```

**UI Elements:**
- Card background with press effect
- Title (18px, bold)
- Body text (14px, secondary color, **truncated to 3 lines** with ellipsis)
- Status badge with color coding:
  - `under_review`: Yellow (#ffcc00)
  - `in_progress`: Blue (#4a9eff)
  - `completed`: Green (#4caf50)
  - `declined`: Red (#f44336)
  - `planned`: Purple (#9c27b0)
- **Two separate vote buttons** (upvote and downvote with individual counts)
- Created date (relative time, e.g., "2 days ago")
- Author info (small avatar + name)

**Body Truncation:**
- Use `numberOfLines={3}` to limit body text display
- Always tappable to view full content in detail modal

### 3.3 CreateFeedbackModal.tsx
**Purpose:** Modal for submitting new feedback

**State:**
- `title`: string - Feedback title (5-200 chars)
- `body`: string - Feedback description (10-2000 chars)
- `submitting`: boolean - Submit loading state

**Validation:**
- Title: 5-200 characters
- Body: 10-2000 characters
- Real-time character count display
- Disable submit if validation fails

**Supabase Insert:**
```typescript
const { error } = await supabase
  .from('feedback')
  .insert({
    user_id: userId,
    title: title.trim(),
    body: body.trim(),
    status: 'under_review'
  });
```

**UI:**
- Full-screen modal
- Header with close (X) and submit buttons
- Title input field
- Body textarea (multiline, 8-10 lines minimum height)
- Character counters for both fields
- ScrollView for content
- Auto-focus on title field

### 3.4 FeedbackDetailModal.tsx
**Purpose:** Full-screen modal showing complete feedback details

**Props:**
```typescript
interface FeedbackDetailModalProps {
  visible: boolean;
  feedback: Feedback | null;
  userUpvoted: boolean;
  userDownvoted: boolean;
  onClose: () => void;
  onUpvote: () => void;
  onDownvote: () => void;
  onDelete?: () => void; // Only shown if user owns the feedback
}
```

**UI Elements:**
- Full-screen modal (like Settings modal)
- Header with close button and optional delete button (three-dot menu)
- Author info (avatar, name, date)
- Title (larger font, bold)
- **Full body text** in ScrollView (not truncated)
- Status badge
- Vote buttons (upvote and downvote with counts)
- Developer response section (if exists)

**Delete Functionality:**
- Show delete option in header menu (three dots) only if current user is author
- Confirmation Alert before deletion
- Delete format consistent with other app deletion patterns

### 3.5 FeedbackVoteButton.tsx
**Purpose:** Individual vote button component (used for both upvote and downvote)

**Props:**
```typescript
interface VoteButtonProps {
  voteType: 'up' | 'down';
  count: number;
  userVoted: boolean;
  onPress: () => void;
  loading?: boolean;
}
```

**Vote Logic (handled in parent component):**
- If user hasn't voted this type: Insert vote record (and delete opposite if exists)
- If user voted this type: Delete vote record (un-vote)

**UI:**
- Upvote: ▲ arrow icon (Feather: arrow-up)
- Downvote: ▼ arrow icon (Feather: arrow-down)
- Active state: Highlighted with appropriate color (upvote yellow, downvote red)
- Inactive state: Gray color
- Count displayed next to arrow
- Smooth transition on state change

### 3.6 DevResponseSection.tsx
**Purpose:** Display developer response when available

**Props:**
```typescript
interface DevResponseProps {
  response: string;
  respondedAt: string;
}
```

**UI:**
- Only displayed if `dev_response` field has content
- Distinct visual styling (e.g., bordered section with different background)
- "Developer Response" header
- Response text
- Timestamp of response
- Icon to indicate official response (Feather: shield or message-square)

---

## 4. Integration Points

### 4.1 Main Feed (Feed Tab)
**File:** `screens/FeedScreen.tsx` or similar

**Location:** Top-right corner, overlaying the static visual, in line with flag button

**Implementation:**
```typescript
const [showFeedbackModal, setShowFeedbackModal] = useState(false);

// Add feedback button next to flag button
<TouchableOpacity
  style={styles.feedbackButton}
  onPress={() => setShowFeedbackModal(true)}
>
  <View style={styles.feedbackButtonContainer}>
    <Text style={styles.feedbackButtonText}>FEEDBACK</Text>
  </View>
</TouchableOpacity>

<FeedbackBoardModal
  visible={showFeedbackModal}
  onClose={() => setShowFeedbackModal(false)}
/>
```

**Button Styling:**
- Rounded rectangle background (borderRadius: 8-12px)
- Padding: 8px horizontal, 6px vertical
- Background: Semi-transparent or primary color
- Text: Bold, 12-13px font size
- Border: Optional 1px border for visibility

**Visibility Logic:**
- Show when viewing main feed
- Hide when viewing content from Vault (back button takes precedence)

### 4.2 Vault Tab
**File:** `screens/VaultScreen.tsx` or similar

**Location:** In line with "Articles" heading (or Books/Papers depending on selected tab)

**Implementation:**
```typescript
const [showFeedbackModal, setShowFeedbackModal] = useState(false);

<View style={styles.vaultHeader}>
  <Text style={styles.heading}>Articles</Text>
  <TouchableOpacity onPress={() => setShowFeedbackModal(true)}>
    <View style={styles.feedbackButtonContainer}>
      <Text style={styles.feedbackButtonText}>FEEDBACK</Text>
    </View>
  </TouchableOpacity>
</View>

<FeedbackBoardModal
  visible={showFeedbackModal}
  onClose={() => setShowFeedbackModal(false)}
/>
```

### 4.3 People Tab
**File:** `screens/PeopleScreen.tsx` or similar

**Location:** Top header next to notifications (mail icon) button

**Implementation:**
```typescript
const [showFeedbackModal, setShowFeedbackModal] = useState(false);

<View style={styles.headerIcons}>
  <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
    <Feather name="mail" size={24} color={colors.text} />
  </TouchableOpacity>
  <TouchableOpacity onPress={() => setShowFeedbackModal(true)}>
    <View style={styles.feedbackButtonContainer}>
      <Text style={styles.feedbackButtonText}>FEEDBACK</Text>
    </View>
  </TouchableOpacity>
</View>

<FeedbackBoardModal
  visible={showFeedbackModal}
  onClose={() => setShowFeedbackModal(false)}
/>
```

### 4.4 Insights Tab
**File:** `screens/InsightsTab.tsx` or similar

**Location:** In line with "Supercharged Stats" heading

**Implementation:**
```typescript
const [showFeedbackModal, setShowFeedbackModal] = useState(false);

<View style={styles.statsHeader}>
  <Text style={styles.heading}>Supercharged Stats</Text>
  <TouchableOpacity onPress={() => setShowFeedbackModal(true)}>
    <View style={styles.feedbackButtonContainer}>
      <Text style={styles.feedbackButtonText}>FEEDBACK</Text>
    </View>
  </TouchableOpacity>
</View>

<FeedbackBoardModal
  visible={showFeedbackModal}
  onClose={() => setShowFeedbackModal(false)}
/>
```

### 4.5 Settings Modal
**File:** `components/SettingsModal.tsx` or similar

**Location:** Add as menu item in settings list

**Implementation:**
```typescript
const [showFeedbackModal, setShowFeedbackModal] = useState(false);

// Add to settings options
<TouchableOpacity
  style={styles.settingItem}
  onPress={() => setShowFeedbackModal(true)}
>
  <Feather name="message-circle" size={20} color={colors.text} />
  <Text style={styles.settingText}>Feedback & Feature Requests</Text>
  <Feather name="chevron-right" size={20} color={colors.textSecondary} />
</TouchableOpacity>

<FeedbackBoardModal
  visible={showFeedbackModal}
  onClose={() => setShowFeedbackModal(false)}
/>
```

---

## 5. Modal Implementation Notes

### 5.1 No Navigation Stack Changes Needed
Since FeedbackBoardModal is a full-screen modal component (not a screen in navigation stack), no navigation configuration is required. Each screen/tab manages its own modal state.

### 5.2 Modal Behavior
- Full-screen presentation like Settings modal
- Opened via `visible` prop controlled by parent component
- Closed via `onClose` callback
- Can stack modals (FeedbackBoardModal → CreateFeedbackModal or FeedbackDetailModal)
- Bottom tab bar remains visible (or hidden based on parent screen's tab bar settings)

---

## 6. Theme Support

### Dark Mode Colors
```typescript
const darkTheme = {
  feedbackBackground: '#1a1a1a',
  feedbackBorder: '#222222',
  feedbackHoverBackground: '#242424',
  upvoteColor: '#ffcc00',
  downvoteColor: '#ff6b6b',
  statusUnderReview: '#ffcc00',
  statusInProgress: '#4a9eff',
  statusCompleted: '#4caf50',
  statusDeclined: '#f44336',
  statusPlanned: '#9c27b0',
  devResponseBackground: '#111111',
  devResponseBorder: '#333333',
};
```

### Light Mode Colors
```typescript
const lightTheme = {
  feedbackBackground: '#ffffff',
  feedbackBorder: '#e0e0e0',
  feedbackHoverBackground: '#f5f5f5',
  upvoteColor: '#ff9800',
  downvoteColor: '#f44336',
  statusUnderReview: '#ffa726',
  statusInProgress: '#2196f3',
  statusCompleted: '#66bb6a',
  statusDeclined: '#ef5350',
  statusPlanned: '#ab47bc',
  devResponseBackground: '#fafafa',
  devResponseBorder: '#e0e0e0',
};
```

---

## 7. TypeScript Interfaces

```typescript
interface Feedback {
  id: string;
  user_id: string;
  title: string;
  body: string;
  status: 'under_review' | 'in_progress' | 'completed' | 'declined' | 'planned';
  upvotes_count: number;
  downvotes_count: number;
  dev_response: string | null;
  dev_response_at: string | null;
  created_at: string;
  updated_at: string;
  profiles?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
}

interface UserVote {
  feedback_id: string;
  vote_type: 'up' | 'down';
}

type SortOption = 'top' | 'newest' | 'oldest';
```

---

## 8. Implementation Checklist

### Phase 1: Database Setup
- [ ] Create `feedback` table with all fields and constraints
- [ ] Create `user_feedback_upvotes` table
- [ ] Create `user_feedback_downvotes` table
- [ ] Create upvote count trigger function and trigger
- [ ] Create downvote count trigger function and trigger
- [ ] Create updated_at trigger function and trigger
- [ ] Set up RLS policies for all three tables
- [ ] Create indexes for performance

### Phase 2: Core Components
- [ ] Create `FeedbackBoard.tsx` with state management and data fetching
- [ ] Create `FeedbackItem.tsx` with all UI elements
- [ ] Create `FeedbackFilters.tsx` with sort and search
- [ ] Create `FeedbackVoteButton.tsx` with vote logic
- [ ] Create `DevResponseSection.tsx` for developer responses
- [ ] Create `CreateFeedbackModal.tsx` with validation

### Phase 3: Integration
- [ ] Add feedback button to Feed tab (top-right, with visibility logic)
- [ ] Add feedback button to Vault tab (in line with heading)
- [ ] Add feedback button to People tab (header next to mail icon)
- [ ] Add feedback button to Insights tab (in line with stats heading)
- [ ] Add feedback option to Settings modal
- [ ] Configure navigation to show People tab as active when viewing feedback

### Phase 4: Styling & Polish
- [ ] Implement dark mode theme colors
- [ ] Implement light mode theme colors
- [ ] Add hover/press states to all interactive elements
- [ ] Add loading states and skeletons
- [ ] Add empty state for no feedback items
- [ ] Add error handling and error states
- [ ] Test responsive layout on different screen sizes

### Phase 5: Testing & Refinement
- [ ] Test vote toggle functionality (up, down, un-vote, switch)
- [ ] Test search filtering
- [ ] Test sorting (top, newest, oldest)
- [ ] Test feedback creation with validation
- [ ] Test theme switching
- [ ] Test navigation from all integration points
- [ ] Verify RLS policies work correctly
- [ ] Test with multiple users and concurrent votes

---

## 9. Additional Considerations

### Performance Optimization
- Use `useMemo` for filtered/sorted feedback lists
- Implement optimistic UI updates for votes
- Consider pagination if feedback items exceed 50-100 items

### Analytics (Optional)
- Track feedback creation events
- Track vote interactions
- Track which integration points are most used

### Future Enhancements (Out of Scope)
- Email notifications for status changes
- Ability to edit submitted feedback
- Rich text formatting in feedback body
- Image attachments
- Feedback categories/tags
- Admin dashboard for managing feedback

---

## 10. Design Decisions (CONFIRMED)

1. **Navigation Tab Behavior:** ✅ Full-screen modal presentation (like Settings modal), not a navigation stack screen

2. **Feedback Detail View:** ✅ Tapping a feedback card opens a detail modal showing full content

3. **Vote Display:** ✅ Two separate buttons with separate counts (upvotes count + downvotes count)

4. **Deletion Policy:** ✅ Users can delete their own feedback (consistent with app deletion patterns)

5. **Button Design:** ✅ "FEEDBACK" text button in rounded rectangle (not icon-only)

6. **Status Colors:** ✅ Approved as specified

7. **Admin Access:** ✅ Manual Supabase access for now (in-app admin UI for future)

---

## 11. Database Migration File

Create file: `database/create_feedback_system.sql`

This file will contain all SQL statements from section 1 in the correct order for deployment to Supabase.
