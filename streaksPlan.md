# Streaks Implementation Plan

## Current State Analysis

### Database Schema
- ✅ **`profiles.days_streak`** (integer, default 0) - Legacy field in profiles table
- ✅ **`user_streaks` table** - Dedicated streak management (lines 1100-1114)
  - `streak_type` (daily_learning, weekly_content, monthly_engagement)
  - `target_days` - User's goal (set during onboarding)
  - `current_streak` - Current streak count
  - `longest_streak` - Personal best
  - `last_activity_date` - For streak reset logic
- ✅ **`user_daily_activities` table** - Activity tracking per day (lines 868-881)
- ✅ **`learning_sessions` tables** - Track user engagement

### Current Implementation Issues
1. **`profiles.days_streak`** is not being updated when users log in daily
2. **Onboarding sets streak goal** but doesn't properly initialize tracking
3. **No daily activity logging mechanism** to maintain streaks
4. **GMT timezone requirement** needs implementation for consistent daily boundaries

## Proposed Solution: Use `user_streaks` Table (Recommended)

### Why `user_streaks` Over `profiles.days_streak`
1. **Scalability**: Supports multiple streak types (daily, weekly, monthly)
2. **Rich metadata**: Tracks target, longest streak, last activity
3. **Extensibility**: Can add achievement streak types later
4. **Performance**: Separate table allows better indexing and queries
5. **Data integrity**: Dedicated streak logic without affecting profiles table

## Implementation Plan

### Phase 1: Backend Infrastructure

#### 1.1 Database Functions (Supabase)
```sql
-- Function: Update user streak on daily activity
CREATE OR REPLACE FUNCTION update_user_streak(
  user_id_param UUID,
  activity_date_param DATE DEFAULT CURRENT_DATE,
  streak_type_param TEXT DEFAULT 'daily_learning'
) RETURNS BOOLEAN AS $$
DECLARE
  last_activity_date DATE;
  current_streak_count INTEGER;
  streak_record RECORD;
BEGIN
  -- Get current streak record
  SELECT * INTO streak_record
  FROM user_streaks
  WHERE user_id = user_id_param
    AND streak_type = streak_type_param
    AND is_active = true;

  IF NOT FOUND THEN
    -- Initialize streak record if doesn't exist
    INSERT INTO user_streaks (user_id, streak_type, current_streak, longest_streak, last_activity_date)
    VALUES (user_id_param, streak_type_param, 1, 1, activity_date_param);
    RETURN TRUE;
  END IF;

  -- Check if activity is on consecutive day
  IF streak_record.last_activity_date = activity_date_param THEN
    -- Same day, no update needed
    RETURN TRUE;
  ELSIF streak_record.last_activity_date = activity_date_param - INTERVAL '1 day' THEN
    -- Consecutive day, increment streak
    current_streak_count := streak_record.current_streak + 1;
  ELSE
    -- Gap in activity, reset streak to 1
    current_streak_count := 1;
  END IF;

  -- Update streak record
  UPDATE user_streaks
  SET
    current_streak = current_streak_count,
    longest_streak = GREATEST(longest_streak, current_streak_count),
    last_activity_date = activity_date_param,
    updated_at = NOW()
  WHERE user_id = user_id_param
    AND streak_type = streak_type_param
    AND is_active = true;

  -- Also update legacy profiles.days_streak for backwards compatibility
  UPDATE profiles
  SET days_streak = current_streak_count
  WHERE id = user_id_param;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function: Log daily activity and update streak
CREATE OR REPLACE FUNCTION log_daily_activity(
  user_id_param UUID,
  activity_types_param TEXT[] DEFAULT ARRAY['app_open'],
  activity_date_param DATE DEFAULT CURRENT_DATE
) RETURNS BOOLEAN AS $$
BEGIN
  -- Insert or update daily activity record
  INSERT INTO user_daily_activities (user_id, activity_date, activity_types, total_minutes_active)
  VALUES (user_id_param, activity_date_param, activity_types_param, 1)
  ON CONFLICT (user_id, activity_date)
  DO UPDATE SET
    activity_types = array_cat(user_daily_activities.activity_types, activity_types_param),
    total_minutes_active = user_daily_activities.total_minutes_active + 1,
    updated_at = NOW();

  -- Update streak
  PERFORM update_user_streak(user_id_param, activity_date_param);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function: Get user's current streak info
CREATE OR REPLACE FUNCTION get_user_streak_info(user_id_param UUID)
RETURNS TABLE(
  current_streak INTEGER,
  longest_streak INTEGER,
  target_days INTEGER,
  streak_type TEXT,
  last_activity_date DATE,
  days_until_reset INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    us.current_streak,
    us.longest_streak,
    us.target_days,
    us.streak_type,
    us.last_activity_date,
    CASE
      WHEN us.last_activity_date = CURRENT_DATE THEN 0
      WHEN us.last_activity_date = CURRENT_DATE - INTERVAL '1 day' THEN 0
      ELSE 1 -- Will reset tomorrow if no activity today
    END as days_until_reset
  FROM user_streaks us
  WHERE us.user_id = user_id_param
    AND us.streak_type = 'daily_learning'
    AND us.is_active = true;
END;
$$ LANGUAGE plpgsql;
```

#### 1.2 Database Triggers
```sql
-- Trigger: Auto-update streak on learning session completion
CREATE OR REPLACE FUNCTION trigger_update_streak_on_session()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update streak for completed sessions
  IF NEW.is_completed = true AND (OLD.is_completed IS NULL OR OLD.is_completed = false) THEN
    PERFORM log_daily_activity(
      NEW.user_id,
      ARRAY['learning_session', NEW.content_type],
      DATE(NEW.session_start_time AT TIME ZONE 'GMT')
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER learning_session_streak_update
  AFTER UPDATE ON learning_sessions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_streak_on_session();
```

### Phase 2: Frontend Implementation

#### 2.1 Streak Service (`services/streakService.ts`)
```typescript
export const streakService = {
  // Initialize user streak during onboarding
  async initializeStreak(userId: string, targetDays: number): Promise<boolean> {
    const { error } = await supabase.rpc('setup_user_learning_streak', {
      user_id_param: userId,
      target_days_param: targetDays
    });
    return !error;
  },

  // Log daily app open activity
  async logDailyActivity(userId: string, activityTypes: string[] = ['app_open']): Promise<boolean> {
    const { error } = await supabase.rpc('log_daily_activity', {
      user_id_param: userId,
      activity_types_param: activityTypes
    });
    return !error;
  },

  // Get current streak information
  async getStreakInfo(userId: string): Promise<StreakInfo | null> {
    const { data, error } = await supabase.rpc('get_user_streak_info', {
      user_id_param: userId
    });

    if (error || !data?.[0]) return null;
    return data[0];
  },

  // Check if user completed activity today (GMT timezone)
  async checkTodayActivity(userId: string): Promise<boolean> {
    const today = new Date().toISOString().split('T')[0]; // GMT date
    const { data } = await supabase
      .from('user_daily_activities')
      .select('id')
      .eq('user_id', userId)
      .eq('activity_date', today)
      .single();

    return !!data;
  }
};
```

#### 2.2 App-level Integration
- **App.tsx/AuthContext**: Call `streakService.logDailyActivity()` on app launch
- **Learning Sessions**: Auto-trigger via database trigger
- **Manual Activity**: Content views, quiz completions, profile updates

#### 2.3 Profile Display Component
```typescript
// components/profile/StreakDisplay.tsx
export const StreakDisplay: React.FC<{ userId: string }> = ({ userId }) => {
  const [streakInfo, setStreakInfo] = useState<StreakInfo | null>(null);

  useEffect(() => {
    loadStreakInfo();
  }, [userId]);

  const loadStreakInfo = async () => {
    const info = await streakService.getStreakInfo(userId);
    setStreakInfo(info);
  };

  if (!streakInfo) return null;

  return (
    <View style={styles.streakContainer}>
      <Text style={styles.streakNumber}>{streakInfo.current_streak}</Text>
      <Text style={styles.streakLabel}>Day Streak</Text>
      <Text style={styles.streakGoal}>Goal: {streakInfo.target_days} days</Text>
      {streakInfo.longest_streak > streakInfo.current_streak && (
        <Text style={styles.bestStreak}>Best: {streakInfo.longest_streak}</Text>
      )}
    </View>
  );
};
```

### Phase 3: Streak Reset Logic

#### 3.1 GMT Timezone Implementation
- All streak calculations use GMT/UTC timezone
- Database functions use `CURRENT_DATE` (GMT)
- Frontend converts local time to GMT for consistency
- New day starts at midnight GMT globally

#### 3.2 Reset Rules
1. **Same day activity**: No change to streak
2. **Next consecutive day**: Increment streak by 1
3. **Gap of 1+ days**: Reset streak to 1 (never 0)
4. **Minimum streak**: Always 1, never 0

#### 3.3 Edge Cases
- User travels across timezones: GMT calculation remains consistent
- Midnight activity: Properly attributed to correct GMT date
- Rapid consecutive actions: Deduplicated by date

### Phase 4: Migration Plan

#### 4.1 Data Migration
```sql
-- Migrate existing profiles.days_streak to user_streaks table
INSERT INTO user_streaks (user_id, streak_type, target_days, current_streak, longest_streak, last_activity_date)
SELECT
  id as user_id,
  'daily_learning' as streak_type,
  30 as target_days, -- Default goal
  GREATEST(days_streak, 1) as current_streak, -- Ensure minimum 1
  GREATEST(days_streak, 1) as longest_streak,
  CURRENT_DATE as last_activity_date -- Assume recent activity
FROM profiles
WHERE id NOT IN (SELECT user_id FROM user_streaks WHERE streak_type = 'daily_learning');
```

#### 4.2 Backwards Compatibility
- Keep `profiles.days_streak` updated via trigger
- Gradually migrate profile displays to use new streak service
- Remove legacy field in future version

## Testing Strategy

### 4.1 Unit Tests
- Streak calculation logic
- GMT timezone handling
- Edge case scenarios (timezone changes, rapid activity)

### 4.2 Integration Tests
- Onboarding streak initialization
- Daily activity logging
- Profile display accuracy

### 4.3 User Acceptance Testing
- Streak persistence across app sessions
- Accurate reset behavior
- Cross-timezone functionality

## Implementation Timeline

### Week 1: Backend Infrastructure
- [ ] Create database functions
- [ ] Set up triggers
- [ ] Test streak calculation logic

### Week 2: Frontend Integration
- [ ] Implement streak service
- [ ] Add app-level activity logging
- [ ] Create streak display components

### Week 3: Migration & Testing
- [ ] Migrate existing data
- [ ] Comprehensive testing
- [ ] Fix edge cases

### Week 4: Deployment & Monitoring
- [ ] Deploy to production
- [ ] Monitor streak accuracy
- [ ] User feedback collection

## Success Metrics

1. **Streak Accuracy**: 99%+ consistency between expected and actual streaks
2. **User Engagement**: Increase in daily active users
3. **Feature Adoption**: 80%+ of users have active streak goals
4. **Performance**: Sub-100ms streak queries
5. **Data Integrity**: Zero data loss during migration

## Risk Mitigation

1. **Data Loss**: Comprehensive backup before migration
2. **Timezone Issues**: Extensive testing across timezones
3. **Performance Impact**: Database indexing and query optimization
4. **User Confusion**: Clear streak reset messaging
5. **Rollback Plan**: Keep legacy system running during transition

## Future Enhancements

1. **Streak Types**: Weekly content goals, monthly engagement
2. **Achievements**: Streak-based badges and rewards
3. **Social Features**: Friend streak comparisons
4. **Streak Freeze**: Premium feature to pause streak during breaks
5. **Advanced Analytics**: Streak trend analysis and insights