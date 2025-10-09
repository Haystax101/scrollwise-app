# Streak System Deployment Guide

## Overview
This guide walks through deploying the simplified daily streaks system that tracks user learning activity and maintains streak counts using GMT timezone consistency.

## ✅ What's Been Implemented

### 1. Database Functions (`database/streak_functions.sql`)
- ✅ `update_user_streak()` - Core streak calculation logic
- ✅ `log_daily_activity()` - Activity logging with streak updates
- ✅ `get_user_streak_info()` - Retrieve current streak data
- ✅ `setup_user_learning_streak()` - Initialize streaks for new users
- ✅ Database triggers for automatic streak updates on learning sessions
- ✅ Migration script for existing users

### 2. Frontend Service (`services/streakService.ts`)
- ✅ Complete TypeScript service with all streak operations
- ✅ Activity logging, streak info retrieval, target updates
- ✅ Comprehensive error handling and logging
- ✅ Helper functions for streak status and motivational messages

### 3. UI Components
- ✅ `StreakDisplay.tsx` - Main profile display component
- ✅ `StreakEditModal.tsx` - Goal editing interface
- ✅ Integrated into `NewProfile.tsx`

### 4. App Integration
- ✅ Activity logging in `AuthContext.tsx` on app launch and sign-in
- ✅ Onboarding integration via `MainOnboarding.tsx`
- ✅ Automatic learning session triggers

## 🚀 Deployment Steps

### Step 1: Deploy Database Functions

**Option A: Safe Deployment Script (Recommended)**
```bash
# Connect to your Supabase project and run the safe deployment script
psql -h [your-supabase-host] -U postgres -d postgres -f database/streak_functions_safe_deploy.sql
```

**Option B: Manual Deployment**
Via Supabase Dashboard:
1. Go to SQL Editor in Supabase Dashboard
2. Copy and paste contents of `database/streak_functions.sql`
3. Execute the script

**Note:** If you get dependency errors about triggers, use Option A which handles PostgreSQL dependencies properly.

### Step 2: Verify Database Setup
Check that these exist in your database:
- [ ] Functions: `update_user_streak`, `log_daily_activity`, `get_user_streak_info`, `setup_user_learning_streak`
- [ ] Triggers: `learning_session_streak_update` on all learning_sessions tables (main + partitioned)
- [ ] Indexes: `idx_user_streaks_user_type`, `idx_user_daily_activities_user_date`
- [ ] Unique constraints: `idx_user_streaks_unique_active`, `idx_user_daily_activities_unique`

### Step 3: Test Backend Functions
```sql
-- Test streak initialization
SELECT setup_user_learning_streak('[test-user-id]'::UUID, 30);

-- Test activity logging
SELECT log_daily_activity('[test-user-id]'::UUID, ARRAY['app_open']);

-- Test streak info retrieval
SELECT * FROM get_user_streak_info('[test-user-id]'::UUID);
```

### Step 4: Frontend Deployment
The frontend code is already integrated. Just ensure your app rebuild includes:
- [x] New service files
- [x] Updated profile components
- [x] AuthContext changes
- [x] Onboarding updates

## 🧪 Testing Checklist

### Database Testing
- [ ] Run migration script - existing users get streak records
- [ ] Test streak initialization for new users
- [ ] Test consecutive day streak increments
- [ ] Test streak reset after gap days
- [ ] Verify GMT timezone consistency
- [ ] Test minimum streak value (never 0)

### Frontend Testing
- [ ] Profile displays streak correctly
- [ ] Streak editing modal works
- [ ] App launch logs daily activity
- [ ] Learning sessions trigger streak updates
- [ ] Onboarding sets up initial streak

### Integration Testing
- [ ] Sign in/out updates streaks properly
- [ ] Cross-timezone testing (streak calculations remain GMT-based)
- [ ] Performance with large user base
- [ ] Error handling and fallbacks

## 📊 Monitoring

### Key Metrics to Watch
1. **Streak Accuracy**: Compare `profiles.days_streak` vs `user_streaks.current_streak`
2. **Activity Logging**: Monitor `user_daily_activities` table growth
3. **Performance**: Check query execution times
4. **User Engagement**: Track daily active users with streaks

### Useful Queries
```sql
-- Check streak distribution
SELECT current_streak, COUNT(*)
FROM user_streaks
WHERE streak_type = 'daily_learning' AND is_active = true
GROUP BY current_streak
ORDER BY current_streak;

-- Find users with inconsistent streaks
SELECT p.id, p.days_streak, us.current_streak
FROM profiles p
LEFT JOIN user_streaks us ON p.id = us.user_id
WHERE p.days_streak != us.current_streak
  AND us.streak_type = 'daily_learning';

-- Today's activity summary
SELECT COUNT(DISTINCT user_id) as active_users
FROM user_daily_activities
WHERE activity_date = CURRENT_DATE;
```

## 🔧 Troubleshooting

### Common Issues

1. **Missing Streak Records**
   - Run migration script: The SQL file includes migration for existing users
   - Check if `user_streaks` table has records for all active users

2. **Streak Not Updating**
   - Verify triggers are active: `SELECT * FROM pg_trigger WHERE tgname LIKE '%streak%'`
   - Check if `log_daily_activity` is being called from frontend
   - Ensure `learning_sessions.is_completed` is being set to `true`
   - Verify all learning session tables have triggers (main + partitioned tables)

3. **Timezone Issues**
   - All calculations use GMT/UTC: `CURRENT_DATE` in database functions
   - Frontend sends GMT dates to avoid timezone discrepancies

4. **Performance Issues**
   - Ensure indexes exist on `user_streaks` and `user_daily_activities`
   - Monitor trigger execution time on learning sessions
   - Check unique constraints are working properly

5. **PostgreSQL Compatibility**
   - Functions use `DROP FUNCTION IF EXISTS` instead of `CREATE OR REPLACE`
   - Uses IF/ELSE logic instead of UPSERT for table compatibility
   - Triggers created on all learning session table variants

6. **Trigger Dependency Errors**
   - Error: "cannot drop function trigger_update_streak_on_session() because other objects depend on it"
   - Solution: Use `streak_functions_safe_deploy.sql` which drops triggers first
   - Or manually drop triggers before running the main script

### Rollback Plan
If issues arise:
1. Disable triggers: `ALTER TABLE learning_sessions DISABLE TRIGGER learning_session_streak_update`
2. Use legacy `profiles.days_streak` field temporarily
3. Fix issues and re-enable: `ALTER TABLE learning_sessions ENABLE TRIGGER learning_session_streak_update`

## 🎯 Success Criteria

The streak system is working correctly when:
- ✅ Users see accurate streak counts in their profile
- ✅ Daily app usage increments streaks
- ✅ Streak resets properly after missed days (but stays minimum 1)
- ✅ Performance remains fast (<100ms for streak queries)
- ✅ No data inconsistencies between old and new streak systems

## 🔄 Next Steps (Future Enhancements)

Once the basic system is stable, consider:
1. **Streak Achievements**: Badges for 7-day, 30-day, 100-day streaks
2. **Streak Recovery**: Premium feature to "freeze" streaks during breaks
3. **Social Features**: Friend streak comparisons
4. **Analytics Dashboard**: Streak trends and insights
5. **Push Notifications**: Streak reminder notifications (requires notifications system)

The simplified daily streaks system provides a solid foundation for user engagement while maintaining data consistency and performance.