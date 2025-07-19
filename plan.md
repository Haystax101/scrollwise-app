# Comprehensive Development Plan (Generated July 18th)

This document outlines the technical steps required to implement the features described in the development plan. It is based on the existing application architecture and best practices for the tech stack involved (React Native, Expo Router, Supabase).

---

## Phase 1: Real-Time Chat & Insights Integration

This phase focuses on building out the core social features of the app, enabling real-time interaction between users.

### 1.1. Data Seeding & User Setup

**Goal:** Create multiple user accounts for realistic testing.

- **Manual Seeding:** Create 3-5 user accounts manually via the app's sign-up flow. This is the simplest method for initial testing.
- **Recommendation (Advanced):** For long-term testing, create a simple Node.js script (`/scripts/seed.js`) that uses the `supabase-js` client to programmatically create users. This ensures a repeatable test environment.

### 1.2. Supabase Schema for Chat & Insights

**Goal:** Create the necessary backend tables to store conversations and insight responses.

- **New Table: `chats`**
  - Purpose: Represents a single conversation thread between two or more users.
  - Columns:
    - `id` (uuid, primary key)
    - `created_at` (timestamp with time zone)
    - `participant_ids` (array of uuid, references `profiles.id`) - Stores the IDs of the two users in the chat.
- **New Table: `chat_messages`**
  - Purpose: Stores an individual message within a chat.
  - Columns:
    - `id` (uuid, primary key)
    - `chat_id` (uuid, foreign key to `chats.id`)
    - `sender_id` (uuid, foreign key to `profiles.id`)
    - `content` (text, not null)
    - `created_at` (timestamp with time zone)
- **New Table: `insight_responses`**
  - Purpose: Stores user replies to feed insights.
  - Columns:
    - `id` (uuid, primary key)
    - `insight_id` (integer) - This will eventually reference a formal `insights` table.
    - `responder_id` (uuid, foreign key to `profiles.id`)
    - `original_author_id` (uuid, foreign key to `profiles.id`)
    - `content` (text, not null)
    - `created_at` (timestamp with time zone)
- **Row Level Security (RLS):** Immediately after creation, enable RLS on all three tables.
  - `chats`: Users can only see chats where their `auth.uid()` is in the `participant_ids` array.
  - `chat_messages`: Users can only see messages belonging to chats they are a part of.
  - `insight_responses`: Users can only see responses to their own insights.

### 1.3. Real-Time Chat Implementation

**Goal:** Enable users to send and receive messages in real time.

- **File to Modify:** `app/chat/[id].tsx`
- **Implementation:**
  1.  On screen load, query the `chat_messages` table for all messages where `chat_id` matches the ID from the route.
  2.  Use the Supabase client to create a **Realtime Subscription**. Listen for `INSERT` events on the `chat_messages` table where the `chat_id` matches.
  3.  When a new message event is received, update the component's state to append the new message to the screen, creating the real-time effect.
  4.  The "Send" button will trigger a function that inserts the new message into the `chat_messages` table, which will then be broadcast to the other user via the subscription.

### 1.4. Insight Reply → Friend Connection Flow

**Goal:** Create a connection and chat thread when a user replies to an insight.

- **New Table: `connections`**
  - Purpose: A simple join table to represent a friendship or connection.
  - Columns:
    - `user_id_1` (uuid, foreign key to `profiles.id`)
    - `user_id_2` (uuid, foreign key to `profiles.id`)
    - `created_at` (timestamp with time zone)
- **Implementation:**
  1.  When a user taps reply in `components\Insights.tsx` , trigger a new Supabase Edge Function.
  2.  This function will:
      a. Check the `connections` table to see if a friendship already exists. If not, create one.
      b. Check the `chats` table to see if a chat thread already exists between the two users. If not, create one.
      c. Use Expo Router (`router.push`) to navigate the user to the appropriate chat screen (`/chat/[id]`).

### 1.5. Insight Response Flow (Feed to Chat Tab)

**Goal:** Ensure a response submitted on an `InsightCard` in the feed appears in the original author's "Insights" tab.

- **Files to Modify:** `components/InsightCard.tsx`, `components/Insights.tsx`
- **Implementation:**
  1.  **Submit Logic (`InsightCard.tsx`):** The "Submit" button next to the text input on the `InsightCard` will trigger a function.
  2.  This function will perform an `INSERT` into the `insight_responses` table. The row will contain:
      - `responder_id`: The ID of the current user submitting the response.
      - `original_author_id`: The ID of the author of the insight.
      - `content`: The text from the input field.
      - `insight_id`: A reference to the original insight (once an `insights` table is formalized).
  3.  **Data Fetching (`Insights.tsx`):** The `Insights` component (in the chat tab) will be modified. Instead of using `dummyInsights`, it will now fetch data from the `insight_responses` table.
  4.  The query will select all rows where the `original_author_id` matches the current user's ID. This ensures users only see responses to their own insights.

---

## Phase 2: Profile Enhancement

This phase focuses on making the user profile more detailed, interactive, and personalized.

### 2.1. Fix Profile Data Fetching

**Goal:** Ensure name and email are properly fetched and displayed from the profiles table.

- **Files to Modify:** `components/Profile.tsx`
- **Issue:** The current profile query doesn't filter by the current user's ID, which may cause incorrect or missing data.
- **Implementation:**
  1. **Fix Profile Query:** Update the profile data fetching in the `useEffect` to properly filter by the current user's ID.
  2. **Add User ID Filter:** Modify the Supabase query to include `.eq('id', userId)` where `userId` is obtained from `supabase.auth.getUser()`.
  3. **Error Handling:** Add proper error handling for cases where the profile data is not found or the query fails.
  4. **Loading States:** Add loading states to prevent displaying default data while the actual profile data is being fetched.

### 2.2. Profile Picture Management

**Goal:** Allow users to upload and change their profile picture.

- **Files to Modify:** `components/Profile.tsx`, `lib/supabase.ts`
- **Dependencies:** `expo-image-picker`
- **Implementation:**
  1.  **Supabase Storage:** Create a new public bucket in Supabase Storage named `avatars`. Configure its policies for public reads and authenticated uploads.
  2.  **Image Picker:** In the `Profile` component, add an "Edit" button over the avatar. On press, use `expo-image-picker` to launch the device's image gallery.
  3.  **Upload Logic:** Once an image is selected, get its file data and upload it to the `avatars` bucket in Supabase Storage. The file should be named uniquely, e.g., `${userId}.png`. Use the `upload` method with `upsert: true` to handle both new uploads and replacements.
  4.  **Update Profile:** After a successful upload, get the public URL for the file and update the `avatar_url` column in the user's `profiles` row.

### 2.3. Consistent Saved Content Height

**Goal:** Ensure all saved content items have consistent height for better visual alignment.

- **Files to Modify:** `components/Profile.tsx`
- **Implementation:**
  1. **Fixed Height Container:** Update the `savedItemRow` style to have a fixed height (e.g., 80px) instead of allowing dynamic height based on content.
  2. **Title Truncation:** Add `numberOfLines={2}` and `ellipsizeMode="tail"` to the saved item title text to ensure it doesn't exceed the fixed height.
  3. **Content Layout:** Ensure the icon, title, and metadata are properly aligned within the fixed height container.
  4. **Visual Consistency:** This will create a uniform grid-like appearance for the saved content horizontal scroll view.

### 2.2. Onboarding & Profile Expansion

**Goal:** Collect more user information during onboarding and display/edit it on the profile screen.

- **Files to Modify:** `components/Onboarding.tsx`, `components/Profile.tsx`, `types.ts`
- **Implementation:**
  1.  **Add New Fields to `profiles`:** Add new columns to the `profiles` table as required (e.g., `role`, `company`, `location`, `bio`, etc.).
  2.  **Update Onboarding:** Add new steps or form fields to the `Onboarding` component to capture this information from new users. Update the final submission function to save these new fields.
  3.  **Display on Profile:** Fetch and display all new fields in the expandable details section of the `Profile` component.
  4.  **Create "Edit Profile" Screen:** Create a new screen/modal for editing profile details. This will be a form pre-filled with the user's current data that calls `supabase.from('profiles').update()` upon submission.
  5.  **Profile Completion Logic:** In the `Profile` component, create a function that calculates a completion percentage based on which of the key fields are filled out. Display this value in a new UI element, such as a progress bar, to incentivize users to complete their profiles.
 
---

## Phase 3: Feed & Content Refinement

This phase focuses on improving the quality and presentation of content in the main feed.

### 3.1. Refactor `VideoCard` to `ArticleCard`

**Goal:** Align the component's name with its primary function and remove unused video logic.

- **Files to Modify:** `components/VideoCard.tsx`, `components/MainFeed.tsx`
- **Implementation:**
  1.  Rename the file `components/VideoCard.tsx` to `components/ArticleCard.tsx`.
  2.  In the newly renamed file, change the component name from `VideoCard` to `ArticleCard`.
  3.  Search the codebase for all imports of `VideoCard` and update them to `ArticleCard`.
  4.  Analyze the component and remove all code related to video playback, including the `expo-video` dependency, state variables (`isPlaying`, `duration`, etc.), and the `<VideoView>` component.

### 3.2. Content Filtering

**Goal:** Allow users to hide content types they are not interested in.

- **Files to Modify:** `lib/feedAlgorithm.ts`, `components/SettingsModal.tsx`
- **Implementation:**
  1.  **Update `profiles` Table:** Add a new column, `hidden_content_types` (type: `text[]`), to the `profiles` table.
  2.  **Update Settings UI:** In the `SettingsModal`, add a new section with checkboxes for each content type (e.g., "Research", "News", "Book"). When a user checks a box, add that type to their `hidden_content_types` array in Supabase.
  3.  **Update Feed Algorithm:** In `feedAlgorithm.ts`, fetch the user's `hidden_content_types`. When querying for articles, add a `.not('type', 'in', `(${hidden_content_types.join(',')})`)` filter to the Supabase query to exclude the hidden types.

### 3.3. Display User Names in Comments

**Goal:** Show actual user names instead of generic "User" labels in comments.

- **Files to Modify:** `components/CommentsModal.tsx`, `components/CommentsSheet.tsx`
- **Implementation:**
  1. **Update Comments Query:** Modify the `fetchComments` function in both components to join with the `profiles` table to get user names.
  2. **Join with Profiles Table:** Update the Supabase query to include `profiles!comments_user_id_fkey(full_name)` in the select statement.
  3. **Display Logic:** Replace the current mapping logic that shows "User" for all non-current users with the actual `full_name` from the profiles table.
  4. **Fallback Handling:** If a user's profile doesn't exist or `full_name` is null, display a fallback like "Anonymous User" or the first part of their email address.

---

## Backend Plan (Out of Scope for this Workspace)

The following tasks are noted for the backend but will not be implemented here.

- [ ] Add a secondary, simpler summary for each article.
- [ ] Integrate a book summary service (e.g., via Gemini API) to populate book content.
- [ ] Refine data cleaning scripts to remove artifacts like "this paper" from summaries.
- [ ] Fix data ingestion bug causing multiple author names to be combined.
- [ ] Expand and verify RSS feed ingestion to ensure a wider variety of content.
