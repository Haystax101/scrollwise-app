# SQL Files to Run - EXECUTION ORDER

Please run these SQL files in your Supabase SQL Editor in the following order:

## 1. Fix Level System (CRITICAL - Run First)
File: `fix_level_system.sql`
**Purpose**: Ensures level updates when voltz changes. This will fix the issue where you earned 50 voltz but stayed at Level 1.
**Impact**: 
- Creates/updates level calculation functions
- Installs trigger to auto-update level when total_voltz_earned changes
- Fixes any users with incorrect levels immediately
- 50 voltz should make you Level 3 according to the formula

## 2. Post-Onboarding System 
File: `post_onboarding_completion_system.sql`
**Purpose**: Creates the onboarding progress tracking system
**Impact**:
- Creates onboarding_progress table
- Creates functions to complete onboarding steps
- Creates achievements for completing onboarding steps
- Enables the onboarding progress card to work properly

## 3. Final Voltz Implementation (Optional - for completeness)
File: `final_voltz_implementation.sql`  
**Purpose**: Ensures all voltz-related triggers are working
**Impact**:
- Ensures achievement → voltz awarding works
- Adds triggers for social interactions (likes, comments, saves)
- Creates comprehensive voltz ecosystem

## Expected Results After Running SQL:
✅ Your level will update to Level 3 (for 50 voltz earned)
✅ Profile images will show consistent default icons
✅ Leaderboard will show proper rankings with default images
✅ Onboarding steps will appear for all users until 4/4 complete
✅ Real-time updates: achievement → voltz → level → leaderboard

## Test After SQL Execution:
1. Check your profile - level should be correct based on voltz
2. Publish an insight - should automatically complete "Share Knowledge" onboarding step
3. Check if level updates immediately after earning achievements
4. Verify leaderboard shows updated rankings

Run these files now, then test the complete flow!