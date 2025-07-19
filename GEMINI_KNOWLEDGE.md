
# Gemini Knowledge Base: AcademicReels/ScrollWise

This document is a comprehensive knowledge base for the AcademicReels (ScrollWise) project. It combines information from `structure.md`, `plan.md`, and `CURSOR_MEMORY.md` to provide a single source of truth for development.

## 1. Project Overview

**AcademicReels** (branded as **ScrollWise**) is a React Native mobile application built with Expo that provides a TikTok-style vertical scrolling feed for academic content. Users can browse educational articles, papers, and content across various academic disciplines.

### 1.1. Tech Stack

- **Framework**: React Native with Expo SDK 53
- **Router**: Expo Router v5 (file-based routing)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **State Management**: React Context API
- **UI Components**: React Native Elements (@rneui/themed)
- **Icons**: Expo Vector Icons (Feather, MaterialCommunityIcons)
- **Video**: Expo Video (expo-video v2.2.1)
- **Gestures**: React Native Gesture Handler
- **Bottom Sheets**: @gorhom/bottom-sheet
- **Language**: TypeScript

## 2. Architecture & Design

### 2.1. Key Architectural Learnings & Decisions

- **Global Navigation Overlay**: A persistent global UI element like a bottom tab bar must be placed in the root layout file (`app/_layout.tsx`) as a sibling to the main `Stack` navigator, not as a child. This ensures it renders on top of all screens.
- **Layout File Responsibilities**:
    - **Root Layout (`app/_layout.tsx`):** For top-level setup, initializing global context providers, defining the root navigator, and rendering persistent global UI overlays.
    - **Group Layouts (`app/(group)/_layout.tsx`):** Define the navigation structure for a specific group of routes. Their sole purpose is to return a navigator component.
- **Full-Screen Backgrounds**: For full-bleed backgrounds, the root element should be a standard `<View style={{ flex: 1 }}>`. Content within that view should then have its padding managed manually to avoid being obscured by the status bar or bottom navigation.
- **Modal Implementation**: Encapsulate modal logic within the component that triggers it. Using React Native's built-in `<Modal>` component directly inside the parent screen ensures the modal's content inherits all necessary contexts.

### 2.2. Data Flow

1.  **Authentication**: Supabase Auth → AuthContext → Components
2.  **User Preferences**: Onboarding → Supabase profiles → IndustriesContext
3.  **Content Feed**: Industries filter → Supabase articles → MainFeed → VideoCard
4.  **Interactions**: User actions → Supabase (likes/saves/comments) → UI updates

## 3. Supabase Database Schema

### 3.1. Core Tables

-   **`profiles`**: User profile data.
-   **`articles`**: Main content items.
-   **`reels`**: Video content items (legacy/alternative format).
-   **`industries`**: Academic categories/disciplines.
-   **`article_likes`**: User like interactions.
-   **`article_saves`**: User save/bookmark interactions.
-   **`comments`**: Article comments and discussions.

### 3.2. Planned Tables (for Chat & Insights)

-   **`chats`**: Represents a single conversation thread.
    -   `id` (uuid, pk), `created_at`, `participant_ids` (array of uuid)
-   **`chat_messages`**: Stores an individual message within a chat.
    -   `id` (uuid, pk), `chat_id` (fk to `chats`), `sender_id` (fk to `profiles`), `content` (text), `created_at`
-   **`insight_responses`**: Stores user replies to feed insights.
    -   `id` (uuid, pk), `insight_id` (integer), `responder_id` (fk to `profiles`), `original_author_id` (fk to `profiles`), `content` (text), `created_at`
-   **`connections`**: A join table to represent a friendship or connection.
    -   `user_id_1` (fk to `profiles`), `user_id_2` (fk to `profiles`), `created_at`

### 3.3. Security

-   **Row Level Security (RLS)** is enabled on all tables.
-   **Planned RLS Policies**:
    -   `chats`: Users can only see chats where their `auth.uid()` is in the `participant_ids` array.
    -   `chat_messages`: Users can only see messages belonging to chats they are a part of.
    -   `insight_responses`: Users can only see responses to their own insights.

## 4. Development Plan & Future Updates

### 4.1. Phase 1: Real-Time Chat & Insights Integration

-   **Goal**: Build out the core social features of the app.
-   **Tasks**:
    1.  **Data Seeding**: Create multiple user accounts for testing.
    2.  **Supabase Schema**: Create `chats`, `chat_messages`, and `insight_responses` tables with RLS.
    3.  **Real-Time Chat**: Implement real-time messaging in `app/chat/[id].tsx` using Supabase Realtime Subscriptions.
    4.  **Insight Reply → Friend Connection**: Create a `connections` table and a Supabase Edge Function to create a connection and chat thread when a user replies to an insight.
    5.  **Insight Response Flow**: Implement the logic for submitting and displaying insight responses.

### 4.2. Phase 2: Profile Enhancement

-   **Goal**: Make the user profile more detailed, interactive, and personalized.
-   **Tasks**:
    1.  **Fix Profile Data Fetching**: Ensure name and email are properly fetched and displayed from the `profiles` table.
    2.  **Profile Picture Management**: Allow users to upload and change their profile picture using `expo-image-picker` and Supabase Storage.
    3.  **Consistent Saved Content Height**: Ensure all saved content items have consistent height for better visual alignment.
    4.  **Onboarding & Profile Expansion**: Collect more user information during onboarding and display/edit it on the profile screen.

### 4.3. Phase 3: Feed & Content Refinement

-   **Goal**: Improve the quality and presentation of content in the main feed.
-   **Tasks**:
    1.  **Refactor `VideoCard` to `ArticleCard`**: Align the component's name with its primary function and remove unused video logic.
    2.  **Content Filtering**: Allow users to hide content types they are not interested in.
    3.  **Display User Names in Comments**: Show actual user names instead of generic "User" labels in comments.

### 4.4. Backend Plan (Out of Scope for this Workspace)

-   Add a secondary, simpler summary for each article.
-   Integrate a book summary service.
-   Refine data cleaning scripts.
-   Fix data ingestion bug causing multiple author names to be combined.
-   Expand and verify RSS feed ingestion.

## 5. Potential Issues & Current Solutions

-   **Problem**: The bottom navigation bar (`AppHeader.tsx`) repeatedly disappeared.
    -   **Root Cause**: Incorrect placement of the `<AppHeader />` component inside nested layout files.
    -   **Solution**: Place the `<AppHeader />` in the root layout file (`app/_layout.tsx`) as a sibling to the main `Stack` navigator.
-   **Problem**: A gradient background on the `Profile` screen was not extending to the top edge of the device screen.
    -   **Root Cause**: Using a `<SafeAreaView>` as the root container.
    -   **Solution**: Use a standard `<View style={{ flex: 1 }}>` as the root element and manage padding manually.
-   **Problem**: The `SettingsModal` crashed due to a `useTheme` error.
    -   **Root Cause**: The modal was rendered in a part of the React tree that was not a descendant of the `ThemeProvider`.
    -   **Solution**: Encapsulate modal logic within the component that triggers it using React Native's built-in `<Modal>` component.
-   **Issue**: The current profile query doesn't filter by the current user's ID.
    -   **Solution**: Update the profile data fetching in `components/Profile.tsx` to properly filter by the current user's ID.

This knowledge base should be updated as the project evolves.
