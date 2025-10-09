# Onboarding Restructuring Plan

## Current State Analysis

### Database Schema Review
From `databaseOverview.sql`, here's what's currently captured vs. displayed:

#### ✅ **Currently Used in NewProfile**
1. **Basic Info**: `profiles.full_name`, `profiles.avatar_url`, `profiles.tagline` (lines 676, 677, 685)
2. **Industries**: `user_industries` table (lines 954-963)
3. **Career Goals**: `user_goals` table (lines 938-953)
4. **Passions**: `profile_sections` table with `passionate_about` content (lines 659-672)
5. **Streak Info**: `user_streaks` table (lines 1100-1114)
6. **XP/Level**: `profiles.xp`, `profiles.level`, `profiles.spendable_voltz` (lines 682-684)

#### ❌ **Collected in Onboarding but NOT Displayed**
1. **Current Work**: `user_experiences` table (lines 908-930)
   - `position_title`, `company_id`, `is_current`
   - **Issue**: No profile card shows current work
2. **Dream Role/Company**: `user_goal_companies` table (lines 931-937)
   - **Issue**: Shows generic goals, not specific dream role/company
3. **Work Experience Details**: Detailed `user_experiences` fields
   - `responsibilities`, `key_achievements`, `employment_type`

#### 📊 **Tables That Can Be Removed/Simplified**
1. **`user_experiences`**: Over-engineered for current use
   - Only using basic current role/company
   - Complex fields like `responsibilities`, `key_achievements` unused
2. **`user_goal_companies`**: Redundant with simpler goal storage
3. **`companies` table integration**: May be overkill for simple display

## Proposed Changes

### Phase 1: Remove Unused Current Work Collection

#### 1.1 Database Cleanup
```sql
-- Option A: Simplify user_experiences to just current work basics
ALTER TABLE user_experiences
DROP COLUMN IF EXISTS responsibilities,
DROP COLUMN IF EXISTS key_achievements,
DROP COLUMN IF EXISTS skills_gained,
DROP COLUMN IF EXISTS experience_level,
DROP COLUMN IF EXISTS employment_type,
DROP COLUMN IF EXISTS industry,
DROP COLUMN IF EXISTS location,
DROP COLUMN IF EXISTS start_date,
DROP COLUMN IF EXISTS end_date;

-- Option B: Remove user_experiences entirely and store in profile_sections
-- This is the recommended approach for simplicity
```

#### 1.2 Replace Current Work with Tagline Collection
Instead of asking about current role/company, ask for a personalized tagline that's actually displayed.

### Phase 2: Onboarding Flow Restructuring

#### 2.1 **Remove Components**
1. **`CurrentWork.tsx`** - No longer displayed in profile
2. **`DreamRole.tsx`** - Replace with simpler tagline input

#### 2.2 **Add/Replace Components**
1. **`TaglineInput.tsx`** - Replace current work collection
2. **Simplify `CareerGoal.tsx`** - Just ask for general career goal text

#### 2.3 **New Onboarding Flow**
```typescript
// Updated onboarding step order in MainOnboarding.tsx
const registrationSteps = [
  0: 'EmailInput',
  1: 'OtpVerificationScreen',
  2: 'PasswordSetup',
  3: 'PersonalInfo',
  4: 'IndustrySelection',
  5: 'CongratulationsScreen',
  6: 'TaglineInput',        // NEW: Replace current work
  7: 'CareerGoalSimple',    // MODIFIED: Simplified career goal
  8: 'StreakSelection',
  9: 'Notifications',
  10: 'YoureAllSetScreen'
];
```

## Implementation Plan

### Phase 1: Create New Components

#### 1.1 TaglineInput Component
```typescript
// components/onboarding/TaglineInput.tsx
interface TaglineInputProps {
  onNext: (data: { tagline: string }) => void;
  onBack?: () => void;
}

export const TaglineInput: React.FC<TaglineInputProps> = ({ onNext, onBack }) => {
  const [tagline, setTagline] = useState('');

  const handleNext = () => {
    if (tagline.trim()) {
      onNext({ tagline: tagline.trim() });
    }
  };

  return (
    <OnboardingPage
      title="What's your tagline?"
      subtitle="A short, catchy phrase that describes you professionally (shown on your profile)"
      onNext={handleNext}
      onBack={onBack}
      buttonText="Continue"
      buttonDisabled={!tagline.trim() || tagline.length > 100}
    >
      <View style={styles.container}>
        <TextInput
          style={styles.input}
          value={tagline}
          onChangeText={setTagline}
          placeholder="e.g., Passionate product manager building the future of fintech"
          maxLength={100}
          multiline={true}
          numberOfLines={3}
        />
        <Text style={styles.characterCount}>
          {tagline.length}/100 characters
        </Text>
        <View style={styles.examples}>
          <Text style={styles.examplesTitle}>Examples:</Text>
          <Text style={styles.example}>• "AI researcher obsessed with making technology accessible"</Text>
          <Text style={styles.example}>• "Marketing strategist helping startups find their voice"</Text>
          <Text style={styles.example}>• "Full-stack developer building tools for creative professionals"</Text>
        </View>
      </View>
    </OnboardingPage>
  );
};
```

#### 1.2 Simplified Career Goal Component
```typescript
// components/onboarding/CareerGoalSimple.tsx
interface CareerGoalSimpleProps {
  onNext: (data: { careerGoal: string }) => void;
  onBack?: () => void;
}

export const CareerGoalSimple: React.FC<CareerGoalSimpleProps> = ({ onNext, onBack }) => {
  const [careerGoal, setCareerGoal] = useState('');

  const handleNext = () => {
    if (careerGoal.trim()) {
      onNext({ careerGoal: careerGoal.trim() });
    }
  };

  return (
    <OnboardingPage
      title="What's your career goal?"
      subtitle="Share what you're working towards professionally"
      onNext={handleNext}
      onBack={onBack}
      buttonText="Continue"
      buttonDisabled={!careerGoal.trim()}
    >
      <View style={styles.container}>
        <TextInput
          style={styles.input}
          value={careerGoal}
          onChangeText={setCareerGoal}
          placeholder="e.g., Become a Senior Product Manager at a tech unicorn"
          maxLength={200}
          multiline={true}
          numberOfLines={4}
        />
        <Text style={styles.characterCount}>
          {careerGoal.length}/200 characters
        </Text>
      </View>
    </OnboardingPage>
  );
};
```

### Phase 2: Update MainOnboarding.tsx

#### 2.1 Replace Current Steps
```typescript
// In MainOnboarding.tsx - update step handlers
const handleTaglineInput = async (data: { tagline: string }) => {
  updateOnboardingData(data);

  if (userId) {
    // Update user's tagline directly in profiles table
    const { error } = await supabase
      .from('profiles')
      .update({ tagline: data.tagline })
      .eq('id', userId);

    if (error) {
      console.error('Error saving tagline:', error);
      Alert.alert('Error', 'Failed to save tagline. Please try again.');
      return;
    }
  }
  nextStep();
};

const handleCareerGoalSimple = async (data: { careerGoal: string }) => {
  updateOnboardingData(data);

  if (userId) {
    // Save simplified career goal
    const { error } = await supabase
      .from('user_goals')
      .upsert({
        user_id: userId,
        goal: data.careerGoal,
        goal_type: 'career',
        status: 'active',
        priority: 1
      });

    if (error) {
      console.error('Error saving career goal:', error);
      Alert.alert('Error', 'Failed to save career goal. Please try again.');
      return;
    }
  }
  nextStep();
};

// Update the step rendering switch statement
const renderRegistrationStep = () => {
  switch (currentStep) {
    case 0: return <EmailInput onNext={handleEmailInput} onBack={prevStep} emailExistsError={emailExistsError} onGoToLogin={goToLogin} />;
    case 1: return <OtpVerificationScreen email={onboardingData.email} onSuccess={handleOtpSuccess} onBack={handleOtpBack} skipInitialOtpSend={true} />;
    case 2: return <PasswordSetup onNext={handlePasswordSetup} onBack={prevStep} />;
    case 3: return <PersonalInfo onNext={handlePersonalInfo} onBack={prevStep} isLoading={creatingAccount} />;
    case 4: return <IndustrySelection onNext={handleIndustrySelection} />;
    case 5: return <CongratulationsScreen onNext={nextStep} onBack={prevStep} />;
    case 6: return <TaglineInput onNext={handleTaglineInput} onBack={showProgressBar ? undefined : prevStep} />;
    case 7: return <CareerGoalSimple onNext={handleCareerGoalSimple} onBack={showProgressBar ? undefined : prevStep} />;
    case 8: return <StreakSelection onNext={handleStreakSelection} onBack={showProgressBar ? undefined : prevStep} />;
    case 9: return <Notifications onNext={handleNotifications} />;
    case 10: return <YoureAllSetScreen onNext={handleYoureAllSet} />;
    default: return null;
  }
};
```

### Phase 3: Database Cleanup

#### 3.1 Remove Unused Tables/Fields (After Migration)
```sql
-- Remove unused experience fields
ALTER TABLE user_experiences
DROP COLUMN IF EXISTS responsibilities,
DROP COLUMN IF EXISTS key_achievements,
DROP COLUMN IF EXISTS skills_gained,
DROP COLUMN IF EXISTS experience_level,
DROP COLUMN IF EXISTS employment_type,
DROP COLUMN IF EXISTS industry,
DROP COLUMN IF EXISTS location;

-- Or completely remove user_experiences if not used elsewhere
-- DROP TABLE IF EXISTS user_experiences;

-- Remove goal companies relationship (if not used)
-- DROP TABLE IF EXISTS user_goal_companies;

-- Clean up unused companies entries (optional, be careful)
-- DELETE FROM companies WHERE id NOT IN (
--   SELECT DISTINCT company_id FROM user_experiences WHERE company_id IS NOT NULL
-- );
```

#### 3.2 Data Migration Script
```sql
-- Before removing user_experiences, extract any useful data
-- to profiles.tagline or profile_sections if needed

-- Example: Convert current role/company to tagline format
UPDATE profiles
SET tagline = CONCAT(
  COALESCE(ue.position_title, ''),
  CASE WHEN ue.position_title IS NOT NULL AND c.name IS NOT NULL
       THEN ' at ' ELSE '' END,
  COALESCE(c.name, '')
)
FROM user_experiences ue
LEFT JOIN companies c ON ue.company_id = c.id
WHERE profiles.id = ue.user_id
  AND ue.is_current = true
  AND profiles.tagline IS NULL
  AND (ue.position_title IS NOT NULL OR c.name IS NOT NULL);
```

### Phase 4: Update Profile Display (Optional Enhancement)

#### 4.1 Enhance TaglineEditModal
```typescript
// components/profile/TaglineEditModal.tsx - ensure it shows examples and guidance
const TaglineEditModal = ({ visible, onClose, currentTagline, userId, onSave }) => {
  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        <Text style={styles.title}>Edit Tagline</Text>
        <Text style={styles.subtitle}>
          A short, catchy phrase that describes you professionally
        </Text>

        <TextInput
          style={styles.input}
          value={tagline}
          onChangeText={setTagline}
          placeholder="What makes you unique professionally?"
          maxLength={100}
          multiline={true}
        />

        {/* Show examples like in onboarding */}
        <View style={styles.examples}>
          <Text style={styles.examplesTitle}>Examples:</Text>
          <Text style={styles.example}>• "AI researcher obsessed with making technology accessible"</Text>
          <Text style={styles.example}>• "Marketing strategist helping startups find their voice"</Text>
        </View>
      </View>
    </Modal>
  );
};
```

## Benefits of This Restructuring

### 1. **Improved User Experience**
- ✅ **Consistency**: Only ask for data that's actually displayed
- ✅ **Faster Onboarding**: Fewer steps, more relevant questions
- ✅ **Better Engagement**: Tagline is visible and encourages creativity

### 2. **Technical Benefits**
- ✅ **Simplified Schema**: Fewer unused tables and relationships
- ✅ **Better Performance**: Less complex queries and joins
- ✅ **Easier Maintenance**: Fewer components and database interactions

### 3. **Product Focus**
- ✅ **Profile Clarity**: Every field collected is prominently displayed
- ✅ **Professional Branding**: Tagline helps users express their professional identity
- ✅ **Goal-Oriented**: Simplified career goal collection focuses on aspirations

## Implementation Timeline

### Week 1: New Components
- [ ] Create `TaglineInput.tsx` component with examples and validation
- [ ] Create `CareerGoalSimple.tsx` component
- [ ] Test new components in isolation

### Week 2: Integration
- [ ] Update `MainOnboarding.tsx` to use new components
- [ ] Replace current work/dream role steps
- [ ] Test full onboarding flow

### Week 3: Database Cleanup
- [ ] Create migration script for existing data
- [ ] Remove unused table fields
- [ ] Test with existing user data

### Week 4: Profile Enhancement
- [ ] Update profile components to show tagline prominently
- [ ] Enhance tagline editing experience
- [ ] User testing and feedback

## Alternative Approaches Considered

### Option A: Keep Current Work, Add Display
- **Pros**: No data loss, comprehensive profile
- **Cons**: More complex UI, many fields not essential

### Option B: Make Current Work Optional
- **Pros**: Preserves functionality for users who want it
- **Cons**: Optional fields often get ignored, UI complexity

### Option C: Convert to Profile Sections
- **Pros**: Flexible content system
- **Cons**: Over-engineering for simple use case

**Recommendation**: **Option from this plan** - Replace with tagline collection. It's simpler, more engaging, and directly visible to users.

## Risk Mitigation

### 1. **Data Loss Prevention**
- Backup current work data before migration
- Provide option to export user's work history
- Gradual rollout with rollback capability

### 2. **User Communication**
- Notify existing users about profile changes
- Provide guidance on writing effective taglines
- Show examples from successful professionals

### 3. **Testing Strategy**
- A/B test new onboarding vs. old version
- Monitor completion rates and user feedback
- Test with various user personas

## Success Metrics

### 1. **Onboarding Improvement**
- **Target**: 15% increase in onboarding completion rate
- **Metric**: Percentage of users completing full flow
- **Reason**: Fewer, more relevant steps

### 2. **Profile Engagement**
- **Target**: 80% of users add meaningful taglines
- **Metric**: Tagline completion rate and character count
- **Reason**: Direct visibility encourages thoughtful completion

### 3. **Technical Performance**
- **Target**: 20% faster profile loading
- **Metric**: Average profile page load time
- **Reason**: Simplified database queries

### 4. **User Satisfaction**
- **Target**: 4.5+ rating for onboarding experience
- **Metric**: In-app feedback scores
- **Reason**: More focused, relevant experience

This restructuring creates a more focused, efficient onboarding experience that directly translates to a better profile display, reducing complexity while improving user engagement.