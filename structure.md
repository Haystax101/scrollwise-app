# AcademicReels/ScrollWise - Project Structure Documentation

## Project Overview

**AcademicReels** (branded as **ScrollWise**) is a React Native mobile application built with Expo that provides a TikTok-style vertical scrolling feed for academic content. Users can browse educational articles, papers, and content across various academic disciplines.

### Tech Stack

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

## Architecture Overview

### Design Patterns

- **Context-Provider Pattern**: For global state management (Auth, Industries)
- **Compound Component Pattern**: For modular UI components
- **Render Props/Hook Pattern**: Custom hooks for data fetching and state
- **File-based Routing**: Expo Router for navigation structure

### Data Flow

1. **Authentication**: Supabase Auth → AuthContext → Components
2. **User Preferences**: Onboarding → Supabase profiles → IndustriesContext
3. **Content Feed**: Industries filter → Supabase articles → MainFeed → VideoCard
4. **Interactions**: User actions → Supabase (likes/saves/comments) → UI updates

## Directory Structure

```
AcademicReels/
├── app/                          # Expo Router file-based routing
│   ├── _layout.tsx              # Root layout with providers
│   ├── (auth)/                  # Auth route group
│   │   └── _layout.tsx         # Auth-specific layout
│   ├── (app)/                   # Main app route group
│   │   └── _layout.tsx         # App-specific layout
│   ├── index.tsx               # Entry point (redirects)
│   ├── feed.tsx                # Main feed screen
│   ├── discover.tsx            # Discover/search screen
│   ├── profile.tsx             # User profile screen
│   ├── settings.tsx            # Settings screen
│   ├── sign-in.tsx             # Sign in screen
│   ├── sign-up.tsx             # Sign up screen
│   ├── onboarding.tsx          # User onboarding flow
│   └── saved-feed.tsx          # Saved content feed
├── components/                   # Reusable UI components
│   ├── AppHeader.tsx           # App-wide header/navigation
│   ├── CommentsModal.tsx       # Comments modal component
│   ├── CommentsSheet.tsx       # Comments bottom sheet
│   ├── CustomCheckbox.tsx      # Custom checkbox component
│   ├── Discover.tsx            # Discover screen component
│   ├── Header.tsx              # Bottom navigation header
│   ├── MainFeed.tsx            # Core feed functionality
│   ├── Onboarding.tsx          # Onboarding flow component
│   ├── Profile.tsx             # Profile screen component
│   ├── SavedFeed.tsx           # Saved content component
│   ├── Settings.tsx            # Settings screen component
│   ├── SignIn.tsx              # Sign in form component
│   ├── SignUp.tsx              # Sign up form component
│   ├── StaticVisual.tsx        # Static content visual
│   └── VideoCard.tsx           # Individual content card
├── context/                      # React Context providers
│   ├── AuthContext.tsx         # Authentication state
│   └── IndustriesContext.tsx   # User interests/industries
├── lib/                         # Utility libraries
│   ├── supabase.ts             # Supabase client configuration
│   └── industryMap.ts          # Industry ID/name mappings
├── assets/                      # Static assets
│   ├── icon.png                # App icon
│   ├── adaptive-icon.png       # Android adaptive icon
│   └── splash.png              # Splash screen
├── types.ts                     # TypeScript type definitions
├── database_migration.sql       # Database schema migration
├── App.tsx                      # Legacy app component
├── package.json                 # Dependencies and scripts
├── app.json                     # Expo configuration
├── tsconfig.json               # TypeScript configuration
├── metro.config.js             # Metro bundler config
└── babel.config.js             # Babel configuration
```

## Core Components

### 1. Authentication System (`context/AuthContext.tsx`)

- **Purpose**: Manages user authentication state globally
- **Features**:
  - Supabase auth integration
  - Session management
  - Auto-refresh tokens
  - Sign out functionality
- **Hook**: `useAuth()` - provides user, session, loading state, signOut function

### 2. Industries/Interests System (`context/IndustriesContext.tsx`)

- **Purpose**: Manages user's selected academic interests
- **Features**:
  - Fetches user interests from profiles table
  - Refreshes interests when updated
  - Provides industry filtering data
- **Hook**: `useIndustries()` - provides industries array and refresh function

### 3. Main Feed (`components/MainFeed.tsx`)

- **Purpose**: Core content browsing experience
- **Features**:
  - Vertical scrolling TikTok-style feed
  - Industry-based content filtering
  - Infinite scroll with pagination
  - Deep linking support (initialArticleId)
  - Loading states and error handling
- **Data Source**: Supabase articles table
- **Navigation**: FlatList with pagingEnabled for smooth scrolling

### 4. Video/Article Card (`components/VideoCard.tsx`)

- **Purpose**: Individual content item display
- **Features**:
  - Article content display with expandable text
  - Video playback support (expo-video)
  - Like/save functionality with real-time updates
  - External link handling
  - Progress bar for video content
  - Comments integration
- **Interactions**: Supabase real-time updates for likes/saves/comments

### 5. Onboarding Flow (`components/Onboarding.tsx`)

- **Purpose**: New user setup and preference collection
- **Features**:
  - 2-step wizard interface
  - Industry selection (CS, Finance, Math, Physics, EdTech)
  - Experience level selection
  - Profile creation in Supabase
- **Data Storage**: Updates profiles table with interests and experience

### 6. Navigation System

- **App Router Structure**: File-based routing with groups
- **Header Component** (`components/Header.tsx`): Bottom navigation with 3 tabs
  - Home (feed)
  - Discover (search)
  - Profile
- **AppHeader** (`components/AppHeader.tsx`): Router-aware header wrapper

## Database Schema (Supabase)

### Core Tables

1. **profiles**: User profile data

   - `id` (UUID, primary key, references auth.users)
   - `full_name` (text) - user's display name
   - `avatar_url` (text) - profile picture URL
   - `experience` (text) - experience level (Student, Professional, etc.)
   - `interests` (integer array) - selected industry IDs
   - `videos_watched` (integer) - total videos/articles consumed
   - `minutes_learned` (integer) - learning time tracking
   - `days_streak` (integer) - consecutive days streak
   - `email` (text) - user email address
   - `interests_names_list` (text array) - industry names for display

2. **articles**: Main content items

   - `id` (integer, primary key)
   - `title` (text) - article title
   - `content` (text) - full article content
   - `authors` (text array) - list of authors
   - `link` (text) - source URL
   - `created_at` (timestamp) - creation date
   - `type` (text) - content type (research/book/news)
   - `file_name` (text) - associated file reference
   - `date` (date) - publication date
   - `industry_id` (integer, foreign key) - references industries table
   - `likes_count` (integer) - total likes count
   - `saves_count` (integer) - total saves count
   - `comments_count` (integer) - total comments count

3. **reels**: Video content items (legacy/alternative format)

   - `id` (integer, primary key)
   - `created_at` (timestamp) - creation date
   - `user_id` (UUID, foreign key) - content creator
   - `title` (text) - reel title
   - `caption` (text) - reel description
   - `source_url` (text) - original source
   - `video_url` (text) - video file path
   - `likes_count` (integer) - total likes
   - `saves_count` (integer) - total saves
   - `comments_count` (integer) - total comments
   - `content` (text) - text content

4. **industries**: Academic categories/disciplines

   - `id` (integer, primary key)
   - `name` (text) - industry name (CS, Finance, etc.)
   - `description` (text) - detailed description
   - `icon_name` (text) - icon identifier
   - `color` (text) - theme color for UI

5. **article_likes**: User like interactions

   - `user_id` (UUID, foreign key) - references profiles.id
   - `article_id` (integer, foreign key) - references articles.id
   - `created_at` (timestamp) - when liked
   - **Unique constraint**: (user_id, article_id)

6. **article_saves**: User save/bookmark interactions

   - `user_id` (UUID, foreign key) - references profiles.id
   - `article_id` (integer, foreign key) - references articles.id
   - `created_at` (timestamp) - when saved
   - **Unique constraint**: (user_id, article_id)

7. **comments**: Article comments and discussions
   - `id` (integer, primary key)
   - `article_id` (integer, foreign key) - references articles.id
   - `content` (text) - comment text
   - `created_at` (timestamp) - comment timestamp
   - Additional user/author fields for comment attribution

### Table Relationships

- **profiles** ↔ **article_likes** (1:many via user_id)
- **profiles** ↔ **article_saves** (1:many via user_id)
- **articles** ↔ **article_likes** (1:many via article_id)
- **articles** ↔ **article_saves** (1:many via article_id)
- **articles** ↔ **comments** (1:many via article_id)
- **industries** ↔ **articles** (1:many via industry_id)
- **profiles** ↔ **reels** (1:many via user_id) - for user-generated content

### Industry Mapping (`lib/industryMap.ts`)

```typescript
1: 'CS'
2: 'Finance & Economics'
3: 'Maths'
4: 'Physics'
5: 'EdTech'
```

## State Management

### AuthContext Flow

1. **Initialization**: Check existing session on app start
2. **Auth State Changes**: Listen to Supabase auth events
3. **Session Management**: Auto-refresh tokens, handle sign out
4. **Component Integration**: Conditional rendering based on auth state

### IndustriesContext Flow

1. **User Dependency**: Triggers on user authentication
2. **Data Fetching**: Queries profiles table for user interests
3. **Feed Filtering**: Provides industry IDs to MainFeed component
4. **Real-time Updates**: Refreshes when profile is updated

## Navigation Architecture

### Expo Router Structure

- **Route Groups**: `(auth)` and `(app)` for logical separation
- **Layout Hierarchy**: Root → Group → Screen layouts
- **Provider Integration**: Root layout wraps entire app with contexts

### Navigation Flow

1. **Entry Point** (`app/index.tsx`): Redirects based on auth state
2. **Auth Screens**: Sign in/up flow in `(auth)` group
3. **Main App**: Protected routes in `(app)` group
4. **Deep Linking**: Support for direct feed item access

## Key Features

### Content Browsing

- **Vertical Scroll Feed**: TikTok-style infinite scroll
- **Industry Filtering**: Content filtered by user interests
- **Multi-format Support**: Articles, research papers, news
- **External Links**: Direct access to source material

### User Interactions

- **Likes System**: Real-time like/unlike with optimistic updates
- **Save Functionality**: Bookmark articles for later
- **Comments**: Modal-based commenting system
- **Content Sharing**: External link sharing capabilities

### Personalization

- **Interest Selection**: Academic field preferences
- **Experience Levels**: Student, Professional, Researcher, Enthusiast
- **Curated Feed**: Content filtered by selected interests

## Configuration

### Expo Configuration (`app.json`)

- **App Name**: ScrollWise
- **Bundle ID**: scrollwise
- **Platform Support**: iOS, Android, Web
- **Plugins**: expo-router

### Build Configuration

- **Metro Config**: SVG transformer support
- **TypeScript**: Strict mode enabled
- **Babel**: Module resolver for imports

## Development Patterns

### Component Patterns

- **Functional Components**: React hooks throughout
- **TypeScript**: Strict typing for props and state
- **Custom Hooks**: Reusable state logic (useAuth, useIndustries)
- **Error Boundaries**: Graceful error handling

### Data Patterns

- **Optimistic Updates**: UI updates before server confirmation
- **Real-time Sync**: Supabase real-time subscriptions
- **Caching Strategy**: Context-based state caching
- **Error Recovery**: Rollback on failed operations

### Security Patterns

- **Row Level Security**: Supabase RLS policies
- **Auth Guards**: Route protection based on auth state
- **Input Validation**: Client and server-side validation
- **Secure Storage**: Expo SecureStore for sensitive data

## Future Considerations

### Scalability

- **Content Pagination**: Implement proper infinite scroll
- **Image Optimization**: Add image caching and optimization
- **Performance**: React.memo and useMemo for heavy components
- **Offline Support**: Cache content for offline browsing

### Features

- **Search Functionality**: Full-text search in discover screen
- **User Profiles**: Public profiles and following system
- **Content Creation**: User-generated content submission
- **Notifications**: Push notifications for interactions

This structure documentation provides a comprehensive overview of the AcademicReels/ScrollWise codebase, covering architecture, components, data flow, and development patterns. Use this as a reference for understanding the project structure and making informed development decisions.
