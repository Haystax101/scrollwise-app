# Comprehensive Development Plan (Generated July 18th)

This document outlines the technical steps required to implement the features described in the development plan. It is based on the existing application architecture and best practices for the tech stack involved (React Native, Expo Router, Supabase).


## Phase 2: Profile & Onboarding Overhaul (PRIORITY)

### 2.1. Profile Data Model & Matching Foundations

- [ ] **Introduce canonical tables for skills, industries, degrees, companies**
    - See SQL migration below for table structure.
-- [ ] **Introduce join tables for normalized, queryable relationships**
    - User's universities (normalized, canonical table + join table)
    - User's degrees/subjects/disciplines + stage
    - User's industries + stage (with experience level: Student, Intern, Entry-Level, Mid-Level, Senior, Executive)
    - User's current projects
    - User's work experiences (multiple, each linked to a company from canonical table, with title, description, start/end date, experience level)
    - User's current and desired roles + timeframe
    - User's long-term career goals and target companies (companies selected from canonical table)
- [ ] **Introduce more input fields in onboarding to ensure user can add details**
- [ ] **Introduce ability to update details in profile**
- [ ] **Introduce tracker of how much of their profile is completed**

#### SQL Migration Example
```sql
-- Canonical tables
CREATE TABLE universities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL
);
CREATE TABLE industries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL
);
CREATE TABLE degrees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL
);
CREATE TABLE companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL
);

-- Join tables
CREATE TABLE user_universities (
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  university_id uuid REFERENCES universities(id),
  PRIMARY KEY (user_id, university_id)
);
CREATE TABLE user_degrees (
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  degree_id uuid REFERENCES degrees(id),
  stage TEXT,
  PRIMARY KEY (user_id, degree_id)
);
CREATE TABLE user_industries (
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  industry_id uuid REFERENCES industries(id),
  stage TEXT, -- Student, Intern, Entry-Level, Mid-Level, Senior, Executive
  PRIMARY KEY (user_id, industry_id)
);
CREATE TABLE user_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT,
  description TEXT
);
CREATE TABLE user_experiences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  company_id uuid REFERENCES companies(id),
  title TEXT,
  description TEXT,
  start_date DATE,
  end_date DATE,
  experience_level TEXT -- Student, Intern, Entry-Level, Mid-Level, Senior, Executive
);
CREATE TABLE user_roles (
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT,
  type TEXT, -- 'current' or 'desired'
  timeframe TEXT,
  PRIMARY KEY (user_id, type)
);
CREATE TABLE user_goals (
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  goal TEXT,
  PRIMARY KEY (user_id)
);
CREATE TABLE user_goal_companies (
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  company_id uuid REFERENCES companies(id),
  PRIMARY KEY (user_id, company_id)
);

-- RLS policies
ALTER TABLE universities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON universities FOR SELECT USING (true);
ALTER TABLE industries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON industries FOR SELECT USING (true);
ALTER TABLE degrees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON degrees FOR SELECT USING (true);
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON companies FOR SELECT USING (true);

ALTER TABLE user_universities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own university links"
  ON user_universities
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
ALTER TABLE user_degrees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own degrees"
  ON user_degrees
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
ALTER TABLE user_industries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own industries"
  ON user_industries
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
ALTER TABLE user_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own projects"
  ON user_projects
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
ALTER TABLE user_experiences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own experiences"
  ON user_experiences
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own roles"
  ON user_roles
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own goals"
  ON user_goals
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
ALTER TABLE user_goal_companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own goal companies"
  ON user_goal_companies
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

---

### 2.2. Profile Picture Management

**Goal:** Allow users to upload and change their profile picture.

- [ ] Allow user to change their profile picture + store it!
- **Files to Modify:** `components/Profile.tsx`, `lib/supabase.ts`
- **Dependencies:** `expo-image-picker`
- **Implementation:**
  1.  **Supabase Storage:** Create a new public bucket in Supabase Storage named `avatars`. Configure its policies for public reads and authenticated uploads.
  2.  **Image Picker:** In the `Profile` component, add an "Edit" button over the avatar. On press, use `expo-image-picker` to launch the device's image gallery.
  3.  **Upload Logic:** Once an image is selected, get its file data and upload it to the `avatars` bucket in Supabase Storage. The file should be named uniquely, e.g., `${userId}.png`. Use the `upload` method with `upsert: true` to handle both new uploads and replacements.
  4.  **Update Profile:** After a successful upload, get the public URL for the file and update the `avatar_url` column in the user's `profiles` row.


### 2.3. Onboarding & Profile Expansion

- [ ] Modify onboarding to accept additional information (see below for field mapping and UI types)
    - All fields optional except name/email; users can fill in later via profile
    - All company/university/industry/degree fields are autocomplete/search from canonical tables
    - Experience level options: Student, Intern, Entry-Level, Mid-Level, Senior, Executive
    - Work experience: allow multiple, each linked to a company from canonical table
    - Remove skills from onboarding
- [ ] Modify profile section to display all a user’s information as well as allow them to update / add more information. **Also fetch name and email in profile properly**
    - [ ] Display what percentage complete their profile is, like how LinkedIn do

---

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
