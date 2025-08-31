# Pre-Launch Updates Plan

## Overview

This document outlines the comprehensive plan to prepare the Supercharged social learning app for beta testing. Based on the analysis of `zzz.md` and `achievementsList.md`, this plan focuses on implementing essential features while maintaining code quality and following 2025 React Native best practices.

## 🎯 Primary Objectives

- Implement achievements system with proper voltz rewards
- Enhance voltz awarding mechanisms across all user activities
- Create post-onboarding completion tracking
- Improve feed algorithm for supercharged insights
- Fix UI inconsistencies and remove deprecated components
- Ensure seamless light/dark mode support

---

## 📋 Task Breakdown

### 1. 🏆 Achievements System Implementation

#### Database Schema Updates

```sql
-- Seed achievements table with curated list from achievementsList.md
-- Voltz amounts reduced to prevent inflation: 1000 voltz = 1 level

INSERT INTO public.achievements (name, description, icon_name, category, rarity, criteria, voltz_reward, is_active) VALUES
-- SHARING & PLATFORM GROWTH (Highest Priority)
('The Social Butterfly', 'Share your first post to social media', 'share', 'social', 'common', '{"action": "first_share"}', 250, true),
('Wingman Activated', 'Invite your first friend', 'users', 'social', 'common', '{"action": "first_invite"}', 375, true),
('Cross-Platform Pioneer', 'Share to 3 different social platforms', 'globe', 'social', 'uncommon', '{"action": "multi_platform_share", "target": 3}', 300, true),
('Link Dropper', 'Share your profile link 5 times', 'link', 'social', 'common', '{"action": "profile_shares", "target": 5}', 200, true),
('Viral Virtuoso', 'Get 100+ likes on a shared post', 'heart', 'social', 'rare', '{"action": "viral_content", "target": 100}', 600, true),
('The Recruiter', 'Successfully invite 5 friends who join', 'user-plus', 'social', 'epic', '{"action": "successful_invites", "target": 5}', 1000, true),

-- PUBLISHING CONTENT (High Priority)
('First Words', 'Publish your first insight', 'edit-3', 'completion', 'common', '{"action": "first_insight"}', 200, true),
('The Debutante', 'Get your first like on published content', 'heart', 'engagement', 'common', '{"action": "first_like_received"}', 150, true),
('Regular Contributor', 'Publish 10 insights', 'edit', 'milestone', 'uncommon', '{"action": "insights_published", "target": 10}', 500, true),
('Crowd Pleaser', 'Get 50 total likes on your content', 'heart-circle', 'engagement', 'uncommon', '{"action": "total_likes_received", "target": 50}', 400, true),
('Supercharge Rookie', 'Use voltz points to supercharge your first post', 'zap', 'completion', 'uncommon', '{"action": "first_supercharge"}', 300, true),

-- SOCIAL INTERACTION (Medium Priority)
('The Supporter', 'Like your first post', 'heart', 'completion', 'common', '{"action": "first_like_given"}', 50, true),
('Conversation Starter', 'Leave your first comment', 'message-circle', 'completion', 'common', '{"action": "first_comment"}', 75, true),
('Engagement Enthusiast', 'Like 100 posts', 'heart-multiple', 'engagement', 'uncommon', '{"action": "likes_given", "target": 100}', 200, true),
('Chatty Cathy', 'Leave 50 comments', 'message-circle-multiple', 'engagement', 'uncommon', '{"action": "comments_made", "target": 50}', 300, true),

-- LEARNING ACTIVITIES (Lower Priority)
('Quiz Curious', 'Complete your first quiz', 'help-circle', 'learning', 'common', '{"action": "first_quiz"}', 100, true),
('Quiz Whiz', 'Complete 25 quizzes', 'brain', 'learning', 'uncommon', '{"action": "quizzes_completed", "target": 25}', 250, true),
('Accuracy Ace', 'Maintain 80%+ quiz accuracy over 20 quizzes', 'target', 'skill', 'rare', '{"action": "quiz_accuracy", "percentage": 80, "minimum_quizzes": 20}', 350, true),

-- PLATFORM LOYALTY & STREAKS
('Profile Perfectionist', 'Complete your profile 100%', 'user-check', 'completion', 'common', '{"action": "profile_completion", "percentage": 100}', 150, true),
('Daily Devotee', 'Log in for 7 consecutive days', 'calendar', 'streak', 'common', '{"action": "login_streak", "target": 7}', 125, true),
('Creature of Habit', 'Maintain a 30-day login streak', 'calendar-heart', 'streak', 'rare', '{"action": "login_streak", "target": 30}', 400, true),
('Leaderboard Climber', 'Break into top 100 users', 'trophy', 'milestone', 'uncommon', '{"action": "leaderboard_position", "target": 100}', 300, true);

-- Create trigger function for achievement tracking
CREATE OR REPLACE FUNCTION public.check_achievements()
RETURNS TRIGGER AS $$
DECLARE
  achievement_record RECORD;
  user_achievement_exists BOOLEAN;
  achievement_met BOOLEAN;
BEGIN
  -- Loop through all active achievements
  FOR achievement_record IN
    SELECT * FROM public.achievements WHERE is_active = true
  LOOP
    -- Check if user already has this achievement
    SELECT EXISTS(
      SELECT 1 FROM public.user_achievements
      WHERE user_id = COALESCE(NEW.user_id, NEW.author_id)
      AND achievement_id = achievement_record.id
    ) INTO user_achievement_exists;

    -- Skip if user already has achievement
    IF user_achievement_exists THEN
      CONTINUE;
    END IF;

    -- Check achievement criteria based on the action
    achievement_met := FALSE;

    -- Example criteria checking (expand based on your needs)
    IF achievement_record.criteria->>'action' = 'first_insight' AND TG_TABLE_NAME = 'insights' THEN
      achievement_met := TRUE;
    ELSIF achievement_record.criteria->>'action' = 'first_like_given' AND TG_TABLE_NAME = 'insight_likes' THEN
      achievement_met := TRUE;
    ELSIF achievement_record.criteria->>'action' = 'first_comment' AND TG_TABLE_NAME = 'insight_comments' THEN
      achievement_met := TRUE;
    END IF;

    -- Award achievement if criteria met
    IF achievement_met THEN
      INSERT INTO public.user_achievements (
        user_id,
        achievement_id,
        achievement_type,
        title,
        description,
        icon_name,
        earned_at
      ) VALUES (
        COALESCE(NEW.user_id, NEW.author_id),
        achievement_record.id,
        achievement_record.category,
        achievement_record.name,
        achievement_record.description,
        achievement_record.icon_name,
        NOW()
      );

      -- Award voltz
      UPDATE public.profiles
      SET spendable_voltz = spendable_voltz + achievement_record.voltz_reward,
          total_voltz_earned = total_voltz_earned + achievement_record.voltz_reward
      WHERE id = COALESCE(NEW.user_id, NEW.author_id);

      -- Log voltz transaction
      INSERT INTO public.xp_ledger (user_id, amount, reason, subject_type, subject_id, transaction_type)
      VALUES (
        COALESCE(NEW.user_id, NEW.author_id),
        achievement_record.voltz_reward,
        'Achievement: ' || achievement_record.name,
        'achievement',
        achievement_record.id::text,
        'earned'
      );
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for achievement checking
CREATE TRIGGER achievement_trigger_insights
  AFTER INSERT ON public.insights
  FOR EACH ROW EXECUTE FUNCTION public.check_achievements();

CREATE TRIGGER achievement_trigger_likes
  AFTER INSERT ON public.insight_likes
  FOR EACH ROW EXECUTE FUNCTION public.check_achievements();

CREATE TRIGGER achievement_trigger_comments
  AFTER INSERT ON public.insight_comments
  FOR EACH ROW EXECUTE FUNCTION public.check_achievements();
```

#### Implementation Tasks

- [ ] Create `services/achievementService.ts` for client-side achievement logic
- [ ] Build `components/achievements/AchievementNotification.tsx` for real-time notifications
- [ ] Implement `components/achievements/AchievementsList.tsx` for profile display
- [ ] Add achievement icons to the design system
- [ ] Create achievement progress tracking in user dashboard

### 2. ⚡ Enhanced Voltz Awarding System

#### Database Schema Updates

```sql
-- Update insights table to properly track voltz spent on supercharging
ALTER TABLE public.insights
  ALTER COLUMN voltz_spent SET NOT NULL DEFAULT 0;

-- Create function for voltz rewards on social interactions
CREATE OR REPLACE FUNCTION public.award_social_voltz()
RETURNS TRIGGER AS $$
BEGIN
  -- Award voltz to content author for engagement
  IF TG_TABLE_NAME = 'insight_likes' THEN
    -- +5 voltz for likes received
    UPDATE public.profiles
    SET spendable_voltz = spendable_voltz + 5,
        total_voltz_earned = total_voltz_earned + 5
    WHERE id = (SELECT author_id FROM public.insights WHERE id = NEW.insight_id);

    INSERT INTO public.xp_ledger (user_id, amount, reason, subject_type, subject_id, transaction_type)
    SELECT author_id, 5, 'Like received on insight', 'insight', NEW.insight_id::text, 'earned'
    FROM public.insights WHERE id = NEW.insight_id;

  ELSIF TG_TABLE_NAME = 'insight_comments' THEN
    -- +10 voltz for comments received
    UPDATE public.profiles
    SET spendable_voltz = spendable_voltz + 10,
        total_voltz_earned = total_voltz_earned + 10
    WHERE id = (SELECT author_id FROM public.insights WHERE id = NEW.insight_id);

    INSERT INTO public.xp_ledger (user_id, amount, reason, subject_type, subject_id, transaction_type)
    SELECT author_id, 10, 'Comment received on insight', 'insight', NEW.insight_id::text, 'earned'
    FROM public.insights WHERE id = NEW.insight_id;

  ELSIF TG_TABLE_NAME = 'insight_saves' THEN
    -- +10 voltz for saves received
    UPDATE public.profiles
    SET spendable_voltz = spendable_voltz + 10,
        total_voltz_earned = total_voltz_earned + 10
    WHERE id = (SELECT author_id FROM public.insights WHERE id = NEW.insight_id);

    INSERT INTO public.xp_ledger (user_id, amount, reason, subject_type, subject_id, transaction_type)
    SELECT author_id, 10, 'Save received on insight', 'insight', NEW.insight_id::text, 'earned'
    FROM public.insights WHERE id = NEW.insight_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for social voltz
CREATE TRIGGER social_voltz_trigger_likes
  AFTER INSERT ON public.insight_likes
  FOR EACH ROW EXECUTE FUNCTION public.award_social_voltz();

CREATE TRIGGER social_voltz_trigger_comments
  AFTER INSERT ON public.insight_comments
  FOR EACH ROW EXECUTE FUNCTION public.award_social_voltz();

CREATE TRIGGER social_voltz_trigger_saves
  AFTER INSERT ON public.insight_saves
  FOR EACH ROW EXECUTE FUNCTION public.award_social_voltz();

-- Update quiz voltz rewards
CREATE OR REPLACE FUNCTION public.award_quiz_voltz()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_correct THEN
    -- +20 voltz for correct answers
    UPDATE public.profiles
    SET spendable_voltz = spendable_voltz + 20,
        total_voltz_earned = total_voltz_earned + 20
    WHERE id = NEW.user_id;

    INSERT INTO public.xp_ledger (user_id, amount, reason, subject_type, subject_id, transaction_type)
    VALUES (NEW.user_id, 20, 'Correct quiz answer', 'quiz', NEW.question_id::text, 'earned');
  ELSE
    -- +5 voltz for incorrect answers (participation)
    UPDATE public.profiles
    SET spendable_voltz = spendable_voltz + 5,
        total_voltz_earned = total_voltz_earned + 5
    WHERE id = NEW.user_id;

    INSERT INTO public.xp_ledger (user_id, amount, reason, subject_type, subject_id, transaction_type)
    VALUES (NEW.user_id, 5, 'Quiz participation', 'quiz', NEW.question_id::text, 'earned');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER quiz_voltz_trigger
  AFTER INSERT ON public.quiz_attempts
  FOR EACH ROW EXECUTE FUNCTION public.award_quiz_voltz();

-- Daily login voltz system
CREATE TABLE IF NOT EXISTS public.daily_logins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  login_date DATE NOT NULL DEFAULT CURRENT_DATE,
  streak_count INTEGER NOT NULL DEFAULT 1,
  bonus_voltz INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, login_date)
);

CREATE OR REPLACE FUNCTION public.handle_daily_login(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
  last_login_date DATE;
  current_streak INTEGER := 1;
  daily_voltz INTEGER := 5;
  streak_bonus INTEGER := 0;
  total_voltz INTEGER;
  result JSON;
BEGIN
  -- Check last login
  SELECT login_date, streak_count INTO last_login_date, current_streak
  FROM public.daily_logins
  WHERE user_id = user_uuid
  ORDER BY login_date DESC
  LIMIT 1;

  -- Calculate streak
  IF last_login_date = CURRENT_DATE THEN
    -- Already logged in today
    RETURN json_build_object(
      'already_logged_today', true,
      'streak', current_streak,
      'voltz_awarded', 0
    );
  ELSIF last_login_date = CURRENT_DATE - INTERVAL '1 day' THEN
    -- Continuing streak
    current_streak := current_streak + 1;
  ELSE
    -- Streak broken or first login
    current_streak := 1;
  END IF;

  -- Calculate streak bonus (every 5 days)
  IF current_streak % 5 = 0 THEN
    streak_bonus := current_streak * 5;
  END IF;

  total_voltz := daily_voltz + streak_bonus;

  -- Record login
  INSERT INTO public.daily_logins (user_id, login_date, streak_count, bonus_voltz)
  VALUES (user_uuid, CURRENT_DATE, current_streak, streak_bonus);

  -- Award voltz
  UPDATE public.profiles
  SET spendable_voltz = spendable_voltz + total_voltz,
      total_voltz_earned = total_voltz_earned + total_voltz,
      days_streak = current_streak
  WHERE id = user_uuid;

  -- Log transaction
  INSERT INTO public.xp_ledger (user_id, amount, reason, transaction_type)
  VALUES (user_uuid, total_voltz, 'Daily login (streak: ' || current_streak || ')', 'earned');

  RETURN json_build_object(
    'streak', current_streak,
    'daily_voltz', daily_voltz,
    'streak_bonus', streak_bonus,
    'total_voltz', total_voltz,
    'already_logged_today', false
  );
END;
$$ LANGUAGE plpgsql;
```

#### Implementation Tasks

- [ ] Update `InsightCard.tsx` to show supercharged status with voltz amount
- [ ] Modify voltz selector in `components/insights/VoltzSelector.tsx` to use integer values
- [ ] Implement daily login tracking in `context/AuthContext.tsx`
- [ ] Create voltz transaction history in profile
- [ ] Add voltz balance display in navigation header

### 3. 📝 Post-Onboarding Completion System

#### Database Schema

```sql
-- Create onboarding steps tracking table
CREATE TABLE IF NOT EXISTS public.onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  step_name TEXT NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  UNIQUE(user_id, step_name)
);

-- Update profiles table to include onboarding completion percentage
-- (This field already exists in the schema)

-- Function to calculate and update onboarding progress
CREATE OR REPLACE FUNCTION public.update_onboarding_progress(
  user_uuid UUID,
  step_name TEXT,
  step_metadata JSONB DEFAULT '{}'
) RETURNS JSON AS $$
DECLARE
  total_steps INTEGER := 4; -- Will be 5 when social sharing is added
  completed_steps INTEGER;
  completion_percentage INTEGER;
  step_config JSONB;
  voltz_reward INTEGER;
  achievement_name TEXT;
BEGIN
  -- Step configuration with voltz rewards and achievements
  step_config := json_build_object(
    'explore_engage', json_build_object('voltz', 100, 'achievement', 'Platform Explorer'),
    'complete_profile', json_build_object('voltz', 200, 'achievement', 'Profile Perfectionist'),
    'join_conversation', json_build_object('voltz', 150, 'achievement', 'Community Member'),
    'share_knowledge', json_build_object('voltz', 200, 'achievement', 'First Words')
  );

  -- Insert or update step completion
  INSERT INTO public.onboarding_progress (user_id, step_name, metadata)
  VALUES (user_uuid, step_name, step_metadata)
  ON CONFLICT (user_id, step_name) DO UPDATE SET
    completed_at = NOW(),
    metadata = step_metadata;

  -- Count completed steps
  SELECT COUNT(*) INTO completed_steps
  FROM public.onboarding_progress
  WHERE user_id = user_uuid;

  -- Calculate percentage
  completion_percentage := (completed_steps * 100) / total_steps;

  -- Update profile completion percentage
  UPDATE public.profiles
  SET profile_completion_percentage = GREATEST(profile_completion_percentage, completion_percentage)
  WHERE id = user_uuid;

  -- Award voltz and achievement for this step
  IF step_config ? step_name THEN
    voltz_reward := (step_config->step_name->>'voltz')::INTEGER;
    achievement_name := step_config->step_name->>'achievement';

    -- Award voltz
    UPDATE public.profiles
    SET spendable_voltz = spendable_voltz + voltz_reward,
        total_voltz_earned = total_voltz_earned + voltz_reward
    WHERE id = user_uuid;

    -- Log voltz transaction
    INSERT INTO public.xp_ledger (user_id, amount, reason, transaction_type)
    VALUES (user_uuid, voltz_reward, 'Onboarding step: ' || step_name, 'earned');

    -- Award achievement (if not already awarded)
    INSERT INTO public.user_achievements (
      user_id, achievement_type, title, description, icon_name, earned_at
    )
    SELECT user_uuid, 'completion', achievement_name, 'Completed onboarding step', 'check-circle', NOW()
    WHERE NOT EXISTS (
      SELECT 1 FROM public.user_achievements
      WHERE user_id = user_uuid AND title = achievement_name
    );
  END IF;

  -- Check for completion bonus
  IF completed_steps = total_steps THEN
    -- Award completion bonus
    INSERT INTO public.user_achievements (
      user_id, achievement_type, title, description, icon_name, earned_at
    )
    SELECT user_uuid, 'milestone', 'Tutorial Graduate', 'Completed all onboarding steps', 'graduation-cap', NOW()
    WHERE NOT EXISTS (
      SELECT 1 FROM public.user_achievements
      WHERE user_id = user_uuid AND title = 'Tutorial Graduate'
    );

    -- Award completion voltz bonus
    UPDATE public.profiles
    SET spendable_voltz = spendable_voltz + 1000,
        total_voltz_earned = total_voltz_earned + 1000
    WHERE id = user_uuid;

    INSERT INTO public.xp_ledger (user_id, amount, reason, transaction_type)
    VALUES (user_uuid, 1000, 'Onboarding completion bonus', 'earned');
  END IF;

  RETURN json_build_object(
    'completed_steps', completed_steps,
    'total_steps', total_steps,
    'completion_percentage', completion_percentage,
    'voltz_awarded', voltz_reward,
    'achievement_unlocked', achievement_name
  );
END;
$$ LANGUAGE plpgsql;
```

#### Implementation Tasks

- [ ] Create `components/onboarding/OnboardingProgressCard.tsx`
- [ ] Implement step tracking in existing components
- [ ] Add progress indicator to profile page
- [ ] Create onboarding step completion API calls
- [ ] Design achievement unlock animations

### 4. 🔄 Enhanced Feed Algorithm for Supercharged Insights

#### Database Updates

```sql
-- Create supercharged insights priority table
CREATE TABLE IF NOT EXISTS public.supercharged_insights_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_id UUID NOT NULL REFERENCES public.insights(id),
  voltz_spent INTEGER NOT NULL,
  boost_start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  boost_duration_hours INTEGER DEFAULT 24,
  priority_score INTEGER GENERATED ALWAYS AS (
    CASE
      WHEN voltz_spent >= 500 THEN 100
      WHEN voltz_spent >= 300 THEN 80
      WHEN voltz_spent >= 200 THEN 60
      WHEN voltz_spent >= 100 THEN 40
      ELSE 20
    END
  ) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(insight_id)
);

-- Function to add supercharged insight to queue
CREATE OR REPLACE FUNCTION public.add_supercharged_insight()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.voltz_spent > OLD.voltz_spent THEN
    INSERT INTO public.supercharged_insights_queue (insight_id, voltz_spent)
    VALUES (NEW.id, NEW.voltz_spent)
    ON CONFLICT (insight_id) DO UPDATE SET
      voltz_spent = NEW.voltz_spent,
      boost_start_time = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER supercharge_queue_trigger
  AFTER UPDATE ON public.insights
  FOR EACH ROW EXECUTE FUNCTION public.add_supercharged_insight();
```

#### Implementation Tasks

- [ ] Update `lib/feedAlgorithm.ts` to prioritize supercharged content
- [ ] Modify `components/MainFeed.tsx` to handle boosted content
- [ ] Add visual indicators for supercharged posts
- [ ] Implement cross-industry visibility for highly supercharged content
- [ ] Create analytics for supercharged post performance

### 5. 🎨 UI/UX Improvements

#### Light Theme Enhancements

Based on the theme context analysis, the light theme needs improvements:

```typescript
// Update context/ThemeContext.tsx with better light theme colors
const lightTheme: ThemeColors = {
  background: "#FFFFFF",
  surface: "#F8F9FA",
  card: "#FFFFFF",
  overlay: "rgba(0,0,0,0.05)",

  text: "#1A1A1A",
  textSecondary: "#6C757D",
  textTertiary: "#ADB5BD",

  border: "#E9ECEF",
  separator: "#F1F3F4",

  primary: "#EAB308",
  primaryText: "#000000",
  readButtonText: "#000000",
  accent: "#EAB308",
  error: "#DC3545",

  // Enhanced contrast for better readability
  bookTitle: "#1A1A1A",
  bookMeta: "#6C757D",
  bookSummary: "#495057",
  bookSwipeHint: "#ADB5BD",

  statusBarStyle: "dark-content",
  statusBarBackground: "#FFFFFF",

  navigationBackground: "#FFFFFF",
  navigationBorder: "#E9ECEF",
  navigationActive: "#EAB308",
  navigationInactive: "#6C757D",

  inputBackground: "#F8F9FA",
  inputBorder: "#DEE2E6",
  inputText: "#1A1A1A",
  inputPlaceholder: "#6C757D",
};
```

#### Implementation Tasks

- [ ] Update all components to use theme colors consistently
- [ ] Remove system theme option from settings
- [ ] Set dark theme as default in `context/ThemeContext.tsx`
- [ ] Test all UI components in both themes
- [ ] Fix `CongratulationsScreen.tsx` title display issue

### 6. 🧹 Code Cleanup & Deprecated File Removal

#### Deprecated Files to Remove

Based on codebase analysis, these files are deprecated and can be safely removed:

```bash
(All removed)


# Legacy app files
App.legacy.tsx
index.legacy.tsx
```

#### Implementation Tasks

- [ ] Verify no imports reference deprecated step components
- [ ] Update profile.tsx to only use NewProfile component
- [ ] Remove deprecated step components after verification
- [ ] Clean up unused imports and types
- [ ] Update component barrel exports

### 7. 🚀 Performance Optimizations (2025 Best Practices)

#### React Native Performance Updates

```typescript
// Implement proper memoization for expensive components
// Example: components/MainFeed.tsx
import React, { memo, useCallback, useMemo } from "react";

export const MainFeed = memo(() => {
  const memoizedPosts = useMemo(() => {
    return posts.filter((post) => post.isVisible);
  }, [posts]);

  const handleLike = useCallback((postId: string) => {
    // Optimized like handler
  }, []);

  return (
    <FlatList
      data={memoizedPosts}
      renderItem={renderPost}
      getItemLayout={getItemLayout} // For better performance
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      windowSize={10}
    />
  );
});
```

#### Implementation Tasks

- [ ] Add React.memo to expensive components
- [ ] Implement proper useCallback for event handlers
- [ ] Use useMemo for computed values
- [ ] Optimize FlatList configurations
- [ ] Implement image lazy loading
- [ ] Add bundle splitting for larger components

---

## 🗂️ Implementation Priority

### Phase 1: Core Features (Week 1-2)

1. Achievements system database setup
2. Enhanced voltz awarding mechanisms
3. Post-onboarding progress tracking
4. UI theme improvements

### Phase 2: Advanced Features (Week 3)

1. Feed algorithm enhancements
2. Achievement notifications
3. Performance optimizations
4. Code cleanup

### Phase 3: Testing & Polish (Week 4)

1. Comprehensive testing
2. UI/UX refinements
3. Beta testing preparation
4. Documentation updates

---

## 🧪 Testing Strategy

### Database Testing

- Test all SQL functions with various user scenarios
- Verify achievement triggers work correctly
- Ensure voltz calculations are accurate
- Test edge cases for streak calculations

### Component Testing

- Test all components in light and dark modes
- Verify achievement notifications display correctly
- Test onboarding flow completion tracking
- Ensure deprecated components are properly removed

### Integration Testing

- Test full user journey from onboarding to achievement unlocking
- Verify feed algorithm prioritizes supercharged content
- Test voltz earning and spending flows
- Ensure real-time updates work correctly

---

## ⚠️ Known Issues to Address

### Achievement System Issues

1. **Voltz to Level Progression**:

   - Issue: Voltz awarded from achievements are not triggering level-up calculations
   - Impact: Users earning achievements don't see their level increase appropriately
   - Root Cause: Likely missing trigger or calculation logic for level progression based on total_voltz_earned
   - Priority: High - affects core progression system

2. **Leaderboard RLS (Row Level Security) Issue**:
   - Issue: Leaderboard is only showing the current user instead of top 3 users
   - Impact: Users cannot see competitive leaderboard with other users
   - Root Cause: RLS policies preventing access to other users' profile data needed for leaderboard
   - Solution Needed: Update RLS policies to allow read access to specific profile fields (e.g., total_voltz_earned, full_name) for leaderboard display while maintaining privacy for other profile data
   - Priority: Medium - affects social engagement features

### Implementation Notes

- Both issues were discovered during achievement system implementation
- Voltz awarding works correctly, but level calculation needs investigation
- Leaderboard queries likely need RLS policy adjustments to allow cross-user visibility for ranking purposes
- Test thoroughly after fixes to ensure no security issues with RLS changes

---

## 📊 Success Metrics

### User Engagement

- Achievement unlock rate per user
- Average voltz earned per session
- Onboarding completion rate
- Daily active user retention

### Technical Performance

- Feed load time improvements
- App startup time optimization
- Memory usage reduction
- Crash rate minimization

### Content Quality

- Supercharged content engagement rates
- User-generated content volume
- Comment and like ratios
- Content sharing frequency

---

## 🔧 Development Environment Setup

### Required Dependencies

```bash
# Additional packages for achievements and notifications
npm install @react-native-async-storage/async-storage
npm install react-native-push-notification
npm install @react-native-community/netinfo

# Performance monitoring
npm install flipper-plugin-performance
```

### Database Setup

```sql
-- Run all SQL migrations in order
-- Test with sample data
-- Verify all triggers and functions work correctly
```

---

## 🚨 Risk Mitigation

### Technical Risks

- **Database Performance**: Monitor query performance with complex achievement logic
- **Real-time Updates**: Ensure Supabase realtime doesn't cause memory leaks
- **Voltz Inflation**: Carefully balance reward amounts to prevent economic imbalance

### User Experience Risks

- **Overwhelming Notifications**: Implement smart batching for achievement alerts
- **Complex Onboarding**: Keep post-onboarding steps simple and optional
- **Theme Inconsistencies**: Comprehensive testing across all components

---

## 📝 Next Steps

1. **Review and Approval**: Get stakeholder approval on voltz amounts and achievement criteria
2. **Database Migration**: Implement all SQL changes in development environment
3. **Component Development**: Start with core achievement system components
4. **Iterative Testing**: Test each feature as it's implemented
5. **Beta Preparation**: Final testing and documentation before beta release

---

This plan provides a comprehensive roadmap to get the Supercharged app ready for beta testing while maintaining high code quality and following 2025 React Native best practices. The focus is on essential features that will provide immediate value to users while setting up a solid foundation for future enhancements.
